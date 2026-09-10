/**
 * Anonymous testimonials tray.
 *
 * A localStorage-based queue where anonymous surfaces (find-my-proof
 * search results, import panels, screenshot tool) drop testimonials
 * that the user should get on their wall AFTER they sign up.
 *
 * The dashboard welcome page reads this tray on first login, POSTs
 * the batch to /api/testimonials/bulk-from-anon, then clears it.
 *
 * ── Why localStorage, not sessionStorage ─────────────────────────
 * sessionStorage dies when the browser tab closes. Users often
 * click "sign up" in a new tab / restart mid-flow. localStorage
 * survives that. We accept the tradeoff: quotes stay around
 * across sessions until picked up or manually cleared.
 *
 * ── Why not a cookie ─────────────────────────────────────────────
 * Cookies would be sent to the server on every request. This data
 * only matters to the client + one bulk POST post-signup, so
 * localStorage is a better fit.
 *
 * ── Shape ────────────────────────────────────────────────────────
 * We keep the tray flat (no nesting, no per-tool namespacing) so
 * new tools can drop items without schema changes.
 */

export const PENDING_TRAY_KEY = "pending_testimonials_v1";

export interface PendingTestimonial {
  content: string;
  author: string;
  role?: string;
  source?: string;
  sourceUrl?: string;
  // Which anonymous surface added this — analytics / debug only.
  origin?: string;
  // Client-side id so callers can dedupe / remove specific items.
  id: string;
  addedAt: number;
}

function safeRead(): PendingTestimonial[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PENDING_TRAY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x) => x && typeof x === "object" && x.content);
  } catch {
    return [];
  }
}

function safeWrite(items: PendingTestimonial[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PENDING_TRAY_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("pending-testimonials-changed"));
  } catch {
    // localStorage full or blocked (Safari private mode). We
    // silently drop — the anonymous surfaces still render the
    // testimonial in-memory, they just won't survive signup.
  }
}

export function addPendingTestimonial(
  input: Omit<PendingTestimonial, "id" | "addedAt"> & { id?: string },
): void {
  const items = safeRead();
  const id =
    input.id ??
    `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const next: PendingTestimonial = {
    id,
    addedAt: Date.now(),
    content: input.content.slice(0, 2000),
    author: input.author.slice(0, 200),
    role: input.role?.slice(0, 200),
    source: input.source?.slice(0, 40),
    sourceUrl: input.sourceUrl?.slice(0, 500),
    origin: input.origin?.slice(0, 40),
  };
  // Dedupe by (content + author). If the user re-searches and we
  // get the same quote twice, we don't want them appearing twice
  // on the wall post-signup.
  const dedupKey = `${next.content}::${next.author}`.toLowerCase();
  const filtered = items.filter(
    (x) => `${x.content}::${x.author}`.toLowerCase() !== dedupKey,
  );
  filtered.push(next);
  // Cap at 25 — protects against runaway localStorage from
  // repeated searches; the top 25 is more than enough for a wall.
  const capped = filtered.slice(-25);
  safeWrite(capped);
}

export function addPendingTestimonials(
  batch: Array<Omit<PendingTestimonial, "id" | "addedAt">>,
): void {
  for (const item of batch) addPendingTestimonial(item);
}

export function getPendingTestimonials(): PendingTestimonial[] {
  return safeRead();
}

export function getPendingCount(): number {
  return safeRead().length;
}

export function clearPendingTestimonials(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PENDING_TRAY_KEY);
    window.dispatchEvent(new Event("pending-testimonials-changed"));
  } catch {}
}

export function removePendingTestimonial(id: string): void {
  const items = safeRead().filter((x) => x.id !== id);
  safeWrite(items);
}
