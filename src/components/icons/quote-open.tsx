import type { SVGProps } from "react";

/**
 * 66-style opening quote-mark icon, monochromatic so it inherits the
 * surrounding text color like a lucide icon. The paths are drawn as
 * comma-shaped glyphs (heads at top, tails at bottom) then flipped
 * 180° on the whole svg so they visually read as 6-shaped opening quotes.
 */
export function QuoteOpen(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <g transform="rotate(180 12 12)">
        <path d="M4 5.5C4 4.67 4.67 4 5.5 4H8.5C9.33 4 10 4.67 10 5.5V11C10 15.14 6.64 18.5 2.5 18.5V16C5.26 16 7.5 13.76 7.5 11H5.5C4.67 11 4 10.33 4 9.5V5.5Z" />
        <path d="M14 5.5C14 4.67 14.67 4 15.5 4H18.5C19.33 4 20 4.67 20 5.5V11C20 15.14 16.64 18.5 12.5 18.5V16C15.26 16 17.5 13.76 17.5 11H15.5C14.67 11 14 10.33 14 9.5V5.5Z" />
      </g>
    </svg>
  );
}
