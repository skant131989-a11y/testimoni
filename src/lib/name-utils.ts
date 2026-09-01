/**
 * Some password managers (LastPass, older 1Password) ignore
 * autoComplete="name" on our signup form and fill the Name field
 * with a generated password. That garbage string ends up in
 * user.name in the DB. This helper detects it and hands back a
 * safer fallback so emails never greet someone as "uHbGbeZdFIK…".
 *
 * Heuristic matches the client-side check in the signup form:
 * 15+ chars, no whitespace, mixed case. Real names — including
 * single-word non-Latin names — don't hit all three.
 *
 * Used by the email preview routes and by any future email sender
 * so a dirty DB row never reaches a recipient.
 */
export function looksLikeGeneratedPassword(name: string): boolean {
  const trimmed = name.trim();
  if (trimmed.length < 15) return false;
  if (/\s/.test(trimmed)) return false;
  const hasUpper = /[A-Z]/.test(trimmed);
  const hasLower = /[a-z]/.test(trimmed);
  return hasUpper && hasLower;
}

/**
 * Returns a display-safe name for use in emails or greetings.
 * Falls back to a Title-Cased email local-part if the stored name
 * is empty or looks like a generated password.
 */
export function safeDisplayName(name: string | null | undefined, email: string): string {
  if (name && !looksLikeGeneratedPassword(name)) return name;
  const local = (email.split("@")[0] || "there").replace(/[._+-].*$/, "");
  return local.charAt(0).toUpperCase() + local.slice(1);
}

/**
 * Workspace-name variant: same rule, but the fallback reads like a
 * workspace label. "Alex's Workspace" if we have a real name,
 * "Alex's Workspace" from email local-part otherwise.
 */
export function safeWorkspaceName(
  workspaceName: string | null | undefined,
  fallbackDisplayName: string
): string {
  if (workspaceName && !looksLikeGeneratedPassword(workspaceName.replace(/'s Workspace$/, ""))) {
    return workspaceName;
  }
  return `${fallbackDisplayName}'s Workspace`;
}
