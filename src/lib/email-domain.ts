const FREE_MAIL = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.in", "yahoo.co.uk", "hotmail.com",
  "outlook.com", "live.com", "icloud.com", "me.com", "msn.com", "aol.com", "proton.me",
  "protonmail.com", "pm.me", "rediffmail.com", "gmx.com", "gmx.de", "yandex.com", "mail.com",
  "zoho.com", "qq.com", "163.com", "126.com", "testimoni.dev",
]);

/** The domain of a work email, or null for free-mail / invalid addresses. */
export function workDomainFromEmail(email: string | null | undefined): string | null {
  const domain = email?.split("@")[1]?.trim().toLowerCase();
  if (!domain || !domain.includes(".") || FREE_MAIL.has(domain)) return null;
  return domain;
}
