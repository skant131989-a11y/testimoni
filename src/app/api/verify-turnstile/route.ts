import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * POST /api/verify-turnstile
 *
 * Called client-side right before Supabase signup / login. Validates
 * the Turnstile token with Cloudflare's siteverify API and returns
 * ok:true if the challenge passed.
 *
 * ── Fail-open when misconfigured ───────────────────────────────
 * If TURNSTILE_SECRET_KEY is missing (local dev without the env
 * var set, forgotten Vercel config), we return ok:true rather
 * than blocking real users. See the README/comment in
 * <Turnstile />.
 *
 * ── Rate limit ─────────────────────────────────────────────────
 * 30 checks per IP per minute. That's plenty for a normal
 * founder poking a form, way below what a bot fleet would need to
 * be useful.
 */

const BODY = z.object({
  token: z.string().min(1).max(2048),
  action: z.string().max(40).optional(),
});

const HITS = new Map<string, { minute: number; count: number }>();
const LIMIT_PER_MIN = 30;

function ipFrom(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

interface CFResponse {
  success: boolean;
  "error-codes"?: string[];
  hostname?: string;
  action?: string;
  cdata?: string;
  challenge_ts?: string;
}

export async function POST(req: NextRequest) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    // Fail-open — server misconfig shouldn't lock everyone out.
    return NextResponse.json({ ok: true, degraded: true });
  }

  const ip = ipFrom(req);
  const nowMinute = Math.floor(Date.now() / 60_000);
  const hit = HITS.get(ip);
  if (hit && hit.minute === nowMinute) {
    if (hit.count >= LIMIT_PER_MIN) {
      return NextResponse.json(
        { ok: false, error: "rate_limited" },
        { status: 429 },
      );
    }
    hit.count += 1;
  } else {
    HITS.set(ip, { minute: nowMinute, count: 1 });
  }

  let body: z.infer<typeof BODY>;
  try {
    body = BODY.parse(await req.json());
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_body" },
      { status: 400 },
    );
  }

  const form = new URLSearchParams();
  form.append("secret", secret);
  form.append("response", body.token);
  form.append("remoteip", ip);
  if (body.action) form.append("action", body.action);

  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
        body: form.toString(),
      },
    );
    const data = (await res.json()) as CFResponse;
    if (data.success) {
      return NextResponse.json({ ok: true, hostname: data.hostname });
    }
    return NextResponse.json(
      { ok: false, error: "verify_failed", codes: data["error-codes"] },
      { status: 400 },
    );
  } catch {
    // Cloudflare unreachable — fail-closed on network issues so we
    // don't accidentally open the gate during a DNS/edge glitch.
    return NextResponse.json(
      { ok: false, error: "verify_unreachable" },
      { status: 502 },
    );
  }
}
