"use client";

interface SegmentErrorProps {
  title?: string;
  reset: () => void;
}

/**
 * Shared per-segment error boundary UI for storefront catalog segments.
 * Segment error.tsx files stay thin wrappers so each route owns its boundary.
 */
export default function SegmentError({
  title = "Something went wrong",
  reset,
}: SegmentErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-md px-container-margin py-xxl text-center min-h-[50vh]">
      <h2 className="font-headline-sm text-headline-sm text-primary">{title}</h2>
      <p className="font-body-md text-body-md text-on-surface-variant max-w-[24rem]">
        We couldn&apos;t load this page. Please try again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-full border border-secondary text-secondary font-body-md text-body-md px-xl py-md hover:bg-surface-container-low transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
