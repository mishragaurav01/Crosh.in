"use client";

import { useEffect, useState } from "react";

const TESTIMONIALS = [
  {
    text: "The bouquet I ordered for my mother's birthday was absolutely stunning. She couldn't believe it was made of yarn!",
    author: "Sarah M.",
  },
  {
    text: "I bought a bouquet for my anniversary, and my wife was speechless. The quality is so much better than the photos suggest. It's truly art.",
    author: "Ananya R., Mumbai",
  },
  {
    text: "The perfect sustainable gift. I've had my crochet lavender for 6 months and it still brings a smile to my face every single morning.",
    author: "Karan S., Bangalore",
  },
];

/**
 * Testimonial section — responsive layout:
 * - Mobile: Simple quote card with pagination dots
 * - Desktop: Two-column with stars + cycling testimonial with fade animation
 */
export default function TestimonialCard() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIdx((prev) => (prev + 1) % TESTIMONIALS.length);
        setIsVisible(true);
      }, 500);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const testimonial = TESTIMONIALS[currentIdx];

  return (
    <section aria-label="Testimonials">
      {/* ─── Mobile Layout ─── */}
      <div className="md:hidden mx-container-margin">
        <div className="bg-surface-container-lowest rounded-3xl px-xl py-[33px] soft-shadow text-center">
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-primary-fixed-dim text-4xl mb-md"
          >
            format_quote
          </span>

          <blockquote
            className="font-body-lg text-body-lg italic text-on-surface mb-lg transition-all duration-500"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? "translateY(0)" : "translateY(10px)",
            }}
          >
            &ldquo;{testimonial.text}&rdquo;
          </blockquote>
          <p
            className="font-label-md text-label-md text-primary transition-opacity duration-500"
            style={{ opacity: isVisible ? 1 : 0 }}
          >
            — {testimonial.author}
          </p>

          <div className="flex justify-center gap-xs mt-lg" aria-hidden="true">
            {TESTIMONIALS.map((_, i) => (
              <span
                key={i}
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${i === currentIdx
                    ? "bg-primary"
                    : "bg-surface-container-highest"
                  }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ─── Desktop Layout ─── */}
      <div className="hidden md:block bg-surface-container py-xxl overflow-hidden">
        <div className="max-w-[1280px] mx-auto px-lg">
          <div className="grid grid-cols-2 gap-xxl items-center">
            <div>
              <span className="text-primary font-label-md text-label-md uppercase mb-sm block">
                Kind Words
              </span>
              <h2 className="font-headline-md text-headline-md text-on-surface mb-lg">
                From our community
              </h2>
              <div className="flex gap-sm mb-xl">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className="material-symbols-outlined text-primary"
                    style={{
                      fontVariationSettings: '"FILL" 1',
                    }}
                  >
                    star
                  </span>
                ))}
              </div>
            </div>

            <div className="relative h-64">
              <div
                className="transition-all duration-500"
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? "translateY(0)" : "translateY(10px)",
                }}
              >
                <blockquote className="font-headline-sm text-headline-sm italic text-on-surface-variant mb-lg leading-snug">
                  &ldquo;{testimonial.text}&rdquo;
                </blockquote>
                <div className="flex items-center gap-md">
                  <div className="w-10 h-10 rounded-full bg-primary-container" />
                  <p className="text-label-md font-label-md text-primary">
                    — {testimonial.author}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
