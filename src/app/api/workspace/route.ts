import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/utils";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user already exists in our database
    const existingUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: {
        workspaceMembers: {
          include: { workspace: true },
        },
      },
    });

    if (existingUser) {
      const workspace = existingUser.workspaceMembers[0]?.workspace ?? null;
      return NextResponse.json({ user: existingUser, workspace });
    }

    // Derive display name and workspace slug
    const fullName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "User";
    const slug = generateSlug(fullName);

    // Ensure slug uniqueness
    let uniqueSlug = slug;
    let suffix = 1;
    while (await prisma.workspace.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${slug}-${suffix}`;
      suffix++;
    }

    // Create User, Workspace, WorkspaceMember, and Subscription in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          supabaseId: user.id,
          email: user.email!,
          name: fullName,
          avatarUrl: user.user_metadata?.avatar_url ?? null,
        },
      });

      const workspace = await tx.workspace.create({
        data: {
          name: `${fullName}'s Workspace`,
          slug: uniqueSlug,
        },
      });

      await tx.workspaceMember.create({
        data: {
          userId: newUser.id,
          workspaceId: workspace.id,
          role: "OWNER",
        },
      });

      await tx.subscription.create({
        data: {
          workspaceId: workspace.id,
          plan: "FREE",
          status: "ACTIVE",
          stripeCustomerId: `cus_placeholder_${newUser.id}`,
        },
      });

      return { user: newUser, workspace };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("[POST /api/workspace] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
