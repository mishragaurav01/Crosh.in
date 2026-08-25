import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api, PaginatedData } from "@/lib/api";
import FilterSidebar from "@/app/features/storefront/components/filter-sidebar";
import Pagination from "@/app/features/storefront/components/pagination";
import ProductCard from "@/app/features/storefront/components/product-card";
import type {
  CategoryListItemDto,
  ProductListItemDto,
} from "@/app/features/storefront/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop | Crosh.in",
};

const PAGE_LIMIT = 6;

function isNotFound(error: unknown): boolean {
  return (
    (error as { code?: string }).code === "PRODUCT_NOT_FOUND" ||
    (error as { code?: string }).code === "CATEGORY_NOT_FOUND"
  );
}

interface ProductsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const category =
    typeof params.category === "string" && params.category !== ""
      ? params.category
      : undefined;
  const rawPage = typeof params.page === "string" ? Number(params.page) : NaN;
  const requestedPage =
    Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1;

  let categories: PaginatedData<CategoryListItemDto>;
  let firstSlice: PaginatedData<ProductListItemDto>;
  try {
    // The chips rail is filter-only (no category detail endpoint exists).
    [categories, firstSlice] = await Promise.all([
      api.get<PaginatedData<CategoryListItemDto>>("/api/categories", {
        page: 1,
        limit: 100,
      }),
      api.get<PaginatedData<ProductListItemDto>>("/api/products", {
        page: 1,
        limit: PAGE_LIMIT,
        category,
      }),
    ]);
  } catch (error) {
    if (isNotFound(error)) {
      notFound();
    }
    throw error;
  }

  // Load More model: ?page=N means "highest loaded page". Slices 2..N are
  // appended server-side so the grid grows while the URL stays canonical.
  const totalPages =
    firstSlice.total > 0 ? Math.ceil(firstSlice.total / PAGE_LIMIT) : 0;
  const currentPage = Math.min(requestedPage, Math.max(totalPages, 1));

  const laterSlices =
    currentPage > 1
      ? await Promise.all(
        Array.from({ length: currentPage - 1 }, (_, index) =>
          api.get<PaginatedData<ProductListItemDto>>("/api/products", {
            page: index + 2,
            limit: PAGE_LIMIT,
            category,
          }),
        ),
      )
      : [];

  const products = [firstSlice, ...laterSlices].flatMap((slice) => slice.data);

  const activeCategory = category
    ? categories.data.find((entry) => entry.slug === category)
    : undefined;

  function buildPageHref(page: number): string {
    const search = new URLSearchParams();
    if (category) {
      search.set("category", category);
    }
    if (page > 1) {
      search.set("page", String(page));
    }
    const query = search.toString();
    return query ? `/products?${query}` : "/products";
  }

  const hasNextPage = currentPage < totalPages;

  return (
    <div className="flex flex-col md:flex-row gap-xxl pb-32 pt-md px-container-margin">
      {/* Search Layout Left Column: Filter Sidebar */}
      {categories.data.length > 0 && (
        <FilterSidebar categories={categories.data} activeCategory={category} />
      )}

      {/* Main Catalog Area */}
      <section className="flex-1" aria-label="Catalog">
        <div className="flex justify-between items-end mb-xl">
          <div>
            <h1 className="text-display-lg-mobile md:text-display-lg font-display-lg text-on-surface">
              {activeCategory ? activeCategory.name : "Our Collection"}
            </h1>
            {!activeCategory && (
              <p className="text-body-lg text-on-surface-variant opacity-80 italic font-medium mt-sm">
                Hand-woven stories in every stitch.
              </p>
            )}
          </div>
          <div className="hidden md:flex items-center gap-sm">
            <span className="text-label-sm text-on-surface-variant uppercase tracking-tighter">
              Sort by:
            </span>
            <select
              defaultValue="New Arrivals"
              className="bg-transparent border-none text-primary font-semibold text-label-md focus:ring-0 cursor-pointer p-0"
              aria-label="Sort products"
            >
              <option value="New Arrivals">New Arrivals</option>
              <option value="Price: Low to High">Price: Low to High</option>
              <option value="Price: High to Low">Price: High to Low</option>
              <option value="Most Popular">Most Popular</option>
            </select>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="flex flex-col items-center gap-md py-xxl text-center">
            <p className="font-body-md text-body-md text-on-surface-variant">
              {category
                ? `No products in ${activeCategory?.name ?? "this category"} yet.`
                : "No products yet — check back soon."}
            </p>
            {category && (
              <Link
                href="/products"
                className="rounded-full border border-secondary px-lg py-sm font-body-md text-body-md text-secondary transition-colors hover:bg-surface-container-low"
              >
                View everything
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-xl">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}

              {/* Additional Decorative Row for visual weight (per reference) */}
              <div className="col-span-full py-xxl text-center">
                <p className="text-body-md text-on-surface-variant max-w-[36rem] mx-auto opacity-70">
                  Our artisans dedicate over 20 hours of hand-weaving to every
                  large tote. Each piece is unique, reflecting the individual
                  tension and rhythm of the weaver.
                </p>
                <div className="mt-lg flex justify-center gap-sm">
                  <span className="w-3 h-3 rounded-full bg-primary" />
                  <span className="w-3 h-3 rounded-full bg-primary-container" />
                  <span className="w-3 h-3 rounded-full bg-primary-container" />
                </div>
              </div>
            </div>

            <div className="mt-xl">
              <Pagination
                nextHref={hasNextPage ? buildPageHref(currentPage + 1) : null}
              />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
