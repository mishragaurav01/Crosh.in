import Link from "next/link";
import { api, PaginatedData } from "@/lib/api";
import Hero from "@/app/features/storefront/components/hero";
import CollectionRail from "@/app/features/storefront/components/collection-rail";
import ProductCard from "@/app/features/storefront/components/product-card";
import BrandStory from "@/app/features/storefront/components/brand-story";
import TestimonialCard from "@/app/features/storefront/components/testimonial-card";
import NewsletterSignup from "@/app/features/storefront/components/newsletter-signup";
import type {
  CollectionListItemDto,
  ProductListItemDto,
} from "@/app/features/storefront/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [bestsellers, collections] = await Promise.all([
    api.get<PaginatedData<ProductListItemDto>>("/api/products", {
      page: 1,
      limit: 4,
    }),
    api.get<PaginatedData<CollectionListItemDto>>("/api/collections", {
      page: 1,
      limit: 10,
    }),
  ]);

  const hasCollections = collections.data.length > 0;

  return (
    <div className="pb-32 md:pb-0">
      {/* Hero Section */}
      <Hero />

      {/* Featured Collections */}
      {hasCollections && (
        <div className="mt-xxl md:mt-0">
          <CollectionRail collections={collections.data} />
        </div>
      )}

      {/* Bestsellers Section */}
      <section aria-label="Bestsellers" className="mt-xxl">
        {/* Mobile Header */}
        <div className="md:hidden px-container-margin">
          <h2 className="font-headline-sm text-headline-sm text-primary mb-lg">
            Bestsellers
          </h2>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:flex justify-between items-end mb-xxl max-w-[1280px] mx-auto px-lg">
          <div>
            <span className="text-primary font-label-md text-label-md uppercase tracking-widest">
              Customer Favorites
            </span>
            <h2 className="font-headline-md text-headline-md text-on-surface">
              The Bestsellers
            </h2>
          </div>
          <Link
            href="/products"
            className="text-primary font-label-md text-label-md flex items-center gap-sm hover:underline"
          >
            View all Shop{" "}
            <span className="material-symbols-outlined text-[18px]">
              arrow_forward
            </span>
          </Link>
        </div>

        {bestsellers.data.length === 0 ? (
          <p className="px-container-margin md:max-w-[1280px] md:mx-auto md:px-lg font-body-md text-body-md text-on-surface-variant">
            No products yet — check back soon.
          </p>
        ) : (
          <div className="px-container-margin md:max-w-[1280px] md:mx-auto md:px-lg grid grid-cols-2 lg:grid-cols-4 gap-x-gutter gap-y-[31px] md:gap-lg">
            {bestsellers.data.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Brand Story */}
      <div className="mt-xxl">
        <BrandStory />
      </div>

      {/* Testimonials */}
      <div className="mt-xxl">
        <TestimonialCard />
      </div>

      {/* Newsletter */}
      <div className="mt-xxl mb-xxl">
        <NewsletterSignup />
      </div>
    </div>
  );
}
