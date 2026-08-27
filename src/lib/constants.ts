export const PLAN_LIMITS = {
  FREE: {
    maxTestimonials: 10,
    maxWidgets: 1,
    layouts: ["GRID"] as const,
    video: false,
    watermark: true,
    customBranding: false,
  },
  PRO: {
    maxTestimonials: Infinity,
    maxWidgets: Infinity,
    layouts: ["GRID", "MASONRY", "CAROUSEL", "LIST", "MARQUEE"] as const,
    video: true,
    watermark: false,
    customBranding: true,
  },
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;

export const PRO_PRICE_MONTHLY = 29;
