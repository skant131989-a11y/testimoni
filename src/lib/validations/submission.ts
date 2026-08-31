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

export const createSubmissionSchema = z
  .object({
    formId: z.string().min(1),
    customerName: z.string().min(1).max(200),
    customerEmail: optionalEmail,
    customerTitle: optionalString(200),
    content: optionalString(5000),
    rating: z.number().int().min(1).max(5).optional(),
    videoUrl: z.string().url().max(2048).optional(),
    imageUrls: z.array(z.string().url().max(2048)).max(5).default([]),
    answers: z.record(z.string(), z.unknown()).default({}),
  })
  .refine((data) => data.content || data.rating, {
    message: "Either content or rating is required",
    path: ["content"],
  });

export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;
