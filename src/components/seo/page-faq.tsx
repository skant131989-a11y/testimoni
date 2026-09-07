interface FAQ {
  question: string;
  answer: string;
}

interface Props {
  heading: string;
  subheading?: string;
  faqs: readonly FAQ[];
  /** Wrapper background tint. Defaults to muted so it visually
   *  separates from the tool/comparison content above. */
  variant?: "muted" | "plain";
}

/**
 * Zero-JS accordion FAQ block. Renders the same 5 questions/answers
 * that live in the page's JSON-LD schema, so users and Google see
 * identical content — a requirement for FAQPage rich results
 * (Google penalizes schema that doesn't match visible content).
 *
 * Uses native <details>/<summary> instead of React state: no
 * hydration cost, works with JS disabled, keyboard-accessible by
 * default. Rendered as a server component so it costs zero client
 * bundle.
 */
export function PageFAQ({ heading, subheading, faqs, variant = "muted" }: Props) {
  const wrapperClass =
    variant === "muted"
      ? "border-t bg-muted/10 py-16"
      : "border-t bg-background py-16";
  return (
    <section className={wrapperClass}>
      <div className="mx-auto max-w-3xl px-4">
        <h2 className="text-3xl font-bold tracking-tight">{heading}</h2>
        {subheading && (
          <p className="mt-2 text-muted-foreground">{subheading}</p>
        )}
        <div className="mt-8 space-y-3">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-lg border bg-card px-5 py-4"
            >
              <summary className="cursor-pointer list-none text-base font-semibold marker:hidden">
                <span className="flex items-start justify-between gap-3">
                  <span>{faq.question}</span>
                  <span className="mt-0.5 text-primary transition-transform group-open:rotate-180">
                    ⌄
                  </span>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
