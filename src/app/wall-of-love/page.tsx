import { GuidePage, guideMetadata } from "@/components/guides/guide-page";

const SLUG = "wall-of-love";

export const metadata = guideMetadata(SLUG);

export default function Page() {
  return <GuidePage slug={SLUG} />;
}
