/**
 * Quality gate for imported prospects. Audits every not-yet-audited lead
 * that import-prospects.cjs created (status NEW, reason starts "Prospect
 * list") by fetching its site, scores it for "real business that can pay
 * and needs social proof", and queues only those scoring >= 60 for the
 * daily sender (status DRAFT_READY). The rest stay NEW with the reason.
 *
 *   node scripts/audit-and-queue.cjs [--min-score 60] [--dry]
 */
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
require(path.join(ROOT, "node_modules/dotenv")).config({ path: path.join(ROOT, ".env.local") });
const { PrismaClient } = require(path.join(ROOT, "node_modules/@prisma/client"));

const args = process.argv.slice(2);
const opt = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const MIN = Number(opt("--min-score", 60));
const dry = args.includes("--dry");
const FREE_MAIL = /@(gmail|googlemail|yahoo|hotmail|outlook|live|icloud|proton|protonmail|aol)./i;
const badAddress = (e, host) => FREE_MAIL.test(e) || /u003|%[0-9a-f]{2}|[<>"s]/i.test(e) || /^(github|gitlab|medium|notion|linkedin|facebook)./i.test(host);
const COMPETITOR = /senja\.io|famewall\.io|testimonial\.to|shapo\.io|endorsal|trustmary|vouch(?:for|\.)|testimonialhub/i;

async function get(url) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 9000);
  try {
    const r = await fetch(url, { signal: ctl.signal, redirect: "follow", headers: { "user-agent": "Mozilla/5.0 (compatible; TestimoniResearch/1.0; +https://testimoni.io)" } });
    return { status: r.status, text: (await r.text()).slice(0, 400000) };
  } catch { return { status: 0, text: "" }; } finally { clearTimeout(t); }
}
const strip = (h) => h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

async function audit(host) {
  const home = await get("https://" + host);
  if (home.status === 0 || home.status >= 400) return { score: 0, notes: ["site not reachable"] };
  const html = home.text, text = strip(html).toLowerCase();
  const notes = []; let score = 20;
  const pricingLink = /href=["'][^"']*pricing/i.test(html);
  if (pricingLink || /\$\s?\d|\/\s?mo(nth)?\b|per month/i.test(text)) {
    const pr = await get("https://" + host + "/pricing");
    const ptxt = pr.status === 200 ? strip(pr.text).toLowerCase() : text;
    const paid = /(\$|€|£|₹)\s?\d{1,4}/.test(ptxt) && /(per month|\/ ?mo|monthly|per year|\/ ?yr|one-time|lifetime)/.test(ptxt);
    if (paid) { score += 30; notes.push("has paid pricing"); } else if (pricingLink) { score += 8; notes.push("pricing page, no clear price"); }
  }
  if (/(sign ?up|get started|start (your )?free|free trial|log ?in)/.test(text)) { score += 10; notes.push("signup/trial"); }
  if (COMPETITOR.test(html)) { score += 25; notes.push("ALREADY USES A TESTIMONIAL TOOL"); }
  const hasTestis = /(testimonial|what our (customers|users) say|loved by|reviews?)/.test(text);
  if (hasTestis) { score += 8; notes.push("has social-proof section"); } else { score += 6; notes.push("no social proof yet (needs it)"); }
  if (/(coming soon|under construction|launching soon|waitlist|join the waitlist)/.test(text)) { score -= 20; notes.push("waitlist/coming soon"); }
  if (/(download on the app store|get it on google play)/.test(text)) { score -= 5; notes.push("consumer app"); }
  if (text.length < 600) { score -= 10; notes.push("very thin site"); }
  return { score: Math.max(0, Math.min(100, score)), notes };
}

(async () => {
  const prisma = new PrismaClient();
  const leads = await prisma.lead.findMany({
    where: { status: "NEW", source: "MANUAL", publicBusinessEmail: { not: null }, scoreReason: { startsWith: "Prospect list" } },
    select: { id: true, website: true, publicBusinessEmail: true },
  });
  console.log(`auditing ${leads.length} imported prospects…`);
  let queued = 0, held = 0, i = 0;
  async function worker() {
    while (i < leads.length) {
      const l = leads[i++];
      const a = badAddress(l.publicBusinessEmail, l.website) ? { score: 0, notes: ["free-mail or malformed contact address"] } : await audit(l.website);
      const keep = a.score >= MIN;
      if (!dry) {
        await prisma.lead.update({
          where: { id: l.id },
          data: { score: a.score, status: keep ? "DRAFT_READY" : "NEW", scoreReason: ("Payability audit " + a.score + "/100: " + a.notes.join("; ") + (keep ? "" : " | HELD: below quality bar (" + MIN + ")")).slice(0, 990) },
        });
      }
      keep ? queued++ : held++;
    }
  }
  await Promise.all(Array.from({ length: 8 }, worker));
  console.log(`${dry ? "[DRY RUN] " : ""}queued ${queued}, held ${held}`);
  await prisma.$disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });
