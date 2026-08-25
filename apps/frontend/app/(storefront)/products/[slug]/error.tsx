"use client";

import SegmentError from "@/app/features/storefront/components/segment-error";

export default function ProductError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // A missing product is handled via notFound() in the page — reaching this
  // boundary means a real failure (network/backend), so offer a retry.
  if (error.digest) {
    console.error("[product segment]", error.digest);
  }
  return <SegmentError title="Couldn't load this product" reset={reset} />;
}
