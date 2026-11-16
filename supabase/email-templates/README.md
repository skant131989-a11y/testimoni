# Supabase email templates (verification + sign-in code)

Paste these in **Supabase → Authentication → Email Templates**.

| Supabase template | Paste this file | Subject line |
|---|---|---|
| **Confirm signup** | `confirm-signup.html` | `Your Testimoni verification code: {{ .Token }}` |
| **Magic Link** | `magic-link.html` | `Your Testimoni sign-in code: {{ .Token }}` |

- **Confirm signup** is sent when a brand-new email asks for a code on /login, /signup or the inline signup cards (Supabase creates the account and uses this template), and when an unconfirmed account tries to log in. **It must contain `{{ .Token }}`**, or new users get a link and no code to type.
- **Magic Link** is sent when an account that already exists asks for a code.
- Both show the **code** (`{{ .Token }}`) as the main action and the one-click link (`{{ .ConfirmationURL }}`) as a backup — the code can't be burned by mail scanners that pre-open links.
- **Code length:** set *Auth → Providers → Email → Email OTP Length* to match the app (default 8; set `NEXT_PUBLIC_OTP_LENGTH=6` in Vercel if you use 6). Expiry default is 1 hour (3600 s) — the templates say "1 hour", change both together.
- **Sender:** under *Auth → SMTP Settings* use your Resend SMTP details so these arrive from `@testimoni.io` instead of Supabase's shared sender (better deliverability).
- Supabase variables used: `{{ .Token }}`, `{{ .ConfirmationURL }}`, `{{ .Email }}`.
