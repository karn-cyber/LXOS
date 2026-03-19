import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Suspense } from "react";
import HeaderActions from "@/components/header-actions";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "LX Management OS",
  description: "Learner Experience Operating System for University Management",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClerkProvider>
          <header className="border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-50 bg-white dark:bg-zinc-950 hidden lg:block">
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
              <h1 className="text-xl font-bold">LX Management OS</h1>
              <Suspense fallback={<div className="w-24 h-10" />}>
                <HeaderActions />
              </Suspense>
            </div>
          </header>
          {children}
          <Toaster />
          <Sonner />
        </ClerkProvider>
      </body>
    </html>
  );
}
