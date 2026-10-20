/**
 * Send (or preview) a day's prospect batch.
 *
 *   node scripts/send-batch.cjs                         # PREVIEW newest batch, sends nothing
 *   node scripts/send-batch.cjs --send --count 15       # really send the next 15 unsent
 *   node scripts/send-batch.cjs --date 2026-10-20 --base http://localhost:3001
 *
 * Reads outreach-batches/<date>.json (written by import-prospects.cjs)
 * and calls POST /api/cron/send-combo-batch with CRON_SECRET from
 * .env.local. Without --send it is always a dry run. Leads already
 * contacted, and opted-out addresses, are skipped server-side, so it is
 * safe to run daily with the same file until everyone has been emailed.
 * Templates alternate Pro-first / Customer Voice-first.
 */
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
require(path.join(ROOT, "node_modules/dotenv")).config({ path: path.join(ROOT, ".env.local") });

const args = process.argv.slice(2);
const opt = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const send = args.includes("--send");
const count = Math.min(Number(opt("--count", 15)) || 15, 50);
const base = (opt("--base", process.env.SEND_BASE_URL || "https://testimoni.io")).replace(/\/$/, "");

const dir = path.join(ROOT, "outreach-batches");
const date =
  opt("--date") ||
  fs.readdirSync(dir).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort().pop()?.replace(".json", "");
if (!date) throw new Error("No batch file in outreach-batches/. Run import-prospects.cjs first.");
const batch = JSON.parse(fs.readFileSync(path.join(dir, `${date}.json`), "utf8"));
const ids = batch.eligible.map((e) => e.id).filter(Boolean);

(async () => {
  const url = `${base}/api/cron/send-combo-batch?limit=${count}&dryRun=${send ? 0 : 1}&leadIds=${ids.join(",")}`;
  console.log(`${send ? "SENDING" : "PREVIEW (nothing is sent)"} up to ${count} of ${ids.length} from ${date} via ${base}`);
  const res = await fetch(url, { method: "POST", headers: { authorization: `Bearer ${process.env.CRON_SECRET}` } });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) { console.error("HTTP", res.status, j); process.exit(1); }
  for (const r of j.results) {
    console.log(`${r.sent ? "SENT " : send ? "FAIL " : "draft"}  [${r.variant}] ${r.website} -> ${r.email}${r.error ? "  (" + r.error + ")" : ""}`);
  }
  console.log(`\n${j.count} processed${send ? `, ${j.results.filter((r) => r.sent).length} sent` : " (preview — re-run with --send to send)"}`);
})().catch((e) => { console.error(e.message); process.exit(1); });
