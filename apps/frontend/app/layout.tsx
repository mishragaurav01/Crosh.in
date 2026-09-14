import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import MaterialSymbols from "@/components/material-symbols";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Join Our Garden | Crosh.in",
  description: "Handcrafted warmth and slow fashion.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Material Symbols stylesheet is injected client-side (MaterialSymbols) to
  // avoid a third-party render-blocking round trip in <head>. Axis tags MUST
  // stay lowercase-first alphabetical (opsz,wght then FILL,GRAD) or Google
  // returns 400 and every icon renders as raw text.
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} light`}>
      <body>
        <MaterialSymbols />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}