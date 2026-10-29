# Supabase email templates (verification + sign-in code)

Paste these in **Supabase → Authentication → Email Templates**.

| Supabase template | Paste this file | Subject line |
|---|---|---|
| **Confirm signup** | `confirm-signup.html` | `Your Testimoni verification code: {{ .Token }}` |
| **Magic Link** | `magic-link.html` | `Your Testimoni sign-in code: {{ .Token }}` |

- **Confirm signup** is sent when someone signs up with a password (needs *Auth → Providers → Email → Confirm email* ON) and when an unconfirmed account tries to log in.
- **Magic Link** is sent for "Email me a sign-in code" on /login and the inline "Send me a sign-in link" card.
- Both show the **code** (`{{ .Token }}`) as the main action and the one-click link (`{{ .ConfirmationURL }}`) as a backup — the code can't be burned by mail scanners that pre-open links.
- **Code length:** set *Auth → Providers → Email → Email OTP Length* to match the app (default 8; set `NEXT_PUBLIC_OTP_LENGTH=6` in Vercel if you use 6). Expiry default is 1 hour (3600 s) — the templates say "1 hour", change both together.
- **Sender:** under *Auth → SMTP Settings* use your Resend SMTP details so these arrive from `@testimoni.io` instead of Supabase's shared sender (better deliverability).
- Supabase variables used: `{{ .Token }}`, `{{ .ConfirmationURL }}`, `{{ .Email }}`.
