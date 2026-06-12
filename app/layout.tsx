import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import OrivooSidebar from "./components/OrivooSidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pulse50",
  description: "Pulse50 powered by ORIVOO AI",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen flex flex-col bg-black">
  <main className="flex-1">
  {children}
</main>

  <footer className="border-t border-white/10 bg-black py-6">
    <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">

      <div className="flex gap-6 text-sm">
        <Link
          href="/instructions"
          className="text-gray-400 hover:text-yellow-400 transition"
        >
          Instructions
        </Link>

        <Link
          href="/terms"
          className="text-gray-400 hover:text-yellow-400 transition"
        >
          Terms
        </Link>

        <Link
          href="/privacy"
          className="text-gray-400 hover:text-yellow-400 transition"
        >
          Privacy
        </Link>
      </div>

      <p className="text-xs text-gray-600">
        © {new Date().getFullYear()} Pulse50
      </p>

    </div>
  </footer>

  <OrivooSidebar />
</body>
    </html>
  );
}