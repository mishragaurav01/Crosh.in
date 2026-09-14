"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { api, PaginatedData } from "@/lib/api";
import ProductCard from "./product-card";
import type { ProductListItemDto } from "../types";

interface CatalogGridProps {
  initialProducts: ProductListItemDto[];
  total: number;
  pageSize: number;
  category?: string;
  startPage: number;
}

/**
 * Catalog grid with a client-side "Load More" pill (T3). The server renders
 * the initial slice(s); each Load More click appends exactly one backend
 * page (a single request) instead of re-fetching every prior slice on a
 * server round trip. The URL stays canonical: ?page=<highest loaded>.
 */
export default function CatalogGrid({
  initialProducts,
  total,
  pageSize,
  category,
  startPage,
}: CatalogGridProps) {
  const [products, setProducts] = useState(initialProducts);
  const [page, setPage] = useState(startPage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const pathname = usePathname();

  const exhausted = products.length >= total;

  function buildHref(targetPage: number): string {
    const search = new URLSearchParams();
    if (category) {
      search.set("category", category);
    }
    if (targetPage > 1) {
      search.set("page", String(targetPage));
    }
    const query = search.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  async function loadMore() {
    if (loading || exhausted) {
      return;
    }
    setLoading(true);
    setError(null);
    const nextPage = page + 1;
    try {
      const slice = await api.get<PaginatedData<ProductListItemDto>>(
        "/api/products",
        {
          page: nextPage,
          limit: pageSize,
          category,
        },
      );
      setProducts((previous) => [...previous, ...slice.data]);
      setPage(nextPage);
      router.replace(buildHref(nextPage), { scroll: false });
    } catch {
      setError("Couldn't load more products. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-xl">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}

        {/* Additional Decorative Row for visual weight (per reference) */}
        <div className="col-span-full py-xxl text-center">
          <p className="text-body-md text-on-surface-variant max-w-[36rem] mx-auto opacity-70">
            Our artisans dedicate over 20 hours of hand-weaving to every large
            tote. Each piece is unique, reflecting the individual tension and
            rhythm of the weaver.
          </p>
          <div className="mt-lg flex justify-center gap-sm">
            <span className="w-3 h-3 rounded-full bg-primary" />
            <span className="w-3 h-3 rounded-full bg-primary-container" />
            <span className="w-3 h-3 rounded-full bg-primary-container" />
          </div>
        </div>
      </div>

      <div className="mt-xl">
        {!exhausted && (
          <div className="flex flex-col items-center gap-sm">
            <button
              type="button"
              onClick={loadMore}
              disabled={loading}
              aria-busy={loading}
              className="inline-flex h-[58px] items-center justify-center rounded-full border border-secondary px-lg font-body-md text-body-md text-secondary transition-colors duration-200 hover:bg-surface-container-low disabled:opacity-50"
            >
              {loading ? "Loading…" : "Load More"}
            </button>
            {error && (
              <p role="alert" className="font-body-md text-body-md text-error">
                {error}
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
}