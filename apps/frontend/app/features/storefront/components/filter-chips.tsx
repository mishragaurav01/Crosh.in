"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { CategoryListItemDto } from "../types";

interface FilterChipsProps {
  categories: CategoryListItemDto[];
  activeCategory?: string;
}

const CHIP_BASE =
  "inline-flex h-[42px] shrink-0 items-center rounded-full border px-md font-body-md text-body-md transition-colors duration-200";

function chipClasses(isActive: boolean): string {
  return isActive
    ? `${CHIP_BASE} bg-primary-container border-primary/10 text-on-primary-container`
    : `${CHIP_BASE} bg-surface-container border-outline-variant text-on-surface-variant hover:border-primary/30`;
}

export default function FilterChips({
  categories,
  activeCategory,
}: FilterChipsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function selectCategory(slug: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (slug === null) {
      params.delete("category");
    } else {
      params.set("category", slug);
    }
    // Category switches reset pagination — page N of another filter is a
    // different result set.
    params.delete("page");

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <div className="flex gap-sm overflow-x-auto pt-sm" role="group" aria-label="Filter by category">
      <button
        type="button"
        onClick={() => selectCategory(null)}
        aria-pressed={activeCategory === undefined}
        className={chipClasses(activeCategory === undefined)}
      >
        All
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() =>
            selectCategory(
              activeCategory === category.slug ? null : category.slug,
            )
          }
          aria-pressed={activeCategory === category.slug}
          className={chipClasses(activeCategory === category.slug)}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}
