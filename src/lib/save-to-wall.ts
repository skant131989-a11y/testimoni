export interface WallItem {
  content: string;
  author: string;
  role?: string;
  source?: string;
  sourceUrl?: string;
  origin?: string;
}

export type SaveToWallResult =
  | { ok: true; saved: number; skippedDuplicates: number }
  | { ok: false; status: number };

/**
 * Save praise straight into the signed-in user's workspace (approved,
 * so it shows on their wall). Uses the same endpoint the welcome page
 * uses to flush the anonymous tray after signup; the server dedupes by
 * content + author, so saving the same quote twice is harmless.
 */
export async function saveToWall(items: WallItem[]): Promise<SaveToWallResult> {
  const payload = items.slice(0, 25).map((i) => ({
    ...i,
    content: i.content.slice(0, 2000),
  }));
  try {
    const res = await fetch("/api/testimonials/bulk-from-anon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: payload }),
    });
    if (!res.ok) return { ok: false, status: res.status };
    const data = await res.json();
    return {
      ok: true,
      saved: typeof data.saved === "number" ? data.saved : 0,
      skippedDuplicates:
        typeof data.skippedDuplicates === "number" ? data.skippedDuplicates : 0,
    };
  } catch {
    return { ok: false, status: 0 };
  }
}
