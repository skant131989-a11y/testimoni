import { prisma } from "@/lib/prisma";

/** True when this address asked not to be contacted. Case-insensitive. */
export async function isSuppressed(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  const hit = await prisma.outreachSuppression.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true },
  });
  return !!hit;
}
