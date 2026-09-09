import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 675 };
export const contentType = "image/png";

/**
 * Pro-launch announcement card — one-off image for the tweet
 * shipping Wall Score + Tweet drafts + Ask My Wall.
 *
 * Visit /pro-launch/opengraph-image to download the raw PNG,
 * or /pro-launch to get the OG-tagged page for link previews.
 *
 * Same visual language as src/app/opengraph-image.tsx.
 */

function Sparkle({ size: sz = 16, color = "#5b21b6" }: { size?: number; color?: string }) {
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5L12 2z"
        fill={color}
      />
    </svg>
  );
}

function FeatureCard({
  emoji,
  label,
  title,
  body,
  accent,
}: {
  emoji: string;
  label: string;
  title: string;
  body: string;
  accent: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        padding: 20,
        borderRadius: 16,
        background: "white",
        border: `2px solid ${accent}`,
        boxShadow: "0 10px 30px rgba(76, 29, 149, 0.18)",
        gap: 8,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "4px 10px",
          borderRadius: 999,
          background: accent,
          color: "white",
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: "0.03em",
          alignSelf: "flex-start",
        }}
      >
        <span style={{ fontSize: 14 }}>{emoji}</span> {label}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 22,
          fontWeight: 900,
          color: "#0f172a",
          lineHeight: 1.15,
          letterSpacing: "-0.02em",
        }}
      >
        {title}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 14,
          lineHeight: 1.4,
          color: "#475569",
        }}
      >
        {body}
      </div>
    </div>
  );
}

export default function ProLaunchImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "36px 56px 32px 56px",
          background:
            "linear-gradient(135deg, #f5f3ff 0%, #ddd6fe 55%, #a78bfa 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
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
                width: 42,
                height: 42,
                borderRadius: 21,
                background: "#5b21b6",
                color: "white",
                fontSize: 28,
                fontWeight: 900,
                paddingBottom: 6,
                fontFamily: "Georgia, serif",
              }}
            >
              &ldquo;
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#1a1a1a" }}>
              Testimoni
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: 999,
              background: "#4c1d95",
              color: "white",
              fontSize: 14,
              fontWeight: 800,
            }}
          >
            <Sparkle size={13} color="#fbbf24" /> Just shipped · Pro $9/mo
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: 22 }}>
          <div
            style={{
              display: "flex",
              fontSize: 56,
              fontWeight: 900,
              color: "#1a1a1a",
              lineHeight: 1.02,
              letterSpacing: "-0.03em",
            }}
          >
            3 new AI features. One clean upgrade.
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 20,
              fontWeight: 500,
              color: "#4c1d95",
              marginTop: 8,
              letterSpacing: "-0.01em",
            }}
          >
            All included in Pro — no separate tier, no add-ons.
          </div>
        </div>

        <div style={{ display: "flex", gap: 20, marginTop: 26, flex: 1 }}>
          <FeatureCard
            emoji="📊"
            label="WALL SCORE"
            title="Audit your wall 0–100"
            body="6 dimensions, weekly trend graph, specific next actions per weakness."
            accent="#1d4ed8"
          />
          <FeatureCard
            emoji="✍️"
            label="TWEET DRAFTS"
            title="Every quote → 3 tweets"
            body="Quote, reaction, callout. One click opens X or LinkedIn compose."
            accent="#059669"
          />
          <FeatureCard
            emoji="💬"
            label="ASK MY WALL"
            title="AI chatbot, real quotes only"
            body="Answers cite customers by name. Never invents. Embed as one script tag."
            accent="#5b21b6"
          />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 15,
              fontWeight: 600,
              color: "#4c1d95",
            }}
          >
            Free forever plan · Pro $9/mo (₹499)
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 20,
              fontWeight: 800,
              color: "#4c1d95",
            }}
          >
            testimoni.io/pricing
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
