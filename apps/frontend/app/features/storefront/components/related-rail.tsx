import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/format-price";
import type { ProductListItemDto } from "../types";

interface RelatedRailProps {
  products: ProductListItemDto[];
}

/**
 * "You might also love" rail — same-category products excluding the current
 * one (Integration Gap default). Cards 256px wide, image 320 tall.
 */
export default function RelatedRail({ products }: RelatedRailProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section aria-label="You might also love" className="mt-xl">
      <h2 className="px-container-margin font-playfair text-[16px] leading-[24px] text-on-background">
        You might also love
      </h2>

      <ul className="mt-md flex gap-gutter overflow-x-auto px-container-margin pb-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {products.map((product) => {
          const image = product.images[0];
          return (
            <li key={product.id} className="w-64 shrink-0">
              <Link href={`/products/${product.slug}`} className="group block">
                <div className="relative h-80 w-full overflow-hidden rounded-3xl bg-surface-container-low">
                  {image ? (
                    <Image
                      src={image.url}
                      alt={image.alt ?? product.name}
                      fill
                      sizes="256px"
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-br from-surface-container to-outline-variant/60"
                    />
                  )}
                </div>
                <h3 className="mt-sm truncate font-inter text-[14px] leading-[20px] font-medium tracking-[0.7px] text-on-background">
                  {product.name}
                </h3>
                {product.priceMin !== null && (
                  <p className="text-[16px] leading-[26px] font-inter text-secondary">
                    {formatPrice(product.priceMin)}
                  </p>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
