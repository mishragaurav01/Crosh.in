"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/lib/auth-context";
import type { CartDto } from "./types";
import {
  addCartItem,
  clearCart,
  getCart,
  removeCartItem,
  setCartItemQty,
} from "./api";

type CartStatus = "loading" | "ready" | "error";

interface CartContextValue {
  cart: CartDto | null;
  status: CartStatus;
  /** Transient stale-UI notice (CART_ITEM_NOT_FOUND → refetched). */
  notice: string | null;
  refresh: () => Promise<void>;
  addItem: (variantId: string) => Promise<void>;
  /** delta-based; PATCHes the serialized absolute target (0 removes). */
  stepItemQuantity: (itemId: string, delta: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearItems: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

const STALE_NOTICE =
  "Your bag was out of date — we refreshed it for you.";

function getErrorCode(error: unknown): string {
  return (error as { code?: string }).code ?? "UNKNOWN_ERROR";
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartDto | null>(null);
  const [status, setStatus] = useState<CartStatus>("loading");
  const [notice, setNotice] = useState<string | null>(null);

  const mountedRef = useRef(true);
  const cartRef = useRef<CartDto | null>(null);
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // All mutations flow through one queue so rapid steppers resolve in click
  // order and each response reflects every write before it.
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  // Absolute target of queued/in-flight qty writes per line, so a second
  // click during flight computes from the newest intended value (last wins).
  const pendingQtyRef = useRef<Map<string, number>>(new Map());

  const { user } = useAuth();
  const authUserId = user?.id ?? null;
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  const showNotice = useCallback((message: string) => {
    setNotice(message);
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = setTimeout(() => setNotice(null), 6000);
  }, []);

  const applyDto = useCallback((dto: CartDto) => {
    if (!mountedRef.current) return;
    setCart(dto);
    setStatus("ready");
  }, []);

  const refresh = useCallback(async () => {
    try {
      const dto = await getCart();
      applyDto(dto);
    } catch {
      if (mountedRef.current) setStatus("error");
    }
  }, [applyDto]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Merge-on-login pickup: after identity changes the next fetch resolves
  // the merged server-side. Guests never change identity → no extra fetch.
  useEffect(() => {
    if (prevUserIdRef.current === undefined) {
      prevUserIdRef.current = authUserId;
      return;
    }
    if (prevUserIdRef.current !== authUserId) {
      prevUserIdRef.current = authUserId;
      void refresh();
    }
  }, [authUserId, refresh]);

  const enqueue = useCallback((task: () => Promise<void>): Promise<void> => {
    const next = queueRef.current.then(task, task);
    queueRef.current = next.catch(() => {});
    return next;
  }, []);

  /**
   * Shared mutation error mapping (contract clause 6):
   * - CART_ITEM_NOT_FOUND → stale UI: refetch + transient notice, swallowed.
   * - INSUFFICIENT_STOCK → refetch (no DTO on error responses), rethrown so
   *   the control shows its inline message.
   * - anything else → rethrown for an explicit error state upstream.
   */
  const runMutation = useCallback(
    async (mutation: () => Promise<CartDto>): Promise<void> => {
      try {
        applyDto(await mutation());
      } catch (error) {
        const code = getErrorCode(error);
        if (code === "CART_ITEM_NOT_FOUND") {
          showNotice(STALE_NOTICE);
          void refresh();
          return;
        }
        if (code === "INSUFFICIENT_STOCK") {
          void refresh();
        }
        throw error;
      }
    },
    [applyDto, refresh, showNotice],
  );

  const addItem = useCallback(
    (variantId: string): Promise<void> =>
      enqueue(() => runMutation(() => addCartItem(variantId))),
    [enqueue, runMutation],
  );

  const stepItemQuantity = useCallback(
    (itemId: string, delta: number): Promise<void> => {
      const base =
        pendingQtyRef.current.get(itemId) ??
        cartRef.current?.items.find((item) => item.id === itemId)?.quantity;
      if (base === undefined) return Promise.resolve();

      const target = Math.max(0, base + delta);
      pendingQtyRef.current.set(itemId, target);

      return enqueue(async () => {
        try {
          await runMutation(() => setCartItemQty(itemId, target));
        } finally {
          if (pendingQtyRef.current.get(itemId) === target) {
            pendingQtyRef.current.delete(itemId);
          }
        }
      });
    },
    [enqueue, runMutation],
  );

  const removeItem = useCallback(
    (itemId: string): Promise<void> =>
      enqueue(() => runMutation(() => removeCartItem(itemId))),
    [enqueue, runMutation],
  );

  const clearItems = useCallback(
    (): Promise<void> => enqueue(() => runMutation(() => clearCart())),
    [enqueue, runMutation],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      status,
      notice,
      refresh,
      addItem,
      stepItemQuantity,
      removeItem,
      clearItems,
    }),
    [
      cart,
      status,
      notice,
      refresh,
      addItem,
      stepItemQuantity,
      removeItem,
      clearItems,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
