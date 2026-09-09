import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 675 };
export const contentType = "image/png";

/**
 * Combined launch card — one image, three features.
 *
 * Same split-layout language as /ask-demo/opengraph-image
 * (pitch left, product mock right) but the right side stacks
 * three compact real-product mocks for Wall Score, Tweet drafts,
 * and Ask My Wall. Each mock shows the actual visual UI element
 * that makes that feature recognizable — score number + delta,
 * a real draft with a "Post" button, a chat bubble with citation.
 *
 * Load /pro-launch-all/opengraph-image to save the raw PNG.
 */

function Sparkle({ size: sz = 12, color = "#5b21b6" }: { size?: number; color?: string }) {
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5L12 2z" fill={color} />
    </svg>
  );
}

function TrendGraphMini() {
  // Small SVG polyline — 8 points climbing from 42 → 78.
  const points = "0,60 20,55 40,52 60,48 80,40 100,32 120,26 140,20";
  return (
    <svg width={140} height={64} viewBox="0 0 140 64">
      <polyline points={points} fill="none" stroke="#1d4ed8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.split(" ").map((p, i) => {
        const [x, y] = p.split(",");
        return <circle key={i} cx={x} cy={y} r={3} fill="#1d4ed8" />;
      })}
    </svg>
  );
}

/**
 * A single feature mock — corner label chip, then the recognizable
 * UI element for that feature. Kept short (~78px tall) so all three
 * stack cleanly in the right column.
 */
function FeatureMock({
  color,
  label,
  children,
}: {
  color: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        background: "white",
        borderRadius: 14,
        border: `2px solid ${color}`,
        boxShadow: "0 12px 32px rgba(76, 29, 149, 0.2)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 12px",
          background: color,
          color: "white",
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </div>
      <div style={{ display: "flex", padding: 14, gap: 12 }}>{children}</div>
    </div>
  );
}

export default function ProLaunchAllImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          background: "linear-gradient(135deg, #f5f3ff 0%, #ddd6fe 55%, #a78bfa 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
          padding: 40,
          gap: 32,
        }}
      >
        {/* ─── LEFT — pitch ─────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 500,
            justifyContent: "space-between",
            paddingTop: 4,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  background: "#5b21b6",
                  color: "white",
                  fontSize: 24,
                  fontWeight: 900,
                  paddingBottom: 6,
                  fontFamily: "Georgia, serif",
                }}
              >
                &ldquo;
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#1a1a1a" }}>Testimoni</div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 999,
                background: "#4c1d95",
                color: "white",
                fontSize: 12,
                fontWeight: 800,
                alignSelf: "flex-start",
                letterSpacing: "0.04em",
              }}
            >
              <Sparkle size={11} color="#fbbf24" /> 3 THINGS JUST SHIPPED
            </div>

            <div
              style={{
                display: "flex",
                fontSize: 46,
                fontWeight: 900,
                color: "#1a1a1a",
                lineHeight: 1.02,
                letterSpacing: "-0.03em",
              }}
            >
              Score your wall.
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 46,
                fontWeight: 900,
                color: "#1a1a1a",
                lineHeight: 1.02,
                letterSpacing: "-0.03em",
                marginTop: -12,
              }}
            >
              Tweet your quotes.
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 46,
                fontWeight: 900,
                color: "#5b21b6",
                lineHeight: 1.02,
                letterSpacing: "-0.03em",
                marginTop: -12,
              }}
            >
              Chat with your customers.
            </div>

            <div
              style={{
                display: "flex",
                fontSize: 16,
                lineHeight: 1.4,
                color: "#3f3f46",
                marginTop: 4,
              }}
            >
              Three new AI features on the Pro tier. All grounded on the
              real testimonials you already collected — nothing invented.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: 16,
              borderTop: "1px solid rgba(76, 29, 149, 0.2)",
            }}
          >
            <div style={{ display: "flex", fontSize: 15, fontWeight: 700, color: "#4c1d95" }}>
              Included in Pro · $9/mo (₹499)
            </div>
            <div style={{ display: "flex", fontSize: 15, fontWeight: 800, color: "#a78bfa" }}>
              testimoni.io
            </div>
          </div>
        </div>

        {/* ─── RIGHT — three stacked mocks ──────────────────────── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            gap: 14,
          }}
        >
          {/* Wall Score */}
          <FeatureMock color="#1d4ed8" label="📊 WALL SCORE">
            <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 2 }}>
              <div style={{ display: "flex", fontSize: 11, color: "#71717a", fontWeight: 600 }}>
                Your wall
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <div style={{ display: "flex", fontSize: 44, fontWeight: 900, color: "#0f172a" }}>78</div>
                <div style={{ display: "flex", fontSize: 15, color: "#71717a" }}>/100</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#059669", fontWeight: 700 }}>
                ▲ +5 since last week
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <TrendGraphMini />
            </div>
          </FeatureMock>

          {/* Tweet drafts */}
          <FeatureMock color="#059669" label="✍️ TWEET DRAFTS">
            <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 6 }}>
              <div style={{ display: "flex", fontSize: 12, color: "#71717a", fontWeight: 600, letterSpacing: "0.04em" }}>
                CALLOUT · 217 CHARS
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 13,
                  color: "#18181b",
                  lineHeight: 1.35,
                }}
              >
                Cut onboarding from 3 days to 4 hours. &ldquo;Fastest
                playbook we&rsquo;ve rolled out this year&rdquo; — Marcus
                Chen, VP Growth.
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                <div
                  style={{
                    display: "flex",
                    padding: "3px 8px",
                    borderRadius: 6,
                    background: "#f4f4f5",
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#3f3f46",
                  }}
                >
                  Copy
                </div>
                <div
                  style={{
                    display: "flex",
                    padding: "3px 8px",
                    borderRadius: 6,
                    background: "#0f172a",
                    color: "white",
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  Open in X ↗
                </div>
                <div
                  style={{
                    display: "flex",
                    padding: "3px 8px",
                    borderRadius: 6,
                    background: "#1d4ed8",
                    color: "white",
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  Open in LinkedIn ↗
                </div>
              </div>
            </div>
          </FeatureMock>

          {/* Ask My Wall */}
          <FeatureMock color="#5b21b6" label="💬 ASK MY WALL">
            <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <div
                  style={{
                    display: "flex",
                    padding: "6px 10px",
                    borderRadius: 10,
                    background: "#5b21b6",
                    color: "white",
                    fontSize: 12,
                    fontWeight: 600,
                    maxWidth: "80%",
                  }}
                >
                  How fast is onboarding?
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div
                  style={{
                    display: "flex",
                    padding: "6px 10px",
                    borderRadius: 10,
                    background: "#f4f4f5",
                    color: "#18181b",
                    fontSize: 12,
                    fontWeight: 500,
                    maxWidth: "82%",
                  }}
                >
                  Rachel at HubSpot said she was live in 4 hours — she&rsquo;d expected a week.
                </div>
              </div>
              <div style={{ display: "flex", alignSelf: "flex-start" }}>
                <div
                  style={{
                    display: "flex",
                    gap: 4,
                    padding: "3px 8px",
                    borderRadius: 6,
                    background: "white",
                    border: "1px solid #e4e4e7",
                    fontSize: 10,
                    color: "#71717a",
                  }}
                >
                  Based on: <span style={{ color: "#5b21b6", fontWeight: 700 }}>— Rachel Kim, HubSpot</span>
                </div>
              </div>
            </div>
          </FeatureMock>
        </div>
      </div>
    ),
    { ...size },
  );
}
