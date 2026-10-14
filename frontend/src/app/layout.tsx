import type { Metadata } from "next";
import { Schibsted_Grotesk, Public_Sans, JetBrains_Mono } from "next/font/google";
import { SessionProvider } from "@/lib/session/SessionContext";
import "./globals.css";

const schibsted = Schibsted_Grotesk({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-schibsted",
  display: "swap",
});

const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-public-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ShopSense — Calm, Verified Shopping Research",
  description:
    "ShopSense turns a plain-English shopping request into a ranked, explained, sourced shortlist with receipts for every claim.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${schibsted.variable} ${publicSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-canvas text-ink antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
