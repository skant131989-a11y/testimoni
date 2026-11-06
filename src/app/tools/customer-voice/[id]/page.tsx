import type { Metadata } from "next";
import { PublicNav } from "@/components/layout/public-nav";
import { ScanReportClient } from "./client";
import { SiteFooter } from "@/components/layout/site-footer";

export const metadata: Metadata = {
  title: "Customer voice report — Testimoni",
  robots: { index: false, follow: false },
};

export default async function CustomerVoiceReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />
      <main className="flex-1">
        <ScanReportClient id={id} />
      </main>
      <SiteFooter />
    </div>
  );
}
