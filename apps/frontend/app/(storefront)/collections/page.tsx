import Link from "next/link";
import type { Metadata } from "next";
import { api, PaginatedData } from "@/lib/api";
import type { CollectionListItemDto } from "@/app/features/storefront/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Collections | Crosh.in",
};

/**
 * No delivered frame exists for the collections index — token-consistent
 * adaptation reusing the circular-thumbnail treatment from the Home rail.
 * Recorded in design-notes as "desktop/mobile: adapted, not designed".
 */
export default async function CollectionsPage() {
  const collections = await api.get<PaginatedData<CollectionListItemDto>>(
    "/api/collections",
    { page: 1, limit: 100 },
  );

  return (
    <div className="pt-md pb-32">
      <h1 className="px-container-margin font-playfair text-[32px] leading-[38px] font-semibold text-on-background">
        Collections
      </h1>

      {collections.data.length === 0 ? (
        <div className="flex flex-col items-center gap-md px-container-margin py-xxl text-center">
          <p className="font-body-md text-body-md text-on-surface-variant">
            No collections yet — check back soon.
          </p>
          <Link
            href="/products"
            className="rounded-full border border-secondary px-lg py-sm font-body-md text-body-md text-secondary transition-colors hover:bg-surface-container-low"
          >
            Browse all products
          </Link>
        </div>
      ) : (
        <ul className="mt-xl grid grid-cols-2 gap-y-xl px-container-margin">
          {collections.data.map((collection) => (
            <li key={collection.id}>
              <Link href={`/collections/${collection.slug}`} className="flex flex-col items-center">
                {/* Collection DTOs carry no image field (flagged gap) — neutral
                    gradient circle until a source exists. */}
                <span
                  aria-hidden="true"
                  className="h-[140px] w-[140px] rounded-full ring-4 ring-surface-container-high bg-gradient-to-br from-surface-container to-outline-variant/70"
                />
                <p className="mt-sm text-center font-body-md text-body-md text-on-background">
                  {collection.name}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
