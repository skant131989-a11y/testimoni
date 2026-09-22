import type { Metadata } from "next";
import { PublicNav } from "@/components/layout/public-nav";
import { ScanReportClient } from "./client";

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
      <footer className="border-t py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground">
          &copy; 2026 Testimoni · Miss something?{" "}
          <a href="/contact" className="underline">
            hello@testimoni.io
          </a>
        </div>
      </footer>
    </div>
  );
}
