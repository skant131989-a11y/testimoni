import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * OpenGraph card for testimoni.io.
 *
 * v15 — matches the home hero: paste a tweet, turn it into a
 * testimonial (scan-your-website is the second path).
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
            FREE · NO SIGNUP
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
            {/* Three intake methods side-by-side — auto-find + tweet
                + screenshot all get equal weight at the top. Form
                gets a mention below the CTA so nothing is hidden. */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              {[
                { label: "Paste a tweet", primary: true },
                { label: "Or scan your website", primary: false },
                { label: "Or screenshot", primary: false },
              ].map((m) => (
                <div
                  key={m.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    paddingLeft: 12,
                    paddingRight: 12,
                    paddingTop: 5,
                    paddingBottom: 5,
                    borderRadius: 999,
                    border: `2px solid ${m.primary ? VIOLET_600 : SLATE_300}`,
                    background: m.primary ? "#ffffff" : "transparent",
                    color: m.primary ? VIOLET_700 : SLATE_500,
                    fontSize: 13,
                    fontWeight: 800,
                    letterSpacing: 0.5,
                  }}
                >
                  {m.label.toUpperCase()}
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: 18,
                fontSize: 44,
                lineHeight: 1.08,
                fontWeight: 800,
                letterSpacing: -1.2,
                color: SLATE_900,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ display: "flex" }}>Someone already said</div>
              <div style={{ display: "flex" }}>something great about you.</div>
              <div style={{ display: "flex", marginTop: 4 }}>
                <span
                  style={{
                    backgroundImage: `linear-gradient(90deg, ${VIOLET_600}, ${FUCHSIA_500})`,
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  Turn it into a testimonial.
                </span>
              </div>
            </div>

            <div
              style={{
                marginTop: 16,
                fontSize: 20,
                lineHeight: 1.35,
                color: SLATE_500,
                display: "flex",
              }}
            >
              Paste the link — we pull the quote, author and source. Then
              scan your website to find everything else customers are saying.
            </div>

            {/* Signup CTA + form availability line */}
            <div
              style={{
                marginTop: 22,
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  paddingLeft: 20,
                  paddingRight: 20,
                  paddingTop: 10,
                  paddingBottom: 10,
                  borderRadius: 999,
                  background: `linear-gradient(90deg, ${VIOLET_600}, ${PURPLE_500})`,
                  color: "#ffffff",
                  fontSize: 18,
                  fontWeight: 800,
                  boxShadow: "0 8px 20px rgba(124,58,237,0.35)",
                }}
              >
                Put it on my wall →
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 13,
                  color: EMERALD_500,
                  fontWeight: 700,
                }}
              >
                Free forever
              </div>
            </div>

            <div
              style={{
                marginTop: 14,
                display: "flex",
                fontSize: 13,
                color: SLATE_500,
                lineHeight: 1.35,
              }}
            >
              Or send a form to your customers — approve what comes back and
              publish it on your wall.
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
                testimoni.io
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
                x.com/…/status/181593048…
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
                Add link
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
              ✨ EXTRACTED
            </div>

            {/* Extracted quote card — clearly an example, not a real tweet */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                marginTop: 12,
                padding: 16,
                borderRadius: 14,
                border: `2px solid ${SLATE_100}`,
                background: "#faf5ff",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <XLogo color={SLATE_900} />
                <div style={{ display: "flex", fontSize: 13, fontWeight: 700, color: VIOLET_700 }}>
                  EXAMPLE · via X
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  marginTop: 10,
                  fontSize: 20,
                  lineHeight: 1.3,
                  fontWeight: 600,
                  fontStyle: "italic",
                  color: SLATE_900,
                }}
              >
                “Finally, proof on my homepage — it took thirty seconds.”
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 30,
                    height: 30,
                    borderRadius: 999,
                    background: VIOLET_600,
                    color: "#ffffff",
                    fontSize: 14,
                    fontWeight: 800,
                  }}
                >
                  E
                </div>
                <div style={{ display: "flex", fontSize: 14, color: SLATE_500 }}>
                  Example customer · source linked
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                marginTop: 12,
                alignItems: "center",
                gap: 8,
                fontSize: 14,
                color: EMERALD_500,
                fontWeight: 700,
              }}
            >
              Quote · author · original link — imported
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
          <div style={{ display: "flex" }}>testimoni.io</div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <Quote size={12} color={VIOLET_600} />
            Real quotes · Credit intact · Yours to keep
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
