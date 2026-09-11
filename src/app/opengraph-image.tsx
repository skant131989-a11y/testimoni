import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * OpenGraph card for testimoni.io.
 *
 * v14 — Paste-a-website wedge card.
 *
 * v13 mirrored the old hero. The new hero is the "paste your URL,
 * we find your customer love" wedge, so the OG follows.
 *
 * Composition — 1200 × 630:
 *   Top strip     wordmark left · NEW · Free wedge pill right
 *   Left column   eyebrow "PASTE YOUR WEBSITE" · big headline ·
 *                 sub · alt paths (tweet, form) · trust chips
 *   Right column  simulated /tools/find-my-proof result card:
 *                   URL bar → "Found it" pill → We found 44
 *                   potential testimonials for Acme → 5 source
 *                   rows with counts
 *
 * Satori quirks to remember:
 *   - Every div with more than one child needs display: flex
 *   - No CSS grid, no @font-face
 *   - Keep type ≥ 10px so preview compression stays legible
 */

const VIOLET_600 = "#7c3aed";
const VIOLET_700 = "#6d28d9";
const PURPLE_500 = "#a855f7";
const FUCHSIA_500 = "#d946ef";
const SLATE_900 = "#0f172a";
const SLATE_700 = "#334155";
const SLATE_500 = "#64748b";
const SLATE_400 = "#94a3b8";
const SLATE_300 = "#cbd5e1";
const SLATE_100 = "#f1f5f9";
const EMERALD_500 = "#10b981";

function Quote({ size: sz = 24, color = VIOLET_600 }: { size?: number; color?: string }) {
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M6.5 8c-1.4 0-2.5 1.1-2.5 2.5v3c0 1.4 1.1 2.5 2.5 2.5s2.5-1.1 2.5-2.5v-1H7c-.6 0-1-.4-1-1V10c0-1.1.9-2 2-2h.5c-.3-.6-1-1-1.7-1H6.5zm10 0c-1.4 0-2.5 1.1-2.5 2.5v3c0 1.4 1.1 2.5 2.5 2.5s2.5-1.1 2.5-2.5v-1H17c-.6 0-1-.4-1-1V10c0-1.1.9-2 2-2h.5c-.3-.6-1-1-1.7-1h-1.3z"
        fill={color}
      />
    </svg>
  );
}

/** X (twitter) logo, monochrome, for a source row. */
function XLogo({ color }: { color: string }) {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.451-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"
        fill={color}
      />
    </svg>
  );
}

function RedditLogo({ color }: { color: string }) {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill={color} />
      <circle cx="9" cy="12" r="1.5" fill="#ffffff" />
      <circle cx="15" cy="12" r="1.5" fill="#ffffff" />
      <path d="M8 14.5c1 1.2 2.5 1.7 4 1.7s3-.5 4-1.7" stroke="#ffffff" strokeWidth="1.2" fill="none" />
    </svg>
  );
}

function PHLogo({ color }: { color: string }) {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill={color} />
      <path d="M9 7v10h1.5v-3H13a3.5 3.5 0 000-7H9zm1.5 1.5H13a2 2 0 010 4h-2.5v-4z" fill="#ffffff" />
    </svg>
  );
}

function StarIcon({ color }: { color: string }) {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2l2.9 6.9 7.1.6-5.4 4.7 1.7 7-6.3-4-6.3 4 1.7-7L2 9.5l7.1-.6L12 2z"
        fill={color}
      />
    </svg>
  );
}

function LinkedInLogo({ color }: { color: string }) {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="20" height="20" rx="3" fill={color} />
      <path
        d="M7 10h2v7H7v-7zm1-3.2A1.2 1.2 0 108 9a1.2 1.2 0 000-2.2zM11 10h2v1c.5-.7 1.4-1.2 2.5-1.2 1.9 0 2.5 1.3 2.5 3.1V17h-2v-3.6c0-.9-.3-1.4-1.1-1.4-.9 0-1.4.6-1.4 1.4V17h-2v-7z"
        fill="#ffffff"
      />
    </svg>
  );
}

interface SourceRow {
  Icon: React.ComponentType<{ color: string }>;
  iconColor: string;
  count: number;
  label: string;
}

const SOURCE_ROWS: SourceRow[] = [
  { Icon: XLogo, iconColor: SLATE_900, count: 16, label: "X posts" },
  { Icon: RedditLogo, iconColor: "#ff4500", count: 10, label: "Reddit comments" },
  { Icon: PHLogo, iconColor: "#ea580c", count: 7, label: "Product Hunt" },
  { Icon: StarIcon, iconColor: "#f59e0b", count: 6, label: "App Store" },
  { Icon: LinkedInLogo, iconColor: "#2563eb", count: 5, label: "LinkedIn posts" },
];

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background:
            "linear-gradient(135deg, #f5f3ff 0%, #faf5ff 45%, #fdf4ff 100%)",
          padding: 48,
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
        }}
      >
        {/* Top strip — wordmark + pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 44,
                height: 44,
                borderRadius: 999,
                background: "#ede9fe",
              }}
            >
              <Quote size={26} color={VIOLET_600} />
            </div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: SLATE_900,
                letterSpacing: -0.5,
              }}
            >
              Testimoni
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              paddingLeft: 14,
              paddingRight: 14,
              paddingTop: 6,
              paddingBottom: 6,
              borderRadius: 999,
              background: `linear-gradient(90deg, ${VIOLET_600}, ${PURPLE_500})`,
              color: "#ffffff",
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: 0.4,
            }}
          >
            NEW · FREE WEDGE
          </div>
        </div>

        {/* Body — two columns */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginTop: 32,
            gap: 40,
            flex: 1,
          }}
        >
          {/* Left — copy */}
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                paddingLeft: 12,
                paddingRight: 12,
                paddingTop: 6,
                paddingBottom: 6,
                borderRadius: 999,
                border: `2px solid ${VIOLET_600}`,
                color: VIOLET_700,
                fontSize: 15,
                fontWeight: 800,
                letterSpacing: 0.6,
                alignSelf: "flex-start",
              }}
            >
              PASTE YOUR WEBSITE
            </div>

            <div
              style={{
                marginTop: 22,
                fontSize: 62,
                lineHeight: 1.02,
                fontWeight: 800,
                letterSpacing: -1.4,
                color: SLATE_900,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ display: "flex" }}>Find your customer</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span
                  style={{
                    backgroundImage: `linear-gradient(90deg, ${VIOLET_600}, ${FUCHSIA_500})`,
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  love
                </span>
                <span style={{ color: SLATE_700, fontWeight: 700 }}>
                  in 30 seconds.
                </span>
              </div>
            </div>

            <div
              style={{
                marginTop: 20,
                fontSize: 22,
                lineHeight: 1.35,
                color: SLATE_500,
                display: "flex",
              }}
            >
              We scan X, Reddit, LinkedIn, Product Hunt, App Store & G2
              for real praise about your product — before you send a form.
            </div>

            {/* Trust chips */}
            <div
              style={{
                marginTop: 26,
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              {["Free · No signup", "Or paste a tweet", "Or send a form"].map(
                (t, i) => (
                  <div
                    key={t}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      paddingLeft: 12,
                      paddingRight: 12,
                      paddingTop: 6,
                      paddingBottom: 6,
                      borderRadius: 999,
                      background: i === 0 ? "#ecfdf5" : "#ffffff",
                      border:
                        i === 0
                          ? `1px solid ${EMERALD_500}`
                          : `1px solid ${SLATE_300}`,
                      color: i === 0 ? "#047857" : SLATE_700,
                      fontSize: 15,
                      fontWeight: 700,
                    }}
                  >
                    {t}
                  </div>
                ),
              )}
            </div>
          </div>

          {/* Right — simulated result mockup */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: 460,
              borderRadius: 22,
              border: `2px solid ${SLATE_300}`,
              background: "#ffffff",
              boxShadow: "0 20px 40px rgba(124,58,237,0.15)",
              padding: 18,
            }}
          >
            {/* Fake browser dots */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: "#fca5a5",
                }}
              />
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: "#fcd34d",
                }}
              />
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: "#86efac",
                }}
              />
              <div
                style={{
                  marginLeft: 10,
                  fontSize: 13,
                  color: SLATE_400,
                  display: "flex",
                }}
              >
                testimoni.io/tools/find-my-proof
              </div>
            </div>

            {/* URL bar */}
            <div
              style={{
                marginTop: 12,
                display: "flex",
                alignItems: "center",
                padding: 10,
                borderRadius: 14,
                border: `2px solid ${VIOLET_600}`,
                background: "#ffffff",
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 18,
                  color: SLATE_700,
                  fontWeight: 500,
                  flex: 1,
                }}
              >
                acme.com
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  paddingLeft: 12,
                  paddingRight: 12,
                  paddingTop: 6,
                  paddingBottom: 6,
                  borderRadius: 999,
                  background: `linear-gradient(90deg, ${VIOLET_600}, ${PURPLE_500})`,
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 800,
                }}
              >
                Find my proof
              </div>
            </div>

            {/* Result pill */}
            <div
              style={{
                display: "flex",
                marginTop: 14,
                alignSelf: "flex-start",
                paddingLeft: 10,
                paddingRight: 10,
                paddingTop: 4,
                paddingBottom: 4,
                borderRadius: 999,
                background: "#10b981",
                color: "#ffffff",
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: 0.5,
              }}
            >
              ✨ FOUND IT
            </div>

            {/* Result headline */}
            <div
              style={{
                display: "flex",
                marginTop: 8,
                fontSize: 24,
                lineHeight: 1.15,
                fontWeight: 800,
                color: SLATE_900,
                flexWrap: "wrap",
              }}
            >
              We found{" "}
              <span style={{ color: VIOLET_600, marginLeft: 6, marginRight: 6 }}>
                44
              </span>{" "}
              potential testimonials for{" "}
              <span style={{ color: VIOLET_600, marginLeft: 6 }}>Acme</span>
            </div>

            {/* Source rows */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                marginTop: 12,
                gap: 6,
              }}
            >
              {SOURCE_ROWS.map((row) => {
                const Icon = row.Icon;
                return (
                  <div
                    key={row.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      paddingLeft: 10,
                      paddingRight: 10,
                      paddingTop: 6,
                      paddingBottom: 6,
                      borderRadius: 10,
                      background: SLATE_100,
                    }}
                  >
                    <div style={{ display: "flex", color: "#ef4444", fontSize: 14 }}>
                      ❤
                    </div>
                    <Icon color={row.iconColor} />
                    <div
                      style={{
                        display: "flex",
                        fontSize: 15,
                        fontWeight: 800,
                        color: SLATE_900,
                      }}
                    >
                      {row.count}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        fontSize: 14,
                        color: SLATE_500,
                      }}
                    >
                      {row.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom URL */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 14,
            fontSize: 15,
            color: SLATE_500,
          }}
        >
          <div style={{ display: "flex" }}>testimoni.io/tools/find-my-proof</div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <Quote size={12} color={VIOLET_600} />
            Real search · Real quotes · Yours to keep
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
