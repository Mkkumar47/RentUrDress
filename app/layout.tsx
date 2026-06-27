import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Background3D } from "@/components/background-3d";
import { FluidBackgroundOverlay } from "@/components/fluid-background-overlay";
import { PageTransition } from "@/components/page-transition";
import { SiteHeader } from "@/components/site-header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RentUrDress",
  description:
    "A premium peer-to-peer marketplace to rent dresses, track orders by location, and earn money.",
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
      <head>      <meta name="google-site-verification" content="9bmuep6Zk2fSG1yTgXj-HmcmOPUdhFNyyM4QugmttJU" />
      </head>
      <body className="min-h-full bg-slate-950 text-slate-100">
        <FluidBackgroundOverlay />
        <Background3D />
        <div className="relative z-10 flex min-h-full flex-col">
          <SiteHeader />
          <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-8 sm:px-6 lg:px-8">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
      </body>
    </html>
  );
}
