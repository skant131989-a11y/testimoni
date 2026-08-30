import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Auto-generated OpenGraph card for testimoni.io.
 * Satori requires every div with multiple children to declare
 * display: flex explicitly.
 *
 * Left half: the "Paste a tweet" pitch — headline + URL→arrow flow.
 * Right half: a mini Wall of Love (4 cards in a 2x2 grid) so the OG
 * preview shows BOTH the wedge (paste-tweet) AND the destination
 * (a real-looking wall) in one image.
 */

const MINI_TESTIMONIALS = [
  {
    letter: "P",
    color: "#16a34a",
    name: "Priya Menon",
    quote: "Live wall up in the time it took me to make coffee.",
  },
  {
    letter: "M",
    color: "#2563eb",
    name: "Marcus Johnson",
    quote: "Best coaching money I've spent this year.",
  },
  {
    letter: "A",
    color: "#ea580c",
    name: "Aditi Rao",
    quote: "Paid back the whole cohort several times over.",
  },
  {
    letter: "S",
    color: "#0891b2",
    name: "Sarah Chen",
    quote: "Turned a mess of tweets into a wall of love.",
  },
];

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "56px 60px",
          background:
            "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 40%, #ddd6fe 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Word mark row (top) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 44,
              height: 44,
              borderRadius: 22,
              background: "#7c3aed",
              color: "white",
              fontSize: 28,
              fontWeight: 900,
              paddingBottom: 6,
              fontFamily: "Georgia, serif",
            }}
          >
            &ldquo;
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#1a1a1a" }}>
            Testimoni
          </div>
        </div>

        {/* Body row: pitch on left, mini wall on right */}
        <div
          style={{
            display: "flex",
            flex: 1,
            marginTop: 28,
            alignItems: "center",
            gap: 40,
          }}
        >
          {/* LEFT: pitch */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: 560,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 60,
                fontWeight: 800,
                color: "#1a1a1a",
                lineHeight: 1.05,
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
                color: "#7c3aed",
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
                marginTop: 4,
              }}
            >
              Get a testimonial in 30s.
            </div>

            {/* URL bar → arrow → tiny result card */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
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
                  border: "2px solid #cbd5e1",
                  fontSize: 18,
                  fontWeight: 500,
                  color: "#64748b",
                  fontFamily: "ui-monospace, SFMono-Regular, monospace",
                }}
              >
                https://x.com/…
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 28,
                  color: "#7c3aed",
                  fontWeight: 800,
                }}
              >
                →
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "8px 14px",
                  borderRadius: 10,
                  background: "#7c3aed",
                  color: "white",
                  fontSize: 16,
                  fontWeight: 700,
                }}
              >
                ✓ Live on your wall
              </div>
            </div>

            <div
              style={{
                display: "flex",
                fontSize: 22,
                color: "#4b5563",
                marginTop: 28,
                lineHeight: 1.4,
              }}
            >
              Or collect fresh ones via form. Free hosted Wall of Love included.
            </div>
          </div>

          {/* RIGHT: mini Wall of Love (2x2 grid of testimonial cards) */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              padding: 16,
              borderRadius: 20,
              background: "rgba(255,255,255,0.7)",
              border: "1px solid rgba(124,58,237,0.15)",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 13,
                fontWeight: 700,
                color: "#7c3aed",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              ★ Wall of Love — live preview
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {[0, 1].map((row) => (
                <div
                  key={row}
                  style={{ display: "flex", gap: 10 }}
                >
                  {MINI_TESTIMONIALS.slice(row * 2, row * 2 + 2).map((t) => (
                    <div
                      key={t.name}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        flex: 1,
                        padding: 12,
                        borderRadius: 12,
                        background: "white",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          fontSize: 14,
                          color: "#facc15",
                          letterSpacing: "0.06em",
                        }}
                      >
                        ★★★★★
                      </div>
                      <div
                        style={{
                          display: "flex",
                          fontSize: 13,
                          color: "#374151",
                          lineHeight: 1.35,
                          marginTop: 6,
                        }}
                      >
                        &ldquo;{t.quote}&rdquo;
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginTop: 8,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 22,
                            height: 22,
                            borderRadius: 11,
                            background: t.color,
                            color: "white",
                            fontSize: 11,
                            fontWeight: 800,
                          }}
                        >
                          {t.letter}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#1a1a1a",
                          }}
                        >
                          {t.name}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 24,
              fontWeight: 700,
              color: "#7c3aed",
            }}
          >
            testimoni.io
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "8px 18px",
              borderRadius: 999,
              background: "white",
              border: "2px solid #7c3aed",
              fontSize: 18,
              fontWeight: 600,
              color: "#7c3aed",
            }}
          >
            Free plan — no credit card
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
