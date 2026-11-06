/**
 * Find high-fit prospects (businesses that need social proof AND can pay)
 * and queue the good ones for the daily outreach sender.
 *
 *   node scripts/find-prospects.cjs                 # find + queue (score >= 60)
 *   node scripts/find-prospects.cjs --dry           # find and show, write nothing
 *   node scripts/find-prospects.cjs --target 30     # stop after 30 qualified
 *   node scripts/find-prospects.cjs --min-score 65
 *
 * Two sources, neither uses Anthropic: Tavily searches (agencies, coaches,
 * consultants by city) and Hacker News "Show HN" launches (free, open API;
 * small SaaS founders, the ones who most need social proof). Segments: agencies, consultants, coaches
 * and small B2B software with real pricing — businesses where testimonials
 * directly drive sales and $19/month is a rounding error. Each candidate
 * site is fetched and scored; only a business-domain contact email counts.
 * Never sends email: qualified prospects are queued (status DRAFT_READY),
 * the 8:30 pm sender takes the highest scores first.
 */
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
require(path.join(ROOT, "node_modules/dotenv")).config({ path: path.join(ROOT, ".env.local") });
const { PrismaClient } = require(path.join(ROOT, "node_modules/@prisma/client"));

const args = process.argv.slice(2);
const opt = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const dry = args.includes("--dry");
const TARGET = Number(opt("--target", 40));
const MIN_SCORE = Number(opt("--min-score", 60));
const TAVILY_KEY = process.env.TAVILY_API_KEY;

const CITIES = ["London", "Berlin", "Amsterdam", "Dublin", "Austin", "New York", "San Francisco", "Toronto", "Stockholm", "Paris", "Barcelona", "Chicago", "Denver", "Manchester", "Copenhagen"];
const TEMPLATES = [
  "B2B SaaS marketing agency {city} contact",
  "startup growth consultant {city} book a discovery call",
  "fractional CMO for startups {city}",
  "business coach for founders {city} book a call",
  "web design agency for SaaS companies {city}",
  "conversion rate optimization consultant {city}",
  "B2B content marketing agency {city} case studies",
  "sales coaching for software companies {city}",
];
const SKIP_HOSTS = /(^|\.)(linkedin|facebook|instagram|twitter|x|youtube|medium|reddit|quora|pinterest|yelp|clutch|goodfirms|upwork|fiverr|g2|capterra|trustpilot|crunchbase|glassdoor|indeed|forbes|inc|entrepreneur|hubspot|semrush|ahrefs|wikipedia|github|substack|eventbrite|meetup|designrush|sortlist|themanifest|expertise|builtin|angel|producthunt|techcrunch|shopify|wordpress|wix|squarespace|google|apple|microsoft|amazon)\./i;
const GENERIC_LOCAL = /^(noreply|no-reply|donotreply|privacy|abuse|legal|jobs|careers|press|pr|media|investors|ir|webmaster|postmaster|mailer-daemon|unsubscribe|billing|security|compliance)$/i;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function tavily(query) {
  const r = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer " + TAVILY_KEY },
    body: JSON.stringify({ query, max_results: 10, search_depth: "basic" }),
  });
  if (!r.ok) throw new Error("tavily " + r.status);
  return (await r.json()).results || [];
}
// Recent "Show HN" launches: free, no key, a fresh batch every day.
async function showHnDomains(known) {
  const since = Math.floor(Date.now() / 1000) - 21 * 86400;
  const out = new Map();
  for (let page = 0; page < 6; page++) {
    let hits = [];
    try {
      const r = await fetch(`https://hn.algolia.com/api/v1/search_by_date?tags=show_hn&hitsPerPage=100&page=${page}&numericFilters=created_at_i>${since}`);
      if (!r.ok) break;
      hits = (await r.json()).hits || [];
    } catch { break; }
    if (!hits.length) break;
    for (const hit of hits) {
      const h = hostOf(hit.url || ""); if (!h || SKIP_HOSTS.test(h + ".")) continue;
      const d = registrable(h);
      if (known.has(d) || known.has(h) || out.has(d)) continue;
      out.set(d, "Show HN: " + String(hit.title || "").slice(0, 80));
    }
  }
  return out;
}
async function get(url) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 9000);
  try {
    const r = await fetch(url, { signal: ctl.signal, redirect: "follow", headers: { "user-agent": "Mozilla/5.0 (compatible; TestimoniResearch/1.0; +https://testimoni.io)" } });
    return { status: r.status, text: (await r.text()).slice(0, 400000) };
  } catch { return { status: 0, text: "" }; } finally { clearTimeout(t); }
}
const strip = (h) => h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, "").toLowerCase(); } catch { return null; } };
const registrable = (h) => { const p = h.split("."); const l = p[p.length - 1], pr = p[p.length - 2]; return l.length === 2 && ["co", "com", "org", "net", "ac"].includes(pr) && p.length >= 3 ? p.slice(-3).join(".") : p.slice(-2).join("."); };

function emailsFrom(html, domain) {
  const found = new Set();
  for (const m of html.matchAll(/mailto:([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/gi)) found.add(m[1].toLowerCase());
  for (const m of html.matchAll(/([A-Za-z0-9._%+-]+)\s?(?:@|\[at\]|\(at\))\s?([A-Za-z0-9.-]+\.[A-Za-z]{2,})/g)) found.add((m[1] + "@" + m[2]).toLowerCase());
  return [...found].filter((e) => {
    const [local, dom] = e.split("@");
    return dom && registrable(dom) === domain && !GENERIC_LOCAL.test(local) && !/\.(png|jpg|svg|webp)$/.test(e) && local.length < 40;
  });
}
const NAMED = (e) => !/^(info|hello|hi|contact|support|sales|team|office|admin|mail|enquiries|enquiry|help|general)$/i.test(e.split("@")[0]);

async function evaluate(domain) {
  const home = await get("https://" + domain);
  if (home.status === 0 || home.status >= 400) return null;
  const html = home.text, text = strip(html).toLowerCase();
  if (text.length < 500) return null;
  const sig = []; let score = 30;
  if (/(book a (discovery |strategy |free )?call|schedule a call|get a quote|request a (quote|proposal|demo)|free consultation|work with (me|us))/.test(text)) { score += 18; sig.push("sells services (book a call/quote)"); }
  if (/(pricing|packages|plans|per month|\/mo\b|retainer)/.test(text)) { score += 12; sig.push("pricing/packages"); }
  if (/(case stud(y|ies)|our clients|clients (include|we've)|results|portfolio)/.test(text)) { score += 10; sig.push("has clients/case studies"); }
  if (/(sign ?up|get started|start (your )?free|free trial|try (it )?(for )?free)/.test(text)) { score += 8; sig.push("signup/trial"); }
  const hasTestis = /(testimonial|what (our )?(clients|customers) say|loved by|kind words)/.test(text);
  if (hasTestis) { score += 8; sig.push("shows testimonials (values proof)"); } else { score += 6; sig.push("no testimonials yet"); }
  if (/(top \d+ |best \d+ |listicle|directory of|find (an )?agenc|compare (the )?best)/.test(text) || /\b(top|best) \d+\b/.test(html.slice(0, 3000).toLowerCase())) { score -= 35; sig.push("looks like a directory/listicle"); }
  if (/(coming soon|under construction|parked|domain (is )?for sale)/.test(text)) score -= 30;
  // Large/enterprise companies are not our buyers (and not reachable by a founder-style email).
  if (/(fortune 500|soc ?2 type|trusted by (over )?\d{3,},? |join(ed)? by (over )?\d{4,}|\d{3,}\+? employees|\d{3,}\+? (global )?clients|we.re hiring|open positions|series [b-f])/.test(text)) { score -= 25; sig.push("looks large/enterprise"); }
  // contact email: homepage, /contact, /about
  let emails = emailsFrom(html, registrable(domain));
  for (const p of ["/contact", "/about", "/contact-us"]) {
    if (emails.length) break;
    const r = await get("https://" + domain + p);
    if (r.status === 200) emails = emailsFrom(r.text, registrable(domain));
  }
  if (!emails.length) return { domain, score: 0, sig: ["no business email found"], email: null };
  const best = emails.find(NAMED) || emails[0];
  score += NAMED(best) ? 14 : /^support$/i.test(best.split("@")[0]) ? 0 : 8; sig.push(NAMED(best) ? "named contact email" : "business email on own domain");
  return { domain, score: Math.max(0, Math.min(100, score)), sig, email: best };
}

(async () => {
  if (!TAVILY_KEY) throw new Error("TAVILY_API_KEY missing");
  const prisma = new PrismaClient();
  const known = new Set((await prisma.lead.findMany({ select: { website: true } })).map((l) => l.website));
  const suppressed = new Set((await prisma.outreachSuppression.findMany({ select: { email: true } })).map((s) => s.email));

  // Rotate queries by date so each day explores different city x segment combos.
  const day = Math.floor(Date.now() / 86400000);
  const combos = [];
  for (let i = 0; i < TEMPLATES.length; i++) for (let j = 0; j < CITIES.length; j++) combos.push(TEMPLATES[i].replace("{city}", CITIES[j]));
  const start = (day * 17) % combos.length;
  const queries = Array.from({ length: 14 }, (_, k) => combos[(start + k * 7) % combos.length]);

  const candidates = new Map();
  for (const q of queries) {
    try {
      for (const r of await tavily(q)) {
        const h = hostOf(r.url); if (!h || SKIP_HOSTS.test(h + ".")) continue;
        const d = registrable(h);
        if (known.has(d) || known.has(h) || candidates.has(d)) continue;
        candidates.set(d, q);
      }
    } catch (e) { console.log("search failed:", q, e.message); }
    await sleep(300);
  }
  console.log(`searched ${queries.length} queries -> ${candidates.size} new candidate domains`);

  const hn = await showHnDomains(known);
  const fromSearch = [...candidates.keys()];
  const fromHn = [...hn.keys()].filter((d) => !candidates.has(d));
  for (const d of fromHn) candidates.set(d, hn.get(d));
  console.log(`Show HN -> ${fromHn.length} new candidate domains`);
  const domains = [];
  for (let i = 0; i < Math.max(fromSearch.length, fromHn.length); i++) {
    if (i < fromHn.length) domains.push(fromHn[i]);
    if (i < fromSearch.length) domains.push(fromSearch[i]);
  }
  const results = []; let idx = 0;
  async function worker() {
    while (idx < domains.length && results.filter((r) => r.score >= MIN_SCORE).length < TARGET) {
      const d = domains[idx++];
      const r = await evaluate(d).catch(() => null);
      if (r) results.push({ ...r, query: candidates.get(d) });
    }
  }
  await Promise.all(Array.from({ length: 8 }, worker));

  const good = results.filter((r) => r.score >= MIN_SCORE && r.email && !suppressed.has(r.email)).sort((a, b) => b.score - a.score);
  console.log(`evaluated ${results.length} sites -> ${good.length} qualified (score >= ${MIN_SCORE})\n`);
  for (const g of good) console.log(String(g.score).padStart(3), g.domain.padEnd(34), g.email.padEnd(36), "|", g.sig.join("; "));

  if (!dry) {
    for (const g of good) {
      await prisma.lead.upsert({
        where: { website: g.domain },
        create: { website: g.domain, companyName: g.domain.split(".")[0], source: "MANUAL", sourceUrl: "https://" + g.domain, publicBusinessEmail: g.email, socialProofStatus: "UNKNOWN", status: "DRAFT_READY", score: g.score, scoreReason: ("Finder: " + g.sig.join("; ") + " | query: " + g.query).slice(0, 990) },
        update: {},
      });
    }
    console.log(`\nqueued ${good.length} prospects (status DRAFT_READY).`);
  } else console.log("\nDRY RUN — nothing written.");
  await prisma.$disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });
