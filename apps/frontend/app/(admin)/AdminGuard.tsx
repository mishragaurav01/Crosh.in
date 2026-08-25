"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { LoadingSpinner } from "@/components/ui/Loading";

export default function AdminGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    const next = encodeURIComponent(pathname);
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen p-lg">
        <div className="max-w-[28rem] w-full text-center bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-xl">
          <div className="w-12 h-12 rounded-full bg-error-container mx-auto mb-md flex items-center justify-center">
            <span className="material-symbols-outlined text-on-error-container text-[24px]">
              lock_clock
            </span>
          </div>
          <h1 className="font-headline-sm text-headline-sm text-on-surface mb-xs">
            Session expired
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mb-lg">
            You need to be signed in to access the admin area.
          </p>
          <Link
            href={`/features/identity/login?next=${next}`}
            className="inline-block bg-primary text-on-primary font-label-md text-label-md px-xl py-sm rounded-full transition-all duration-300 hover:shadow-md"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
