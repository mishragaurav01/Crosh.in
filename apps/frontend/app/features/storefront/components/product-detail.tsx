"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/format-price";
import type { ProductDetailDto } from "../types";
import VariantSwatches from "./variant-swatches";
import AddToCartCta from "./add-to-cart-cta";
import DetailsAccordion, { type AccordionItem } from "./details-accordion";

/**
 * Client coordinator for the interactive part of the product page: the
 * selected variant feeds the availability/price eyebrow, the swatch section,
 * and the add-to-cart CTA.
 */
export default function ProductDetail({ product }: { product: ProductDetailDto }) {
  // Default to the first in-stock variant so a multi-variant page never opens
  // on an unpurchasable choice; falls back to the first variant otherwise.
  const [selectedVariant, setSelectedVariant] = useState(
    () => product.variants.find((variant) => variant.available) ?? product.variants[0] ?? null,
  );

  const hasVariants = product.variants.length > 1;

  const accordionItems: AccordionItem[] = [];
  if (product.description) {
    accordionItems.push({ title: "Description", content: product.description });
  }

  return (
    <div className="flex flex-col gap-lg">
      <div className="border-b border-outline-variant/30 pb-lg">
        <nav className="flex items-center gap-xs text-label-sm font-label-sm text-on-surface-variant mb-md">
          <span>Shop</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span>{product.categorySlug}</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-primary">{product.name}</span>
        </nav>

        <h1 className="font-headline-md text-headline-md text-on-surface mb-sm">
          {product.name}
        </h1>
        {selectedVariant && (
          <p className="font-headline-sm text-headline-sm text-primary">
            {formatPrice(selectedVariant.price)}
          </p>
        )}
      </div>

      {product.description && (
        <div className="flex flex-col gap-md">
          <p className="text-body-md text-on-surface-variant leading-relaxed">
            {product.description}
          </p>
        </div>
      )}

      {hasVariants && selectedVariant && (
        <div className="flex flex-col gap-sm">
          <span className="text-label-sm font-label-sm uppercase tracking-widest text-on-surface-variant">
            Color Variant
          </span>
          <VariantSwatches
            variants={product.variants}
            selectedVariant={selectedVariant}
            onSelectVariant={setSelectedVariant}
          />
        </div>
      )}

      <AddToCartCta variantId={selectedVariant?.id ?? null} />

      <DetailsAccordion items={accordionItems} />
    </div>
  );
}
