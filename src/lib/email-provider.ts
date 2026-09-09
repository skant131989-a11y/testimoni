/**
 * Maps a user's email domain to a "one-click open" webmail URL.
 *
 * When we've just sent a magic link, the biggest drop-off is the
 * "wait, where's the email?" beat. A big "Open Gmail" button next
 * to the confirmation removes that friction — users are one tap
 * away from their inbox, opened in a new tab where the magic link
 * will still be a click away.
 *
 * Covers the majority of consumer + corporate inboxes:
 *   gmail / googlemail        → Gmail
 *   outlook / hotmail / live / msn → Outlook Web
 *   yahoo / ymail            → Yahoo Mail
 *   icloud / me.com / mac.com → iCloud Mail
 *   proton / protonmail      → Proton Mail
 *   fastmail                 → Fastmail
 *   yandex                   → Yandex Mail
 *   zoho                     → Zoho Mail
 *   aol                      → AOL Mail
 *
 * Corporate email (@acme.co, @stripe.com, etc.) most often maps
 * to Google Workspace or Microsoft 365. We can't tell which
 * client-side, so we return null and the UI falls back to a
 * generic "Check your inbox" without an Open button. Better a
 * conservative miss than sending someone to the wrong webmail.
 */

export type WebmailInfo = { name: string; url: string };

const PROVIDERS: Array<{ hosts: readonly string[]; info: WebmailInfo }> = [
  {
    hosts: ["gmail.com", "googlemail.com"],
    info: { name: "Gmail", url: "https://mail.google.com" },
  },
  {
    hosts: ["outlook.com", "hotmail.com", "live.com", "msn.com"],
    info: { name: "Outlook", url: "https://outlook.live.com/mail" },
  },
  {
    hosts: ["yahoo.com", "yahoo.co.in", "yahoo.co.uk", "ymail.com"],
    info: { name: "Yahoo Mail", url: "https://mail.yahoo.com" },
  },
  {
    hosts: ["icloud.com", "me.com", "mac.com"],
    info: { name: "iCloud Mail", url: "https://www.icloud.com/mail" },
  },
  {
    hosts: ["proton.me", "protonmail.com", "pm.me"],
    info: { name: "Proton Mail", url: "https://mail.proton.me" },
  },
  {
    hosts: ["fastmail.com", "fastmail.fm"],
    info: { name: "Fastmail", url: "https://www.fastmail.com/mail" },
  },
  {
    hosts: ["yandex.com", "yandex.ru"],
    info: { name: "Yandex Mail", url: "https://mail.yandex.com" },
  },
  {
    hosts: ["zoho.com", "zohomail.com"],
    info: { name: "Zoho Mail", url: "https://mail.zoho.com" },
  },
  {
    hosts: ["aol.com"],
    info: { name: "AOL Mail", url: "https://mail.aol.com" },
  },
];

export function webmailForEmail(email: string): WebmailInfo | null {
  const at = email.indexOf("@");
  if (at < 0) return null;
  const host = email.slice(at + 1).trim().toLowerCase();
  if (!host) return null;
  for (const p of PROVIDERS) {
    if (p.hosts.includes(host)) return p.info;
  }
  return null;
}
