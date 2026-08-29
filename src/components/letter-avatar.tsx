import { cn } from "@/lib/utils";

const LETTER_BG = [
  "#7c3aed", "#0891b2", "#059669", "#d97706", "#dc2626",
  "#db2777", "#4f46e5", "#0284c7", "#65a30d", "#c2410c",
];

function pickColor(name: string): string {
  const s = name || "";
  let idx = 0;
  for (let i = 0; i < s.length; i++) idx = (idx + s.charCodeAt(i)) % LETTER_BG.length;
  return LETTER_BG[idx];
}

interface LetterAvatarProps {
  name: string;
  size?: number;
  className?: string;
  fontSize?: number;
}

/**
 * Circular avatar with the first letter of the person's name on a
 * name-hashed color. Same person always gets the same color so
 * repeated appearances read as the same identity.
 */
export function LetterAvatar({ name, size = 40, className, fontSize }: LetterAvatarProps) {
  const letter = (name || "?").trim().charAt(0).toUpperCase() || "?";
  const bg = pickColor(name);
  const fs = fontSize ?? Math.max(12, Math.round(size * 0.42));

  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white select-none",
        className,
      )}
      style={{ width: size, height: size, background: bg, fontSize: fs, lineHeight: 1 }}
      aria-hidden="true"
    >
      {letter}
    </div>
  );
}
