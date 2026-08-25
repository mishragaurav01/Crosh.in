"use client";

import SegmentError from "@/app/features/storefront/components/segment-error";

export default function CollectionsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <SegmentError title="Couldn't load collections" reset={reset} />;
}
