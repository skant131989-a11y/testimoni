/**
 * Send (or preview) a day's prospect batch.
 *
 *   node scripts/send-batch.cjs                         # PREVIEW newest batch, sends nothing
 *   node scripts/send-batch.cjs --send --count 25       # really send the next 25 unsent
 *   node scripts/send-batch.cjs --send --count 25 --local # run the same route in-process
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
const { pathToFileURL } = require("url");
const { register } = require("node:module");
const ROOT = path.resolve(__dirname, "..");
require(path.join(ROOT, "node_modules/dotenv")).config({ path: path.join(ROOT, ".env.local") });

const args = process.argv.slice(2);
const opt = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const send = args.includes("--send");
const local = args.includes("--local");
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
  let res;
  if (local) {
    if (!process.env.CRON_SECRET) throw new Error("CRON_SECRET is missing from .env.local");
    console.log(`${send ? "SENDING" : "PREVIEW (nothing is sent)"} up to ${count} of ${ids.length} from ${date} via the local route`);
    register(pathToFileURL(path.join(ROOT, "scripts/ts-loader/hooks.mjs")).href);
    const [{ POST }, { prisma }] = await Promise.all([
      import(pathToFileURL(path.join(ROOT, "src/app/api/cron/send-combo-batch/route.ts"))),
      import(pathToFileURL(path.join(ROOT, "src/lib/prisma.ts"))),
    ]);
    const istToday = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
    istToday.setUTCHours(0, 0, 0, 0);
    const utcStart = new Date(istToday.getTime() - 5.5 * 60 * 60 * 1000);
    const sentToday = await prisma.leadOutreachDraft.count({ where: { createdAt: { gte: utcStart } } });
    const dailyCap = Math.min(Number(process.env.DAILY_OUTREACH_LIMIT) || 25, 25);
    const limit = Math.min(count, Math.max(0, dailyCap - sentToday), ids.length);
    if (!limit) {
      console.log(`Daily send cap reached (${sentToday}/${dailyCap}); nothing sent.`);
      await prisma.$disconnect();
      return;
    }
    const request = new Request(`http://localhost/api/cron/send-combo-batch?limit=${limit}&dryRun=${send ? 0 : 1}&leadIds=${ids.join(",")}`, {
      method: "POST",
      headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
    });
    try { res = await POST(request); }
    finally { await prisma.$disconnect(); }
  } else {
    console.log(`${send ? "SENDING" : "PREVIEW (nothing is sent)"} up to ${count} of ${ids.length} from ${date} via ${base}`);
    res = await fetch(url, { method: "POST", headers: { authorization: `Bearer ${process.env.CRON_SECRET}` } });
  }
  const j = await res.json().catch(() => ({}));
  if (!res.ok) { console.error("HTTP", res.status, j); process.exit(1); }
  for (const r of j.results) {
    console.log(`${r.sent ? "SENT " : send ? "FAIL " : "draft"}  [${r.variant}] ${r.website} -> ${r.email}${r.error ? "  (" + r.error + ")" : ""}`);
  }
  console.log(`\n${j.count} processed${send ? `, ${j.results.filter((r) => r.sent).length} sent` : " (preview — re-run with --send to send)"}`);
})().catch((e) => { console.error(e.message); process.exit(1); });
