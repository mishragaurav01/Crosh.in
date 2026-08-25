"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "@/app/features/cart/cart-context";

interface AddToCartCtaProps {
  /** Selected variant id; null keeps the CTA disabled (no selectable choice yet). */
  variantId: string | null;
}

type CtaStatus =
  | { state: "idle" }
  | { state: "adding" }
  | { state: "added" }
  | { state: "error"; message: string };

export default function AddToCartCta({ variantId }: AddToCartCtaProps) {
  const { addItem } = useCart();
  const [status, setStatus] = useState<CtaStatus>({ state: "idle" });
  const addedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (addedTimerRef.current) {
        clearTimeout(addedTimerRef.current);
      }
    };
  }, []);

  async function handleAdd() {
    if (!variantId || status.state === "adding") return;

    setStatus({ state: "adding" });

    try {
      // Mutations resolve with the refreshed cart DTO applied by the cart
      // provider — the bottom-nav badge updates without a refetch round trip.
      await addItem(variantId);
      setStatus({ state: "added" });
      addedTimerRef.current = setTimeout(
        () => setStatus({ state: "idle" }),
        2500,
      );
    } catch (error) {
      const code = (error as { code?: string }).code ?? "UNKNOWN_ERROR";
      const message = (error as { message?: string }).message;
      setStatus({
        state: "error",
        message:
          code === "INSUFFICIENT_STOCK"
            ? "This item is out of stock right now."
            : message || "Could not add to cart. Please try again.",
      });
    }
  }

  const disabled = !variantId || status.state === "adding";

  return (
    <div className="flex flex-col gap-md pt-md">
      <div className="flex gap-md">
        <div className="flex items-center border border-outline-variant rounded-xl px-sm">
          <button className="p-sm text-on-surface-variant hover:text-primary"><span className="material-symbols-outlined">remove</span></button>
          <span className="px-md font-label-md">1</span>
          <button className="p-sm text-on-surface-variant hover:text-primary"><span className="material-symbols-outlined">add</span></button>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={disabled}
          className="flex-1 bg-primary text-on-primary font-label-md py-md rounded-xl hover:bg-on-surface-variant transition-all duration-300 shadow-lg hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status.state === "adding"
            ? "Adding…"
            : status.state === "added"
              ? "Added to Bag ✓"
              : "Add to Cart"}
        </button>
      </div>

      <button className="w-full flex items-center justify-center gap-sm border border-secondary text-secondary py-md rounded-xl hover:bg-secondary/5 transition-all outline-none">
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>favorite</span>
        <span className="font-label-md">Save to Favorites</span>
      </button>

      {status.state === "error" && (
        <p role="alert" className="mt-sm font-label-md text-error">
          {status.message}
        </p>
      )}
    </div>
  );
}
