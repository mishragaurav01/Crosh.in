import Link from "next/link";
import type { CollectionListItemDto } from "../types";

interface CollectionRailProps {
  collections: CollectionListItemDto[];
}

/**
 * Featured Collections — responsive layout:
 * - Mobile: Horizontal scrolling circular thumbnails
 * - Desktop: Large centered circular cards with hover overlays
 *
 * Collections DTO carries no image field, so circles render a neutral gradient
 * placeholder until an image source exists.
 */
export default function CollectionRail({ collections }: CollectionRailProps) {
  return (
    <section aria-label="Featured collections">
      {/* ─── Mobile Layout ─── */}
      <div className="md:hidden">
        <div className="flex items-center justify-between px-container-margin mb-lg">
          <h2 className="font-headline-sm text-headline-sm text-primary">
            Collections
          </h2>
          <Link
            href="/collections"
            className="font-label-sm text-label-sm text-primary underline underline-offset-4"
          >
            View All
          </Link>
        </div>

        <ul className="flex gap-md overflow-x-auto px-container-margin no-scrollbar snap-x snap-mandatory">
          {collections.map((collection) => (
            <li key={collection.id} className="shrink-0 w-[200px] snap-start group">
              <Link href={`/collections/${collection.slug}`} className="block">
                <div className="aspect-square rounded-full overflow-hidden mb-sm border-4 border-surface-container-high transition-transform duration-500 group-hover:scale-105">
                  <div
                    aria-hidden="true"
                    className="w-full h-full bg-gradient-to-br from-surface-container to-outline-variant/70"
                  />
                </div>
                <p className="text-center font-label-md text-label-md text-on-surface">
                  {collection.name}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* ─── Desktop Layout ─── */}
      <div className="hidden md:block bg-surface-container-low py-xxl overflow-hidden">
        <div className="max-w-[1280px] mx-auto px-lg">
          <div className="text-center mb-xxl">
            <h2 className="font-headline-md text-headline-md text-primary">
              Explore Collections
            </h2>
            <div className="editorial-line w-24 mx-auto mt-md" />
          </div>

          <div className="flex flex-wrap justify-center gap-xxl">
            {collections.map((collection) => (
              <Link
                key={collection.id}
                href={`/collections/${collection.slug}`}
                className="group cursor-pointer flex flex-col items-center"
              >
                <div className="w-64 h-64 lg:w-80 lg:h-80 rounded-full overflow-hidden mb-lg shadow-xl relative">
                  <div
                    aria-hidden="true"
                    className="w-full h-full bg-gradient-to-br from-surface-container to-outline-variant/70 transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-surface px-lg py-sm rounded-full text-label-md font-label-md text-primary">
                      View More
                    </span>
                  </div>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface group-hover:text-primary transition-colors">
                  {collection.name}
                </h3>
                {collection.description && (
                  <p className="text-label-sm font-label-sm text-on-surface-variant mt-xs">
                    {collection.description}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
