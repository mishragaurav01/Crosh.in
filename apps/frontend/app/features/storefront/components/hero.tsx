import Link from "next/link";

/**
 * Hero section — responsive layout:
 * - Mobile: Full-width rounded card with gradient overlay and bottom-aligned text
 * - Desktop: 12-column grid with editorial text on the left, hero image on the right
 *
 * Hero visual uses a gradient placeholder — swap for next/image when asset lands.
 */
export default function Hero() {
  return (
    <section aria-label="Featured">
      {/* ─── Mobile Hero ─── */}
      <div className="md:hidden mx-container-margin">
        <div className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden soft-shadow">
          {/* Gradient placeholder for hero image */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-br from-surface-container-high via-outline-variant/70 to-secondary-fixed-dim"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent z-10"
          />

          <div className="absolute bottom-0 left-0 right-0 p-lg z-20 text-white">
            <h1 className="font-display-lg-mobile text-display-lg-mobile mb-md drop-shadow-sm">
              Handcrafted Blooms for Every Moment
            </h1>
            <Link
              href="/products"
              className="inline-block bg-primary-fixed text-primary px-xl py-md rounded-full text-label-md font-label-md transition-all duration-300 active:scale-95 hover:opacity-90"
            >
              Shop Now
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Desktop Hero ─── */}
      <div className="hidden md:block max-w-[1280px] mx-auto px-lg mt-md mb-xxl">
        <div className="grid grid-cols-12 gap-lg items-center">
          {/* Text Column */}
          <div className="col-span-5 flex flex-col justify-center">
            <span className="text-primary font-label-md text-label-md tracking-widest uppercase mb-sm">
              Artisanal Crochet Boutique
            </span>
            <h1 className="font-display-lg text-display-lg text-on-surface mb-lg">
              Handcrafted Blooms for Every Moment
            </h1>
            <p className="text-body-lg font-body-lg text-on-surface-variant mb-xl max-w-[28rem]">
              Meticulously looped by hand, our crochet creations offer a timeless
              warmth that fresh flowers can&apos;t capture. Sustainable, soft, and
              eternally beautiful.
            </p>
            <div className="flex gap-md">
              <Link
                href="/products"
                className="bg-primary text-on-primary px-xxl py-md rounded-full font-label-md text-label-md hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
              >
                Shop Collection
              </Link>
              <Link
                href="/#brand-story"
                className="border border-secondary text-secondary px-xxl py-md rounded-full font-label-md text-label-md hover:bg-secondary/5 transition-all"
              >
                Our Story
              </Link>
            </div>
          </div>

          {/* Image Column */}
          <div className="col-span-7">
            <div className="relative rounded-[40px] overflow-hidden aspect-[6/5] shadow-2xl">
              {/* Gradient placeholder */}
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-br from-surface-container-high via-outline-variant/70 to-secondary-fixed-dim"
              />

              {/* Sustainability badge */}
              <div className="absolute bottom-lg right-lg glass-card p-md rounded-xl flex items-center gap-md z-10">
                <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">eco</span>
                </div>
                <div>
                  <p className="text-label-sm font-label-sm text-on-surface">
                    100% Sustainable
                  </p>
                  <p className="text-[10px] text-on-surface-variant">
                    Organic Cotton Thread
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
