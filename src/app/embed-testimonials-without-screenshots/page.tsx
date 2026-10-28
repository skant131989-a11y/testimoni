import { GuidePage, guideMetadata } from "@/components/guides/guide-page";

const SLUG = "embed-testimonials-without-screenshots";

export const metadata = guideMetadata(SLUG);

export default function Page() {
  return <GuidePage slug={SLUG} />;
}
