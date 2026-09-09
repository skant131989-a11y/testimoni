import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * OpenGraph card for testimoni.io.
 *
 * v10 — Both intake paths visible.
 *
 * The launch story is "any praise becomes a testimonial." The
 * previous card led with the screenshot flow only, hiding the
 * URL-paste path that most visitors already know. This version
 * shows both flows side-by-side as coequal choices:
 *   Left  — paste a tweet URL → testimonial card
 *   Right — drop a screenshot → testimonial card
 *
 * Same visual weight, same output shape. Users scanning a social
 * feed see immediately: "oh, this works with either kind of praise
 * I have lying around."
 *
 * Satori quirks that trip you up:
 *   - Every div with multiple children needs display: flex.
 *   - No CSS grid, no @font-face.
 *   - Keep type >= 14px for social preview compression.
 */

function StarRow({ size: sz = 11 }: { size?: number }) {
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

/** Sparkle glyph — for the "AI" chips. */
function Sparkle({ size: sz = 12, color = "#5b21b6" }: { size?: number; color?: string }) {
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5L12 2z"
        fill={color}
      />
    </svg>
  );
}

/**
 * A single intake-path column: label chip, input mock, arrow, and
 * the extracted testimonial card. Kept as a reusable subcomponent
 * so the two paths share exact visual weight.
 */
function FlowColumn({
  chip,
  chipColor,
  input,
  quote,
  author,
  handle,
  sourceLabel,
  authorInitial,
  authorColor,
}: {
  chip: string;
  chipColor: string;
  input: React.ReactNode;
  quote: string;
  author: string;
  handle: string;
  sourceLabel: string;
  authorInitial: string;
  authorColor: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        flex: 1,
        gap: 10,
      }}
    >
      {/* Path label */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "5px 12px",
          borderRadius: 999,
          background: chipColor,
          color: "white",
          fontSize: 13,
          fontWeight: 800,
          letterSpacing: "0.02em",
        }}
      >
        {chip}
      </div>

      {/* Input mock */}
      {input}

      {/* AI arrow */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "3px 10px",
          borderRadius: 999,
          background: "white",
          border: "1.5px solid #5b21b6",
          fontSize: 12,
          fontWeight: 900,
          color: "#5b21b6",
        }}
      >
        <Sparkle size={11} color="#5b21b6" /> AI ↓
      </div>

      {/* Extracted testimonial card */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          padding: 14,
          borderRadius: 12,
          background: "white",
          border: "2px solid rgba(91, 33, 182, 0.3)",
          boxShadow: "0 8px 24px rgba(76, 29, 149, 0.16)",
        }}
      >
        <StarRow size={11} />
        <div
          style={{
            display: "flex",
            fontSize: 13,
            lineHeight: 1.4,
            color: "#1f2937",
            marginTop: 8,
          }}
        >
          &ldquo;{quote}&rdquo;
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 10,
            paddingTop: 8,
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
              background: authorColor,
              color: "white",
              fontSize: 11,
              fontWeight: 800,
            }}
          >
            {authorInitial}
          </div>
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div
              style={{
                display: "flex",
                fontSize: 11,
                fontWeight: 700,
                color: "#1a1a1a",
              }}
            >
              {author}
            </div>
            <div style={{ display: "flex", fontSize: 9, color: "#6b7280" }}>
              {handle}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              padding: "2px 6px",
              borderRadius: 999,
              background: "#f3f4f6",
              fontSize: 9,
              fontWeight: 700,
              color: "#4b5563",
            }}
          >
            {sourceLabel}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OpenGraphImage() {
  // Input mock #1 — a browser-style URL bar with an X post URL.
  const urlInputMock = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        gap: 8,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 12px",
          borderRadius: 10,
          background: "white",
          border: "1.5px solid rgba(76, 29, 149, 0.25)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 18,
            height: 18,
            borderRadius: 9,
            background: "#0f172a",
            color: "white",
            fontSize: 12,
            fontWeight: 900,
            fontFamily: "Georgia, serif",
          }}
        >
          𝕏
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 12,
            color: "#1f2937",
            fontFamily: "monospace",
          }}
        >
          x.com/sarahchen/status/1798...
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignSelf: "center",
          padding: "3px 10px",
          borderRadius: 999,
          background: "#5b21b6",
          color: "white",
          fontSize: 11,
          fontWeight: 800,
        }}
      >
        Import →
      </div>
    </div>
  );

  // Input mock #2 — a dark DM screenshot.
  const screenshotMock = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        padding: 12,
        borderRadius: 10,
        background: "#0f172a",
        boxShadow: "0 6px 16px rgba(15, 23, 42, 0.25)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          paddingBottom: 6,
          borderBottom: "1px solid #1e293b",
          fontSize: 10,
          fontWeight: 700,
          color: "#e2e8f0",
        }}
      >
        WhatsApp · Priya M.
      </div>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 8 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 22,
            height: 22,
            borderRadius: 11,
            background: "#ea580c",
            color: "white",
            fontSize: 11,
            fontWeight: 800,
          }}
        >
          P
        </div>
        <div
          style={{
            display: "flex",
            flex: 1,
            padding: "7px 10px",
            borderRadius: 12,
            background: "#059669",
            color: "white",
            fontSize: 12,
            lineHeight: 1.35,
          }}
        >
          Set up my testimonials wall in about 5 minutes yesterday. Wild.
        </div>
      </div>
    </div>
  );

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "34px 56px 28px 56px",
          background:
            "linear-gradient(135deg, #f5f3ff 0%, #ddd6fe 55%, #a78bfa 100%)",
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
            <div style={{ fontSize: 26, fontWeight: 800, color: "#1a1a1a" }}>
              Testimoni
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "7px 14px",
              borderRadius: 999,
              background: "white",
              border: "1.5px solid #4c1d95",
              fontSize: 13,
              fontWeight: 700,
              color: "#4c1d95",
            }}
          >
            Free · No card required
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: 18,
            gap: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 52,
              fontWeight: 900,
              color: "#1a1a1a",
              lineHeight: 1.02,
              letterSpacing: "-0.03em",
              textAlign: "center",
            }}
          >
            Tweet or screenshot. Testimonial in 30 seconds.
          </div>
        </div>

        {/* Two intake paths, side by side */}
        <div
          style={{
            display: "flex",
            gap: 32,
            marginTop: 22,
            flex: 1,
            paddingLeft: 20,
            paddingRight: 20,
          }}
        >
          <FlowColumn
            chip="PATH A · Paste a URL"
            chipColor="#1d4ed8"
            input={urlInputMock}
            quote="Turned a mess of praise tweets into a wall of love in 30 seconds."
            author="Sarah Chen"
            handle="@sarahchen"
            sourceLabel="Twitter"
            authorInitial="S"
            authorColor="#059669"
          />
          <FlowColumn
            chip="PATH B · Drop a screenshot"
            chipColor="#5b21b6"
            input={screenshotMock}
            quote="Set up my testimonials wall in about 5 minutes yesterday. Wild."
            author="Priya M."
            handle="WhatsApp DM"
            sourceLabel="WhatsApp"
            authorInitial="P"
            authorColor="#ea580c"
          />
        </div>

        {/* Sources strip + wordmark footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 12,
              fontWeight: 600,
              color: "#4c1d95",
            }}
          >
            <span>Works with:</span>
            <span>Twitter</span>
            <span>·</span>
            <span>LinkedIn</span>
            <span>·</span>
            <span>Slack</span>
            <span>·</span>
            <span>WhatsApp</span>
            <span>·</span>
            <span>Reddit</span>
            <span>·</span>
            <span>HN</span>
            <span>·</span>
            <span>Product Hunt</span>
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
    ),
    { ...size },
  );
}
