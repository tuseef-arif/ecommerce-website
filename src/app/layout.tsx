import type { Metadata } from "next";
import "./globals.css";
import { geistMono, satoshi } from "./fonts";

export const metadata: Metadata = {
  title: "Ecommerce Website",
  description: "Ecommerce storefront application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${satoshi.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
