import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format-price";
import type { ProductListItemDto } from "../types";

interface ProductCardProps {
  product: ProductListItemDto;
  imageSizes?: string;
}

/**
 * Product card — responsive behavior:
 * - Mobile: Simple card with image, name, price, and decorative heart
 * - Desktop: Adds hover interactions — Quick Add button slides up, favorite fades in
 */
export default function ProductCard({
  product,
  imageSizes = "(max-width: 768px) 50vw, 25vw",
}: ProductCardProps) {
  const image = product.images[0];

  return (
    <div className="w-full group cursor-pointer">
      <div className="relative aspect-[4/5] rounded-[24px] overflow-hidden mb-md shadow-[0_20px_20px_rgba(0,0,0,0.04)] bg-surface-container-low transition-transform duration-500 group-hover:scale-[1.02]">
        <Link href={`/products/${product.slug}`} className="absolute inset-0 z-10 block" aria-label={`View ${product.name}`} />
        {image ? (
          <Image
            src={image.url}
            alt={image.alt ?? product.name}
            fill
            sizes={imageSizes}
            className="object-cover group-hover:brightness-95 transition-all duration-300"
          />
        ) : (
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-br from-surface-container to-outline-variant/60"
          />
        )}

        {/* Wishlist heart — decorative (shows always on mobile, top right) */}
        <button
          aria-hidden="true"
          className="absolute top-lg right-lg w-10 h-10 rounded-full bg-surface-bright/80 backdrop-blur-sm flex items-center justify-center text-primary hover:text-error transition-colors shadow-sm z-20"
        >
          <span className="material-symbols-outlined text-[20px]">
            favorite
          </span>
        </button>

        {/* Quick View — desktop only, slides up on hover */}
        <div className="hidden md:block absolute bottom-lg left-1/2 -translate-x-1/2 opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 w-[80%] z-20 pointer-events-none">
          <span className="block w-full py-md bg-surface-bright/90 backdrop-blur-md rounded-full text-center text-label-md font-label-md text-primary border border-primary/10 shadow-lg group-hover:pointer-events-auto cursor-pointer hover:bg-primary hover:text-on-primary transition-all">
            Quick View
          </span>
        </div>
      </div>

      <div className="space-y-xs px-xs">
        <h3 className="text-headline-sm font-headline-sm text-on-surface group-hover:text-primary transition-colors line-clamp-1">
          <Link href={`/products/${product.slug}`}>{product.name}</Link>
        </h3>

        <div className="flex justify-between items-center">
          {product.priceMin !== null && (
            <span className="text-body-md font-medium text-on-surface-variant">
              {formatPrice(product.priceMin)}
            </span>
          )}
          {/* Decorative tag, e.g. "In Stock" or "New" */}
          <span className="text-label-sm text-secondary uppercase tracking-widest font-bold">
            {product.priceMin !== null && product.priceMin > 100 ? "Limited" : "In Stock"}
          </span>
        </div>
      </div>
    </div>
  );
}
