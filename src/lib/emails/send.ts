/**
 * Shared Resend-backed email sender.
 *
 * All internally-triggered emails (submission notifications, founder
 * check-ins, pitch emails) route through this one helper so we get
 * consistent from-address + error handling + no-op behavior when
 * RESEND_API_KEY is missing (dev / staging without a key).
 *
 * Never throws — callers can treat send as fire-and-forget. If the
 * key isn't configured we silently no-op with a dev-time console
 * warning; the DB submission still completes.
 */

import { Resend } from "resend";

const FROM_ADDRESS =
  process.env.EMAIL_FROM_ADDRESS || "Testimoni <no-reply@testimoni.io>";

let cachedClient: Resend | null = null;

function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (cachedClient) return cachedClient;
  cachedClient = new Resend(key);
  return cachedClient;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  /** Optional plain-text fallback. Resend will auto-generate one if
   *  omitted, but supplying a proper text version improves deliverability. */
  text?: string;
  /** Optional reply-to — for submission notifications, we set this to
   *  the submitter's email so owners can reply directly. */
  replyTo?: string;
  /** Optional per-call from-address override. Defaults to
   *  EMAIL_FROM_ADDRESS env / "Testimoni <no-reply@testimoni.io>".
   *  Use for founder-touch emails (welcome, founder-checkin) that
   *  should come from a replyable address like hello@ instead of
   *  the transactional no-reply@. Domain must still be verified
   *  in Resend. */
  from?: string;
}

export async function sendEmail(input: SendEmailInput): Promise<{ ok: boolean; error?: string }> {
  const client = getClient();
  if (!client) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[sendEmail] RESEND_API_KEY missing — skipping send", { to: input.to, subject: input.subject });
    }
    return { ok: false, error: "no_api_key" };
  }

  try {
    const res = await client.emails.send({
      from: input.from || FROM_ADDRESS,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      replyTo: input.replyTo,
    });
    if ((res as { error?: unknown }).error) {
      return { ok: false, error: JSON.stringify((res as { error: unknown }).error) };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
