import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "../contexts/CartContext";
import { ApolloProvider } from "../components/ApolloProvider";
import { HydrationSafeProvider } from "../components/HydrationSafeProvider";
import Link from "next/link";
import CartButtonAndPanel from "../components/CartButtonAndPanel";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ay Wey - Menú",
  description: "Menú del restaurante Ay Wey",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white`}>
        <HydrationSafeProvider>
          <ApolloProvider>
            <CartProvider>
              <header className="fixed top-0 left-0 w-full z-50 bg-black/95 border-b border-zinc-900 flex items-center justify-between px-6 py-2 shadow-xl">
                <Link href="/" className="flex items-center gap-2">
                  <div className="text-2xl font-bold text-yellow-400">🍽️ Ay Wey</div>
                </Link>
                <div className="flex items-center gap-4">
                  <Link href="/admin/orders">
                    <button className="px-4 py-2 rounded-full bg-yellow-400 text-black font-bold hover:bg-yellow-300 transition-colors text-sm shadow">
                      Admin Órdenes
                    </button>
                  </Link>
                <CartButtonAndPanel />
                </div>
              </header>
              <div className="pt-24">{children}</div>
            </CartProvider>
          </ApolloProvider>
        </HydrationSafeProvider>
      </body>
    </html>
  );
}
