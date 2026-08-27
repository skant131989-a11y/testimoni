import { z } from "zod";

export const createSubmissionSchema = z
  .object({
    formId: z.string().min(1),
    customerName: z.string().min(1).max(200),
    customerEmail: z.string().email().max(320).optional(),
    content: z.string().max(5000).optional(),
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
