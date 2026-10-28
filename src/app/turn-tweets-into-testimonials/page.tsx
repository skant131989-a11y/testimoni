import { GuidePage, guideMetadata } from "@/components/guides/guide-page";

const SLUG = "turn-tweets-into-testimonials";

export const metadata = guideMetadata(SLUG);

export default function Page() {
  return <GuidePage slug={SLUG} />;
}
