/**
 * Branded cover art for the "scattered customer praise" blog post.
 * Used both for the post's social-share image and the Dev.to cover.
 * Satori rules: inline styles only, every container is display:flex.
 * No customer quotes here on purpose — only the source names.
 */
const SOURCES = ["X", "LinkedIn", "Reddit", "App Store"];

export function ScatteredPraiseCover({ width, height }: { width: number; height: number }) {
  const s = height / 420; // design is drawn at 420px tall, scaled to fit
  return (
    <div
      style={{
        width,
        height,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: `${32 * s}px ${48 * s}px`,
        background: "linear-gradient(135deg, #4c1d95 0%, #7c3aed 55%, #c026d3 100%)",
        color: "white",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", width: width * 0.5 }}>
        <div
          style={{
            display: "flex",
            alignSelf: "flex-start",
            padding: `${6 * s}px ${14 * s}px`,
            borderRadius: 999,
            background: "rgba(255,255,255,0.18)",
            fontSize: 16 * s,
            fontWeight: 800,
            letterSpacing: 2,
          }}
        >
          TESTIMONI
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 20 * s,
            fontSize: 40 * s,
            fontWeight: 900,
            lineHeight: 1.08,
            letterSpacing: "-0.02em",
          }}
        >
          Your best customer praise is scattered across the internet.
        </div>
        <div style={{ display: "flex", marginTop: 16 * s, fontSize: 22 * s, color: "#f5d0fe", fontWeight: 600 }}>
          Here&apos;s how to put it to work.
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14 * s }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 * s }}>
          {SOURCES.map((name) => (
            <div
              key={name}
              style={{
                display: "flex",
                padding: `${8 * s}px ${18 * s}px`,
                borderRadius: 12 * s,
                background: "rgba(255,255,255,0.16)",
                border: "1px solid rgba(255,255,255,0.35)",
                fontSize: 20 * s,
                fontWeight: 700,
              }}
            >
              {name}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", fontSize: 40 * s, fontWeight: 800, color: "#fbbf24" }}>→</div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: 150 * s,
            height: 150 * s,
            borderRadius: 24 * s,
            background: "white",
            color: "#4c1d95",
            boxShadow: "0 12px 40px rgba(0,0,0,0.3)",
          }}
        >
          <div style={{ display: "flex", fontSize: 44 * s }}>♥</div>
          <div style={{ display: "flex", fontSize: 20 * s, fontWeight: 900, marginTop: 4 * s }}>Wall of</div>
          <div style={{ display: "flex", fontSize: 20 * s, fontWeight: 900 }}>Love</div>
        </div>
      </div>
    </div>
  );
}
