import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * OpenGraph card for testimoni.io.
 *
 * v13 — Hero-mirror card.
 *
 * v12 leaned on three columns of intake demos. It worked but
 * competed with itself — three flows meant no single message
 * anchored the image. The site's new hero ("Any praise becomes
 * a Wall of Love. Now the wall talks back.") is the brand-defining
 * line and belongs on the card. This version puts that line at
 * the center of the composition, with a single supporting product
 * mock on the right so the "here's the product" signal survives.
 *
 * Layout — 1200×630:
 *   Top strip     — wordmark + "NEW · Ask My Wall" chip
 *   Left column   — eyebrow chip, headline, subhead, trust chips
 *   Right column  — one supporting product mock (mini testimonial
 *                   card + Ask My Wall citation chip)
 *
 * Satori quirks that trip you up:
 *   - Every div with multiple children needs display: flex.
 *   - No CSS grid, no @font-face.
 *   - Keep type ≥ 10px so social preview compression stays legible.
 */

function Sparkle({ size: sz = 12, color = "#5b21b6" }: { size?: number; color?: string }) {
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5L12 2z" fill={color} />
    </svg>
  );
}

function StarRow({ size: sz = 12 }: { size?: number }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} width={sz} height={sz} viewBox="0 0 24 24">
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill="#facc15"
          />
        </svg>
      ))}
    </div>
  );
}

function TrustChip({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        fontSize: 12,
        color: "#4c1d95",
        fontWeight: 600,
      }}
    >
      <svg width={12} height={12} viewBox="0 0 24 24">
        <path
          d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"
          fill="none"
          stroke="#4c1d95"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {children}
    </div>
  );
}

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "30px 48px 26px 48px",
          background: "linear-gradient(135deg, #f5f3ff 0%, #ddd6fe 55%, #a78bfa 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Top row — wordmark + Ask My Wall chip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 40,
                height: 40,
                borderRadius: 20,
                background: "#5b21b6",
                color: "white",
                fontSize: 26,
                fontWeight: 900,
                paddingBottom: 6,
                fontFamily: "Georgia, serif",
              }}
            >
              &ldquo;
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#1a1a1a" }}>Testimoni</div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 999,
              background: "#4c1d95",
              color: "white",
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.04em",
            }}
          >
            <Sparkle size={11} color="#fbbf24" /> NEW · ASK MY WALL
          </div>
        </div>

        {/* Body — split composition */}
        <div
          style={{
            display: "flex",
            gap: 32,
            marginTop: 22,
            flex: 1,
          }}
        >
          {/* Left column — pitch */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: 700,
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Eyebrow chip — leads with the punchy "paste-a-tweet
                  + 30s" promise that was our biggest pre-brand-pivot
                  conversion hook. The NOW FREE / new-sources story
                  moved into the subhead below (still surfaced, just
                  not competing for the eyebrow slot). */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  borderRadius: 999,
                  background: "white",
                  border: "1.5px solid rgba(76, 29, 149, 0.4)",
                  fontSize: 12,
                  fontWeight: 900,
                  color: "#4c1d95",
                  letterSpacing: "0.05em",
                  alignSelf: "flex-start",
                }}
              >
                <span style={{ display: "flex", fontSize: 14 }}>⚡</span>
                PASTE A TWEET → LIVE WALL IN 30 SECONDS
              </div>

              {/* Headline — three lines with color rhythm:
                    line 1  "Any praise becomes a"           → black
                    line 2  "Wall of Love."                   → primary purple
                                                                (the sole
                                                                 accent — home
                                                                 hero uses a
                                                                 gradient here
                                                                 but Satori
                                                                 doesn't
                                                                 support
                                                                 bg-clip-text)
                    line 3  "Now the wall talks back."       → black to match
                                                                the opening
                                                                line — only
                                                                "Wall of Love"
                                                                gets the color
                                                                pop */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div
                  style={{
                    display: "flex",
                    fontSize: 52,
                    fontWeight: 900,
                    color: "#1a1a1a",
                    lineHeight: 1.02,
                    letterSpacing: "-0.03em",
                  }}
                >
                  Any praise becomes a
                </div>
                <div
                  style={{
                    display: "flex",
                    fontSize: 52,
                    fontWeight: 900,
                    color: "#5b21b6",
                    lineHeight: 1.02,
                    letterSpacing: "-0.03em",
                  }}
                >
                  Wall of Love.
                </div>
                <div
                  style={{
                    display: "flex",
                    fontSize: 52,
                    fontWeight: 900,
                    color: "#1a1a1a",
                    lineHeight: 1.02,
                    letterSpacing: "-0.03em",
                    marginTop: 6,
                  }}
                >
                  Now the wall talks back.
                </div>
              </div>

              {/* Subhead */}
              <div
                style={{
                  display: "flex",
                  fontSize: 16,
                  color: "#3f3f46",
                  lineHeight: 1.4,
                  maxWidth: 620,
                  marginTop: 6,
                }}
              >
                Paste a tweet, drop a screenshot, or import from App Store,
                Play, Chrome, Product Hunt, Shopify. An AI chatbot answers
                visitors using real customer quotes — cited by name.
              </div>
            </div>

            {/* Trust chips + domain */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <TrustChip>Free forever</TrustChip>
                <div style={{ display: "flex", color: "#a78bfa" }}>·</div>
                <TrustChip>No credit card</TrustChip>
                <div style={{ display: "flex", color: "#a78bfa" }}>·</div>
                <TrustChip>Live in ~30s</TrustChip>
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#4c1d95",
                }}
              >
                testimoni.io
              </div>
            </div>
          </div>

          {/* Right column — mini wall (2 stacked cards) + Ask My
              Wall chat. Mirrors what the home hero shows: real
              testimonials sitting next to an AI chatbot that cites
              them. Uses actual seeded testimonials so this OG card
              and the live wall stay in sync. */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              gap: 10,
              justifyContent: "center",
            }}
          >
            {/* Testimonial card #1 — Rachel */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                padding: 14,
                borderRadius: 14,
                background: "white",
                border: "2px solid rgba(91, 33, 182, 0.28)",
                boxShadow: "0 10px 26px rgba(76, 29, 149, 0.18)",
                gap: 8,
              }}
            >
              <StarRow size={10} />
              <div
                style={{
                  display: "flex",
                  fontSize: 13,
                  lineHeight: 1.35,
                  color: "#0f172a",
                }}
              >
                &ldquo;Every other testimonial tool wanted me to schedule a demo. Testimoni just… worked. Live wall in 30 seconds.&rdquo;
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  paddingTop: 6,
                  borderTop: "1px solid #e5e7eb",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    background: "#059669",
                    color: "white",
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                >
                  R
                </div>
                <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                  <div style={{ display: "flex", fontSize: 10, fontWeight: 700, color: "#1a1a1a" }}>
                    Rachel K.
                  </div>
                  <div style={{ display: "flex", fontSize: 9, color: "#6b7280" }}>
                    VP Ops · via Twitter
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    padding: "2px 6px",
                    borderRadius: 999,
                    background: "#f3f4f6",
                    fontSize: 8,
                    fontWeight: 700,
                    color: "#4b5563",
                  }}
                >
                  Twitter
                </div>
              </div>
            </div>

            {/* Testimonial card #2 — Marcus (competitor comparison) */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                padding: 14,
                borderRadius: 14,
                background: "white",
                border: "2px solid rgba(91, 33, 182, 0.20)",
                boxShadow: "0 8px 22px rgba(76, 29, 149, 0.14)",
                gap: 8,
                marginLeft: 18,
              }}
            >
              <StarRow size={10} />
              <div
                style={{
                  display: "flex",
                  fontSize: 13,
                  lineHeight: 1.35,
                  color: "#0f172a",
                }}
              >
                &ldquo;Half the price of Senja and it does more. The screenshot AI extracted quotes from my DMs in one click.&rdquo;
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  paddingTop: 6,
                  borderTop: "1px solid #e5e7eb",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    background: "#c026d3",
                    color: "white",
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                >
                  M
                </div>
                <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                  <div style={{ display: "flex", fontSize: 10, fontWeight: 700, color: "#1a1a1a" }}>
                    Marcus C.
                  </div>
                  <div style={{ display: "flex", fontSize: 9, color: "#6b7280" }}>
                    VP Growth · via LinkedIn
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    padding: "2px 6px",
                    borderRadius: 999,
                    background: "#f3f4f6",
                    fontSize: 8,
                    fontWeight: 700,
                    color: "#4b5563",
                  }}
                >
                  LinkedIn
                </div>
              </div>
            </div>

            {/* Ask My Wall chat exchange — cites BOTH names above so
                the OG card literally shows the wall talking back. */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                borderRadius: 14,
                background: "white",
                border: "1.5px solid rgba(76, 29, 149, 0.25)",
                overflow: "hidden",
                boxShadow: "0 6px 18px rgba(76, 29, 149, 0.14)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "6px 12px",
                  background: "#5b21b6",
                  color: "white",
                }}
              >
                <div style={{ display: "flex", fontSize: 11, fontWeight: 700 }}>Ask My Wall</div>
                <div style={{ display: "flex", fontSize: 9, opacity: 0.85 }}>Live</div>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  padding: 10,
                  gap: 6,
                  background: "#fafafa",
                }}
              >
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <div
                    style={{
                      display: "flex",
                      padding: "5px 9px",
                      borderRadius: 10,
                      background: "#5b21b6",
                      color: "white",
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  >
                    How fast to set up?
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                  <div
                    style={{
                      display: "flex",
                      padding: "5px 9px",
                      borderRadius: 10,
                      background: "#f4f4f5",
                      color: "#18181b",
                      fontSize: 10,
                      fontWeight: 500,
                      lineHeight: 1.3,
                      maxWidth: "88%",
                    }}
                  >
                    Rachel said her wall was live in 30 seconds.
                  </div>
                </div>
                <div style={{ display: "flex", alignSelf: "flex-start" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "3px 8px",
                      borderRadius: 6,
                      background: "white",
                      border: "1px solid #e4e4e7",
                      fontSize: 9,
                      color: "#71717a",
                    }}
                  >
                    Cited:&nbsp;
                    <span style={{ color: "#5b21b6", fontWeight: 800 }}>
                      — Rachel K. · Marcus C.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
