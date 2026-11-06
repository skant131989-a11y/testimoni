import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createRequests } from "@/lib/requests";

const BODY = z.object({
  email: z.string().min(3).max(320).optional(),
  customer_email: z.string().min(3).max(320).optional(),
  name: z.string().max(200).optional(),
  customer_name: z.string().max(200).optional(),
  delay_days: z.number().int().min(0).max(30).optional(),
});

/**
 * POST /api/hooks/request/<secret>
 *
 * Ask one customer for a testimonial from any automation: Zapier, Make,
 * a Stripe/Shopify/Gumroad flow, or your own code.
 *
 *   curl -X POST <url> -H "Content-Type: application/json" \
 *     -d '{"email":"ana@example.com","name":"Ana","delay_days":3}'
 *
 * The secret in the URL identifies the workspace. Monthly limits apply
 * (see PLAN_LIMITS.requestsPerMonth); repeat and opted-out addresses are
 * skipped.
 */
export async function POST(req: Request, { params }: { params: Promise<{ secret: string }> }) {
  const { secret } = await params;
  const hook = await prisma.requestHook.findUnique({ where: { secret }, select: { workspaceId: true } });
  if (!hook) return NextResponse.json({ error: "Unknown webhook" }, { status: 404 });

  let body: z.infer<typeof BODY>;
  try {
    body = BODY.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'Send JSON like {"email":"ana@example.com","name":"Ana"}' }, { status: 400 });
  }
  const email = body.email ?? body.customer_email;
  if (!email) return NextResponse.json({ error: "email is required" }, { status: 400 });

  const result = await createRequests({
    workspaceId: hook.workspaceId,
    entries: [{ email, name: body.name ?? body.customer_name ?? null }],
    delayDays: body.delay_days ?? 0,
    source: "webhook",
  });

  if (result.limitReached) {
    return NextResponse.json({ ok: false, error: "monthly request limit reached" }, { status: 429 });
  }
  return NextResponse.json({ ok: true, ...result });
}
