"use client";

import { formatPrice } from "@/lib/format-price";

interface CartSummaryProps {
  subtotal: number;
  clearing: boolean;
  onClear: () => void;
}

export default function CartSummary({
  subtotal,
  clearing,
  onClear,
}: CartSummaryProps) {
  return (
    <div className="bg-surface-container-low rounded-xl md:rounded-[24px] p-lg md:p-xl shadow-[0_20px_24px_-4px_rgba(0,0,0,0.04)]">
      <h2 className="font-headline-sm text-headline-sm text-on-surface mb-xl">
        Order Summary
      </h2>

      <div className="space-y-md mb-xl">
        <div className="flex justify-between items-center text-body-md text-on-surface-variant">
          <span>Subtotal</span>
          <span className="font-medium text-on-surface">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between items-center text-body-md text-on-surface-variant">
          <span>Shipping</span>
          <span className="italic">Calculated at checkout</span>
        </div>
        <div className="flex justify-between items-center text-body-md text-on-surface-variant">
          <span>Taxes</span>
          <span className="italic">Calculated at checkout</span>
        </div>
      </div>

      <div className="h-px bg-outline-variant/30 mb-xl" />

      <div className="flex justify-between items-end mb-xl">
        <span className="font-headline-sm text-headline-sm text-on-surface">Total</span>
        <div className="text-right">
          <span className="block font-headline-md text-headline-md text-primary leading-none">
            {formatPrice(subtotal)}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-sm">
        <button className="w-full bg-primary text-on-primary font-label-md py-md rounded-xl hover:bg-on-surface-variant transition-colors shadow-lg shadow-primary/20">
          Proceed to Checkout
        </button>
        <button
          type="button"
          onClick={onClear}
          disabled={clearing}
          className="w-full font-label-md py-sm text-error/80 hover:text-error hover:bg-error-container/20 rounded-lg transition-colors disabled:opacity-50 mt-sm"
        >
          {clearing ? "Clearing…" : "Empty Cart"}
        </button>
      </div>
    </div>
  );
}
