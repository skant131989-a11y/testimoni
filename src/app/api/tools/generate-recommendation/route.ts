import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/tools/generate-recommendation
 *
 * Public — no auth. Given a person's name, role, relationship, and
 * skills, return 3 LinkedIn recommendation variations. Template-driven
 * for now; swap for an LLM later.
 */

type Relationship =
  | "worked_with"
  | "reported_to_me"
  | "reported_to_them"
  | "client"
  | "vendor"
  | "peer";
type Tone = "professional" | "warm" | "punchy";

interface Body {
  personName?: string;
  role?: string;
  relationship?: Relationship;
  skills?: string;
  tone?: Tone;
  yourName?: string;
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const person = (body.personName || "").trim().slice(0, 80);
  const role = (body.role || "").trim().slice(0, 120);
  const skills = (body.skills || "").trim().slice(0, 300);
  const relationship: Relationship = body.relationship || "worked_with";
  const tone: Tone = body.tone || "professional";
  const yourName = (body.yourName || "").trim().slice(0, 80);

  if (!person || !skills) {
    return NextResponse.json(
      { error: "personName and skills are required" },
      { status: 400 }
    );
  }

  const variants = buildVariants({ person, role, skills, relationship, tone, yourName });
  return NextResponse.json({ variants }, { status: 200 });
}

function buildVariants(opts: {
  person: string;
  role: string;
  skills: string;
  relationship: string;
  tone: string;
  yourName: string;
}) {
  const { person, role, skills, relationship, tone } = opts;

  // First-person context per relationship
  const contextByRelationship: Record<string, string> = {
    worked_with: `I had the pleasure of working with ${person}`,
    reported_to_me: `${person} reported to me`,
    reported_to_them: `I reported to ${person}`,
    client: `${person} was a client of mine`,
    vendor: `We hired ${person} as a vendor`,
    peer: `${person} and I worked as peers`,
  };
  const context = contextByRelationship[relationship] || contextByRelationship.worked_with;

  const roleLine = role ? ` in their capacity as ${role}` : "";

  // Recommendation angle templates
  // 1. Skills-first (leads with concrete strengths)
  // 2. Story-first (moment that stood out)
  // 3. Character-first (how they operate + who they are)

  const professional = {
    skills: `${context}${roleLine}, and I can say without hesitation that ${person} is one of the strongest professionals I've collaborated with. Their strengths are exactly what any team needs: ${skills}. What sets ${person} apart is not just what they know — it's the consistency with which they deliver. If you have the opportunity to work with ${person}, take it.`,

    story: `${context}${roleLine}, and one moment stands out. Faced with a hard problem — the kind where the "right" answer isn't obvious — ${person} didn't rush. They mapped the tradeoffs, brought the team along, and shipped a solution that held up. That's the level of thinking you get with ${person}. Skills-wise, they bring ${skills}. But it's the judgment that makes them exceptional.`,

    character: `${context}${roleLine}. Beyond the obvious strengths — ${skills} — what I want to highlight is how ${person} operates. Clear communication. Deep ownership. No drama. They raise the bar for the people around them, quietly and consistently. Any organization would be lucky to have ${person} on the team, and I would work with them again in a heartbeat.`,
  };

  const warm = {
    skills: `Working with ${person}${roleLine ? " " + roleLine : ""} was easily one of the best professional experiences I've had. They brought ${skills} to every project, and they made the work genuinely enjoyable. If you're considering ${person}, don't overthink it — they'll deliver, and you'll like working with them.`,

    story: `I still remember the first project I did with ${person}. It was messy and ambiguous, and ${person} just… handled it. Calmly, thoughtfully, and with the kind of care that's rare. That's ${person} in a sentence. Add to that ${skills}, and you have someone I'd hire again in a heartbeat.`,

    character: `The best thing I can say about ${person} isn't a skill — it's who they are to work with. Generous with knowledge, honest when it matters, and never petty. On top of that, they bring ${skills}. That combination — good human, sharp operator — is rarer than it should be. Highly recommend ${person}.`,
  };

  const punchy = {
    skills: `Three reasons to hire ${person}: ${skills}. One reason to move fast: someone else is about to. Highly recommend.`,

    story: `${person} once fixed a problem I'd been staring at for a week — in an afternoon. That's the level. Plus ${skills}. Would hire again without hesitation.`,

    character: `${person} shows up, does the work, and makes the team better. On top of that: ${skills}. If they're on your candidate list, move them to the top.`,
  };

  const set = tone === "warm" ? warm : tone === "punchy" ? punchy : professional;

  return [
    { angle: "Skills-first", text: set.skills },
    { angle: "Story-first", text: set.story },
    { angle: "Character-first", text: set.character },
  ];
}
