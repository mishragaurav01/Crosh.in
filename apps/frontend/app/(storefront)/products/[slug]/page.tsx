import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api, PaginatedData } from "@/lib/api";
import ImageGallery from "@/app/features/storefront/components/image-gallery";
import ProductDetail from "@/app/features/storefront/components/product-detail";
import ReviewsSection from "@/app/features/storefront/components/reviews-section";
import RelatedRail from "@/app/features/storefront/components/related-rail";
import type {
  ProductDetailDto,
  ProductListItemDto,
} from "@/app/features/storefront/types";

export const dynamic = "force-dynamic";

const RELATED_LIMIT = 6;

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await api.get<ProductDetailDto>(`/api/products/${slug}`);
    return { title: `${product.name} | Crosh.in` };
  } catch {
    return { title: "Product | Crosh.in" };
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  let product: ProductDetailDto;
  try {
    product = await api.get<ProductDetailDto>(`/api/products/${slug}`);
  } catch (error) {
    if ((error as { code?: string }).code === "PRODUCT_NOT_FOUND") {
      notFound();
    }
    throw error;
  }

  // Related items: same-category products excluding the current one
  // (Integration Gap default; categorySlug comes from the detail DTO).
  let related: ProductListItemDto[] = [];
  try {
    const relatedResponse = await api.get<PaginatedData<ProductListItemDto>>(
      "/api/products",
      { page: 1, limit: RELATED_LIMIT + 1, category: product.categorySlug },
    );
    related = relatedResponse.data
      .filter((entry) => entry.slug !== product.slug)
      .slice(0, RELATED_LIMIT);
  } catch {
    // Related rail is a supplementary section — a failed fetch must not take
    // down the whole page; the rail simply doesn't render.
    related = [];
  }

  return (
    <main className="max-w-[1280px] mx-auto px-lg py-xl pb-32">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-xxl items-start">
        {/* Left Column: Image Gallery (Span 7) */}
        <div className="md:col-span-7">
          <ImageGallery images={product.images} productName={product.name} />
        </div>

        {/* Right Column: Product Info & Actions - Sticky (Span 5) */}
        <div className="md:col-span-5 md:sticky md:top-32 flex flex-col gap-lg">
          <ProductDetail product={product} />
        </div>
      </div>

      <div className="mt-xxl">
        <ReviewsSection />
      </div>

      {related.length > 0 && (
        <div className="mt-xxl">
          <RelatedRail products={related} />
        </div>
      )}
    </main>
  );
}
