import type { SocialProofInspection } from "@/lib/leads/types";

/**
 * Inspects a company's public homepage for existing social proof —
 * spec section 4. Deterministic keyword/structure heuristics, not an
 * LLM call: this runs once per candidate company on every scan, and
 * a wrong "NO_SOCIAL_PROOF" verdict directly inflates a lead's score
 * (spec: "weak social proof... should strongly increase lead score"),
 * so it needs to be cheap enough to run on every candidate and
 * conservative enough not to fabricate a verdict it can't support.
 *
 * "Do not assume absence if the site could not be inspected" (spec)
 * — any fetch failure returns UNKNOWN, never NO_SOCIAL_PROOF.
 */

const FETCH_TIMEOUT_MS = 6_000;
const MAX_HTML_BYTES = 400_000; // don't buffer a huge page fully

const STRONG_MARKERS = [
  "wall of love",
  "case stud",
  "customer stor",
  "trustpilot",
  "g2.com/products",
  "capterra",
];
const TESTIMONIAL_MARKERS = [
  "testimonial",
  "what our customers say",
  "what customers say",
  "customer review",
  "loved by",
  "trusted by",
  "5-star review",
  "5 star review",
];
// Present but likely thin — a nav link/section exists without much
// surrounding content (checked via count, see below).
const WEAK_HINT_MARKERS = ["review", "rating"];

async function fetchText(url: string): Promise<string | null> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; TestimoniGrowthBot/1.0; +https://testimoni.io)",
        Accept: "text/html",
      },
    });
    if (!res.ok) return null;
    const reader = res.body?.getReader();
    if (!reader) return await res.text();
    let received = 0;
    const chunks: Uint8Array[] = [];
    while (received < MAX_HTML_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        received += value.length;
      }
    }
    try {
      await reader.cancel();
    } catch {}
    return Buffer.concat(chunks).toString("utf-8");
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

function htmlToLowerText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .toLowerCase();
}

function countOccurrences(haystack: string, needle: string): number {
  let count = 0;
  let idx = 0;
  for (;;) {
    idx = haystack.indexOf(needle, idx);
    if (idx === -1) break;
    count++;
    idx += needle.length;
  }
  return count;
}

export async function inspectSocialProof(website: string): Promise<SocialProofInspection> {
  const homepageHtml = await fetchText(`https://${website}`);
  if (!homepageHtml) {
    // Try common testimonial-page paths directly — sometimes the
    // homepage fetch fails (bot-blocking, redirect loop) but a
    // dedicated page still answers. Still UNKNOWN if all fail.
    for (const path of ["/testimonials", "/wall-of-love", "/customers"]) {
      const html = await fetchText(`https://${website}${path}`);
      if (html) {
        return classify(htmlToLowerText(html), true);
      }
    }
    return { status: "UNKNOWN", reason: "Website could not be fetched." };
  }

  return classify(htmlToLowerText(homepageHtml), false);
}

function classify(text: string, fromDedicatedPage: boolean): SocialProofInspection {
  const strongHit = STRONG_MARKERS.find((m) => text.includes(m));
  if (strongHit) {
    return {
      status: "STRONG_SOCIAL_PROOF",
      reason: `Found a "${strongHit}" section/reference on the site.`,
    };
  }

  const testimonialHit = TESTIMONIAL_MARKERS.find((m) => text.includes(m));
  if (testimonialHit) {
    const occurrences = countOccurrences(text, testimonialHit);
    if (occurrences >= 2 || fromDedicatedPage) {
      return {
        status: "HAS_TESTIMONIALS",
        reason: `Found ${occurrences} reference(s) to "${testimonialHit}"${fromDedicatedPage ? " on a dedicated page" : ""}.`,
      };
    }
    return {
      status: "WEAK_SOCIAL_PROOF",
      reason: `Only one passing mention of "${testimonialHit}" found — likely a small section, not a dedicated page.`,
    };
  }

  const weakHit = WEAK_HINT_MARKERS.find((m) => text.includes(m));
  if (weakHit) {
    return {
      status: "WEAK_SOCIAL_PROOF",
      reason: `Site mentions "${weakHit}" but has no visible testimonials/case-studies section.`,
    };
  }

  return {
    status: "NO_SOCIAL_PROOF",
    reason: "No testimonial, review, or case-study section found on the homepage.",
  };
}
