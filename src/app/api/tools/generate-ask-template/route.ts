import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/tools/generate-ask-template
 *
 * Public endpoint — no auth. Given a customer name, your name/business,
 * a channel (WhatsApp/DM/email/LinkedIn/SMS), and a tone, return 3
 * ready-to-copy message variants.
 *
 * Template-driven for now — swap for an LLM later without touching
 * the client. Same shape as /api/tools/generate-testimonial.
 */

type Channel = "whatsapp" | "email" | "dm" | "linkedin" | "sms";
type Tone = "casual" | "professional" | "warm";
type Ask = "text_only" | "text_and_rating" | "video";

interface Body {
  customerName?: string;
  yourName?: string;
  business?: string;
  channel?: Channel;
  tone?: Tone;
  ask?: Ask;
  formUrl?: string;
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const customer = (body.customerName || "").trim().slice(0, 60) || "there";
  const you = (body.yourName || "").trim().slice(0, 60) || "me";
  const business = (body.business || "").trim().slice(0, 80) || "my product";
  const channel: Channel = body.channel || "whatsapp";
  const tone: Tone = body.tone || "casual";
  const ask: Ask = body.ask || "text_only";
  const formUrl =
    (body.formUrl || "").trim().slice(0, 200) || "[your form URL]";

  const variants = buildVariants({ customer, you, business, channel, tone, ask, formUrl });
  return NextResponse.json({ variants }, { status: 200 });
}

/**
 * Return 3 asks per (channel, tone) combo. Distinct angles:
 *   1. Direct — clear ask, no fluff
 *   2. Warm — reason + ask + gratitude
 *   3. Reciprocity — helping-you-and-them framing
 */
function buildVariants(opts: {
  customer: string;
  you: string;
  business: string;
  channel: string;
  tone: string;
  ask: string;
  formUrl: string;
}) {
  const { customer, you, business, channel, tone, ask, formUrl } = opts;

  const askLine =
    ask === "video"
      ? "Would you be up for recording a quick 30-second video review?"
      : ask === "text_and_rating"
      ? "Would you leave a quick review + star rating for me?"
      : "Would you leave a quick testimonial for me?";

  const formLine = `Here's the link — takes about 30 seconds: ${formUrl}`;

  const casualByChannel: Record<string, [string, string, string]> = {
    whatsapp: [
      `Hey ${customer}! Quick favor — ${askLine.toLowerCase()} If yes, ${formLine}`,
      `Hey ${customer} 👋 loved working with you on ${business}. ${askLine} No pressure, and if yes: ${formLine}`,
      `Hey ${customer}! Trying to get a few testimonials up on my site. You'd be a huge help. ${formLine}`,
    ],
    dm: [
      `hey ${customer} — mind leaving a quick testimonial for ${business}? 30s: ${formUrl}`,
      `hey! working on the ${business} landing page and would love a quote from you if you're up for it — ${formUrl}`,
      `${customer}, quick ask: got a 30s window to drop a testimonial? big help — ${formUrl}`,
    ],
    sms: [
      `Hey ${customer}! Quick favor — leave a testimonial for ${business}? Takes 30s: ${formUrl}`,
      `${customer}, would you drop a review for ${business}? Super helpful. ${formUrl}`,
      `Hey! Working on my testimonials page. 30 seconds if you have it? ${formUrl}`,
    ],
    email: [
      `Hi ${customer},\n\nQuick favor — ${askLine.toLowerCase()} It genuinely helps other customers decide.\n\n${formLine}\n\nThanks!\n${you}`,
      `Hi ${customer},\n\nHope you're doing well. Loved working with you on ${business} — would you be open to sharing a quick testimonial? It would mean a lot.\n\n${formLine}\n\nEither way, thanks for the trust.\n${you}`,
      `Hi ${customer},\n\nCircling back with one small ask: I'm updating the ${business} site with real customer stories. Would you be up for sharing a short one? Takes about 30 seconds.\n\n${formLine}\n\nAppreciate you,\n${you}`,
    ],
    linkedin: [
      `Hi ${customer}, quick ask — would you be open to leaving a short testimonial about our work on ${business}? Would help me a lot as I grow this. Here's a 30-second form: ${formUrl}`,
      `Hi ${customer}, hope you're doing well. Sharing customer wins on ${business} more openly this quarter — would you be up for a short testimonial? ${formUrl}`,
      `Hi ${customer}, ${business} would look a lot more human with your voice on the page. Quick form here if you're up for it — takes about 30 seconds: ${formUrl}`,
    ],
  };

  const professionalByChannel: Record<string, [string, string, string]> = {
    whatsapp: [
      `Hi ${customer}, hope you're well. Would you be open to sharing a testimonial for ${business}? Should take about 30 seconds: ${formUrl}`,
      `Hi ${customer}, following up on our work on ${business}. Would you consider leaving a short testimonial? Form here: ${formUrl}`,
      `Hi ${customer}, gathering customer stories for ${business} this month. Would you be willing to contribute a short review? ${formUrl}`,
    ],
    dm: [
      `Hi ${customer} — would you be open to a short testimonial for ${business}? Form takes ~30 seconds: ${formUrl}`,
      `Hi ${customer}, hope things are going well. Would you consider sharing a short review for ${business}? ${formUrl}`,
      `Hi ${customer} — collecting a few customer stories for ${business}. Would you be up for one? ${formUrl}`,
    ],
    sms: [
      `Hi ${customer}, would you leave a short testimonial for ${business}? ${formUrl}`,
      `Hi ${customer}, hope you're well. Quick testimonial request for ${business}: ${formUrl}`,
      `Hi ${customer}, would you consider a short review for ${business}? ${formUrl}`,
    ],
    email: [
      `Subject: Quick testimonial request\n\nHi ${customer},\n\nHope this finds you well. I'm collecting customer stories for the ${business} page and would love to include yours. ${askLine}\n\n${formLine}\n\nThank you for considering — either way it's been a pleasure working with you.\n\nBest,\n${you}`,
      `Subject: A small favor\n\nHi ${customer},\n\nI'm reaching out with a small ask. As I refresh the ${business} website, real customer voices matter more than anything I could write. ${askLine}\n\n${formLine}\n\nGrateful either way.\n\nBest,\n${you}`,
      `Subject: Would you share your experience?\n\nHi ${customer},\n\nWorking on the testimonials section of the ${business} site and would love to include a short quote from you. ${askLine}\n\n${formLine}\n\nAppreciate your time.\n\nBest,\n${you}`,
    ],
    linkedin: [
      `Hi ${customer}, hope you're well. I'm putting together a testimonials section for ${business} and would love to include a short quote from you if you're open to it. Here's a 30-second form: ${formUrl}. Thanks in advance for considering.`,
      `Hi ${customer}, hope things are going well. Would you be open to sharing a short testimonial about ${business}? Would mean a lot as I grow this. ${formUrl}`,
      `Hi ${customer}, following up on our work on ${business}. Would you be willing to contribute a short customer story? Form here: ${formUrl}. Grateful either way.`,
    ],
  };

  const warmByChannel: Record<string, [string, string, string]> = {
    whatsapp: [
      `Hey ${customer}! Working with you on ${business} was genuinely one of the best things about this year. Would you be open to sharing a short testimonial? ${formUrl}`,
      `Hey ${customer} — hope life is treating you well. Quick, honest ask: would you leave a testimonial for ${business}? Would mean a lot. ${formUrl}`,
      `Hey ${customer}! Building out the ${business} page and it feels incomplete without your voice on it. Would you be up for a short one? ${formUrl}`,
    ],
    dm: [
      `hey ${customer}! genuinely loved working with you on ${business}. would you drop a quick testimonial if you have 30s? ${formUrl}`,
      `hey ${customer} — sharing customer wins for ${business} and yours came to mind first. up for a short one? ${formUrl}`,
      `hey ${customer} — quick honest ask, would love to feature you on the ${business} testimonials page. 30s: ${formUrl}`,
    ],
    sms: [
      `Hey ${customer}! Loved working with you on ${business}. Would you leave a short testimonial? ${formUrl}`,
      `Hey ${customer}! Building out the ${business} page and would love your voice on it. ${formUrl}`,
      `Hey ${customer}! Quick ask — testimonial for ${business}? Would mean a lot. ${formUrl}`,
    ],
    email: [
      `Subject: A quick, honest ask\n\nHi ${customer},\n\nWorking with you on ${business} was one of the highlights of this year — genuinely. I'm gathering customer stories for the site and yours came to mind first. ${askLine}\n\n${formLine}\n\nEither way, thanks for the trust so far.\n\n${you}`,
      `Subject: Would love your voice on the page\n\nHi ${customer},\n\nI hope this finds you well. Updating the ${business} testimonials section, and honestly, your voice on it would mean a lot. ${askLine}\n\n${formLine}\n\nGrateful either way.\n\n${you}`,
      `Subject: A small favor if you have 30 seconds\n\nHi ${customer},\n\nOne of the best parts of building ${business} has been working with you. Would you be up for sharing a short testimonial? Would help other customers decide, and mean a lot to me.\n\n${formLine}\n\nThanks either way.\n\n${you}`,
    ],
    linkedin: [
      `Hi ${customer}, hope you're doing well. Genuinely loved our work together on ${business}. I'm putting together a testimonials section and would love to include a short quote from you if you're open to it — 30s form: ${formUrl}. Would mean a lot.`,
      `Hi ${customer}, hope life is treating you well. Building out ${business}'s customer stories and yours came to mind first. Would you be up for a short one? ${formUrl}. Either way, grateful for your trust.`,
      `Hi ${customer}, hope you're well. Quick honest ask — the ${business} page feels incomplete without your voice on it. Would you share a short testimonial? ${formUrl}. Thanks either way.`,
    ],
  };

  const set =
    tone === "professional"
      ? professionalByChannel
      : tone === "warm"
      ? warmByChannel
      : casualByChannel;

  const [v1, v2, v3] = set[channel] ?? set.whatsapp;

  return [
    { angle: "Direct", body: v1 },
    { angle: "Warm", body: v2 },
    { angle: "Reciprocity / context", body: v3 },
  ];
}
