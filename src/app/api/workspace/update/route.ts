import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

/**
 * POST-only endpoint for saving Workspace changes from the Settings
 * page's HTML forms. Two cards submit here:
 *   1. Workspace name / slug
 *   2. Public listing toggle + pitch + website + X handle
 *
 * Handles both by only updating fields that are present in the
 * FormData — if a field wasn't in the submitting form, it's left
 * untouched. Redirects back to /dashboard/settings on success.
 */

const NAME_MAX = 200;
const SLUG_MAX = 40;
const PITCH_MAX = 240;
const URL_MAX = 400;
const HANDLE_MAX = 60;

function clean(v: FormDataEntryValue | null, max: number): string | null {
  if (typeof v !== "string") return null;
  const trimmed = v.trim().slice(0, max);
  return trimmed.length > 0 ? trimmed : null;
}

function sanitizeSlug(input: string | null): string | null {
  if (!input) return null;
  // Lowercase, replace non-alphanumeric with hyphens, collapse repeats,
  // strip leading/trailing hyphens. Keeps URL-safe.
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX) || null;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
    include: {
      workspaceMembers: {
        include: { workspace: { select: { id: true, slug: true } } },
        take: 1,
      },
    },
  });
  const member = dbUser?.workspaceMembers[0];
  if (!member) {
    return NextResponse.json({ error: "No workspace" }, { status: 404 });
  }

  const form = await request.formData();

  // Build a partial update — only include fields the form actually
  // sent. Prevents the public-listing form from clobbering the name
  // set by the workspace form and vice versa.
  const data: Record<string, string | boolean | null> = {};

  if (form.has("name")) {
    const name = clean(form.get("name"), NAME_MAX);
    if (name) data.name = name;
  }

  if (form.has("slug")) {
    const slug = sanitizeSlug(clean(form.get("slug"), SLUG_MAX));
    if (slug && slug !== member.workspace.slug) {
      // Guard against uniqueness collisions — Prisma would throw
      // on the update otherwise, dropping the whole form.
      const clash = await prisma.workspace.findUnique({
        where: { slug },
        select: { id: true },
      });
      if (!clash) data.slug = slug;
    }
  }

  // Public listing toggle — checkbox sends "on" when checked, omits
  // the field entirely when unchecked. We treat this form specially:
  // the form always includes at least one of the linked fields, so
  // we know it was the public-listing form submitting when we see
  // "pitch" / "websiteUrl" / "xHandle" or "publicListing" in the body.
  const isPublicListingForm =
    form.has("publicListing") ||
    form.has("pitch") ||
    form.has("websiteUrl") ||
    form.has("xHandle");
  if (isPublicListingForm) {
    data.publicListing = form.get("publicListing") === "on";
    data.pitch = clean(form.get("pitch"), PITCH_MAX);
    data.websiteUrl = clean(form.get("websiteUrl"), URL_MAX);
    data.xHandle = clean(form.get("xHandle"), HANDLE_MAX);
    // Strip leading @ on X handles so the URL builder can just append.
    if (typeof data.xHandle === "string") {
      data.xHandle = data.xHandle.replace(/^@+/, "").slice(0, HANDLE_MAX);
    }
  }

  if (Object.keys(data).length > 0) {
    await prisma.workspace.update({
      where: { id: member.workspace.id },
      data,
    });
  }

  redirect("/dashboard/settings?saved=1");
}
