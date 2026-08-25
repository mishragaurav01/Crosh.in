"use client";

import SegmentError from "@/app/features/storefront/components/segment-error";

export default function CollectionError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <SegmentError title="Couldn't load this collection" reset={reset} />;
}
