"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format-price";
import type { CartItemDto } from "../types";

interface CartLineProps {
  item: CartItemDto;
  onStep: (itemId: string, delta: number) => Promise<void>;
  onRemove: (itemId: string) => Promise<void>;
}

export default function CartLine({ item, onStep, onRemove }: CartLineProps) {
  const [stockMessage, setStockMessage] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

  function step(delta: number) {
    setStockMessage(null);
    void onStep(item.id, delta).catch((error) => {
      if ((error as { code?: string }).code === "INSUFFICIENT_STOCK") {
        setStockMessage("Not enough stock available.");
        return;
      }
      // Other failures surface at page level (CartView catches the same
      // promise); nothing more to show here.
    });
  }

  function remove() {
    setRemoving(true);
    void onRemove(item.id)
      .catch(() => {
        // Page level banner covers unexpected failures; stop the spinner.
      })
      .finally(() => setRemoving(false));
  }

  return (
    <div className="flex gap-lg p-md md:p-lg bg-surface-container-low rounded-xl md:rounded-[24px] transition-all duration-300 shadow-[0_20px_24px_-4px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(112,89,89,0.04)] group">
      <Link
        href={`/products/${item.productSlug}`}
        aria-label={item.productName}
        className="relative block w-24 h-24 md:w-32 md:h-40 shrink-0 rounded-xl overflow-hidden bg-surface-container-highest"
      >
        {item.image ? (
          <Image
            src={item.image.url}
            alt={item.image.alt ?? item.productName}
            fill
            sizes="(max-width: 768px) 96px, 128px"
            className={`object-cover group-hover:scale-105 transition-transform duration-500 ${item.available ? "" : "opacity-60"}`}
          />
        ) : (
          <div
            aria-hidden="true"
            className={`absolute inset-0 bg-gradient-to-br from-surface-container to-outline-variant/60 ${item.available ? "" : "opacity-60"}`}
          />
        )}
      </Link>

      <div className="flex-1 flex flex-col justify-between">
        <div className="flex items-start justify-between gap-sm">
          <div>
            <h3 className="font-headline-sm text-label-md md:text-headline-sm text-on-surface leading-tight mb-xs">
              <Link
                href={`/products/${item.productSlug}`}
                className="hover:text-primary transition-colors"
              >
                {item.productName}
              </Link>
            </h3>
            <p className="text-label-md font-label-md text-secondary uppercase tracking-widest mt-xs mb-[2px]">
              {item.size} • {item.color}
            </p>
            {!item.available && (
              <p className="mt-[2px] font-label-md text-[14px] leading-[20px] font-medium tracking-[0.7px] text-on-surface-variant opacity-60">
                Out of Stock
              </p>
            )}
            {stockMessage && (
              <p role="alert" className="mt-[2px] font-label-md text-label-md text-error">
                {stockMessage}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={remove}
            disabled={removing}
            aria-label={`Remove ${item.productName} from cart`}
            className="text-on-surface-variant hover:text-error transition-colors p-sm disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[20px]">delete</span>
          </button>
        </div>

        <div className="flex justify-between items-end mt-sm">
          <div className="flex items-center gap-sm bg-surface rounded-full px-sm py-xs md:gap-md border border-outline-variant/30">
            <button
              type="button"
              onClick={() => step(-1)}
              disabled={!item.available}
              aria-label={`Decrease quantity of ${item.productName} (removes at zero)`}
              className="flex items-center justify-center w-6 h-6 md:w-8 md:h-8 hover:bg-secondary-container rounded-full text-primary transition-colors active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[18px] md:text-sm">remove</span>
            </button>
            <span
              aria-live="polite"
              className="min-w-[16px] text-center font-label-md text-label-md md:w-4"
            >
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => step(1)}
              disabled={!item.available}
              aria-label={`Increase quantity of ${item.productName}`}
              className="flex items-center justify-center w-6 h-6 md:w-8 md:h-8 hover:bg-secondary-container rounded-full text-primary transition-colors active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[18px] md:text-sm">add</span>
            </button>
          </div>
          <span className="font-headline-sm text-body-md md:text-headline-sm text-primary">
            {formatPrice(item.price * item.quantity)}
          </span>
        </div>
      </div>
    </div>
  );
}
