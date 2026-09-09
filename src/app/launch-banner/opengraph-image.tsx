import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 675 };
export const contentType = "image/png";

/**
 * Launch banner v2 — Twitter-optimized 1200×675 covering the three
 * signature Testimoni flows in one image:
 *
 *   1. Paste a URL         (X, LinkedIn, Reddit, HN, Product Hunt)
 *   2. Drop a screenshot   (DMs, emails, Slack, WhatsApp)
 *   3. Ask My Wall         (visitors chat, cited by real customers)
 *
 * Story: any kind of praise → one wall → and now the wall talks
 * back to your visitors.
 *
 * Load /launch-banner/opengraph-image to save the raw PNG.
 */

function Sparkle({ size: sz = 12, color = "#5b21b6" }: { size?: number; color?: string }) {
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5L12 2z" fill={color} />
    </svg>
  );
}

function StarRow({ size: sz = 10 }: { size?: number }) {
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

/**
 * The signature "→ AI" arrow chip between input and output, so the
 * viewer's eye tracks the transformation without having to read.
 */
function AiArrow() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
        padding: "3px 10px",
        borderRadius: 999,
        background: "white",
        border: "1.5px solid #5b21b6",
        fontSize: 11,
        fontWeight: 900,
        color: "#5b21b6",
        alignSelf: "center",
      }}
    >
      <Sparkle size={10} color="#5b21b6" /> AI ↓
    </div>
  );
}

/** Compact testimonial output card — small enough for a column
 *  slot, still readable at Twitter card compression. */
function TestimonialCard({
  quote,
  author,
  handle,
  authorInitial,
  authorColor,
  sourceLabel,
}: {
  quote: string;
  author: string;
  handle: string;
  authorInitial: string;
  authorColor: string;
  sourceLabel: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        padding: 12,
        borderRadius: 12,
        background: "white",
        border: "2px solid rgba(91, 33, 182, 0.28)",
        boxShadow: "0 8px 22px rgba(76, 29, 149, 0.16)",
        gap: 6,
      }}
    >
      <StarRow size={10} />
      <div
        style={{
          display: "flex",
          fontSize: 12,
          lineHeight: 1.35,
          color: "#0f172a",
        }}
      >
        &ldquo;{quote}&rdquo;
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          paddingTop: 6,
          borderTop: "1px solid #e5e7eb",
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
            background: authorColor,
            color: "white",
            fontSize: 11,
            fontWeight: 800,
          }}
        >
          {authorInitial}
        </div>
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ display: "flex", fontSize: 10, fontWeight: 700, color: "#1a1a1a" }}>
            {author}
          </div>
          <div style={{ display: "flex", fontSize: 9, color: "#6b7280" }}>{handle}</div>
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
  );
}

/** Flow column — chip label + input mock + arrow + output card. */
function FlowColumn({
  chip,
  chipColor,
  input,
  output,
}: {
  chip: string;
  chipColor: string;
  input: React.ReactNode;
  output: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        flex: 1,
        gap: 8,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          padding: "5px 11px",
          borderRadius: 999,
          background: chipColor,
          color: "white",
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: "0.04em",
        }}
      >
        {chip}
      </div>
      {input}
      <AiArrow />
      {output}
    </div>
  );
}

// Input mock #1 — browser URL bar with an X post URL.
function UrlInputMock() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        gap: 6,
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
          boxShadow: "0 4px 14px rgba(29, 78, 216, 0.1)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 20,
            height: 20,
            borderRadius: 10,
            background: "#0f172a",
            color: "white",
            fontSize: 13,
            fontWeight: 900,
            fontFamily: "Georgia, serif",
          }}
        >
          𝕏
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 11,
            color: "#1f2937",
            fontFamily: "monospace",
          }}
        >
          x.com/sarahchen/status/1798…
        </div>
      </div>
    </div>
  );
}

// Input mock #2 — dark DM screenshot.
function ScreenshotMock() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        padding: 12,
        borderRadius: 10,
        background: "#0f172a",
        boxShadow: "0 6px 18px rgba(15, 23, 42, 0.25)",
        gap: 6,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          paddingBottom: 5,
          borderBottom: "1px solid #1e293b",
          fontSize: 9,
          fontWeight: 700,
          color: "#e2e8f0",
        }}
      >
        WhatsApp · Priya M.
      </div>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 20,
            height: 20,
            borderRadius: 10,
            background: "#ea580c",
            color: "white",
            fontSize: 10,
            fontWeight: 800,
          }}
        >
          P
        </div>
        <div
          style={{
            display: "flex",
            flex: 1,
            padding: "6px 9px",
            borderRadius: 10,
            background: "#059669",
            color: "white",
            fontSize: 11,
            lineHeight: 1.3,
          }}
        >
          Set up my testimonials wall in 5 min yesterday. Wild.
        </div>
      </div>
    </div>
  );
}

// Input mock #3 — Ask My Wall chat panel (compact).
function ChatMock() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        borderRadius: 12,
        background: "white",
        border: "1.5px solid rgba(76, 29, 149, 0.25)",
        overflow: "hidden",
        boxShadow: "0 6px 18px rgba(76, 29, 149, 0.18)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "6px 10px",
          background: "#5b21b6",
          color: "white",
        }}
      >
        <div style={{ display: "flex", fontSize: 10, fontWeight: 700 }}>Ask about our customers</div>
        <div style={{ display: "flex", fontSize: 9, opacity: 0.75 }}>Live</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", padding: 10, gap: 6, background: "#fafafa" }}>
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
              maxWidth: "85%",
            }}
          >
            Onboarding time?
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
            Rachel at HubSpot said 4 hours — she&rsquo;d expected a full week.
          </div>
        </div>
      </div>
    </div>
  );
}

// Output for column 3 — the citation chip that IS the wow moment.
function CitationChip() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "8px 12px",
        borderRadius: 10,
        background: "white",
        border: "2px solid #5b21b6",
        boxShadow: "0 8px 22px rgba(76, 29, 149, 0.16)",
        width: "100%",
      }}
    >
      <div style={{ display: "flex", fontSize: 11, color: "#71717a", fontWeight: 600 }}>Cited:</div>
      <div style={{ display: "flex", fontSize: 12, color: "#5b21b6", fontWeight: 800 }}>
        — Rachel Kim, HubSpot
      </div>
    </div>
  );
}

export default function LaunchBannerImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "30px 48px 26px 48px",
          background:
            "linear-gradient(135deg, #f5f3ff 0%, #ddd6fe 55%, #a78bfa 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Top row — wordmark + shipped chip */}
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
            <Sparkle size={11} color="#fbbf24" /> JUST SHIPPED · PRO $9/mo
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: 14,
            gap: 4,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 44,
              fontWeight: 900,
              color: "#1a1a1a",
              lineHeight: 1.02,
              letterSpacing: "-0.03em",
              textAlign: "center",
            }}
          >
            Any praise becomes a Wall of Love —
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 44,
              fontWeight: 900,
              color: "#5b21b6",
              lineHeight: 1.02,
              letterSpacing: "-0.03em",
              textAlign: "center",
            }}
          >
            and now it talks back.
          </div>
        </div>

        {/* Three-column flow */}
        <div
          style={{
            display: "flex",
            gap: 22,
            marginTop: 20,
            flex: 1,
            paddingLeft: 8,
            paddingRight: 8,
          }}
        >
          {/* Column 1 — Paste-a-tweet */}
          <FlowColumn
            chip="PASTE-A-TWEET"
            chipColor="#1d4ed8"
            input={<UrlInputMock />}
            output={
              <TestimonialCard
                quote="Turned a mess of praise tweets into a Wall of Love in 30 seconds."
                author="Sarah Chen"
                handle="@sarahchen"
                authorInitial="S"
                authorColor="#059669"
                sourceLabel="Twitter"
              />
            }
          />

          {/* Column 2 — Screenshot AI */}
          <FlowColumn
            chip="SCREENSHOT AI"
            chipColor="#059669"
            input={<ScreenshotMock />}
            output={
              <TestimonialCard
                quote="Set up my testimonials wall in about 5 minutes yesterday. Wild."
                author="Priya M."
                handle="WhatsApp DM"
                authorInitial="P"
                authorColor="#ea580c"
                sourceLabel="WhatsApp"
              />
            }
          />

          {/* Column 3 — Ask My Wall (the wow) */}
          <FlowColumn
            chip="ASK MY WALL · NEW"
            chipColor="#5b21b6"
            input={<ChatMock />}
            output={<CitationChip />}
          />
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: 12,
              fontWeight: 600,
              color: "#4c1d95",
            }}
          >
            <span>Import from</span>
            <span>Twitter</span>
            <span>·</span>
            <span>LinkedIn</span>
            <span>·</span>
            <span>Reddit</span>
            <span>·</span>
            <span>HN</span>
            <span>·</span>
            <span>Product Hunt</span>
            <span>·</span>
            <span>DMs</span>
            <span>·</span>
            <span>Slack</span>
          </div>
          <div style={{ display: "flex", fontSize: 18, fontWeight: 800, color: "#4c1d95" }}>
            testimoni.io
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
