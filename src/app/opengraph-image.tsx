import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Auto-generated OpenGraph card for testimoni.io.
 * Satori requires every div with multiple children to declare
 * display: flex explicitly, so most containers below are flex.
 */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px",
          background:
            "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 40%, #ddd6fe 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
        }}
      >
        {/* Big quote mark circle in top-right */}
        <div
          style={{
            position: "absolute",
            top: 60,
            right: 80,
            width: 220,
            height: 220,
            borderRadius: 110,
            background: "rgba(124, 58, 237, 0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 180,
            fontWeight: 900,
            color: "#7c3aed",
            lineHeight: 1,
            paddingBottom: 40,
            fontFamily: "Georgia, serif",
          }}
        >
          &ldquo;
        </div>

        {/* Word mark row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 36,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 52,
              height: 52,
              borderRadius: 26,
              background: "#7c3aed",
              color: "white",
              fontSize: 32,
              fontWeight: 900,
              paddingBottom: 8,
              fontFamily: "Georgia, serif",
            }}
          >
            &ldquo;
          </div>
          <div style={{ fontSize: 42, fontWeight: 800, color: "#1a1a1a" }}>
            Testimoni
          </div>
        </div>

        {/* Headline (single text node — Satori-safe) */}
        <div
          style={{
            display: "flex",
            fontSize: 78,
            fontWeight: 800,
            color: "#1a1a1a",
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            maxWidth: 900,
          }}
        >
          Turn happy customers into social proof.
        </div>

        {/* Sub-copy */}
        <div
          style={{
            display: "flex",
            fontSize: 30,
            color: "#4b5563",
            marginTop: 28,
            maxWidth: 820,
            lineHeight: 1.4,
          }}
        >
          Collect and embed testimonials on any site — in minutes.
        </div>

        {/* Bottom row */}
        <div
          style={{
            position: "absolute",
            bottom: 60,
            left: 80,
            right: 80,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 28,
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
              padding: "10px 22px",
              borderRadius: 999,
              background: "white",
              border: "2px solid #7c3aed",
              fontSize: 22,
              fontWeight: 600,
              color: "#7c3aed",
            }}
          >
            Free plan available
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
