import { prisma } from "../src/lib/prisma";

const WIDGET_ID = "cmthjxvbo0009l4043n9mzyum";

async function main() {
  const widget = await prisma.widget.findUnique({
    where: { id: WIDGET_ID },
    include: {
      workspace: { select: { id: true, name: true, slug: true } },
    },
  });
  if (!widget) return console.log("Widget not found");

  const workspaceId = widget.workspaceId;
  console.log(`Widget: ${widget.name} (${widget.id})`);
  console.log(`Workspace: ${widget.workspace.name} (${workspaceId})\n`);

  const testimonials = await prisma.testimonial.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
  });

  console.log(`${testimonials.length} testimonials in workspace:\n`);
  for (const t of testimonials) {
    console.log(`--- ${t.id}  [${t.source}]  ${t.customerName}`);
    console.log(`  sourceUrl: ${t.sourceUrl}`);
    console.log(`  chars: ${(t.content ?? "").length}`);
    console.log(`  DB content: ${JSON.stringify(t.content)}`);

    // If it's a tweet, re-fetch the oembed to compare
    if (t.source === "TWITTER" && t.sourceUrl) {
      const oembed = `https://publish.twitter.com/oembed?url=${encodeURIComponent(
        t.sourceUrl
      )}&omit_script=1&hide_thread=1`;
      const res = await fetch(oembed);
      if (res.ok) {
        const data = (await res.json()) as { html?: string };
        const html = data.html || "";
        const pMatch = html.match(/<p[^>]*>([\s\S]*?)<\/p>/);
        const rawParagraph = pMatch ? pMatch[1] : "";
        console.log(`  oembed raw <p>: ${JSON.stringify(rawParagraph)}`);
      } else {
        console.log(`  oembed fetch failed: ${res.status}`);
      }
    }
    console.log("");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
