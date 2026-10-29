"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Loader2, Mail } from "lucide-react";
import { OtpCodeInput } from "@/components/otp-code-input";
import { Button } from "@/components/ui/button";
import { webmailForEmail } from "@/lib/email-provider";
import { track } from "@/lib/analytics";

/**
 * The "Check your email" screen shown after:
 *   - signing up with a password (mode "signup": confirms the address), and
 *   - asking for a sign-in code on /login (mode "login").
 * The 6/8-digit code is the main action; the emailed link works too.
 * Needs the Supabase email templates to include {{ .Token }} — see the
 * setup notes in the PR / auth docs.
 */

const RESEND_COOLDOWN_S = 45;

interface Props {
  email: string;
  mode: "signup" | "login";
  /** Where to go after the code is accepted. */
  redirectTo: string;
  /** Re-send the code. Parent runs the Turnstile gate + Supabase call. */
  onResend: () => Promise<{ error?: string }>;
  /** Back to the form to correct the email. */
  onChangeEmail: () => void;
  surface: string;
}

export function VerifyEmailScreen({ email, mode, redirectTo, onResend, onChangeEmail, surface }: Props) {
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_S);
  const [resending, setResending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);
  const webmail = webmailForEmail(email);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function resend() {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setResendError(null);
    setNotice(null);
    const { error } = await onResend();
    setResending(false);
    if (error) {
      setResendError(error);
      return;
    }
    track("auth_code_resent", { mode, surface });
    setNotice("New code sent. Check your inbox.");
    setCooldown(RESEND_COOLDOWN_S);
  }

  return (
    <div className="space-y-5 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <Mail className="h-6 w-6 text-primary" />
      </div>

      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Check your email</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "signup" ? "To finish creating your account, enter" : "Enter"} the code we sent to{" "}
          <span className="font-medium text-foreground">{email}</span>.
        </p>
      </div>

      <OtpCodeInput
        email={email}
        redirectTo={redirectTo}
        otpType={mode === "signup" ? "signup" : "email"}
        successEvent={mode === "signup" ? "signup_completed" : "login_completed"}
        method={mode === "signup" ? "email_password" : "email_code"}
        surface={surface}
        hideHeader
      />

      {webmail && (
        <a
          href={webmail.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track("auth_open_webmail_clicked", { provider: webmail.name, surface })}
        >
          <Button type="button" variant="outline" size="sm" className="w-full">
            Open {webmail.name}
            <ExternalLink className="ml-2 h-3.5 w-3.5" />
          </Button>
        </a>
      )}

      <div className="space-y-2 text-xs text-muted-foreground">
        <p>The code expires in about an hour. Not there? Check spam or promotions.</p>
        {mode === "login" && (
          <p>No code at all? Make sure it&apos;s the same email you signed up with.</p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <button
            type="button"
            onClick={resend}
            disabled={cooldown > 0 || resending}
            className="font-medium text-primary underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
          >
            {resending ? (
              <span className="inline-flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Sending…
              </span>
            ) : cooldown > 0 ? (
              `Resend code in ${cooldown}s`
            ) : (
              "Resend code"
            )}
          </button>
          <button
            type="button"
            onClick={onChangeEmail}
            className="font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Use a different email
          </button>
        </div>
        {notice && <p className="text-emerald-600">{notice}</p>}
        {resendError && (
          <p className="text-destructive" role="alert">
            {resendError}
          </p>
        )}
      </div>
    </div>
  );
}
