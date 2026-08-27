import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PublicCollectionForm from "@/components/collection/public-form";

export default async function CollectionFormPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; formSlug: string }>;
}) {
  const { workspaceSlug, formSlug } = await params;

  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
    select: { id: true, name: true, logoUrl: true },
  });

  if (!workspace) notFound();

  const form = await prisma.collectionForm.findFirst({
    where: {
      workspaceId: workspace.id,
      slug: formSlug,
      isActive: true,
    },
    select: {
      id: true,
      headline: true,
      description: true,
      allowRating: true,
      allowVideo: true,
      thankYouMessage: true,
    },
  });

  if (!form) notFound();

  return (
    <PublicCollectionForm
      formConfig={{
        ...form,
        workspace: { name: workspace.name, logoUrl: workspace.logoUrl },
      }}
    />
  );
}
