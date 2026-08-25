import Link from "next/link";

/**
 * Branded 404 for the storefront route group — catches notFound() thrown by
 * unknown product/collection slugs (behavior contract clause 6).
 */
export default function StorefrontNotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-md px-container-margin py-xxl text-center min-h-[50vh]">
      <h1 className="font-headline-sm text-headline-sm text-primary">
        We couldn&apos;t find that page
      </h1>
      <p className="font-body-md text-body-md text-on-surface-variant max-w-[24rem]">
        It may have moved, or it never existed. Let&apos;s get you back to
        browsing.
      </p>
      <div className="flex gap-md">
        <Link
          href="/"
          className="rounded-full border border-secondary px-lg py-sm font-body-md text-body-md text-secondary transition-colors hover:bg-surface-container-low"
        >
          Go home
        </Link>
        <Link
          href="/products"
          className="rounded-full bg-primary px-lg py-sm font-body-md text-body-md text-on-primary transition-opacity hover:opacity-90"
        >
          Shop products
        </Link>
      </div>
    </div>
  );
}
