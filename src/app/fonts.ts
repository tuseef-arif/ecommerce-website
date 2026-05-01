import localFont from "next/font/local";
import { Geist_Mono } from "next/font/google";

export const satoshi = localFont({
  src: [
    { path: "./fonts/Satoshi-Light.otf", weight: "300", style: "normal" },
    { path: "./fonts/Satoshi-LightItalic.otf", weight: "300", style: "italic" },
    { path: "./fonts/Satoshi-Regular.otf", weight: "400", style: "normal" },
    { path: "./fonts/Satoshi-Italic.otf", weight: "400", style: "italic" },
    { path: "./fonts/Satoshi-Medium.otf", weight: "500", style: "normal" },
    {
      path: "./fonts/Satoshi-MediumItalic.otf",
      weight: "500",
      style: "italic",
    },
    { path: "./fonts/Satoshi-Bold.otf", weight: "700", style: "normal" },
    { path: "./fonts/Satoshi-BoldItalic.otf", weight: "700", style: "italic" },
    { path: "./fonts/Satoshi-Black.otf", weight: "900", style: "normal" },
    { path: "./fonts/Satoshi-BlackItalic.otf", weight: "900", style: "italic" },
  ],
  variable: "--font-satoshi",
  display: "swap",
  fallback: ["system-ui", "Segoe UI", "Arial", "sans-serif"],
});

export const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});
