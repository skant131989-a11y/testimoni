import { prisma } from "@/lib/prisma";

/**
 * What the public share page and its preview image show for one review.
 * Looked up by the submission's id (an unguessable id that only the person
 * who wrote the review is given), or the testimonial's id when the form
 * publishes straight to the wall. Spam and rejected ones are never shown.
 */
export interface ShareCard {
  quote: string;
  rating: number | null;
  name: string;
  workspaceName: string;
  workspaceSlug: string;
  formSlug: string | null;
}

export async function getShareCard(id: string): Promise<ShareCard | null> {
  if (!/^[a-z0-9]{8,40}$/i.test(id)) return null;
  try {
    const sub = await prisma.submission.findUnique({
      where: { id },
      select: {
        content: true,
        rating: true,
        customerName: true,
        status: true,
        form: { select: { slug: true, workspace: { select: { name: true, slug: true } } } },
      },
    });
    if (sub && sub.status !== "SPAM" && sub.status !== "REJECTED") {
      return {
        quote: (sub.content ?? "").trim(),
        rating: sub.rating,
        name: sub.customerName,
        workspaceName: sub.form.workspace.name,
        workspaceSlug: sub.form.workspace.slug,
        formSlug: sub.form.slug,
      };
    }
    const t = await prisma.testimonial.findUnique({
      where: { id },
      select: {
        content: true,
        rating: true,
        customerName: true,
        status: true,
        source: true,
        workspace: { select: { name: true, slug: true, forms: { take: 1, orderBy: { createdAt: "asc" }, select: { slug: true } } } },
      },
    });
    if (t && t.source === "FORM" && t.status === "APPROVED") {
      return {
        quote: (t.content ?? "").trim(),
        rating: t.rating,
        name: t.customerName,
        workspaceName: t.workspace.name,
        workspaceSlug: t.workspace.slug,
        formSlug: t.workspace.forms[0]?.slug ?? null,
      };
    }
  } catch {
    // fall through
  }
  return null;
}
