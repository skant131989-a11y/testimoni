import { NextRequest, NextResponse } from "next/server";
import { groqChat, hasGroq, GROQ_CHAT_MODEL } from "@/lib/groq";
import { reserveDaily, resolveScanActor } from "@/lib/scan-limits";

/**
 * POST /api/tools/generate-testimonial
 *
 * Free "testimonial writer": three first-person drafts a customer could
 * send for a business or person they worked with.
 *
 * Drafts are written by Groq (free, never Claude) from the details the
 * visitor gave. Visitors get 8 AI drafts a day, signed-in accounts 40;
 * after that, or if Groq is down, the tool still answers with carefully
 * written fill-in drafts so it never just breaks. Response:
 *   { variants: [{ angle, text }], source: "ai" | "template", limited?: boolean }
 */

type Feeling = "impressed" | "grateful" | "transformed" | "saved_time" | "saved_money";
type Tone = "casual" | "professional" | "enthusiastic";
type Length = "short" | "medium" | "long";

interface Body {
  reviewingName?: string;
  didWhat?: string;
  feeling?: Feeling;
  tone?: Tone;
  length?: Length;
}

type Variant = { angle: string; text: string };

const VISITOR_PER_DAY = 8;
const ACCOUNT_PER_DAY = 40;

const FEELING_SENTENCE: Record<Feeling, string> = {
  impressed: "I was genuinely impressed.",
  grateful: "I'm so grateful.",
  transformed: "It completely changed how I work.",
  saved_time: "It saves me hours every week.",
  saved_money: "It paid for itself in the first month.",
};

const FEELING_BRIEF: Record<Feeling, string> = {
  impressed: "genuinely impressed",
  grateful: "very grateful",
  transformed: "it completely changed how they work",
  saved_time: "it saves them hours every week",
  saved_money: "it paid for itself in the first month",
};

const WORDS: Record<Length, number> = { short: 25, medium: 50, long: 85 };

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = (body.reviewingName || "").trim().slice(0, 80);
  const didWhat = (body.didWhat || "").trim().slice(0, 300);
  const feeling: Feeling = body.feeling && body.feeling in FEELING_SENTENCE ? body.feeling : "impressed";
  const tone: Tone = body.tone === "professional" || body.tone === "enthusiastic" ? body.tone : "casual";
  const length: Length = body.length === "short" || body.length === "long" ? body.length : "medium";

  if (!name || !didWhat) {
    return NextResponse.json({ error: "reviewingName and didWhat are required" }, { status: 400 });
  }

  let limited = false;
  if (hasGroq()) {
    const actor = await resolveScanActor(req);
    const cap = actor.tier === "visitor" ? VISITOR_PER_DAY : ACCOUNT_PER_DAY;
    const slot = await reserveDaily(`tool:writer:${actor.subject}`, cap);
    if (slot.ok) {
      try {
        const variants = await writeWithGroq({ name, didWhat, feeling, tone, length });
        if (variants) return NextResponse.json({ variants, source: "ai" });
      } catch (err) {
        console.warn("[writer] Groq failed, using fill-in drafts:", err);
      }
    } else {
      limited = actor.tier === "visitor" ? true : false;
    }
  }

  return NextResponse.json({ variants: templateVariants({ name, didWhat, feeling, tone, length }), source: "template", limited });
}

async function writeWithGroq(o: { name: string; didWhat: string; feeling: Feeling; tone: Tone; length: Length }): Promise<Variant[] | null> {
  const system = `You write short, believable customer testimonials in the first person, as a real customer would. Rules:
- Use only the facts you are given. Never invent numbers, dates, names, prices or results that were not provided.
- Plain, natural language. No hashtags, no emojis, no quotation marks around the whole text, no mention of AI.
- Write three DIFFERENT drafts: (1) leads with the concrete result, (2) leads with how it felt to work with them, (3) leads with a recommendation to someone on the fence.
- Each draft is about ${WORDS[o.length]} words, in a ${o.tone} tone.
Return ONLY this JSON: {"variants":[{"angle":"Result first","text":"..."},{"angle":"Experience first","text":"..."},{"angle":"Recommendation first","text":"..."}]}`;
  const user = `Who or what is being reviewed: ${o.name}
What they did: ${o.didWhat}
How the reviewer felt: ${FEELING_BRIEF[o.feeling]}`;

  const { text } = await groqChat({
    model: GROQ_CHAT_MODEL,
    max_tokens: 900,
    temperature: 0.8,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  const cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  let parsed: { variants?: { angle?: unknown; text?: unknown }[] };
  try {
    parsed = JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
  const variants = (parsed.variants ?? [])
    .filter((v) => typeof v.text === "string" && (v.text as string).trim().length > 15)
    .slice(0, 3)
    .map((v, i) => ({
      angle: typeof v.angle === "string" && v.angle.trim() ? v.angle.trim() : ["Result first", "Experience first", "Recommendation first"][i],
      text: (v.text as string).trim().replace(/^["“]|["”]$/g, ""),
    }));
  return variants.length === 3 ? variants : null;
}

/** Lower-case the first letter, but keep "I", "I'm" and "I'd" as they are. */
function lcFirst(text: string): string {
  return /^I($|[' ])/.test(text) ? text : text.charAt(0).toLowerCase() + text.slice(1);
}

/** Fill-in drafts: grammatical for any "did what" that starts with a verb. */
function templateVariants(o: { name: string; didWhat: string; feeling: Feeling; tone: Tone; length: Length }): Variant[] {
  const { name, didWhat, feeling, tone, length } = o;
  const feel = FEELING_SENTENCE[feeling];
  const feelLower = lcFirst(feel);
  const opener = tone === "casual" ? "Honestly, " : tone === "professional" ? "In my experience, " : "Wow. ";
  const did = `${name} ${didWhat}`;
  const they = `They ${didWhat}`;

  const result: Record<Length, string> = {
    short: `${opener}${did}. ${feel}`,
    medium: `${opener}${did}. ${feel} It was faster and cleaner than I expected, so if you're on the fence, don't be.`,
    long: `${opener}${did}. I came in a little skeptical, but ${feelLower} Communication was clear, nothing slipped, and the result was better than I had in mind. If you're weighing your options, this is your sign.`,
  };
  const experience: Record<Length, string> = {
    short: `I can't recommend ${name} enough. ${they}. ${feel}`,
    medium: `I can't recommend ${name} enough. ${they}, and ${feelLower} What I valued most was the care: they wanted to get it right, not just get it done.`,
    long: `I can't recommend ${name} enough. ${they}. Beyond the result, what stood out was the care: every question answered, every detail thought through, every deadline kept. ${feel} I'd work with them again without a second thought.`,
  };
  const recommend: Record<Length, string> = {
    short: `If you're considering ${name}, go for it: they ${lcFirst(didWhat)}.`,
    medium: `If you're considering ${name}, here's my honest take: ${they}. ${feel} I'd choose them again.`,
    long: `If you're considering ${name}, here's my honest take. ${they}. ${feel} I was weighing a few options and I'm glad I chose them. If you want someone who follows through, start here.`,
  };

  return [
    { angle: "Result first", text: result[length] },
    { angle: "Experience first", text: experience[length] },
    { angle: "Recommendation first", text: recommend[length] },
  ];
}
