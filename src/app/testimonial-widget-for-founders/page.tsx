import { GuidePage, guideMetadata } from "@/components/guides/guide-page";

const SLUG = "testimonial-widget-for-founders";

export const metadata = guideMetadata(SLUG);

export default function Page() {
  return <GuidePage slug={SLUG} />;
}
