/**
 * Ask My Wall rate limiter — an in-process LRU keyed on IP + day.
 *
 * MVP-only. Once we run in multiple regions or scale past a
 * single server, swap for Redis/Upstash. The API surface
 * (checkAndIncrement) stays the same so the switch is 5 lines.
 *
 * The cap comes from the workspace's AskMyWallConfig row, not
 * from this module — different workspaces have different daily
 * limits.
 */

type Bucket = { day: string; count: number };

const BUCKETS = new Map<string, Bucket>();
const MAX_KEYS = 10_000; // hard cap on memory growth

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function checkAndIncrement(
  ip: string,
  workspaceId: string,
  dailyLimit: number
): { allowed: boolean; remaining: number } {
  const key = `${workspaceId}:${ip}`;
  const day = todayKey();
  const existing = BUCKETS.get(key);

  if (!existing || existing.day !== day) {
    // Roll over. Delete the oldest key if we're over cap.
    if (BUCKETS.size >= MAX_KEYS) {
      const first = BUCKETS.keys().next().value;
      if (first) BUCKETS.delete(first);
    }
    BUCKETS.set(key, { day, count: 1 });
    return { allowed: true, remaining: dailyLimit - 1 };
  }

  if (existing.count >= dailyLimit) {
    return { allowed: false, remaining: 0 };
  }

  existing.count += 1;
  return { allowed: true, remaining: dailyLimit - existing.count };
}
