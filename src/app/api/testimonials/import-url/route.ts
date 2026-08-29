import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import { getEffectiveLimits } from "@/lib/plan";

interface ImportResult {
  content: string;
  customerName: string;
  customerTitle?: string | null;
  customerAvatar?: string | null;
  customerUrl?: string | null;
  source: "TWITTER" | "LINKEDIN" | "IMPORT";
  sourceUrl: string;
}

function parseUrl(input: string): { platform: "twitter" | "linkedin" | "unknown"; url: string } {
  const url = input.trim();
  if (/(?:twitter|x)\.com\/[^/]+\/status\/\d+/i.test(url)) {
    return { platform: "twitter", url };
  }
  if (/linkedin\.com\/(feed\/update|posts|pulse)/i.test(url)) {
    return { platform: "linkedin", url };
  }
  return { platform: "unknown", url };
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, "—")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchTwitter(url: string): Promise<ImportResult | null> {
  // Twitter's public oEmbed endpoint — no auth needed, works for x.com URLs too.
  const oembed = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&omit_script=1&hide_thread=1`;
  try {
    const res = await fetch(oembed, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      author_name?: string;
      author_url?: string;
      html?: string;
    };
    const html = data.html || "";
    // The <p>...</p> inside the blockquote contains the tweet body.
    const paragraphMatch = html.match(/<p[^>]*>([\s\S]*?)<\/p>/);
    const content = paragraphMatch ? stripHtml(paragraphMatch[1]) : stripHtml(html);
    if (!content) return null;
    return {
      content,
      customerName: data.author_name || "Twitter user",
      customerUrl: data.author_url ?? null,
      source: "TWITTER",
      sourceUrl: url,
    };
  } catch {
    return null;
  }
}

async function fetchLinkedIn(url: string): Promise<ImportResult | null> {
  // No oEmbed — read OG tags. LinkedIn often serves the post excerpt in
  // og:description and the author in og:title.
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; Testimoni/1.0; +https://testimoni.io)",
        Accept: "text/html",
      },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const pick = (prop: string) => {
      const re = new RegExp(
        `<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["']`,
        "i"
      );
      const m = html.match(re);
      return m ? m[1] : null;
    };
    const content = pick("og:description");
    const title = pick("og:title");
    if (!content) return null;
    const customerName = title ? title.split(" on LinkedIn")[0].split(" | ")[0].trim() : "LinkedIn user";
    return {
      content: content.trim(),
      customerName,
      source: "LINKEDIN",
      sourceUrl: url,
    };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const input = typeof body?.url === "string" ? body.url : "";
  if (!input) {
    return NextResponse.json({ error: "Missing URL" }, { status: 400 });
  }

  const { platform, url } = parseUrl(input);
  if (platform === "unknown") {
    return NextResponse.json(
      {
        error:
          "Only X/Twitter and LinkedIn URLs are supported right now. Paste a tweet or LinkedIn post URL.",
      },
      { status: 400 }
    );
  }

  // Plan gate — same testimonial cap as manual create.
  const subscription = await prisma.subscription.findUnique({
    where: { workspaceId: auth.workspace.id },
  });
  const limits = getEffectiveLimits(auth.workspace.slug, subscription?.plan);
  const currentCount = await prisma.testimonial.count({
    where: { workspaceId: auth.workspace.id },
  });
  if (currentCount >= limits.maxTestimonials) {
    return NextResponse.json(
      { error: "Testimonial limit reached. Upgrade to Pro for unlimited." },
      { status: 403 }
    );
  }

  const result =
    platform === "twitter" ? await fetchTwitter(url) : await fetchLinkedIn(url);

  if (!result) {
    return NextResponse.json(
      {
        error:
          "Couldn't read that URL. Post may be private, deleted, or the URL is malformed. Try a public post URL.",
      },
      { status: 422 }
    );
  }

  const testimonial = await prisma.testimonial.create({
    data: {
      workspaceId: auth.workspace.id,
      content: result.content,
      customerName: result.customerName,
      customerTitle: result.customerTitle ?? null,
      customerAvatar: result.customerAvatar ?? null,
      customerUrl: result.customerUrl ?? null,
      rating: 5,
      source: result.source,
      sourceUrl: result.sourceUrl,
      status: "APPROVED",
    },
  });

  // Auto-add to the workspace's default (oldest) widget so the imported
  // testimonial appears on the hosted wall immediately — same behaviour
  // as /api/submissions/[id]/approve.
  const defaultWidget = await prisma.widget.findFirst({
    where: { workspaceId: auth.workspace.id, isActive: true },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true },
  });

  if (defaultWidget) {
    const nextPosition = await prisma.widgetTestimonial.count({
      where: { widgetId: defaultWidget.id },
    });
    await prisma.widgetTestimonial.upsert({
      where: {
        widgetId_testimonialId: {
          widgetId: defaultWidget.id,
          testimonialId: testimonial.id,
        },
      },
      create: {
        widgetId: defaultWidget.id,
        testimonialId: testimonial.id,
        position: nextPosition,
      },
      update: {},
    });
  }

  return NextResponse.json({
    testimonial,
    widget: defaultWidget
      ? { id: defaultWidget.id, name: defaultWidget.name }
      : null,
  });
}
