import { ImageResponse } from "next/og";
import { getShareCard } from "@/lib/share-card";

/** The 1200x630 card shown when a review is shared on X, LinkedIn or in chat. */
export const alt = "A customer review";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Drawn as shapes: the card renderer has no star glyph in its default font.
function StarShape({ filled }: { filled: boolean }) {
  return (
    <svg width="54" height="54" viewBox="0 0 24 24" style={{ marginRight: 8 }}>
      <path
        d="M12 2.5l2.94 5.96 6.58.96-4.76 4.64 1.12 6.55L12 17.52l-5.88 3.09 1.12-6.55L2.48 9.42l6.58-.96L12 2.5z"
        fill={filled ? "#f59e0b" : "#e5e7eb"}
      />
    </svg>
  );
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const card = await getShareCard(id);
  const quote = card?.quote ? (card.quote.length > 190 ? card.quote.slice(0, 187) + "…" : card.quote) : "";
  const rating = card?.rating ?? 0;
  const who = card?.name ?? "A happy customer";
  const where = `on ${card?.workspaceName ?? "Testimoni"}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: "linear-gradient(135deg, #ede9fe 0%, #fae8ff 100%)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          {rating > 0 ? (
            <div style={{ display: "flex" }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <StarShape key={n} filled={n <= rating} />
              ))}
            </div>
          ) : null}
          {quote ? (
            <div
              style={{
                display: "flex",
                marginTop: 28,
                fontSize: quote.length > 110 ? 46 : 58,
                lineHeight: 1.2,
                color: "#1e1b4b",
                fontWeight: 700,
              }}
            >
              {`“${quote}”`}
            </div>
          ) : null}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 36, fontWeight: 700, color: "#4c1d95" }}>{who}</div>
            <div style={{ display: "flex", fontSize: 28, color: "#6b7280", marginTop: 4 }}>{where}</div>
          </div>
          <div style={{ display: "flex", fontSize: 26, color: "#7c3aed", fontWeight: 700 }}>testimoni.io</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
