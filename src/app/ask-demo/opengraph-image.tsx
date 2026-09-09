import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 675 };
export const contentType = "image/png";

/**
 * Ask My Wall demo card — the "wow moment" screenshot.
 *
 * Shows a mock chat transcript: visitor asks a question, the bot
 * answers using a real customer testimonial, cited by name. This
 * is the differentiator against every generic Intercom-clone bot,
 * so the image leans into the citation.
 *
 * Same visual language as /pro-launch/opengraph-image but with
 * a chat mock as the hero instead of a feature grid.
 *
 * Load /ask-demo/opengraph-image to save the raw PNG.
 */

function ChatBubble({
  role,
  text,
  align,
}: {
  role: "user" | "bot";
  text: string;
  align: "left" | "right";
}) {
  const isUser = role === "user";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: align === "right" ? "flex-end" : "flex-start",
        width: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          maxWidth: "82%",
          padding: "12px 16px",
          borderRadius: 16,
          background: isUser ? "#5b21b6" : "#f4f4f5",
          color: isUser ? "white" : "#18181b",
          fontSize: 18,
          lineHeight: 1.4,
          fontWeight: 500,
          borderBottomRightRadius: isUser ? 4 : 16,
          borderBottomLeftRadius: isUser ? 16 : 4,
        }}
      >
        {text}
      </div>
    </div>
  );
}

export default function AskDemoImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          background:
            "linear-gradient(135deg, #f5f3ff 0%, #ddd6fe 55%, #a78bfa 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
          padding: 40,
          gap: 36,
        }}
      >
        {/* Left column — pitch */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 480,
            justifyContent: "space-between",
            paddingTop: 8,
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
              <div style={{ fontSize: 24, fontWeight: 800, color: "#1a1a1a" }}>
                Testimoni
              </div>
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
              ✨ NEW · ASK MY WALL
            </div>

            <div
              style={{
                display: "flex",
                fontSize: 44,
                fontWeight: 900,
                color: "#1a1a1a",
                lineHeight: 1.05,
                letterSpacing: "-0.03em",
              }}
            >
              Every SaaS bot hallucinates.
            </div>

            <div
              style={{
                display: "flex",
                fontSize: 44,
                fontWeight: 900,
                color: "#5b21b6",
                lineHeight: 1.05,
                letterSpacing: "-0.03em",
              }}
            >
              Ours only quotes real customers.
            </div>

            <div
              style={{
                display: "flex",
                fontSize: 17,
                lineHeight: 1.4,
                color: "#3f3f46",
                marginTop: 4,
              }}
            >
              Embed an AI chatbot on your site that answers visitor
              questions using your testimonials — cited by name, never
              invented.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              paddingTop: 16,
              borderTop: "1px solid rgba(76, 29, 149, 0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 15,
                fontWeight: 700,
                color: "#4c1d95",
              }}
            >
              Included in Pro · $9/mo
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 15,
                fontWeight: 700,
                color: "#a78bfa",
              }}
            >
              testimoni.io
            </div>
          </div>
        </div>

        {/* Right column — chat panel mock */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            background: "white",
            borderRadius: 20,
            boxShadow: "0 20px 60px rgba(76, 29, 149, 0.3)",
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.5)",
          }}
        >
          {/* Panel header */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              padding: "16px 20px",
              background: "#5b21b6",
              color: "white",
            }}
          >
            <div style={{ display: "flex", fontSize: 16, fontWeight: 700 }}>
              Ask about our customers
            </div>
            <div style={{ display: "flex", fontSize: 12, opacity: 0.85 }}>
              Answers grounded on real testimonials.
            </div>
          </div>

          {/* Messages */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              padding: 20,
              flex: 1,
              background: "#fafafa",
            }}
          >
            <ChatBubble
              role="user"
              align="right"
              text="How long does onboarding actually take?"
            />
            <ChatBubble
              role="bot"
              align="left"
              text={
                "Rachel at HubSpot said she was live in 4 hours — she'd expected a full week. Faster than most SaaS onboarding she'd done."
              }
            />
            {/* Citation chip */}
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                gap: 6,
                padding: "6px 10px",
                borderRadius: 8,
                background: "white",
                border: "1px solid #e4e4e7",
                fontSize: 12,
                color: "#71717a",
              }}
            >
              <span>Based on:</span>
              <span style={{ color: "#5b21b6", fontWeight: 700 }}>
                — Rachel Kim, HubSpot
              </span>
            </div>

            <ChatBubble
              role="user"
              align="right"
              text="Any bigger teams using this at scale?"
            />
            <ChatBubble
              role="bot"
              align="left"
              text={
                "Yes — Marcus (VP Growth, 200-person startup) called it 'the fastest playbook we've rolled out this year.'"
              }
            />
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                gap: 6,
                padding: "6px 10px",
                borderRadius: 8,
                background: "white",
                border: "1px solid #e4e4e7",
                fontSize: 12,
                color: "#71717a",
              }}
            >
              <span>Based on:</span>
              <span style={{ color: "#5b21b6", fontWeight: 700 }}>
                — Marcus Chen, VP Growth
              </span>
            </div>
          </div>

          {/* Input strip */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: 12,
              borderTop: "1px solid #e4e4e7",
              background: "white",
            }}
          >
            <div
              style={{
                display: "flex",
                flex: 1,
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #d4d4d8",
                fontSize: 13,
                color: "#a1a1aa",
              }}
            >
              Ask another question…
            </div>
            <div
              style={{
                display: "flex",
                padding: "10px 16px",
                borderRadius: 10,
                background: "#5b21b6",
                color: "white",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              Ask
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
