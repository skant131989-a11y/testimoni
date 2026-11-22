import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { PrintButton } from "./print-button";

/**
 * A print-ready poster for one collection form: a big QR code, a short line
 * that asks for the review, and the address underneath. Made for shops,
 * cafes, salons and market stalls: print it, stand it on the counter, and
 * customers scan and write their review in about 20 seconds.
 *
 * Public on purpose (it only shows the form's own public address), and kept
 * out of search results.
 */
export const metadata: Metadata = {
  title: "Review poster",
  robots: { index: false, follow: false },
};

export default async function PosterPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; formSlug: string }>;
}) {
  const { workspaceSlug, formSlug } = await params;

  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
    select: { id: true, name: true, logoUrl: true },
  });
  if (!workspace) {
    const renamed = await prisma.workspace.findFirst({
      where: { previousSlugs: { has: workspaceSlug } },
      select: { slug: true },
    });
    if (renamed) redirect(`/poster/${renamed.slug}/${formSlug}`);
    notFound();
  }

  const form = await prisma.collectionForm.findFirst({
    where: { workspaceId: workspace.id, slug: formSlug, isActive: true },
    select: { thankYouReward: true },
  });
  if (!form) notFound();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://testimoni.io";
  const formUrl = `${appUrl}/collect/${workspaceSlug}/${formSlug}`;
  const qr = await QRCode.toDataURL(formUrl, { margin: 1, width: 720, color: { dark: "#2e1065", light: "#ffffff" } });
  const shortUrl = formUrl.replace(/^https?:\/\//, "");

  return (
    <main className="min-h-screen bg-neutral-100 px-4 py-8 print:bg-white print:p-0">
      <style>{`@page { size: A4; margin: 0 } @media print { body { background: #fff } }`}</style>

      <div className="mx-auto mb-6 flex max-w-[210mm] items-center justify-between print:hidden">
        <div>
          <p className="text-sm font-semibold">Your review poster</p>
          <p className="text-xs text-neutral-500">Print it on A4 (or any size) and stand it where customers can see it.</p>
        </div>
        <PrintButton />
      </div>

      <div className="mx-auto flex min-h-[297mm] w-full max-w-[210mm] flex-col items-center justify-between bg-white px-[14mm] py-[16mm] text-center shadow-xl print:min-h-screen print:max-w-none print:shadow-none">
        <div>
          {workspace.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={workspace.logoUrl} alt="" className="mx-auto mb-4 h-20 w-20 rounded-full object-cover" />
          )}
          <p className="text-2xl font-semibold tracking-tight text-violet-900">{workspace.name}</p>
        </div>

        <div className="w-full">
          <h1 className="text-[44px] font-extrabold leading-[1.05] tracking-tight text-neutral-900">
            Loved it?
            <br />
            <span className="text-violet-700">Tell us in 20 seconds.</span>
          </h1>
          <div className="mx-auto mt-8 w-[118mm] rounded-[28px] bg-white p-4" style={{ border: "6px solid #6d28d9" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt={`QR code that opens ${shortUrl}`} className="h-auto w-full" />
          </div>
          <p className="mt-6 text-xl font-semibold text-neutral-800">Point your phone camera at the code</p>
          <p className="mt-1 text-base text-neutral-500">No app, no account. Just a few words.</p>
          {form.thankYouReward && (
            <p className="mx-auto mt-6 max-w-[150mm] rounded-2xl border-2 border-dashed border-violet-300 bg-violet-50 px-5 py-3 text-lg font-semibold text-violet-900">
              A thank-you from us: {form.thankYouReward}
            </p>
          )}
        </div>

        <div>
          <p className="font-mono text-sm text-neutral-500">{shortUrl}</p>
          <p className="mt-2 text-[11px] text-neutral-400">Reviews collected with Testimoni</p>
        </div>
      </div>
    </main>
  );
}
