import { Twitter, Linkedin } from "lucide-react";

/**
 * Compact row of the 5 platforms our import pipeline supports.
 * Rendered on the home hero, /dashboard/import, /dashboard/welcome
 * paste-URL card, and anywhere else we want to signal breadth.
 *
 * The last three (Reddit, HN, Product Hunt) shipped after launch —
 * a subtle "NEW" pill on the last icon in the row highlights this
 * without shouting. Auto-disappears from the group after 60 days
 * (rolling `SHIP_DATE` constant) so we don't advertise "new"
 * features forever.
 */

const SHIP_DATE = new Date("2026-09-06");
const NEW_BADGE_TTL_DAYS = 60;

function isStillNew(): boolean {
  const ageDays =
    (Date.now() - SHIP_DATE.getTime()) / (1000 * 60 * 60 * 24);
  return ageDays < NEW_BADGE_TTL_DAYS;
}

// Reddit / HN / PH aren't in lucide, so we inline their mono glyphs.
// SVGs sized 3.5 (w-3.5 h-3.5 = 14px) match the lucide icons.
function RedditGlyph() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5.2 11.8c.03.2.05.4.05.61 0 3.1-3.6 5.61-8.05 5.61s-8.05-2.51-8.05-5.61c0-.21.02-.41.05-.61C.34 13.42 0 12.76 0 12c0-1.24.94-2.24 2.1-2.24.59 0 1.13.26 1.51.68 1.5-1.05 3.55-1.73 5.83-1.83l1.11-5.16c.03-.11.15-.19.26-.16l3.62.77c.24-.5.77-.85 1.38-.85.85 0 1.55.68 1.55 1.53 0 .84-.7 1.52-1.55 1.52-.83 0-1.51-.65-1.55-1.47l-3.28-.7-1 4.66c2.27.1 4.32.79 5.83 1.84.38-.42.92-.68 1.51-.68 1.16 0 2.1 1 2.1 2.24 0 .76-.34 1.42-.86 1.8z" />
    </svg>
  );
}
function HackerNewsGlyph() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M0 0v24h24V0H0zm13.5 12.5V19h-3v-6.5L6 5h3l3 5 3-5h3l-4.5 7.5z" />
    </svg>
  );
}
function ProductHuntGlyph() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm1.4 13.5H10v3.7H7.2V6.7H13c2.6 0 4.4 1.7 4.4 3.9-.1 2.2-1.9 2.9-4 2.9zm-.1-4.4H10v2.7h3.3c1 0 1.6-.5 1.6-1.4-.1-.8-.7-1.3-1.6-1.3z" />
    </svg>
  );
}

const SOURCES = [
  { label: "X (Twitter)", icon: <Twitter className="h-3.5 w-3.5" /> },
  { label: "LinkedIn", icon: <Linkedin className="h-3.5 w-3.5" /> },
  { label: "Reddit", icon: <RedditGlyph /> },
  { label: "Hacker News", icon: <HackerNewsGlyph /> },
  { label: "Product Hunt", icon: <ProductHuntGlyph /> },
];

interface Props {
  /** Optional short "Supports:" prefix — shown on standalone rows
   *  (import page, welcome). Home hero omits it since the row sits
   *  below "Import from any URL" already. */
  label?: string;
  /** Layout variant. "chip" wraps each icon in a bordered pill
   *  (import + welcome pages, more prominent). "inline" is a bare
   *  icon row for tight headers (home hero). */
  variant?: "chip" | "inline";
  /** Show the "NEW" pill next to the Reddit/HN/PH group. Auto-hides
   *  once the ship date is older than NEW_BADGE_TTL_DAYS. */
  showNewBadge?: boolean;
  className?: string;
}

export function ImportSourcesRow({
  label,
  variant = "chip",
  showNewBadge = true,
  className = "",
}: Props) {
  const showBadge = showNewBadge && isStillNew();
  const wrapperCls =
    variant === "chip"
      ? "inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
      : "inline-flex items-center gap-1 text-muted-foreground";

  return (
    <div
      className={`flex flex-wrap items-center gap-2 text-xs text-muted-foreground ${className}`}
    >
      {label && (
        <span className="font-semibold uppercase tracking-wider text-muted-foreground/80">
          {label}
        </span>
      )}
      {SOURCES.map((s) => (
        <span key={s.label} className={wrapperCls} title={s.label}>
          {s.icon}
          {variant === "chip" && (
            <span className="hidden sm:inline">{s.label}</span>
          )}
        </span>
      ))}
      {showBadge && (
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
          ✨ New: Reddit · HN · PH
        </span>
      )}
    </div>
  );
}
