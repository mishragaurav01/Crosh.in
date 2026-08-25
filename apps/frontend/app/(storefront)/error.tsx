"use client";

export default function StorefrontError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-md py-[33px] px-container-margin text-center min-h-[50vh]">
      <h2 className="font-headline-sm text-headline-sm text-primary">
        Something went wrong
      </h2>
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
