import Link from "next/link";

/**
 * Brand Story section — responsive layout:
 * - Mobile: Compact centered card with placeholder image, heading, body text, outline button
 * - Desktop: Cinematic full-width card with gradient overlay and editorial text
 *
 * No brand imagery asset exists yet — both variants use gradient placeholders.
 */
export default function BrandStory() {
  return (
    <section id="brand-story" aria-label="Our brand story">
      {/* ─── Mobile Layout ─── */}
      <div className="md:hidden mx-container-margin">
        <div className="bg-surface-container-low rounded-3xl p-lg flex flex-col items-center text-center">
          {/* Placeholder visual */}
          <div className="w-full aspect-video rounded-xl overflow-hidden mb-lg">
            <div
              aria-hidden="true"
              className="w-full h-full bg-gradient-to-br from-surface-container to-outline-variant/60"
            />
          </div>

          <h2 className="font-headline-sm text-headline-sm text-primary mb-sm">
            Every stitch tells a story.
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mb-lg">
            Our blooms are slow-made with love, capturing memories that never
            fade.
          </p>
          <Link
            href="/#brand-story"
            className="border border-secondary text-secondary px-lg py-sm rounded-full font-label-md text-label-md hover:bg-secondary hover:text-white transition-colors duration-300"
          >
            Our Story
          </Link>
        </div>
      </div>

      {/* ─── Desktop Layout ─── */}
      <div className="hidden md:block max-w-[1280px] mx-auto px-lg py-xxl">
        <div className="relative rounded-[40px] overflow-hidden min-h-[500px] flex items-center shadow-2xl">
          {/* Gradient placeholder for cinematic background */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-br from-surface-container-high via-outline-variant to-secondary-fixed-dim"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />

          <div className="relative z-10 p-xxl max-w-[36rem]">
            <span className="text-primary font-label-md text-label-md tracking-[0.2em] uppercase mb-md block">
              Our Philosophy
            </span>
            <h2 className="font-display-lg text-display-lg text-on-surface mb-lg">
              Every stitch tells a story
            </h2>
            <p className="text-body-lg font-body-lg text-on-surface-variant mb-xl leading-relaxed">
              At Crosh.in, we believe in the beauty of the slow path. Our
              artisans spend hours on a single bloom, ensuring that every loop
              is perfect and every stitch carries the warmth of human touch.
            </p>
            <Link
              href="/#brand-story"
              className="group inline-flex items-center gap-md text-primary font-label-md text-label-md"
            >
              Learn about our artisans
              <span className="w-12 h-[1px] bg-primary group-hover:w-16 transition-all" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
