import { ImageResponse } from "next/og";
import { ScatteredPraiseCover } from "@/lib/blog-cover";

/** 1000x420 cover for Dev.to (its cover_image slot) — GET /blog/put-scattered-customer-praise-to-work/cover */
export async function GET() {
  return new ImageResponse(<ScatteredPraiseCover width={1000} height={420} />, {
    width: 1000,
    height: 420,
  });
}
