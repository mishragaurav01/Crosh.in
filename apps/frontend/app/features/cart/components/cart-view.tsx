"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import SegmentError from "@/app/features/storefront/components/segment-error";
import { useCart } from "../cart-context";
import CartLine from "./cart-line";
import CartSkeleton from "./cart-skeleton";
import CartSummary from "./cart-summary";

export default function CartView() {
  const { cart, status, notice, refresh, stepItemQuantity, removeItem, clearItems } =
    useCart();
  const [actionError, setActionError] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  const handleStep = useCallback(
    (itemId: string, delta: number) => {
      setActionError(null);
      return stepItemQuantity(itemId, delta).catch((error) => {
        // INSUFFICIENT_STOCK renders inline at the control (contract 6).
        if ((error as { code?: string }).code !== "INSUFFICIENT_STOCK") {
          setActionError(
            (error as { message?: string }).message ||
            "Couldn't update your cart. Please try again.",
          );
        }
      });
    },
    [stepItemQuantity],
  );

  const handleRemove = useCallback(
    (itemId: string) => {
      setActionError(null);
      return removeItem(itemId).catch((error) => {
        setActionError(
          (error as { message?: string }).message ||
          "Couldn't update your cart. Please try again.",
        );
      });
    },
    [removeItem],
  );

  const handleClear = useCallback(() => {
    if (!window.confirm("Remove everything from your cart?")) return;
    setActionError(null);
    setClearing(true);
    clearItems()
      .catch((error) => {
        setActionError(
          (error as { message?: string }).message ||
          "Couldn't clear your cart. Please try again.",
        );
      })
      .finally(() => setClearing(false));
  }, [clearItems]);

  if (status === "loading") {
    return <CartSkeleton />;
  }

  if (status === "error" || !cart) {
    return (
      <SegmentError
        title="Couldn't load your cart"
        reset={() => {
          void refresh();
        }}
      />
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-md px-container-margin py-xxl text-center min-h-[50vh]">
        <span aria-hidden="true" className="material-symbols-outlined text-primary text-[40px]">
          shopping_bag
        </span>
        <h1 className="font-headline-sm text-headline-sm text-primary">
          Your cart is empty
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-[20rem]">
          Looks like you haven&apos;t added anything yet.
        </p>
        <Link
          href="/products"
          className="rounded-full border border-secondary px-lg py-sm font-body-md text-body-md text-secondary transition-colors hover:bg-surface-container-low"
        >
          Continue browsing
        </Link>
      </div>
    );
  }

  return (
    <main className="max-w-[1280px] mx-auto px-lg py-xxl">
      {/* Page Header */}
      <div className="mb-xxl">
        <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg text-on-surface mb-sm">
          Your Cart
        </h1>
        <p className="text-on-surface-variant font-body-lg text-body-lg">
          Review your handcrafted selections.
        </p>
      </div>

      {notice && (
        <p
          role="status"
          className="mb-lg px-md py-sm rounded-lg bg-secondary-container text-on-secondary-container font-label-md text-label-md"
        >
          {notice}
        </p>
      )}
      {actionError && (
        <p
          role="alert"
          className="mb-lg px-md py-sm rounded-lg bg-error-container text-on-error-container font-label-md text-label-md"
        >
          {actionError}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-xxl items-start">
        {/* Left Column: Line Items */}
        <div className="lg:col-span-8 space-y-lg">
          {cart.items.map((item) => (
            <CartLine
              key={item.id}
              item={item}
              onStep={handleStep}
              onRemove={handleRemove}
            />
          ))}
        </div>

        {/* Right Column: Summary */}
        <div className="lg:col-span-4 self-start lg:sticky lg:top-32">
          {/* Server-computed field — never summed client-side. */}
          <CartSummary subtotal={cart.subtotal} clearing={clearing} onClear={handleClear} />
        </div>
      </div>
    </main>
  );
}
