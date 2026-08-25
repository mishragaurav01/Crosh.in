"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Footer — responsive layout:
 * - Mobile: Simple centered footer with logo, links, and copyright
 * - Desktop: 4-column grid with logo/description, Shop links, Support links, Connect icons
 *
 * Catalog pages (products/collections) use the R1 footer variant with rounded top.
 */
export default function Footer() {
  const pathname = usePathname();
  const isCatalog =
    pathname.startsWith("/products") || pathname.startsWith("/collections");

  return (
    <footer
      className={`bg-surface-container-low pb-24 md:pb-lg ${isCatalog ? "rounded-t-4xl pt-[47px]" : "pt-lg"
        }`}
    >
      {/* ─── Mobile Footer ─── */}
      <div className="md:hidden px-container-margin py-xl flex flex-col items-center text-center space-y-lg">
        <div className="font-headline-sm text-headline-sm text-primary">
          Crosh.in
        </div>
        <div className="flex flex-wrap justify-center gap-md">
          <Link
            href="/products"
            className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors duration-300"
          >
            Shop
          </Link>
          <Link
            href="/#brand-story"
            className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors duration-300"
          >
            About
          </Link>
          <span className="font-body-md text-body-md text-on-surface-variant">
            Reviews
          </span>
          <Link
            href="/#contact"
            className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors duration-300"
          >
            Contact
          </Link>
          <span className="font-body-md text-body-md text-on-surface-variant">
            Instagram
          </span>
        </div>
        <p className="font-body-md text-body-md text-on-surface-variant opacity-60">
          © {new Date().getFullYear()} Crosh.in. Handcrafted with love.
        </p>
      </div>

      {/* ─── Desktop Footer ─── */}
      <div className="hidden md:block border-t border-outline-variant/10">
        <div className="max-w-[1280px] mx-auto px-lg py-xxl grid grid-cols-4 gap-lg">
          {/* Brand Column */}
          <div>
            <h2 className="text-headline-sm font-headline-sm text-primary mb-lg">
              Crosh.in
            </h2>
            <p className="text-body-md font-body-md text-on-surface-variant opacity-80 leading-relaxed">
              Crafting eternal memories through the art of crochet. Based in
              India, shipping joy worldwide.
            </p>
          </div>

          {/* Shop Column */}
          <div>
            <h4 className="text-label-md font-label-md text-on-surface mb-lg uppercase tracking-widest">
              Shop
            </h4>
            <ul className="space-y-sm">
              <li>
                <Link
                  href="/#brand-story"
                  className="text-on-surface-variant hover:text-primary transition-colors text-label-sm font-label-sm"
                >
                  Our Story
                </Link>
              </li>
              <li>
                <span className="text-on-surface-variant text-label-sm font-label-sm">
                  Sustainability
                </span>
              </li>
              <li>
                <Link
                  href="/products"
                  className="text-on-surface-variant hover:text-primary transition-colors text-label-sm font-label-sm"
                >
                  Best Sellers
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Column */}
          <div>
            <h4 className="text-label-md font-label-md text-on-surface mb-lg uppercase tracking-widest">
              Support
            </h4>
            <ul className="space-y-sm">
              <li>
                <span className="text-on-surface-variant text-label-sm font-label-sm">
                  Shipping &amp; Returns
                </span>
              </li>
              <li>
                <span className="text-on-surface-variant text-label-sm font-label-sm">
                  Privacy Policy
                </span>
              </li>
              <li>
                <span className="text-on-surface-variant text-label-sm font-label-sm">
                  FAQs
                </span>
              </li>
            </ul>
          </div>

          {/* Connect Column */}
          <div>
            <h4 className="text-label-md font-label-md text-on-surface mb-lg uppercase tracking-widest">
              Connect
            </h4>
            <div className="flex gap-md">
              <span className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center text-on-surface-variant hover:bg-primary hover:text-on-primary transition-all cursor-pointer">
                <span className="material-symbols-outlined text-[20px]">
                  share
                </span>
              </span>
              <span className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center text-on-surface-variant hover:bg-primary hover:text-on-primary transition-all cursor-pointer">
                <span className="material-symbols-outlined text-[20px]">
                  mail
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Desktop copyright bar */}
        <div className="max-w-[1280px] mx-auto px-lg py-lg border-t border-outline-variant/10">
          <p className="text-label-sm font-label-sm text-on-surface-variant opacity-60">
            © {new Date().getFullYear()} Crosh.in. Handcrafted with love.
          </p>
        </div>
      </div>
    </footer>
  );
}
