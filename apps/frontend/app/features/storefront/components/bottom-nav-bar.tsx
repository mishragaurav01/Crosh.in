"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import CartBadge from "@/app/features/cart/components/cart-badge";

const NAV_ITEMS = [
  { label: "Home", href: "/", icon: "home" },
  { label: "Shop", href: "/products", icon: "grid_view" },
  { label: "Account", href: "/features/identity/login", icon: "person" },
  { label: "Cart", href: "/cart", icon: "shopping_cart" },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Bottom navigation bar — mobile only.
 * Updated icons to match the design spec (grid_view for Shop, shopping_cart for Cart).
 */
export default function BottomNavBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-surface rounded-t-xl shadow-bottom-nav"
    >
      <ul className="flex h-16 items-center justify-around px-sm">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.label}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex flex-col items-center gap-[2px] px-md py-xs rounded-full transition-all duration-300 active:scale-90 ${active
                    ? "bg-primary-container text-on-primary-container"
                    : "text-on-surface-variant hover:bg-surface-container-high"
                  }`}
              >
                <span className="relative">
                  <span
                    className="material-symbols-outlined text-base"
                    style={
                      active
                        ? { fontVariationSettings: '"FILL" 1' }
                        : undefined
                    }
                  >
                    {item.icon}
                  </span>
                  {item.label === "Cart" && <CartBadge />}
                </span>
                <span className="font-label-sm text-label-sm">
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
