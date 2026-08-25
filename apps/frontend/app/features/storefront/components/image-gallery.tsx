"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { ProductImageDto } from "../types";

interface ImageGalleryProps {
  images: ProductImageDto[];
  productName: string;
}

/**
 * Full-bleed swipeable gallery (487px mobile) with elongated-active pagination
 * dots overlay, per design-notes. Scroll-snap provides the swipe; onScroll
 * tracks the active index for the dots.
 */
export default function ImageGallery({
  images,
  productName,
}: ImageGalleryProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  function handleScroll() {
    const track = trackRef.current;
    if (!track) return;
    const slideWidth = track.clientWidth;
    if (slideWidth === 0) return;
    setActiveIndex(Math.round(track.scrollLeft / slideWidth));
  }

  function goToSlide(index: number) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: index * track.clientWidth, behavior: "smooth" });
  }

  const mainImage = images.length > 0 ? images[activeIndex] : null;

  if (images.length === 0) {
    return (
      <div
        aria-hidden="true"
        className="w-full aspect-[4/5] rounded-[24px] bg-gradient-to-br from-surface-container to-outline-variant/60 shadow-[0_20px_40px_-20px_rgba(86,97,91,0.12)]"
      />
    );
  }

  return (
    <div className="flex flex-col gap-md">
      {/* Mobile Swipe / Desktop Hero */}
      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="relative aspect-[4/5] w-full rounded-[24px] overflow-hidden bg-surface-container-low shadow-[0_20px_40px_-20px_rgba(86,97,91,0.12)] md:flex-none flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
        aria-label={`${productName} images`}
      >
        {/* Desktop: Render only the active main image (controlled via state from thumbnails) 
            Mobile: Render all images in a swipeable track */}
        <div className="hidden md:block absolute inset-0">
          {mainImage && (
            <Image
              priority
              src={mainImage.url}
              alt={mainImage.alt ?? `${productName} image`}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-transform duration-700 hover:scale-105"
            />
          )}
        </div>

        {images.map((image, index) => (
          <div
            key={`mobile-${image.url}`}
            className="md:hidden relative h-full w-full shrink-0 snap-center"
          >
            <Image
              src={image.url}
              alt={image.alt ?? `${productName} image ${index + 1}`}
              fill
              sizes="100vw"
              priority={index === 0}
              className="object-cover"
            />
          </div>
        ))}

        {/* Mobile Pagination Dots */}
        {images.length > 1 && (
          <div className="md:hidden pointer-events-none absolute inset-x-0 bottom-6 flex justify-center gap-2">
            {images.map((image, index) => (
              <button
                key={`dot-${image.url}`}
                type="button"
                onClick={() => goToSlide(index)}
                aria-label={`Go to image ${index + 1}`}
                aria-current={activeIndex === index}
                className={`pointer-events-auto h-2 rounded-full transition-all duration-200 ${activeIndex === index
                    ? "w-6 bg-primary"
                    : "w-2 bg-white/40 hover:bg-white/60"
                  }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Desktop Grid Thumbnails */}
      {images.length > 1 && (
        <div className="hidden md:grid grid-cols-4 gap-md mt-md">
          {images.map((image, index) => (
            <button
              type="button"
              key={`thumb-${image.url}`}
              onClick={() => setActiveIndex(index)}
              className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-opacity duration-300 ${activeIndex === index
                  ? "border-2 border-primary opacity-100"
                  : "opacity-60 hover:opacity-100"
                }`}
            >
              <Image
                src={image.url}
                alt={`Thumbnail ${index + 1}`}
                fill
                sizes="15vw"
                className="object-cover"
              />
              {/* Optional: Add video play icon here if supported in future */}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
