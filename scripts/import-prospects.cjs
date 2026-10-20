/**
 * Daily prospect import for Testimoni outreach.
 *
 *   node scripts/import-prospects.cjs                 # newest CSV in the reports folder
 *   node scripts/import-prospects.cjs --file X.csv    # a specific file
 *   node scripts/import-prospects.cjs --hold-days 14  # change the cool-off window
 *   node scripts/import-prospects.cjs --dry           # report only, write nothing
 *
 * Upserts every row as a Lead (source MANUAL) and splits them into:
 *   eligible — safe to email now
 *   held     — recently contacted by the other app, free-mail / mismatched
 *              email domain, etc. (reason recorded; nothing is sent)
 *   skipped  — already contacted/ignored here, or the address opted out
 * Writes outreach-batches/<date>.json with the eligible lead ids IN ORDER
 * (the send route alternates the two templates down that list).
 * Never sends email.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
require(path.join(ROOT, "node_modules/dotenv")).config({ path: path.join(ROOT, ".env.local") });
const { PrismaClient } = require(path.join(ROOT, "node_modules/@prisma/client"));

const REPORT_DIR =
  process.env.PROSPECTS_DIR ||
  "C:/Users/Neha/Documents/Codex/2026-09-20/referenced-chatgpt-conversation-this-is-an/rising-mvp/reports/testimoni-prospects";
const TERMINAL = ["CONTACTED", "REPLIED", "SIGNUP", "CONVERTED", "IGNORED"];
const FREE_MAIL = /^(gmail|googlemail|yahoo|hotmail|outlook|live|icloud|proton|protonmail|aol)\./i;

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);

function parseCsv(text) {
  const rows = [];
  let row = [], field = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((v) => v !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  const [header, ...data] = rows;
  return data.map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? "").trim()])));
}

function hostOf(url) {
  try {
    const u = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`);
    return u.hostname.replace(/^www\./i, "").toLowerCase();
  } catch { return null; }
}
function registrable(host) {
  const p = host.split(".");
  const last = p[p.length - 1], prev = p[p.length - 2];
  return last.length === 2 && ["co", "com", "org", "net", "ac", "gov"].includes(prev) && p.length >= 3
    ? p.slice(-3).join(".") : p.slice(-2).join(".");
}

(async () => {
  let file = opt("--file");
  if (!file) {
    const csvs = fs.readdirSync(REPORT_DIR).filter((f) => f.endsWith(".csv")).sort();
    if (!csvs.length) throw new Error("No CSV in " + REPORT_DIR);
    file = path.join(REPORT_DIR, csvs[csvs.length - 1]);
  }
  const holdDays = Number(opt("--hold-days", 10));
  const dry = flag("--dry");
  const rows = parseCsv(fs.readFileSync(file, "utf8"));
  const prisma = new PrismaClient();
  const suppressed = new Set((await prisma.outreachSuppression.findMany({ select: { email: true } })).map((s) => s.email));
  const runDate = rows[0]?.run_date || new Date().toISOString().slice(0, 10);
  const now = Date.now();

  const eligible = [], held = [], skipped = [];
  const seenEmails = new Set();

  for (const r of rows) {
    const website = hostOf(r.product_url);
    const email = (r.public_email || "").toLowerCase();
    const label = `${r.product_name} <${email}>`;
    if (!website || !email.includes("@")) { skipped.push({ lead: label, reason: "no valid website/email" }); continue; }
    if (suppressed.has(email)) { skipped.push({ lead: label, reason: "address opted out (suppression list)" }); continue; }
    if (seenEmails.has(email)) { skipped.push({ lead: label, reason: "duplicate email in this file" }); continue; }
    seenEmails.add(email);

    const existing = await prisma.lead.findUnique({ where: { website } });
    if (existing && TERMINAL.includes(existing.status)) {
      skipped.push({ lead: label, reason: `lead already ${existing.status}` });
      continue;
    }

    let hold = null;
    if (r.previous_uppeek_contact === "Yes" && r.last_contacted_at) {
      const days = Math.floor((now - Date.parse(r.last_contacted_at)) / 86400000);
      if (days < holdDays) hold = `contacted by the other app ${days}d ago (hold < ${holdDays}d)`;
    }
    const emailHost = email.split("@")[1];
    if (!hold && FREE_MAIL.test(emailHost)) hold = "free-mail address — verify it is the founder";
    if (!hold && registrable(emailHost) !== registrable(website)) hold = `email domain (${emailHost}) differs from the product site (${website}) — verify`;

    const priority = Number(r.priority) || 50;
    const score = hold ? 20 : Math.max(60, 100 - priority);
    const scoreReason = `Prospect list ${runDate} (${r.lead_source || "n/a"}). ${hold ? "HOLD: " + hold : "Eligible."}`.slice(0, 990);

    let id = existing?.id;
    if (!dry) {
      const data = {
        companyName: r.product_name || existing?.companyName || website,
        publicBusinessEmail: existing?.publicBusinessEmail || email,
        score,
        scoreReason,
      };
      const lead = await prisma.lead.upsert({
        where: { website },
        create: { website, source: "MANUAL", sourceUrl: r.product_url, socialProofStatus: "UNKNOWN", status: "NEW", productName: r.product_name || null, ...data },
        update: data,
      });
      id = lead.id;
      // Use the address actually stored on the lead (could pre-date this file).
    }
    (hold ? held : eligible).push({ id, website, product: r.product_name, email: existing?.publicBusinessEmail || email, ...(hold ? { reason: hold } : {}) });
  }

  const out = { runDate, file: path.basename(file), eligible, held, skipped };
  if (!dry) {
    const dir = path.join(ROOT, "outreach-batches");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${runDate}.json`), JSON.stringify(out, null, 2));
  }
  console.log(`\n${dry ? "[DRY RUN] " : ""}${path.basename(file)}: ${rows.length} rows`);
  console.log(`  eligible: ${eligible.length}   held: ${held.length}   skipped: ${skipped.length}`);
  console.log("\nELIGIBLE (send order — templates alternate Pro / Customer Voice):");
  eligible.forEach((e, i) => console.log(`  ${String(i + 1).padStart(2)}. [${i % 2 === 0 ? "pro  " : "voice"}] ${e.product} — ${e.email}`));
  console.log("\nHELD:");
  held.forEach((h) => console.log(`  - ${h.product} <${h.email}>: ${h.reason}`));
  if (skipped.length) { console.log("\nSKIPPED:"); skipped.forEach((s) => console.log(`  - ${s.lead}: ${s.reason}`)); }
  if (!dry) console.log(`\nlead ids written to outreach-batches/${runDate}.json`);
  await prisma.$disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });
