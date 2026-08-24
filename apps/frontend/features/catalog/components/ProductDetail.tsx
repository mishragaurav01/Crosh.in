"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import { PageLoading } from "@/components/ui/Loading";
import CatalogError from "./CatalogError";
import VariantManager from "./VariantManager";
import ImageManager from "./ImageManager";
import { IMAGE_OWNER_LIMITS } from "../images";
import type { Product, Category, ApiError } from "../types";
import { getProduct, listCategories } from "../api";

interface ProductDetailProps {
  productId: string;
}

export default function ProductDetail({ productId }: ProductDetailProps) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [categoryName, setCategoryName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    Promise.all([getProduct(productId), listCategories(1, 100)])
      .then(([productData, categoryData]) => {
        if (!mounted.current) return;
        setProduct(productData);
        setCategoryName(
          categoryData.data.find((c: Category) => c.id === productData.categoryId)?.name ?? null,
        );
      })
      .catch((err: unknown) => {
        if (mounted.current) setError(err as ApiError);
      })
      .finally(() => {
        if (mounted.current) setLoading(false);
      });
    return () => {
      mounted.current = false;
    };
  }, [productId]);

  if (loading) {
    return (
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="mb-md"
          onClick={() => router.push("/catalog/products")}
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Products
        </Button>
        <PageLoading message="Loading product..." />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="mb-md"
          onClick={() => router.push("/catalog/products")}
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Products
        </Button>
        <CatalogError error={error ?? "Product not found"} />
      </div>
    );
  }

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        className="mb-md"
        onClick={() => router.push("/catalog/products")}
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Products
      </Button>

      <PageHeader
        title={product.name}
        description={
          categoryName ? `Category: ${categoryName}` : product.slug
        }
      />

      <div className="mt-lg space-y-xl">
        <section className="space-y-sm">
          <div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">
              Images
            </h2>
            <p className="text-body-sm text-on-surface-variant">
              Up to {IMAGE_OWNER_LIMITS.product} images. The first image is the
              storefront&apos;s primary product image.
            </p>
          </div>
          <ImageManager
            ownerType="product"
            ownerId={product.id}
            maxImages={IMAGE_OWNER_LIMITS.product}
          />
        </section>

        <section className="space-y-sm">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">
            Variants
          </h2>
          <VariantManager productId={product.id} />
        </section>
      </div>
    </div>
  );
}
