import { z } from "zod";

// Empty strings from the public form get normalised to undefined so
// z.string().email() doesn't reject them. The client sometimes sends
// "" when the user leaves an optional field blank instead of omitting
// the key entirely; letting the schema coerce is easier than fixing
// every caller.
const optionalEmail = z
  .union([z.string().email().max(320), z.literal(""), z.undefined()])
  .transform((v) => (v === "" ? undefined : v));

const optionalString = (max: number) =>
  z
    .union([z.string().max(max), z.literal(""), z.undefined()])
    .transform((v) => (v === "" ? undefined : v));

// Reject content that's just a scraped email / URL / phone number with
// no real prose — the exact spam pattern we've seen in the wild. Bots
// dump `<[a@b.com](mailto:a@b.com)>` and long digit strings into every
// public form they can find. A real message has at least one run of
// letters that isn't inside a link.
function looksLikeScrapedContact(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length > 300) return false; // Long real messages pass.
  const hasContactPattern =
    /(@[\w.-]+\.[a-z]{2,})|(https?:\/\/)|(\b\d{9,}\b)|(mailto:)/i.test(trimmed);
  if (!hasContactPattern) return false;
  // If we strip all contact-shaped tokens and less than 20 chars of
  // letters remain, this is spam — the "message" is just contact info.
  const stripped = trimmed
    .replace(/<?\[?[\w.+-]+@[\w.-]+\.[a-z]{2,}\]?[^>\s]*>?/gi, "")
    .replace(/mailto:[^)\s>]+/gi, "")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\b\d[\d\s-]{7,}\d\b/g, "")
    .replace(/[^a-zA-Z]/g, "");
  return stripped.length < 20;
}

export const createSubmissionSchema = z
  .object({
    formId: z.string().min(1),
    customerName: z.string().min(1).max(200),
    customerEmail: optionalEmail,
    customerTitle: optionalString(200),
    // Content, when present, must be at least 20 real characters —
    // long enough to filter one-liner spam ("nice app", "hi"),
    // short enough that legit users still fit their thoughts.
    content: z
      .union([z.string().max(5000), z.literal(""), z.undefined()])
      .transform((v) => (v === "" ? undefined : v))
      .refine((v) => v === undefined || v.trim().length >= 20, {
        message: "Please write at least 20 characters",
      })
      .refine((v) => v === undefined || !looksLikeScrapedContact(v), {
        message: "That looks like contact info instead of a message",
      }),
    rating: z.number().int().min(1).max(5).optional(),
    videoUrl: z.string().url().max(2048).optional(),
    imageUrls: z.array(z.string().url().max(2048)).max(5).default([]),
    answers: z.record(z.string(), z.unknown()).default({}),
    // Honeypot — a hidden field with an innocent name that real users
    // never see. Bots that auto-fill every input trip this and get
    // rejected silently. Legitimate submissions send it empty or omit
    // it entirely.
    honeypot: z.string().max(0).optional(),
  })
  .refine((data) => data.content || data.rating, {
    message: "Either content or rating is required",
    path: ["content"],
  });

export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;
