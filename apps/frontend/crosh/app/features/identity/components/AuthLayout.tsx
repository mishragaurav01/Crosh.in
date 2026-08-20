import Link from "next/link";
import type { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
  captionText?: string;
}

export default function AuthLayout({
  children,
  captionText = "Every stitch tells a story of patience and warmth.",
}: AuthLayoutProps) {
  return (
    <main className="flex min-h-screen w-full">
      {/* Transactional header — absolute so it overlays both panels on desktop */}
      <header className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-md py-md md:px-xl md:py-lg">
        <Link
          href="/"
          className="flex items-center gap-sm text-primary hover:opacity-80 transition-opacity"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <Link
          href="/"
          className="font-playfair text-headline-sm text-primary tracking-tight"
        >
          Crosh.in
        </Link>
        <div className="w-8" />
      </header>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-0">
        {/* Left panel — lifestyle image placeholder (desktop only) */}
        <div className="hidden md:flex relative overflow-hidden bg-surface-dim items-center justify-center">
          {/* Placeholder — swap for a real image later without restructuring */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-on-surface-variant/50">
              <span className="material-symbols-outlined text-[64px] mb-4">
                image
              </span>
              <p className="font-label-md text-label-md">
                Artisanal Image Placeholder
              </p>
            </div>
          </div>

          {/* Caption overlay at the bottom */}
          <div className="absolute bottom-xl left-xl z-20 max-w-[320px]">
            <p className="font-headline-sm text-headline-sm italic text-on-surface">
              {captionText}
            </p>
          </div>
        </div>

        {/* Right panel — form area */}
        <div className="bg-surface-container-lowest p-xl md:p-xl flex flex-col justify-center min-h-screen">
          <div className="w-full max-w-[400px] mx-auto form-fade-in">
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
