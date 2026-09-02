import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Twitter card — mirrors the OG card exactly so shared links look
 *  consistent across X, LinkedIn, Slack. See opengraph-image.tsx for
 *  the density/contrast decisions behind this design. */

/** Inline SVG star — see opengraph-image.tsx for why we don't use ★. */
function StarRow({ size: sz = 18 }: { size?: number }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <svg
          key={i}
          width={sz}
          height={sz}
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill="#facc15"
          />
        </svg>
      ))}
    </div>
  );
}

const MINI_TESTIMONIALS = [
  {
    letter: "P",
    color: "#16a34a",
    name: "Priya Menon",
    title: "Founder, LinenLab",
    quote:
      "Live wall up in the time it took me to make coffee. Genuinely wild.",
  },
  {
    letter: "S",
    color: "#ea580c",
    name: "Sarah Chen",
    title: "CEO, LaunchPad",
    quote:
      "Turned a mess of tweets into a wall of love in about 30 seconds.",
  },
];

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "48px 56px",
          background:
            "linear-gradient(135deg, #ede9fe 0%, #c4b5fd 50%, #a78bfa 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 48,
              height: 48,
              borderRadius: 24,
              background: "#5b21b6",
              color: "white",
              fontSize: 32,
              fontWeight: 900,
              paddingBottom: 8,
              fontFamily: "Georgia, serif",
            }}
          >
            &ldquo;
          </div>
          <div style={{ fontSize: 34, fontWeight: 800, color: "#1a1a1a" }}>
            Testimoni
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flex: 1,
            marginTop: 28,
            alignItems: "center",
            gap: 40,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", width: 540 }}>
            <div
              style={{
                display: "flex",
                fontSize: 64,
                fontWeight: 800,
                color: "#1a1a1a",
                lineHeight: 1.02,
                letterSpacing: "-0.02em",
              }}
            >
              Paste a tweet.
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 60,
                fontWeight: 800,
                color: "#4c1d95",
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
                marginTop: 6,
              }}
            >
              Get a testimonial in 30 seconds.
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginTop: 28,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "10px 16px",
                  borderRadius: 10,
                  background: "white",
                  border: "2px solid rgba(76, 29, 149, 0.25)",
                  fontSize: 18,
                  fontWeight: 500,
                  color: "#4b5563",
                  fontFamily: "ui-monospace, SFMono-Regular, monospace",
                }}
              >
                https://x.com/…
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 30,
                  color: "#4c1d95",
                  fontWeight: 800,
                }}
              >
                →
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "10px 16px",
                  borderRadius: 10,
                  background: "#4c1d95",
                  color: "white",
                  fontSize: 17,
                  fontWeight: 700,
                }}
              >
                Live on your wall
              </div>
            </div>

            {/* Secondary intake hint — mirrors opengraph-image.tsx */}
            <div
              style={{
                display: "flex",
                marginTop: 14,
                fontSize: 15,
                color: "#6b21a8",
                fontWeight: 500,
              }}
            >
              Or share a form / QR code to collect fresh ones — plus 1 free video testimonial on every plan.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              padding: 18,
              borderRadius: 20,
              background: "white",
              border: "1px solid rgba(76, 29, 149, 0.15)",
              boxShadow: "0 10px 30px rgba(76, 29, 149, 0.15)",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 12,
                fontWeight: 700,
                color: "#4c1d95",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              Wall of Love — live preview
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              {MINI_TESTIMONIALS.map((t) => (
                <div
                  key={t.name}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                    padding: 14,
                    borderRadius: 12,
                    background: "#faf9fc",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <StarRow size={18} />
                  <div
                    style={{
                      display: "flex",
                      fontSize: 16,
                      color: "#1f2937",
                      lineHeight: 1.4,
                      marginTop: 8,
                    }}
                  >
                    &ldquo;{t.quote}&rdquo;
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginTop: 12,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 30,
                        height: 30,
                        borderRadius: 15,
                        background: t.color,
                        color: "white",
                        fontSize: 14,
                        fontWeight: 800,
                      }}
                    >
                      {t.letter}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <div
                        style={{
                          display: "flex",
                          fontSize: 14,
                          fontWeight: 700,
                          color: "#1a1a1a",
                        }}
                      >
                        {t.name}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          fontSize: 12,
                          color: "#6b7280",
                        }}
                      >
                        {t.title}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 18,
            paddingLeft: 8,
            paddingRight: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 24,
              fontWeight: 700,
              color: "#4c1d95",
            }}
          >
            testimoni.io
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "8px 20px",
              borderRadius: 999,
              background: "white",
              border: "2px solid #4c1d95",
              fontSize: 18,
              fontWeight: 700,
              color: "#4c1d95",
            }}
          >
            Free plan — no card required
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
