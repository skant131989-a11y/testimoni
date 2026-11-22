import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";

/**
 * GET /api/inbox/count
 *
 * What is waiting for approval in the signed-in user's workspace: the count,
 * the newest waiting submission (name + a short snippet, so the live alert can
 * say who it is from), and whether the wall has any testimonial yet (so the
 * very first approval can be celebrated). Powers the Inbox badge, the live
 * alert, the tab-title count and the dot on the public site's Dashboard
 * button. Always fresh, never cached.
 */
const NO_STORE = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json({ pending: 0, latest: null, hasTestimonials: true }, { status: 401, headers: NO_STORE });
  }
  const where = { status: "NEW" as const, form: { workspaceId: auth.workspace.id } };
  const [pending, latest, testimonials] = await Promise.all([
    prisma.submission.count({ where }),
    prisma.submission.findFirst({
      where,
      orderBy: { createdAt: "desc" },
      select: { id: true, customerName: true, content: true, rating: true },
    }),
    prisma.testimonial.count({ where: { workspaceId: auth.workspace.id } }),
  ]);
  return NextResponse.json(
    {
      pending,
      latest: latest
        ? {
            id: latest.id,
            name: latest.customerName,
            snippet: (latest.content ?? "").replace(/\s+/g, " ").trim().slice(0, 140),
            rating: latest.rating,
          }
        : null,
      hasTestimonials: testimonials > 0,
    },
    { headers: NO_STORE }
  );
}
