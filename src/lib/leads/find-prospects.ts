import { prisma } from "@/lib/prisma";
import { tavilySearch, hasTavily } from "@/lib/tavily";

/**
 * Finds businesses that need social proof and can pay, and queues the good
 * ones (status DRAFT_READY) for the 8 pm sender. Never sends email.
 *
 * Runs on Vercel (see /api/cron/find-prospects) so it no longer depends on
 * a PC being switched on. scripts/find-prospects.cjs is the same logic for
 * running by hand. Two sources, neither uses Claude:
 *   - Tavily searches (agencies, coaches, consultants by city), a few a run
 *   - Hacker News "Show HN" launches via the free Algolia API
 */

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
const SKIP_HOSTS = /(^|\.)(linkedin|facebook|instagram|twitter|x|youtube|medium|reddit|quora|pinterest|yelp|clutch|goodfirms|upwork|fiverr|g2|capterra|trustpilot|crunchbase|glassdoor|indeed|forbes|inc|entrepreneur|hubspot|semrush|ahrefs|wikipedia|github|substack|eventbrite|meetup|designrush|sortlist|themanifest|expertise|builtin|angel|producthunt|techcrunch|shopify|wordpress|wix|squarespace|google|apple|microsoft|amazon|trello|atlassian|cbinsights|notion|slack|zoom|stripe|salesforce|oracle|ibm|adobe)\./i;
const GENERIC_LOCAL = /^(noreply|no-reply|donotreply|privacy|abuse|legal|jobs|careers|press|pr|media|investors|ir|webmaster|postmaster|mailer-daemon|unsubscribe|billing|security|compliance)$/i;

const hostOf = (u: string): string | null => {
  try {
    return new URL(u).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
};
const registrable = (h: string): string => {
  const p = h.split(".");
  const l = p[p.length - 1];
  const pr = p[p.length - 2];
  return l.length === 2 && ["co", "com", "org", "net", "ac"].includes(pr) && p.length >= 3 ? p.slice(-3).join(".") : p.slice(-2).join(".");
};

async function get(url: string): Promise<{ status: number; text: string }> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 5000);
  try {
    const r = await fetch(url, {
      signal: ctl.signal,
      redirect: "follow",
      headers: { "user-agent": "Mozilla/5.0 (compatible; TestimoniResearch/1.0; +https://testimoni.io)" },
    });
    return { status: r.status, text: (await r.text()).slice(0, 400000) };
  } catch {
    return { status: 0, text: "" };
  } finally {
    clearTimeout(t);
  }
}
const strip = (h: string) =>
  h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

function emailsFrom(html: string, domain: string): string[] {
  const found = new Set<string>();
  for (const m of html.matchAll(/mailto:([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/gi)) found.add(m[1].toLowerCase());
  for (const m of html.matchAll(/([A-Za-z0-9._%+-]+)\s?(?:@|\[at\]|\(at\))\s?([A-Za-z0-9.-]+\.[A-Za-z]{2,})/g)) {
    found.add((m[1] + "@" + m[2]).toLowerCase());
  }
  return [...found].filter((e) => {
    const [local, dom] = e.split("@");
    return dom && registrable(dom) === domain && !GENERIC_LOCAL.test(local) && !/\.(png|jpg|svg|webp)$/.test(e) && local.length < 40;
  });
}
const NAMED = (e: string) => !/^(info|hello|hi|contact|support|sales|team|office|admin|mail|enquiries|enquiry|help|general)$/i.test(e.split("@")[0]);

type Evaluated = { domain: string; score: number; sig: string[]; email: string | null };

async function evaluate(domain: string): Promise<Evaluated | null> {
  const home = await get("https://" + domain);
  if (home.status === 0 || home.status >= 400) return null;
  const html = home.text;
  const text = strip(html).toLowerCase();
  if (text.length < 500) return null;

  const sig: string[] = [];
  let score = 30;
  if (/(book a (discovery |strategy |free )?call|schedule a call|get a quote|request a (quote|proposal|demo)|free consultation|work with (me|us))/.test(text)) { score += 18; sig.push("sells services (book a call/quote)"); }
  if (/(pricing|packages|plans|per month|\/mo\b|retainer)/.test(text)) { score += 12; sig.push("pricing/packages"); }
  if (/(case stud(y|ies)|our clients|clients (include|we've)|results|portfolio)/.test(text)) { score += 10; sig.push("has clients/case studies"); }
  if (/(sign ?up|get started|start (your )?free|free trial|try (it )?(for )?free)/.test(text)) { score += 8; sig.push("signup/trial"); }
  const hasTestis = /(testimonial|what (our )?(clients|customers) say|loved by|kind words)/.test(text);
  if (hasTestis) { score += 8; sig.push("shows testimonials (values proof)"); } else { score += 6; sig.push("no testimonials yet"); }
  if (/(top \d+ |best \d+ |listicle|directory of|find (an )?agenc|compare (the )?best)/.test(text) || /\b(top|best) \d+\b/.test(html.slice(0, 3000).toLowerCase())) { score -= 35; sig.push("looks like a directory/listicle"); }
  if (/(coming soon|under construction|parked|domain (is )?for sale)/.test(text)) score -= 30;
  // Large companies are not our buyers and are not reachable by a founder-style email.
  const large = /(fortune 500|soc ?2 type|trusted by (over )?\d{3,},? |join(ed)? by (over )?\d{4,}|\d{3,}\+? employees|\d{3,}\+? (global )?clients|we.re hiring|open positions|series [b-f])/.test(text);
  if (large) { score -= 25; sig.push("looks large/enterprise"); }

  let emails = emailsFrom(html, registrable(domain));
  if (!emails.length) {
    // the three likely contact pages, fetched together instead of one by one
    const pages = await Promise.all(["/contact", "/about", "/contact-us"].map((p) => get("https://" + domain + p)));
    for (const r of pages) {
      if (r.status === 200 && !emails.length) emails = emailsFrom(r.text, registrable(domain));
    }
  }
  if (!emails.length) return { domain, score: 0, sig: ["no business email found"], email: null };
  const best = emails.find(NAMED) || emails[0];
  score += NAMED(best) ? 14 : /^support$/i.test(best.split("@")[0]) ? 0 : 8;
  sig.push(NAMED(best) ? "named contact email" : "business email on own domain");
  return { domain, score: Math.max(0, Math.min(100, score)), sig, email: best };
}

async function showHnDomains(known: Set<string>): Promise<Map<string, string>> {
  const since = Math.floor(Date.now() / 1000) - 21 * 86400;
  const out = new Map<string, string>();
  for (let page = 0; page < 6; page++) {
    let hits: { url?: string; title?: string }[] = [];
    try {
      const r = await fetch(`https://hn.algolia.com/api/v1/search_by_date?tags=show_hn&hitsPerPage=100&page=${page}&numericFilters=created_at_i>${since}`);
      if (!r.ok) break;
      hits = (await r.json()).hits || [];
    } catch {
      break;
    }
    if (!hits.length) break;
    for (const hit of hits) {
      const h = hostOf(hit.url || "");
      if (!h || SKIP_HOSTS.test(h + ".")) continue;
      const d = registrable(h);
      if (known.has(d) || known.has(h) || out.has(d)) continue;
      out.set(d, "Show HN: " + String(hit.title || "").slice(0, 80));
    }
  }
  return out;
}

export async function findProspects(opts: {
  /** Stop starting new site checks after this long. */
  budgetMs: number;
  target: number;
  minScore: number;
  /** Rotates which search queries run, so repeated runs on one day differ. */
  runIndex: number;
  /** Sites checked in parallel (default 8). */
  workers?: number;
  dryRun?: boolean;
}) {
  const started = Date.now();
  const known = new Set((await prisma.lead.findMany({ select: { website: true } })).map((l) => l.website));
  const suppressed = new Set((await prisma.outreachSuppression.findMany({ select: { email: true } })).map((s) => s.email.toLowerCase()));

  const candidates = new Map<string, string>();

  // A couple of Tavily searches per run (1 credit each); Show HN is the free bulk.
  if (hasTavily()) {
    const day = Math.floor(Date.now() / 86400000);
    const combos: string[] = [];
    for (const t of TEMPLATES) for (const c of CITIES) combos.push(t.replace("{city}", c));
    const start = (day * 17 + opts.runIndex * 29) % combos.length;
    for (const q of [combos[start], combos[(start + 7) % combos.length]]) {
      try {
        const { results } = await tavilySearch({ query: q, searchDepth: "basic", maxResults: 10 });
        for (const r of results) {
          const h = hostOf(r.url);
          if (!h || SKIP_HOSTS.test(h + ".")) continue;
          const d = registrable(h);
          if (known.has(d) || known.has(h) || candidates.has(d)) continue;
          candidates.set(d, q);
        }
      } catch (e) {
        console.warn("[find-prospects] search failed:", q, e);
      }
    }
  }
  const fromSearch = [...candidates.keys()];
  const hn = await showHnDomains(known);
  const fromHn = [...hn.keys()].filter((d) => !candidates.has(d));
  for (const d of fromHn) candidates.set(d, hn.get(d)!);

  // Alternate the two sources, and start at a different point each run so
  // runs don't keep re-checking the same first domains.
  const offset = (opts.runIndex * 37) % Math.max(fromHn.length, 1);
  const rotatedHn = [...fromHn.slice(offset), ...fromHn.slice(0, offset)];
  const domains: string[] = [];
  for (let i = 0; i < Math.max(fromSearch.length, rotatedHn.length); i++) {
    if (i < rotatedHn.length) domains.push(rotatedHn[i]);
    if (i < fromSearch.length) domains.push(fromSearch[i]);
  }

  const results: (Evaluated & { query: string })[] = [];
  let idx = 0;
  const qualified = () => results.filter((r) => r.score >= opts.minScore && r.email).length;
  async function worker() {
    while (idx < domains.length && qualified() < opts.target && Date.now() - started < opts.budgetMs) {
      const d = domains[idx++];
      const r = await evaluate(d).catch(() => null);
      if (r) results.push({ ...r, query: candidates.get(d) ?? "" });
    }
  }
  await Promise.all(Array.from({ length: opts.workers ?? 8 }, worker));

  const good = results
    .filter((r) => r.score >= opts.minScore && r.email && !suppressed.has(r.email))
    .sort((a, b) => b.score - a.score);

  if (!opts.dryRun) {
    for (const g of good) {
      await prisma.lead.upsert({
        where: { website: g.domain },
        create: {
          website: g.domain,
          companyName: g.domain.split(".")[0],
          source: "MANUAL",
          sourceUrl: "https://" + g.domain,
          publicBusinessEmail: g.email!,
          socialProofStatus: "UNKNOWN",
          status: "DRAFT_READY",
          score: g.score,
          scoreReason: ("Finder: " + g.sig.join("; ") + " | " + g.query).slice(0, 990),
        },
        update: {},
      });
    }
  }

  return {
    candidates: domains.length,
    evaluated: results.length,
    queued: opts.dryRun ? 0 : good.length,
    qualified: good.length,
    samples: good.slice(0, 5).map((g) => ({ domain: g.domain, score: g.score })),
    seconds: Math.round((Date.now() - started) / 1000),
  };
}
