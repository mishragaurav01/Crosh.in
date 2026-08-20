"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { LoadingSpinner } from "@/components/ui/Loading";

const navItems = [
  {
    label: "Catalog",
    icon: "inventory_2",
    children: [
      { label: "Categories", href: "/catalog/categories", icon: "category" },
      { label: "Collections", href: "/catalog/collections", icon: "collections" },
      { label: "Products", href: "/catalog/products", icon: "products" },
    ],
  },
];

function SidebarNavItem({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-sm px-md py-sm rounded-lg text-label-md transition-colors duration-150 ${
        active
          ? "bg-primary-container text-on-primary-container"
          : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
      }`}
    >
      <span className="material-symbols-outlined text-[20px]">{icon}</span>
      {label}
    </Link>
  );
}

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 bg-surface-container-low border-r border-outline-variant/30 h-screen sticky top-0 flex flex-col">
      <div className="px-lg py-lg border-b border-outline-variant/30">
        <Link
          href="/"
          className="font-playfair text-headline-sm text-primary tracking-tight"
        >
          Crosh.in
        </Link>
        <span className="text-label-sm text-on-surface-variant ml-sm">Admin</span>
      </div>

      <nav className="flex-1 px-sm py-md space-y-lg overflow-y-auto">
        {navItems.map((section) => (
          <div key={section.label}>
            <p className="px-md mb-xs text-label-sm text-outline font-label-sm uppercase tracking-wider">
              {section.label}
            </p>
            <div className="space-y-xs">
              {section.children.map((item) => (
                <SidebarNavItem
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  active={pathname.startsWith(item.href)}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <AdminUserSection />
    </aside>
  );
}

function AdminUserSection() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="px-lg py-md border-t border-outline-variant/30">
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="px-lg py-md border-t border-outline-variant/30">
      <div className="flex items-center gap-sm mb-sm">
        <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center">
          <span className="text-on-primary-container text-label-sm font-label-md">
            {user.email.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-label-md text-on-surface truncate">{user.email}</p>
          {user.isAdmin && (
            <p className="text-label-sm text-primary">Admin</p>
          )}
        </div>
      </div>
      <button
        onClick={logout}
        className="flex items-center gap-sm w-full px-md py-sm rounded-lg text-label-md text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
      >
        <span className="material-symbols-outlined text-[20px]">logout</span>
        Sign out
      </button>
    </div>
  );
}
