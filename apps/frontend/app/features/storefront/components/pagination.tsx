import Link from "next/link";

interface PaginationProps {
  /** Fully composed target URL (preserves ?category=), or null when exhausted. */
  nextHref: string | null;
}

/**
 * Catalog pagination per frame: a single outline "Load More" pill. The grid
 * re-renders server-side with every slice up to ?page=N appended, so the URL
 * stays canonical (?page reflects the highest loaded page).
 */
export default function Pagination({ nextHref }: PaginationProps) {
  if (!nextHref) {
    return null;
  }

  return (
    <div className="flex justify-center">
      <Link
        href={nextHref}
        scroll={false}
        className="inline-flex h-[58px] items-center justify-center rounded-full border border-secondary px-lg font-body-md text-body-md text-secondary transition-colors duration-200 hover:bg-surface-container-low"
      >
        Load More
      </Link>
    </div>
  );
}
