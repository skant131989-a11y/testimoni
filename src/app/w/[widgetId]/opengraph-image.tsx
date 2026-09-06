import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Dynamic OG image for a hosted Wall of Love.
 *
 * When the workspace owner shares their /w/[widgetId] URL on X or
 * LinkedIn, the platform preview card is this image — not a text-only
 * blob. It shows the workspace name + logo, aggregate rating + count,
 * and three real testimonial snippets. This is the single biggest
 * lever in the viral share loop.
 *
 * Satori rules: every div with multiple children needs display: flex.
 * No CSS grid. No @font-face — system fonts only.
 */

interface Props {
  params: Promise<{ widgetId: string }>;
}

function StarRow({ size: sz = 18, filled = 5 }: { size?: number; filled?: number }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} width={sz} height={sz} viewBox="0 0 24 24">
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill={i < filled ? "#facc15" : "#e5e7eb"}
          />
        </svg>
      ))}
    </div>
  );
}

function initial(name: string) {
  return (name || "?").trim().charAt(0).toUpperCase();
}

const ACCENTS = ["#7c3aed", "#0ea5e9", "#ea580c", "#16a34a", "#db2777"];

export default async function WallOgImage({ params }: Props) {
  const { widgetId } = await params;

  const widget = await prisma.widget.findUnique({
    where: { id: widgetId },
    include: {
      workspace: { select: { name: true, logoUrl: true } },
      testimonials: {
        orderBy: { position: "asc" },
        take: 8,
        include: {
          testimonial: {
            select: {
              content: true,
              rating: true,
              customerName: true,
              customerAvatar: true,
              customerTitle: true,
              status: true,
            },
          },
        },
      },
    },
  });

  if (!widget) {
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
            background: "#f5f3ff",
            fontSize: 48,
            color: "#4c1d95",
          }}
        >
          Wall not found
        </div>
      ),
      { ...size }
    );
  }

  const testimonials = widget.testimonials
    .map((wt) => wt.testimonial)
    .filter((t) => t.status === "APPROVED" && t.content);

  const count = testimonials.length;
  const withRating = testimonials.filter((t) => t.rating);
  const avg =
    withRating.length > 0
      ? withRating.reduce((sum, t) => sum + (t.rating || 0), 0) /
        withRating.length
      : 5;
  const avgRounded = Math.round(avg * 10) / 10;

  const featured = testimonials.slice(0, 3);
  const workspaceName = widget.workspace.name;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "56px 64px 40px 64px",
          background:
            "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 60%, #ddd6fe 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Top row: workspace identity + testimoni watermark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 56,
                height: 56,
                borderRadius: 28,
                background: "#7c3aed",
                color: "white",
                fontSize: 30,
                fontWeight: 900,
              }}
            >
              {initial(workspaceName)}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 36,
                fontWeight: 800,
                color: "#1a1a1a",
              }}
            >
              {workspaceName}
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
              fontSize: 13,
              fontWeight: 700,
              color: "#4c1d95",
            }}
          >
            Wall of Love · testimoni.io
          </div>
        </div>

        {/* Hero headline + aggregate proof */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            marginTop: 32,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 76,
              fontWeight: 900,
              color: "#1a1a1a",
              lineHeight: 1,
              letterSpacing: "-0.03em",
            }}
          >
            Everyone&rsquo;s loving {workspaceName}.
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              marginTop: 24,
            }}
          >
            <StarRow size={26} filled={Math.round(avg)} />
            <div
              style={{
                display: "flex",
                fontSize: 26,
                color: "#4b5563",
                fontWeight: 600,
              }}
            >
              {avgRounded} average · {count}{" "}
              {count === 1 ? "review" : "reviews"}
            </div>
          </div>
        </div>

        {/* Testimonial strip */}
        <div style={{ display: "flex", gap: 14, marginTop: 36, flex: 1 }}>
          {featured.length === 0 ? (
            <div
              style={{
                display: "flex",
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                fontSize: 26,
                color: "#6b7280",
              }}
            >
              First reviews coming in soon…
            </div>
          ) : (
            featured.map((t, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  flex: 1,
                  padding: 20,
                  borderRadius: 16,
                  background: "white",
                  border: "1px solid rgba(76, 29, 149, 0.12)",
                  boxShadow: "0 12px 32px rgba(76, 29, 149, 0.12)",
                }}
              >
                <StarRow size={14} filled={t.rating || 5} />
                <div
                  style={{
                    display: "flex",
                    fontSize: 17,
                    color: "#1f2937",
                    lineHeight: 1.4,
                    marginTop: 12,
                    // Clamp visually — Satori doesn't support -webkit-line-clamp
                    // reliably, so we just truncate content string.
                  }}
                >
                  &ldquo;
                  {(t.content || "").replace(/\s*…\s*$/, "").slice(0, 140)}
                  {(t.content || "").length > 140 ? "…" : ""}
                  &rdquo;
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginTop: 14,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      background: ACCENTS[i % ACCENTS.length],
                      color: "white",
                      fontSize: 14,
                      fontWeight: 800,
                    }}
                  >
                    {initial(t.customerName)}
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
                      {t.customerName || "Anonymous"}
                    </div>
                    {t.customerTitle && (
                      <div
                        style={{
                          display: "flex",
                          fontSize: 12,
                          color: "#6b7280",
                        }}
                      >
                        {t.customerTitle}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
