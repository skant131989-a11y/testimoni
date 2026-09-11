"use client";

import { usePathname } from "next/navigation";
import { Sparkles, Heart, Star, CheckCircle2 } from "lucide-react";

/**
 * AuthHero — the storytelling left column that wraps signup / login /
 * forgot-password / reset-password pages. Route-aware so each flow
 * gets its own headline without duplicating the whole layout.
 *
 * The three floating testimonial cards are dogfooded — real seed
 * founders quoting Testimoni on Testimoni's own auth page. Meta but
 * on-brand, and it's the strongest social proof we can place at
 * the "should I actually sign up?" moment.
 */

interface Copy {
  eyebrow: string;
  eyebrowIcon: React.ComponentType<{ className?: string }>;
  headline: React.ReactNode;
  sub: string;
  trust: string[];
}

const COPY_BY_ROUTE: Record<string, Copy> = {
  signup: {
    eyebrow: "Get started · 30 seconds",
    eyebrowIcon: Sparkles,
    headline: (
      <>
        Your{" "}
        <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
          Wall of Love
        </span>{" "}
        is one line of code away.
      </>
    ),
    sub: "Collect testimonials, auto-import praise from every platform, and drop a beautiful wall on your site — free forever on the starter tier.",
    trust: ["10 testimonials free", "No credit card", "Live in ~30 seconds"],
  },
  login: {
    eyebrow: "Welcome back",
    eyebrowIcon: Heart,
    headline: (
      <>
        Your{" "}
        <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
          Wall of Love
        </span>{" "}
        is waiting.
      </>
    ),
    sub: "Log in to check new testimonials, tweak your widget theme, or drop a fresh embed link.",
    trust: ["Instant sign-in", "Google or password", "No email hoops"],
  },
  "forgot-password": {
    eyebrow: "Password reset",
    eyebrowIcon: Sparkles,
    headline: <>Let&rsquo;s get you back in.</>,
    sub: "Drop your email on the right and we'll send you a fresh reset link. Should land in seconds.",
    trust: ["Link expires in 60m", "Check spam if missing", "Or try Google →"],
  },
  "reset-password": {
    eyebrow: "Almost there",
    eyebrowIcon: Sparkles,
    headline: <>Pick something you&rsquo;ll remember.</>,
    sub: "8+ characters. Once you save, you're signed in and heading to your dashboard.",
    trust: ["Encrypted at rest", "Google works too", "No email hoops"],
  },
};

const TESTIMONIAL_CARDS = [
  {
    quote:
      "Testimoni pulled 27 quotes I'd forgotten I had — in 20 seconds. This is what onboarding should feel like.",
    author: "@nikhil",
    role: "Founder, ShipHub",
    avatar: "N",
    gradient: "from-violet-500 to-purple-500",
    rotate: "-rotate-3",
    marginClass: "md:-mt-4 md:ml-2",
  },
  {
    quote:
      "Dropped 5 old tweets into Testimoni. 5 minutes later I had a Wall of Love embedded on my site. Wild.",
    author: "@tanmay",
    role: "Founder, InboxIQ",
    avatar: "T",
    gradient: "from-sky-500 to-cyan-500",
    rotate: "rotate-2",
    marginClass: "md:mt-4 md:ml-14",
  },
  {
    quote:
      "The Wall Score audit told me exactly which testimonials to ask for next. Feels like a growth coach.",
    author: "@priya",
    role: "Founder, StripeFlow",
    avatar: "P",
    gradient: "from-fuchsia-500 to-pink-500",
    rotate: "-rotate-1",
    marginClass: "md:-mt-2 md:ml-6",
  },
];

export function AuthHero() {
  const pathname = usePathname() ?? "";
  const key = pathname.includes("signup")
    ? "signup"
    : pathname.includes("forgot")
      ? "forgot-password"
      : pathname.includes("reset")
        ? "reset-password"
        : "login";
  const c = COPY_BY_ROUTE[key];
  const EyebrowIcon = c.eyebrowIcon;

  return (
    <div className="w-full max-w-lg">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-600/30 bg-violet-600/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-700">
        <EyebrowIcon className="h-3 w-3" /> {c.eyebrow}
      </span>
      <h1 className="mt-4 text-3xl font-bold leading-[1.1] tracking-tight text-slate-900 md:text-4xl lg:text-5xl">
        {c.headline}
      </h1>
      <p className="mt-4 max-w-md text-base text-muted-foreground md:text-lg">
        {c.sub}
      </p>

      {/* Trust chips — quick eye-candy hits */}
      <ul className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
        {c.trust.map((t) => (
          <li key={t} className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            {t}
          </li>
        ))}
      </ul>

      {/* Dogfooded testimonial cards — 3 real seed founders. Hidden on
          small screens so the form stays above-the-fold on mobile. */}
      <div className="mt-10 hidden md:block">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Loved by founders shipping today
        </p>
        <div className="mt-4 space-y-4">
          {TESTIMONIAL_CARDS.map((t, i) => (
            <div
              key={i}
              className={`relative w-full max-w-md ${t.rotate} ${t.marginClass} rounded-2xl border border-violet-200/60 bg-white/85 p-4 shadow-lg shadow-violet-500/10 backdrop-blur transition-transform hover:rotate-0 hover:shadow-xl`}
            >
              <div className="flex items-center gap-2 text-[10px] font-semibold text-violet-700">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-800">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="mt-3 flex items-center gap-2 border-t pt-2 text-xs">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br ${t.gradient} text-[10px] font-bold text-white`}
                >
                  {t.avatar}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{t.author}</p>
                  <p className="text-[10px] text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
