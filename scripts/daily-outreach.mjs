/**
 * Local daily outreach runner (replaces the Vercel cron — runs from
 * Windows Task Scheduler at 8:30 pm IST).
 *
 *   node scripts/daily-outreach.mjs          # DRY RUN: reports what would be sent
 *   node scripts/daily-outreach.mjs --send   # really sends today's batch
 *
 * Runs the app's own /api/cron/daily-outreach handler directly against
 * the database and Resend using .env.local — no web server needed.
 * Sends the next DAILY_OUTREACH_LIMIT (default 15) QUEUED leads
 * (status DRAFT_READY, queued by import-prospects.cjs), alternating the
 * Pro-first and Customer Voice-first templates. Anthropic is never called.
 * Every run is appended to outreach-batches/daily-outreach.log.
 */
import { createRequire, register } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(ROOT, "package.json"));
require("dotenv").config({ path: path.join(ROOT, ".env.local") });
delete process.env.ANTHROPIC_API_KEY; // hard guarantee: no Claude calls

const send = process.argv.includes("--send");
if (send) process.env.DAILY_OUTREACH_ENABLED = "1";
process.env.DAILY_OUTREACH_LIMIT ||= "15";

register(pathToFileURL(path.join(ROOT, "scripts/ts-loader/hooks.mjs")).href);
const { GET } = await import(pathToFileURL(path.join(ROOT, "src/app/api/cron/daily-outreach/route.ts")).href);
const { prisma } = await import(pathToFileURL(path.join(ROOT, "src/lib/prisma.ts")).href);

const res = await GET(new Request("http://local/api/cron/daily-outreach", { headers: { authorization: `Bearer ${process.env.CRON_SECRET}` } }));
const j = await res.json();

const lines = [`[${new Date().toISOString()}] ${send ? "SEND" : "DRY RUN"} status=${res.status} ${j.note ?? ""}`.trim()];
if (j.error) lines.push(`  error: ${j.error}`);
else {
  lines.push(`  limit=${j.dailyLimit} sentEarlierToday=${j.sentToday} processed=${j.processed ?? 0} sent=${j.sent ?? 0} queueLeft=${j.queueLeft ?? "?"}`);
  for (const r of j.results ?? []) lines.push(`  ${r.sent ? "SENT " : send ? "FAIL " : "would"} [${r.variant}] ${r.website} -> ${r.email}${r.error ? " (" + r.error + ")" : ""}`);
}
console.log(lines.join("\n"));
fs.mkdirSync(path.join(ROOT, "outreach-batches"), { recursive: true });
fs.appendFileSync(path.join(ROOT, "outreach-batches", "daily-outreach.log"), lines.join("\n") + "\n");
await prisma.$disconnect();
