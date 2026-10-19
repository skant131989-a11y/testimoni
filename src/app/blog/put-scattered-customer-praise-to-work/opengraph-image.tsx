import { ImageResponse } from "next/og";
import { ScatteredPraiseCover } from "@/lib/blog-cover";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Your best customer praise is scattered across the internet";

export default function Image() {
  return new ImageResponse(<ScatteredPraiseCover width={1200} height={630} />, size);
}
