import dns from "node:dns/promises";
import net from "node:net";
import type { Testimonial } from "@prisma/client";
import { retrieve } from "@/lib/ask-my-wall";

/**
 * Proof placement audit.
 *
 * Crawls a customer's own website (home, pricing, features, ...), works out
 * what each page is trying to say, checks whether it shows any customer
 * proof, and matches real quotes from their wall to each page's themes.
 * Nothing here calls an AI model: pages are read with fixed rules and quotes
 * are picked with the same keyword retrieval Ask My Wall uses, so a quote is
 * always a real one from the customer's own wall.
 */

// ─── safe fetching of a customer-supplied URL ───────────────────────

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127)
    );
  }
  if (net.isIPv6(ip)) {
    const l = ip.toLowerCase();
    return (
      l === "::1" || l === "::" || l.startsWith("fc") || l.startsWith("fd") || l.startsWith("fe80") ||
      /^::ffff:(127|10|0)\./.test(l) || l.startsWith("::ffff:192.168.") || l.startsWith("::ffff:169.254.")
    );
  }
  return true;
}

async function assertPublicHost(host: string): Promise<void> {
  const h = host.toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local") || h.endsWith(".internal")) {
    throw new Error("That address isn't a public website.");
  }
  if (net.isIP(h)) {
    if (isPrivateIp(h)) throw new Error("That address isn't a public website.");
    return;
  }
  const addrs = await dns.lookup(h, { all: true });
  if (addrs.length === 0 || addrs.some((a) => isPrivateIp(a.address))) {
    throw new Error("That address isn't a public website.");
  }
}

export function normalizeSite(input: string): string | null {
  try {
    const u = new URL(/^https?:\/\//i.test(input.trim()) ? input.trim() : `https://${input.trim()}`);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return `${u.protocol}//${u.hostname}`;
  } catch {
    return null;
  }
}

async function safeGet(
  url: string,
  timeoutMs = 6000
): Promise<{ status: number; html: string; finalUrl: string } | null> {
  let current = url;
  for (let hop = 0; hop < 4; hop++) {
    try {
      const u = new URL(current);
      if (u.protocol !== "http:" && u.protocol !== "https:") return null;
      await assertPublicHost(u.hostname);
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), timeoutMs);
      try {
        const res = await fetch(current, {
          signal: ctl.signal,
          redirect: "manual",
          headers: {
            "user-agent": "Mozilla/5.0 (compatible; TestimoniProofAudit/1.0; +https://testimoni.io)",
            accept: "text/html,application/xhtml+xml",
          },
        });
        if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
          current = new URL(res.headers.get("location")!, current).toString();
          continue;
        }
        const type = res.headers.get("content-type") || "";
        if (!type.includes("html")) return { status: res.status, html: "", finalUrl: current };
        return { status: res.status, html: (await res.text()).slice(0, 600_000), finalUrl: current };
      } finally {
        clearTimeout(t);
      }
    } catch {
      return null;
    }
  }
  return null;
}

// ─── page discovery ─────────────────────────────────────────────────

export type PageKind = "home" | "pricing" | "features" | "customers" | "about";

const KIND_RULES: [PageKind, RegExp][] = [
  ["pricing", /^\/(pricing|plans|price|buy)(\/|$)/i],
  ["features", /^\/(features?|product|products|platform|solutions?|how-it-works|use-cases?|integrations?|services?)(\/|$)/i],
  ["customers", /^\/(customers?|case-stud(y|ies)|stories|reviews?|testimonials?|love|wall-of-love)(\/|$)/i],
  ["about", /^\/(about|company|team|our-story)(\/|$)/i],
];

const SKIP_EXT = /\.(pdf|png|jpe?g|gif|svg|webp|zip|css|js|xml|ico|mp4|mov)$/i;

function hostKey(h: string): string {
  return h.toLowerCase().replace(/^www\./, "");
}

function pickLinks(homeHtml: string, base: URL): Map<PageKind, string> {
  const found = new Map<PageKind, string>();
  for (const m of homeHtml.matchAll(/<a\s[^>]*href=["']([^"'#]+)["']/gi)) {
    let u: URL;
    try {
      u = new URL(m[1], base);
    } catch {
      continue;
    }
    if (hostKey(u.hostname) !== hostKey(base.hostname) || SKIP_EXT.test(u.pathname) || u.search.length > 0) continue;
    for (const [kind, re] of KIND_RULES) {
      if (!found.has(kind) && re.test(u.pathname)) found.set(kind, `${u.origin}${u.pathname}`);
    }
  }
  return found;
}

// ─── reading a page ─────────────────────────────────────────────────

function textOf(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8217;|&rsquo;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

type Topic = { key: string; label: string; claim: RegExp; query: string; ask: string };

const TOPICS: Topic[] = [
  {
    key: "value",
    label: "Price and value",
    claim: /\b(pricing|price|per month|\/mo|free plan|free trial|money-back|affordable|no hidden|cancel anytime|\$\d+)/gi,
    query: "price pricing worth value affordable cost",
    ask: "Was it worth the price?",
  },
  {
    key: "ease",
    label: "Easy to start",
    claim: /\b(easy|simple|in minutes|no[- ]code|get started|set ?up|onboard\w*|quick(ly)?|plug and play)\b/gi,
    query: "easy setup quick start minutes simple",
    ask: "How easy was it to get started?",
  },
  {
    key: "support",
    label: "Support",
    claim: /\b(support|help center|24\/7|customer success|dedicated|response time|live chat)\b/gi,
    query: "support helpful responsive team help",
    ask: "How was the support you got?",
  },
  {
    key: "trust",
    label: "Reliability and trust",
    claim: /\b(secure|security|uptime|reliable|soc ?2|gdpr|compliance|encrypted|99\.\d+%)\b/gi,
    query: "reliable stable trust solid works",
    ask: "Do you trust it and does it work reliably?",
  },
  {
    key: "results",
    label: "Results",
    claim: /\b(increase|boost|grow\w*|conversions?|revenue|roi|saves? (time|hours)|faster|reduce\w*|results|outcomes?)\b/gi,
    query: "results growth conversion sales revenue increase",
    ask: "What result did you get?",
  },
  {
    key: "features",
    label: "Features",
    claim: /\b(integrat\w*|api|automat\w*|dashboard|analytics|workflows?|templates?|features?)\b/gi,
    query: "feature tool integration works",
    ask: "Which feature do you use most?",
  },
  {
    key: "design",
    label: "Design and look",
    claim: /\b(beautiful|design\w*|customi[sz]\w*|brand\w*|themes?)\b/gi,
    query: "design clean beautiful look",
    ask: "What do you think of how it looks?",
  },
];

const DEFAULT_TOPICS: Record<PageKind, string[]> = {
  home: ["results", "ease"],
  pricing: ["value", "trust"],
  features: ["features", "ease"],
  customers: ["results", "support"],
  about: ["trust", "support"],
};

const PROOF_EMBEDS: [RegExp, string][] = [
  [/testimoni\.io\/(embed|w\/)|data-testimoni|testimoni-widget/i, "Testimoni wall"],
  [/senja\.io|senja-embed/i, "Senja"],
  [/famewall/i, "Famewall"],
  [/testimonial\.to/i, "Testimonial.to"],
  [/trustpilot\.com|tp-widget|trustpilot-widget/i, "Trustpilot"],
  [/g2crowd|g2\.com\/[^"']*widget/i, "G2"],
  [/elfsight/i, "Elfsight"],
  [/shapo\.io|endorsal|boast\.io|wallofloveapp/i, "a review widget"],
];

function detectProof(html: string, text: string): { has: boolean; kind: string | null } {
  for (const [re, name] of PROOF_EMBEDS) if (re.test(html)) return { has: true, kind: name };
  const blocks =
    (html.match(/<blockquote/gi) || []).length + (text.match(/[“"][^”"]{40,260}[”"]/g) || []).length;
  const heading = /(what (our )?(customers|clients|users) (are )?(say|saying)|testimonials?|loved by|kind words)/i.test(text);
  if ((heading && blocks >= 2) || blocks >= 3) return { has: true, kind: "quotes written on the page" };
  return { has: false, kind: null };
}

export type PageQuote = { content: string; author: string; title: string | null };
export type PageMatch = { topic: string; label: string; ask: string; quotes: PageQuote[] };

export type PageAudit = {
  url: string;
  path: string;
  title: string;
  kind: PageKind;
  hasProof: boolean;
  proofKind: string | null;
  priority: "high" | "medium" | "low" | "ok";
  themes: string[];
  matches: PageMatch[];
  recommendation: string;
};

export type ProofAuditResult = {
  siteUrl: string;
  checkedAt: string;
  wallQuotes: number;
  pages: PageAudit[];
  summary: { pagesChecked: number; withoutProof: number; missingTopics: { label: string; ask: string }[] };
  note?: string;
};

const PLACEMENT_HINT: Record<PageKind, string> = {
  home: "directly under the hero, before the first call to action",
  pricing: "right under the plan cards, where visitors hesitate",
  features: "next to the feature it proves, or just above the sign-up button",
  customers: "at the top, ahead of any logos",
  about: "below your story, so people see others vouch for you",
};

export async function auditSite(
  siteInput: string,
  testimonials: readonly Testimonial[]
): Promise<ProofAuditResult> {
  const site = normalizeSite(siteInput);
  if (!site) throw new Error("That doesn't look like a website address. Try something like acme.com");

  const home = await safeGet(site);
  if (!home || home.status >= 400 || !home.html) {
    throw new Error("We couldn't open that website. Check the address, and that it's public.");
  }
  const base = new URL(home.finalUrl);
  const links = pickLinks(home.html, base);
  // Pages that JavaScript-built menus hide from the homepage HTML.
  for (const [kind, path] of [["pricing", "/pricing"], ["features", "/features"]] as const) {
    if (!links.has(kind)) links.set(kind, `${base.origin}${path}`);
  }
  const targets: { kind: PageKind; url: string }[] = [
    { kind: "home", url: home.finalUrl },
    ...[...links.entries()].slice(0, 5).map(([kind, url]) => ({ kind, url })),
  ];

  const fetched = await Promise.all(
    targets.map(async (t) => ({ t, res: t.kind === "home" ? home : await safeGet(t.url) }))
  );

  const usable = testimonials.filter((x) => x.status === "APPROVED" && x.content);
  const usedQuotes = new Set<string>();
  const pages: PageAudit[] = [];

  for (const { t, res } of fetched) {
    if (!res || res.status >= 400 || !res.html) continue;
    const text = textOf(res.html);
    if (text.length < 200) continue;
    const title = (res.html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "").replace(/\s+/g, " ").trim().slice(0, 90);
    const proof = detectProof(res.html, text);

    // Themes the page talks about, strongest first; fall back to what a
    // page of this kind usually needs to convince people of.
    const slice = text.slice(0, 20_000);
    const ranked = TOPICS.map((tp) => ({ tp, n: (slice.match(tp.claim) || []).length }))
      .filter((x) => x.n >= 2)
      .sort((a, b) => b.n - a.n)
      .slice(0, 2)
      .map((x) => x.tp);
    const chosen = ranked.length > 0 ? ranked : DEFAULT_TOPICS[t.kind].map((k) => TOPICS.find((x) => x.key === k)!);
    const wanted = [...new Map([...chosen, ...DEFAULT_TOPICS[t.kind].slice(0, 1).map((k) => TOPICS.find((x) => x.key === k)!)].map((x) => [x.key, x])).values()].slice(0, 3);

    const matches: PageMatch[] = wanted.map((tp) => {
      const got = retrieve(usable, tp.query, 6).filter((r) => r.score >= 0.7);
      const fresh = got.filter((r) => !usedQuotes.has(r.content));
      const picks = (fresh.length > 0 ? fresh : got).slice(0, 2);
      for (const p of picks) usedQuotes.add(p.content);
      return {
        topic: tp.key,
        label: tp.label,
        ask: tp.ask,
        quotes: picks.map((p) => ({ content: p.content, author: p.author, title: p.title })),
      };
    });

    const important = t.kind === "home" || t.kind === "pricing";
    const priority: PageAudit["priority"] = proof.has ? "ok" : important ? "high" : t.kind === "features" ? "medium" : "low";
    const path = new URL(res.finalUrl).pathname || "/";
    const hint = PLACEMENT_HINT[t.kind];
    const haveQuotes = matches.some((m) => m.quotes.length > 0);
    const recommendation = proof.has
      ? `This page already shows proof (${proof.kind}). ${haveQuotes ? "These quotes speak to what the page is selling, if you want to strengthen it." : "Check that what it shows speaks to the page's main claims."}`
      : haveQuotes
        ? `No customer proof on this page. Add your Wall of Love ${hint}, and lead with the quotes below.`
        : `No customer proof on this page, and your wall has no quote that fits its themes yet. Ask customers the questions below, then add the wall ${hint}.`;

    pages.push({
      url: res.finalUrl,
      path,
      title: title || path,
      kind: t.kind,
      hasProof: proof.has,
      proofKind: proof.kind,
      priority,
      themes: wanted.map((x) => x.label),
      matches,
      recommendation,
    });
  }

  if (pages.length === 0) {
    throw new Error("We could open the site but couldn't read any pages. It may build its pages with JavaScript only.");
  }

  const order = { high: 0, medium: 1, low: 2, ok: 3 } as const;
  pages.sort((a, b) => order[a.priority] - order[b.priority]);

  // Themes pages need that the wall can't back up yet.
  const missing = new Map<string, { label: string; ask: string }>();
  for (const p of pages) for (const m of p.matches) if (m.quotes.length === 0) missing.set(m.topic, { label: m.label, ask: m.ask });

  return {
    siteUrl: site,
    checkedAt: new Date().toISOString(),
    wallQuotes: usable.length,
    pages,
    summary: {
      pagesChecked: pages.length,
      withoutProof: pages.filter((p) => !p.hasProof).length,
      missingTopics: [...missing.values()],
    },
    note: usable.length === 0 ? "Your wall has no approved testimonials yet, so there are no quotes to match." : undefined,
  };
}
