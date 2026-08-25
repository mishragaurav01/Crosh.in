"use client";

import { swatchHexForColorName } from "../swatch-colors";
import type { VariantPublicDto } from "../types";

interface VariantSwatchesProps {
  variants: VariantPublicDto[];
  selectedVariant: VariantPublicDto;
  onSelectVariant: (variant: VariantPublicDto) => void;
}

const SECTION_LABEL_CLASSES =
  "text-[12px] leading-[17px] font-semibold tracking-[0.6px] uppercase text-on-background";

const SWATCH_LABEL_CLASSES =
  "mt-xs text-center text-[12px] leading-[17px] font-semibold";

const SELECTED_RING =
  "shadow-[0_0_0_2px_var(--color-surface-container-lowest),0_0_0_4px_var(--color-primary)]";
const UNSELECTED_RING = "shadow-[0_0_0_2px_var(--color-surface-container-lowest),0_0_0_1px_var(--color-outline-variant)]";

function uniqueBy<T>(items: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const value = key(item);
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

export default function VariantSwatches({
  variants,
  selectedVariant,
  onSelectVariant,
}: VariantSwatchesProps) {
  const colors = uniqueBy(variants, (variant) => variant.color);
  const sizesForSelectedColor = variants.filter(
    (variant) => variant.color === selectedVariant.color,
  );

  function selectColor(color: string) {
    const candidates = variants.filter((variant) => variant.color === color);
    // A color is selectable when any of its sizes is in stock; landing on the
    // first available size keeps the CTA immediately usable.
    const next =
      candidates.find(
        (variant) => variant.id === selectedVariant.id && variant.available,
      ) ?? candidates.find((variant) => variant.available) ?? candidates[0];
    if (next) {
      onSelectVariant(next);
    }
  }

  function selectSize(size: string) {
    const next = variants.find(
      (variant) =>
        variant.color === selectedVariant.color && variant.size === size,
    );
    if (next) {
      onSelectVariant(next);
    }
  }

  function renderSwatchCircle(color: string, isSelected: boolean) {
    const hex = swatchHexForColorName(color);
    if (hex) {
      return (
        <span
          aria-hidden="true"
          className={`block h-12 w-12 rounded-full ${isSelected ? SELECTED_RING : UNSELECTED_RING}`}
          style={{ backgroundColor: hex }}
        />
      );
    }
    // Unknown color name: neutral circle + initial letter (gap-table fallback).
    return (
      <span
        aria-hidden="true"
        className={`flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-high font-inter text-[14px] uppercase text-on-surface-variant ${
          isSelected ? SELECTED_RING : UNSELECTED_RING
        }`}
      >
        {color.trim().charAt(0) || "?"}
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-lg">
      <fieldset>
        <legend className={SECTION_LABEL_CLASSES}>Select Color</legend>
        <div className="mt-md flex flex-wrap gap-x-md gap-y-sm">
          {colors.map(({ color }) => {
            const isSelected = color === selectedVariant.color;
            const hasAvailableSize = variants.some(
              (variant) => variant.color === color && variant.available,
            );
            return (
              <button
                key={color}
                type="button"
                onClick={() => selectColor(color)}
                disabled={!hasAvailableSize}
                aria-pressed={isSelected}
                className={`flex w-12 flex-col items-center ${
                  hasAvailableSize
                    ? "cursor-pointer"
                    : "cursor-not-allowed opacity-60"
                }`}
              >
                {renderSwatchCircle(color, isSelected)}
                <span
                  className={`${SWATCH_LABEL_CLASSES} ${
                    isSelected ? "text-on-background" : "text-on-surface-variant"
                  }`}
                >
                  {color}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {sizesForSelectedColor.length > 1 && (
        <fieldset>
          <legend className={SECTION_LABEL_CLASSES}>Select Size</legend>
          <div className="mt-md flex flex-wrap gap-sm">
            {sizesForSelectedColor.map((variant) => {
              const isSelected = variant.id === selectedVariant.id;
              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => variant.available && selectSize(variant.size)}
                  disabled={!variant.available}
                  aria-pressed={isSelected}
                  className={`inline-flex h-[42px] items-center rounded-full border px-md font-body-md text-body-md transition-colors duration-200 ${
                    isSelected
                      ? "bg-primary-container border-primary/10 text-on-primary-container"
                      : "bg-surface-container border-outline-variant text-on-surface-variant"
                  } ${variant.available ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
                >
                  {variant.size}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}
    </div>
  );
}
