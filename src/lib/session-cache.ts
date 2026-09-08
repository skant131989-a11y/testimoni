"use client";

/**
 * Client-side session cache — persists non-sensitive workspace and
 * derived-URL data to localStorage so subsequent dashboard/welcome
 * loads can render optimistically before the server response.
 *
 * ─── Why this exists ─────────────────────────────────────────────
 * Server-rendered pages already ship fresh HTML on every navigation,
 * so this cache doesn't reduce TTFB. What it DOES fix:
 *   1. The "Setting up your form…" flicker on welcome-client when
 *      SSR renders null (provisioning race) — cache fills in.
 *   2. SPA-transition placeholders for header/sidebar between
 *      /dashboard/* routes.
 *   3. Back-button navigations feel instant on repeat visits.
 *
 * ─── What we cache (all low-sensitivity) ─────────────────────────
 *   workspaceId    — string
 *   workspaceSlug  — string
 *   workspaceName  — string
 *   plan           — "FREE" | "PRO" | etc.
 *   formUrl        — absolute collection form URL
 *   wallUrl        — absolute Wall of Love URL (already public)
 *   embedOrigin    — this app's origin, for embed snippet
 *   supabaseUserId — used to guard against cross-account bleed
 *
 * NOT cached: email, name, testimonial content, any PII the user
 * didn't already choose to make public.
 *
 * ─── Guardrails ───────────────────────────────────────────────────
 *   TTL: 24h. After that the cache is treated as absent.
 *   User binding: cache is keyed by supabaseUserId. Reading with a
 *     mismatched userId returns null — prevents leaks when someone
 *     signs out and a different account signs in.
 *   Version: bumping CACHE_VERSION invalidates all existing caches
 *     on next read.
 */

const CACHE_KEY = "testimoni_session_v1";
const CACHE_VERSION = 1;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

export interface SessionCachePayload {
  workspaceId: string;
  workspaceSlug: string;
  workspaceName: string;
  plan: string | null;
  formUrl: string | null;
  wallUrl: string | null;
  embedOrigin: string | null;
  supabaseUserId: string;
}

interface StoredEntry {
  v: number;
  storedAt: number; // epoch ms
  data: SessionCachePayload;
}

/**
 * Read a fresh, non-expired cache entry for the given user.
 * Returns null when:
 *   - not running in a browser
 *   - no cache stored
 *   - cache expired (>24h old)
 *   - cache belongs to a different Supabase user (bleed guard)
 *   - cache version mismatch (schema changed)
 */
export function readSessionCache(supabaseUserId: string): SessionCachePayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry: StoredEntry = JSON.parse(raw);
    if (entry.v !== CACHE_VERSION) return null;
    if (Date.now() - entry.storedAt > CACHE_TTL_MS) return null;
    if (entry.data.supabaseUserId !== supabaseUserId) return null;
    return entry.data;
  } catch {
    return null;
  }
}

/**
 * Persist fresh session data. Safe to call on every render — writes
 * only when at least one field changed vs. what's already stored,
 * so we don't thrash localStorage with identical writes.
 */
export function writeSessionCache(data: SessionCachePayload): void {
  if (typeof window === "undefined") return;
  try {
    const existing = window.localStorage.getItem(CACHE_KEY);
    if (existing) {
      const parsed: StoredEntry = JSON.parse(existing);
      if (
        parsed.v === CACHE_VERSION &&
        JSON.stringify(parsed.data) === JSON.stringify(data)
      ) {
        return; // no-op — same data
      }
    }
    const entry: StoredEntry = { v: CACHE_VERSION, storedAt: Date.now(), data };
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // Silent — localStorage quota / privacy mode / disabled all
    // fine to ignore. The cache is a perf optimization, not
    // functional data.
  }
}

/**
 * Clear the cache. Call on sign-out so the next signed-in user
 * doesn't briefly see stale data during their first render.
 */
export function clearSessionCache(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(CACHE_KEY);
  } catch {}
}
