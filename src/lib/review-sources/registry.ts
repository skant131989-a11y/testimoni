import type { ReviewSourcePlatform } from "@prisma/client";
import type { ReviewSourceAdapter } from "./types";
import { chromeStoreAdapter } from "./chrome-store";
import { productHuntAdapter } from "./product-hunt";
import { appStoreAdapter } from "./app-store";
import { googlePlayAdapter } from "./google-play";
import { shopifyAdapter } from "./shopify";

/**
 * Registry of all platform adapters — keyed by the enum value the
 * Prisma schema stores, so callers can look up the adapter for a
 * ReviewSource row without a switch statement.
 *
 * Adding a new platform:
 *   1. Ship a new adapter (see product-hunt.ts as the smallest
 *      complete reference implementation).
 *   2. Register it here.
 *   3. Add the enum value to ReviewSourcePlatform + TestimonialSource
 *      in prisma/schema.prisma and run `prisma db push`.
 *
 * The URL-parser lookup (parseAnySourceUrl) tries each adapter's
 * parseUrl until one matches — so callers can just paste a URL
 * and let the registry figure out the platform.
 */

export const ADAPTERS: Record<ReviewSourcePlatform, ReviewSourceAdapter> = {
  CHROME_STORE: chromeStoreAdapter,
  PRODUCT_HUNT: productHuntAdapter,
  APP_STORE: appStoreAdapter,
  GOOGLE_PLAY: googlePlayAdapter,
  SHOPIFY: shopifyAdapter,
  // Placeholder for future adapters — throws at runtime so the
  // compiler can't skip it accidentally.
  TRUSTPILOT: {
    platform: "TRUSTPILOT",
    parseUrl: () => null,
    fetchReviews: () => {
      throw new Error("Trustpilot adapter not yet shipped");
    },
    available: () => false,
  },
};

/**
 * Try every adapter's parseUrl in order. Returns the first match
 * along with which platform matched — used by the dashboard's
 * "paste any review URL" input to auto-detect the source type.
 */
export function parseAnySourceUrl(
  url: string,
):
  | {
      platform: ReviewSourcePlatform;
      externalAppId: string;
      displayName: string;
    }
  | null {
  for (const [platform, adapter] of Object.entries(ADAPTERS)) {
    if (!adapter.available()) continue;
    const parsed = adapter.parseUrl(url);
    if (parsed) {
      return {
        platform: platform as ReviewSourcePlatform,
        ...parsed,
      };
    }
  }
  return null;
}

/** Adapters the dashboard should show as connectable options. */
export function availablePlatforms(): {
  platform: ReviewSourcePlatform;
  available: boolean;
}[] {
  return (Object.entries(ADAPTERS) as [
    ReviewSourcePlatform,
    ReviewSourceAdapter,
  ][]).map(([platform, adapter]) => ({
    platform,
    available: adapter.available(),
  }));
}
