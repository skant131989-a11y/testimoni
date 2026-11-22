import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkAndIncrement } from "@/lib/ask-rate-limit";
import { groqChat, hasGroq, GROQ_CHAT_MODEL } from "@/lib/groq";

/**
 * POST /api/collect/polish
 *
 * "Help me say it" on the public collection form: a customer types a few
 * rough words and gets back a natural sentence or two in their own voice,
 * which they can edit before sending. Free Groq model only (never Claude),
 * a short input, and a small daily limit per visitor.
 */
const BODY = z.object({
  formId: z.string().min(1).max(64),
  text: z.string().trim().min(8).max(600),
});

// This route is outside the middleware, so it refuses obvious script clients itself.
const SCRIPT_UA = /headlesschrome|puppeteer|playwright|selenium|phantomjs|(bot|spider|crawler|scraper|scrapy)|^(python-requests|curl|wget|go-http-client|node-fetch|okhttp|libwww-perl)/i;

function ipFrom(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

export async function POST(req: NextRequest) {
  const ua = req.headers.get("user-agent") || "";
  if (!ua || SCRIPT_UA.test(ua)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!hasGroq()) return NextResponse.json({ error: "unavailable" }, { status: 503 });

  let body: z.infer<typeof BODY>;
  try {
    body = BODY.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Type a few words first." }, { status: 400 });
  }

  const rate = checkAndIncrement(ipFrom(req), "collect-polish", 12);
  if (!rate.allowed) {
    return NextResponse.json({ error: "You've used today's help. Your own words are great too." }, { status: 429 });
  }

  const form = await prisma.collectionForm.findUnique({
    where: { id: body.formId },
    select: { isActive: true, workspace: { select: { name: true } } },
  });
  if (!form || !form.isActive) return NextResponse.json({ error: "Form not found" }, { status: 404 });

  try {
    const { text } = await groqChat({
      model: GROQ_CHAT_MODEL,
      max_tokens: 220,
      temperature: 0.5,
      messages: [
        {
          role: "system",
          content:
            "You help a customer write a short testimonial in their own voice. Turn their rough notes into one to three natural sentences, in the first person. " +
            "Keep their meaning and tone. Never invent facts, numbers, names or results that are not in their notes. No hashtags, no emojis, no quotation marks around it, no preamble. " +
            "Return only the testimonial text.",
        },
        { role: "user", content: `Business: ${form.workspace.name}\nTheir rough notes: ${body.text}` },
      ],
    });
    const cleaned = text.trim().replace(/^["'\u201C]+|["'\u201D]+$/g, "").trim().slice(0, 600);
    if (cleaned.length < 10) return NextResponse.json({ error: "unavailable" }, { status: 502 });
    return NextResponse.json({ text: cleaned });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 502 });
  }
}
