import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * OpenGraph card for testimoni.io.
 * Satori requires every div with multiple children to declare
 * display: flex explicitly. No CSS grid, no @font-face.
 *
 * Fresh direction (v7 rewrite):
 * - Positioning-first, not paste-a-tweet-first. The three-step loop
 *   Ask → Collect → Publish is the story we now lead with on the
 *   home page; the OG mirrors it.
 * - Big centered headline. Feeds compress this card to ~500px wide,
 *   so anything smaller than ~48px type turns to mud.
 * - Wall-preview strip at the bottom shows the outcome — three
 *   testimonial cards in a row, tight, with real-sized author photos.
 * - No URL bar → arrow → pill diagram. That solved a different
 *   confusion (paste-a-tweet). We're past it.
 */

function StarRow({ size: sz = 14 }: { size?: number }) {
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

const WALL_STRIP = [
  {
    initial: "P",
    accent: "#16a34a",
    name: "Priya",
    role: "Founder, LinenLab",
    quote: "Live wall up in the time it took me to make coffee.",
  },
  {
    initial: "S",
    accent: "#ea580c",
    name: "Sarah",
    role: "CEO, LaunchPad",
    quote: "Turned a mess of tweets into a wall of love in 30 seconds.",
  },
  {
    initial: "M",
    accent: "#7c3aed",
    name: "Marcus",
    role: "Founder, ShipFast",
    quote: "Embed took me one line. Wall was live before lunch.",
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
          padding: "44px 56px 36px 56px",
          background:
            "linear-gradient(135deg, #f5f3ff 0%, #ddd6fe 50%, #a78bfa 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Wordmark row */}
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
                width: 44,
                height: 44,
                borderRadius: 22,
                background: "#5b21b6",
                color: "white",
                fontSize: 30,
                fontWeight: 900,
                paddingBottom: 8,
                fontFamily: "Georgia, serif",
              }}
            >
              &ldquo;
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, color: "#1a1a1a" }}>
              Testimoni
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "8px 16px",
              borderRadius: 999,
              background: "white",
              border: "1.5px solid #4c1d95",
              fontSize: 14,
              fontWeight: 700,
              color: "#4c1d95",
            }}
          >
            Free plan · No card required
          </div>
        </div>

        {/* Center: massive 3-word positioning headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "12px 26px",
              borderRadius: 999,
              background: "#5b21b6",
              color: "white",
              fontSize: 28,
              fontWeight: 800,
              marginBottom: 22,
            }}
          >
            Paste a tweet → live in 30 seconds
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 96,
              fontWeight: 900,
              color: "#1a1a1a",
              lineHeight: 1,
              letterSpacing: "-0.03em",
              gap: 24,
            }}
          >
            <span>Ask.</span>
            <span style={{ color: "#7c3aed" }}>Collect.</span>
            <span>Publish.</span>
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 18,
              fontSize: 24,
              color: "#4b5563",
              fontWeight: 500,
              textAlign: "center",
            }}
          >
            One tool for your Wall of Love — on your site or ours.
          </div>
        </div>

        {/* Wall preview strip — three testimonial cards */}
        <div
          style={{
            display: "flex",
            gap: 14,
            marginTop: 36,
          }}
        >
          {WALL_STRIP.map((t) => (
            <div
              key={t.name}
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                padding: 16,
                borderRadius: 14,
                background: "white",
                border: "1px solid rgba(76, 29, 149, 0.15)",
                boxShadow: "0 8px 24px rgba(76, 29, 149, 0.10)",
              }}
            >
              <StarRow size={14} />
              <div
                style={{
                  display: "flex",
                  fontSize: 15,
                  color: "#1f2937",
                  lineHeight: 1.4,
                  marginTop: 10,
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
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    background: t.accent,
                    color: "white",
                    fontSize: 13,
                    fontWeight: 800,
                  }}
                >
                  {t.initial}
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div
                    style={{
                      display: "flex",
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#1a1a1a",
                    }}
                  >
                    {t.name}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      fontSize: 11,
                      color: "#6b7280",
                    }}
                  >
                    {t.role}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 22,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 22,
              fontWeight: 700,
              color: "#4c1d95",
            }}
          >
            testimoni.io
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
