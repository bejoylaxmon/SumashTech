import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PopupOffer from "@/components/PopupOffer";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import RouteGuard from "@/components/RouteGuard";

export const metadata: Metadata = {
  title: "Sumash Tech | Authentic Gadget Shop in Bangladesh",
  description: "Sumash Tech is the most trusted gadget shop in Bangladesh. Buy original iPhones, MacBooks, Samsungs, and premium accessories at the best prices.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <CartProvider>
            <PopupOffer />
            <Header />
            <RouteGuard>
              <main>{children}</main>
            </RouteGuard>
            <Footer />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
