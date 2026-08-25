"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const NAV_LINKS = [
  { label: "Shop", href: "/products" },
  { label: "Collections", href: "/collections" },
  { label: "Contact", href: "/#contact" },
  { label: "Our Story", href: "/#brand-story" },
] as const;

export default function TopAppBar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled ? "bg-background/95 backdrop-blur-md shadow-sm" : "bg-background"
      }`}
    >
      {/* ─── Mobile Header ─── */}
      <div className="flex items-center justify-between px-container-margin py-sm md:hidden">
        <span
          aria-hidden="true"
          className="material-symbols-outlined text-primary cursor-pointer"
        >
          search
        </span>

        <Link
          href="/"
          className="font-playfair text-headline-md tracking-tight text-primary"
        >
          Crosh.in
        </Link>

        <Link
          href="/cart"
          aria-label="Cart"
          className="material-symbols-outlined text-primary hover:opacity-70 transition-opacity"
        >
          shopping_bag
        </Link>
      </div>

      {/* ─── Desktop Header ─── */}
      <nav className="hidden md:flex items-center justify-between px-lg py-md max-w-[1280px] mx-auto">
        <div className="flex items-center gap-xl">
          <Link
            href="/"
            className="font-playfair text-headline-md font-semibold tracking-tight text-primary"
          >
            Crosh.in
          </Link>

        </div>

        <div className="flex items-center gap-lg">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-on-surface-variant font-label-md text-label-md font-medium pb-1 hover:text-primary transition-colors duration-300"
              >
                {link.label}
              </Link>
            ))}
        </div>

        <div className="flex items-center gap-md">
          <button
            type="button"
            className="p-2 text-primary hover:bg-primary-container/20 rounded-full transition-all"
            aria-label="Favorites"
          >
            <span className="material-symbols-outlined">favorite</span>
          </button>
          <Link
            href="/cart"
            aria-label="Cart"
            className="relative p-2 text-primary hover:bg-primary-container/20 rounded-full transition-all"
          >
            <span className="material-symbols-outlined">shopping_bag</span>
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
          </Link>
        </div>
      </nav>
    </header>
  );
}
