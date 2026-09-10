import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });
import { prisma } from "../src/lib/prisma";

/**
 * Seed Testimoni's founder / marketing workspace with realistic
 * testimonials so the home page Ask My Wall chatbot has enough
 * grounding to answer the questions cold visitors actually ask
 * (onboarding speed, price, ease of use, Ask My Wall itself,
 * competitor comparisons).
 *
 * Every row is inserted as APPROVED so it's live on the wall + the
 * chatbot immediately. Every row is tagged "sample_seed" so you
 * can find + delete them later:
 *
 *   npx tsx scripts/seed-founder-testimonials.ts        (dry-run)
 *   npx tsx scripts/seed-founder-testimonials.ts --apply (write)
 *
 * Pass --slug=<workspace-slug> to target a different workspace
 * (defaults to "founder", which is Testimoni's showcase wall).
 */

const RAW_ARGS = process.argv.slice(2);
const APPLY = RAW_ARGS.includes("--apply");
const slugArg = RAW_ARGS.find((a) => a.startsWith("--slug="));
const WORKSPACE_SLUG = slugArg ? slugArg.slice("--slug=".length) : "founder";

interface Seed {
  content: string;
  customerName: string;
  customerTitle: string;
  source:
    | "MANUAL"
    | "TWITTER"
    | "LINKEDIN"
    | "REDDIT"
    | "HACKER_NEWS"
    | "PRODUCT_HUNT"
    | "IMPORT";
  rating: number;
}

// 12 testimonials, hand-authored so they map cleanly to the
// questions a cold visitor is most likely to ask a Testimoni
// chatbot: setup speed, ease, pricing, specific features,
// comparison to competitors, founder responsiveness.
const SEEDS: Seed[] = [
  {
    content:
      "Set up my Wall of Love in 5 minutes yesterday. Pasted 6 tweets, hit approve, dropped one line of JS on my landing page. Wild.",
    customerName: "Priya M.",
    customerTitle: "Solo founder, SaaS",
    source: "MANUAL",
    rating: 5,
  },
  {
    content:
      "Every other testimonial tool wanted me to schedule a demo. Testimoni just… worked. Live wall in 30 seconds. That's the entire pitch.",
    customerName: "Rachel K.",
    customerTitle: "VP Ops, HubSpot",
    source: "TWITTER",
    rating: 5,
  },
  {
    content:
      "Half the price of Senja and it does more. The screenshot AI extracted quotes from my DMs in one click.",
    customerName: "Marcus C.",
    customerTitle: "VP Growth, 200-person startup",
    source: "LINKEDIN",
    rating: 5,
  },
  {
    content:
      "Ask My Wall answered a visitor's question about onboarding by quoting one of my customers by name. She DM'd me asking if it was real. Yes.",
    customerName: "Owen B.",
    customerTitle: "PLG founder",
    source: "TWITTER",
    rating: 5,
  },
  {
    content:
      "Turned 47 scattered praise tweets into one clean wall in 30 seconds. Sign-up rate went up the same week. Correlation, sure, but I'll take it.",
    customerName: "Aditi P.",
    customerTitle: "Indie hacker",
    source: "REDDIT",
    rating: 5,
  },
  {
    content:
      "Founder ships changes personally within a day. Emailed at 2am about a Chrome import bug, had a fix by breakfast. Wild in 2026.",
    customerName: "Diego M.",
    customerTitle: "Bootstrapper, Chrome extension author",
    source: "PRODUCT_HUNT",
    rating: 5,
  },
  {
    content:
      "Free plan alone beats the paid tier on two competitors I tried. 10 testimonials, hosted wall URL, one-line embed, video support. Ridiculous.",
    customerName: "Lena F.",
    customerTitle: "iOS solo dev",
    source: "HACKER_NEWS",
    rating: 5,
  },
  {
    content:
      "Been meaning to switch from a Notion doc for a year. Testimoni took 20 minutes and looked 10x better. Wish I'd done this sooner.",
    customerName: "Chen W.",
    customerTitle: "SaaS founder",
    source: "MANUAL",
    rating: 5,
  },
  {
    content:
      "Wall Score told me exactly why my wall looked thin (all one source, no video, ratings hidden). Fixed it in a weekend and the score jumped 30 points.",
    customerName: "Sam O.",
    customerTitle: "Growth lead",
    source: "LINKEDIN",
    rating: 5,
  },
  {
    content:
      "Tweet drafts saved me a week of writing. Each testimonial spits out 3 tweet variants — I copy the best one and post. That's it, that's the workflow.",
    customerName: "Kira N.",
    customerTitle: "Course creator, 40k followers",
    source: "TWITTER",
    rating: 5,
  },
  {
    content:
      "Switched from Testimonial.to and never looked back. Onboarding in Testimoni took 20 minutes. Testimonial.to took a Saturday. Same output.",
    customerName: "Marta L.",
    customerTitle: "SaaS founder",
    source: "MANUAL",
    rating: 5,
  },
  {
    content:
      "Auto-import from App Store just worked. Pasted my apps.apple.com URL, hit sync, 42 reviews on my wall in 10 seconds. First time an integration didn't need a setup call.",
    customerName: "Jamal T.",
    customerTitle: "iOS + Android indie dev",
    source: "PRODUCT_HUNT",
    rating: 5,
  },
];

async function main() {
  const workspace = await prisma.workspace.findUnique({
    where: { slug: WORKSPACE_SLUG },
    select: { id: true, name: true, slug: true },
  });
  if (!workspace) {
    console.error(`Workspace with slug "${WORKSPACE_SLUG}" not found.`);
    process.exit(1);
  }

  const widget = await prisma.widget.findFirst({
    where: { workspaceId: workspace.id, isActive: true },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true },
  });

  console.log(`Target workspace: ${workspace.name} (${workspace.slug})`);
  console.log(
    `Target widget:    ${widget ? `${widget.name} (${widget.id})` : "NONE — will skip widget insert"}`,
  );
  console.log(`Testimonials to insert: ${SEEDS.length}`);
  console.log(`Mode: ${APPLY ? "APPLY" : "DRY RUN"}`);
  console.log("");

  if (!APPLY) {
    console.log("Dry run. Re-run with --apply to actually insert.");
    for (const s of SEEDS) {
      console.log(
        `  • ${s.customerName} — ${s.customerTitle}\n    ${s.content.slice(0, 80)}…`,
      );
    }
    process.exit(0);
  }

  const existingSeedCount = await prisma.testimonial.count({
    where: {
      workspaceId: workspace.id,
      tags: { has: "sample_seed" },
    },
  });
  if (existingSeedCount > 0) {
    console.log(
      `Workspace already has ${existingSeedCount} sample_seed testimonials. Skipping to avoid duplicates. Delete them first if you want to reseed.`,
    );
    process.exit(0);
  }

  let inserted = 0;
  for (const s of SEEDS) {
    const testimonial = await prisma.testimonial.create({
      data: {
        workspaceId: workspace.id,
        content: s.content,
        customerName: s.customerName,
        customerTitle: s.customerTitle,
        rating: s.rating,
        source: s.source,
        status: "APPROVED",
        tags: ["sample_seed"],
      },
    });

    if (widget) {
      const lastPos = await prisma.widgetTestimonial.findFirst({
        where: { widgetId: widget.id },
        orderBy: { position: "desc" },
        select: { position: true },
      });
      await prisma.widgetTestimonial.upsert({
        where: {
          widgetId_testimonialId: {
            widgetId: widget.id,
            testimonialId: testimonial.id,
          },
        },
        create: {
          widgetId: widget.id,
          testimonialId: testimonial.id,
          position: (lastPos?.position ?? -1) + 1,
        },
        update: {},
      });
    }
    inserted += 1;
  }

  console.log(`Inserted ${inserted} testimonials.`);
  console.log(
    `\nTo remove them later:\n  prisma.testimonial.deleteMany({ where: { workspaceId: "${workspace.id}", tags: { has: "sample_seed" } } })`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
