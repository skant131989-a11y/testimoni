"use client";

import { useEffect, useRef, useState } from "react";
import { LetterAvatar } from "@/components/letter-avatar";

/**
 * A person's photo that falls back to their letter avatar when the
 * image can't be loaded. Profile photos pulled in from other sites
 * (X, LinkedIn, Google…) expire or block hotlinking, so a broken photo
 * is normal, not an edge case.
 */
export function AvatarImage({
  src,
  name,
  size = 40,
  fontSize,
}: {
  src: string | null | undefined;
  name: string;
  size?: number;
  fontSize?: number;
}) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  // A photo that already failed before React hydrated never fires
  // onError, so check once on mount.
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  if (!src || failed) {
    return <LetterAvatar name={name} size={size} fontSize={fontSize} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={src}
      alt=""
      width={size}
      height={size}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="shrink-0 rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  );
}
