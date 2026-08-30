import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import ProductCard from "@/app/features/storefront/components/product-card";
import type { CollectionDetailDto } from "@/app/features/storefront/types";

export const revalidate = 60;

interface CollectionPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: CollectionPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const collection = await api.get<CollectionDetailDto>(
      `/api/collections/${slug}`,
    );
    return { title: `${collection.name} | Crosh.in` };
  } catch {
    return { title: "Collection | Crosh.in" };
  }
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { slug } = await params;

  let collection: CollectionDetailDto;
  try {
    collection = await api.get<CollectionDetailDto>(`/api/collections/${slug}`);
  } catch (error) {
    if ((error as { code?: string }).code === "COLLECTION_NOT_FOUND") {
      notFound();
    }
    throw error;
  }

  return (
    <div className="pt-md pb-32">
      {collection.banner && (
        <div className="relative mx-md h-[200px] overflow-hidden rounded-3xl">
          <Image
            src={collection.banner.url}
            alt={collection.banner.alt ?? `${collection.name} banner`}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
            className="object-cover"
          />
        </div>
      )}

      <h1
        className={`px-container-margin font-playfair text-[32px] leading-[38px] font-semibold text-on-background ${
          collection.banner ? "mt-lg" : ""
        }`}
      >
        {collection.name}
      </h1>

      {collection.description && (
        <p className="mt-sm px-container-margin text-[16px] leading-[26px] font-inter text-on-surface-variant">
          {collection.description}
        </p>
      )}

      {collection.products.length === 0 ? (
        <div className="flex flex-col items-center gap-md px-container-margin py-xxl text-center">
          <p className="font-body-md text-body-md text-on-surface-variant">
            Nothing in this collection yet.
          </p>
          <Link
            href="/products"
            className="rounded-full border border-secondary px-lg py-sm font-body-md text-body-md text-secondary transition-colors hover:bg-surface-container-low"
          >
            Browse all products
          </Link>
        </div>
      ) : (
        <div className="mt-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-xl px-container-margin">
          {collection.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
