import { GuidePage, guideMetadata } from "@/components/guides/guide-page";

const SLUG = "import-linkedin-recommendations";

export const metadata = guideMetadata(SLUG);

export default function Page() {
  return <GuidePage slug={SLUG} />;
}
