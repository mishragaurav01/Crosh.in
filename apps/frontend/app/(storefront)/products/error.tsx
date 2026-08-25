"use client";

import SegmentError from "@/app/features/storefront/components/segment-error";

export default function ProductsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <SegmentError title="Couldn't load products" reset={reset} />;
}
