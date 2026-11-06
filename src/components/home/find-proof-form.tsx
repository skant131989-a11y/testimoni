"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Globe, Loader2 } from "lucide-react";
import { track } from "@/lib/analytics";

/**
 * The home page's one call to action: paste your website, see the
 * praise we find. Used in the hero and again in the closing band so
 * the same button leads every scroll depth to the same place.
 * /tools/find-my-proof reads ?url= and starts the scan by itself.
 */

const EXAMPLES = ["notion.so", "linear.app"];

function looksLikeSite(value: string) {
  const v = value.trim();
  return v.length > 3 && !/\s/.test(v) && /\.[a-z]{2,}/i.test(v);
}

export function FindProofForm({
  placement,
  size = "lg",
}: {
  /** Analytics label, e.g. "hero" or "final". */
  placement: string;
  size?: "lg" | "md";
}) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [going, setGoing] = useState(false);

  function go(value: string, via: "typed" | "example") {
    if (!looksLikeSite(value)) {
      setError("Enter your website, like yourproduct.com");
      return;
    }
    setError(null);
    setGoing(true);
    track("home_find_proof_submitted", { placement, via }, { anonymous: true });
    router.push(`/tools/find-my-proof?url=${encodeURIComponent(value.trim())}`);
  }

  return (
    <div className="w-full">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          go(url, "typed");
        }}
        className={`flex w-full flex-col gap-2 rounded-2xl border-2 border-primary/25 bg-white p-2 shadow-lg shadow-primary/10 sm:flex-row sm:items-center ${
          size === "lg" ? "sm:p-2.5" : ""
        }`}
      >
        <label htmlFor={`find-proof-${placement}`} className="sr-only">
          Your website
        </label>
        <div className="flex flex-1 items-center gap-2 px-3">
          <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            id={`find-proof-${placement}`}
            type="text"
            inputMode="url"
            autoComplete="url"
            autoCapitalize="none"
            spellCheck={false}
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (error) setError(null);
            }}
            placeholder="yourproduct.com"
            className="h-11 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground/70"
          />
        </div>
        <button
          type="submit"
          disabled={going}
          className="group inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 text-sm font-bold text-white shadow-md shadow-violet-500/25 transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-70 sm:text-base"
        >
          {going ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Opening…
            </>
          ) : (
            <>
              Find my praise
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </form>

      {error ? (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">
          Try an example:{" "}
          {EXAMPLES.map((ex, i) => (
            <span key={ex}>
              <button
                type="button"
                onClick={() => {
                  setUrl(ex);
                  go(ex, "example");
                }}
                className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
              >
                {ex}
              </button>
              {i < EXAMPLES.length - 1 ? ", " : ""}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}
