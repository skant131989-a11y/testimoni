import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export type AuthContext = {
  user: {
    id: string;
    supabaseId: string;
    email: string;
    name: string | null;
  };
  workspace: {
    id: string;
    name: string;
    slug: string;
  };
  membership: {
    id: string;
    role: "OWNER" | "ADMIN" | "MEMBER";
  };
};

/**
 * Get the current authenticated user and their workspace context.
 * Expects a `workspaceId` query param or uses the user's first workspace.
 * Returns null if not authenticated or not a member of the workspace.
 */
export async function getAuthContext(
  request: Request
): Promise<AuthContext | null> {
  const supabase = await createClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  if (!supabaseUser) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { supabaseId: supabaseUser.id },
  });

  if (!user) {
    return null;
  }

  // Try to get workspaceId from query params
  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId");

  let membership;

  if (workspaceId) {
    membership = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId,
        },
      },
      include: { workspace: true },
    });
  } else {
    // Default to the user's first workspace
    membership = await prisma.workspaceMember.findFirst({
      where: { userId: user.id },
      include: { workspace: true },
      orderBy: { createdAt: "asc" },
    });
  }

  if (!membership) {
    return null;
  }

  return {
    user: {
      id: user.id,
      supabaseId: user.supabaseId,
      email: user.email,
      name: user.name,
    },
    workspace: {
      id: membership.workspace.id,
      name: membership.workspace.name,
      slug: membership.workspace.slug,
    },
    membership: {
      id: membership.id,
      role: membership.role,
    },
  };
}
