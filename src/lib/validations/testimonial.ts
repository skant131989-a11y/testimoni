import { z } from "zod";

export const createTestimonialSchema = z.object({
  content: z.string().min(1).max(5000).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  customerName: z.string().min(1).max(200),
  customerEmail: z.string().email().max(320).optional().or(z.literal("")),
  customerTitle: z.string().max(200).optional(),
  customerUrl: z.string().url().max(2048).optional(),
  customerAvatar: z.string().url().max(2048).optional(),
  source: z
    .enum(["MANUAL", "FORM", "TWITTER", "LINKEDIN", "GOOGLE", "IMPORT"])
    .default("MANUAL"),
  sourceUrl: z.string().url().max(2048).optional().or(z.literal("")),
  status: z.enum(["PENDING", "APPROVED", "ARCHIVED"]).default("PENDING"),
  tags: z.array(z.string().max(50)).max(20).default([]),
  videoUrl: z.string().url().max(2048).optional(),
  imageUrls: z.array(z.string().url().max(2048)).max(10).default([]),
});

export const updateTestimonialSchema = z.object({
  content: z.string().min(1).max(5000).optional(),
  rating: z.number().int().min(1).max(5).optional().nullable(),
  customerName: z.string().min(1).max(200).optional(),
  customerEmail: z.string().email().max(320).optional().nullable(),
  customerTitle: z.string().max(200).optional().nullable(),
  customerUrl: z.string().url().max(2048).optional().nullable(),
  customerAvatar: z.string().url().max(2048).optional().nullable(),
  source: z
    .enum(["MANUAL", "FORM", "TWITTER", "LINKEDIN", "GOOGLE", "IMPORT"])
    .optional(),
  sourceUrl: z.string().url().max(2048).optional().nullable(),
  status: z.enum(["PENDING", "APPROVED", "ARCHIVED"]).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  videoUrl: z.string().url().max(2048).optional().nullable(),
  imageUrls: z.array(z.string().url().max(2048)).max(10).optional(),
});

export type CreateTestimonialInput = z.infer<typeof createTestimonialSchema>;
export type UpdateTestimonialInput = z.infer<typeof updateTestimonialSchema>;
