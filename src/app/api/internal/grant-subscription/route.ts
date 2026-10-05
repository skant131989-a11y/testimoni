import { NextResponse } from "next/server";
import { z } from "zod";
import { timingSafeEqual } from "node:crypto";
import { grantMonths } from "@/lib/grants";

/**
 * POST /api/internal/grant-subscription — server-to-server only.
 *
 *   Authorization: Bearer <GRANT_API_KEY>
 *   { "email": "user@x.com", "months": 3, "source": "other-app", "externalRef": "order_123" }
 *
 * Gives the user's workspace Pro for N months (stacking on any access
 * still running). If the email has no Testimoni account yet, the grant
 * is queued and applied the moment they first sign up with that email.
 * `externalRef` makes retries safe: the same ref never grants twice.
 */
const BODY = z.object({
  email: z.string().email().max(254),
  months: z.number().int().min(1).max(36),
  source: z.string().max(64).optional(),
  externalRef: z.string().min(1).max(128).optional(),
});

function authorized(req: Request): boolean {
  const key = process.env.GRANT_API_KEY;
  if (!key) return false;
  const given = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${key}`;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  if (!process.env.GRANT_API_KEY) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof BODY>;
  try {
    body = BODY.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: "invalid_body", hint: "email (string), months (integer 1-36), optional source, externalRef" },
      { status: 400 }
    );
  }

  try {
    const result = await grantMonths(body);
    if (result.status === "conflict") {
      return NextResponse.json({ error: result.reason, email: body.email }, { status: 409 });
    }
    if (result.status === "applied") {
      return NextResponse.json({
        ok: true,
        status: "applied",
        email: body.email,
        months: body.months,
        plan: "PRO",
        accessUntil: result.accessUntil.toISOString(),
      });
    }
    if (result.status === "pending") {
      return NextResponse.json({
        ok: true,
        status: "pending",
        email: body.email,
        months: body.months,
        note: "No Testimoni account for this email yet — the grant applies when they sign up with it.",
      });
    }
    return NextResponse.json({
      ok: true,
      status: "duplicate",
      email: body.email,
      previous: {
        status: result.previous.status,
        accessUntil: result.previous.accessUntil?.toISOString() ?? null,
      },
    });
  } catch (err) {
    console.error("[grant-subscription] failed:", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
