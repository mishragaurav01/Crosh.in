import { ReactNode } from "react";
import { AuthProvider } from "@/lib/auth-context";
import AdminSidebar from "./AdminSidebar";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <main className="flex-1 min-w-0 p-lg">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </AuthProvider>
  );
}
