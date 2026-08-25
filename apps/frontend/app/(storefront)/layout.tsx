import TopAppBar from "@/app/features/storefront/components/top-app-bar";
import BottomNavBar from "@/app/features/storefront/components/bottom-nav-bar";
import Footer from "@/app/features/storefront/components/footer";
import { CartProvider } from "@/app/features/cart/cart-context";

export default function StorefrontLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col">
        <TopAppBar />
        <main className="flex-1">{children}</main>
        <Footer />
        <BottomNavBar />
      </div>
    </CartProvider>
  );
}
