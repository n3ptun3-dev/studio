// src/app/layout.tsx

import React from 'react';
import type { Metadata } from 'next';
import { Orbitron, Exo_2, Rajdhani } from 'next/font/google';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AppProvider } from '@/contexts/AppContext';
// import { ThemeUpdater } from '@/components/theme-updater'; // Still commented out as planned
import { Toaster } from "@/components/ui/toaster";
import { SpyShopSectionWrapper } from '@/components/game/spyshop/SpyShopSectionWrapper';
import { SpyShopFadeOverlay } from '@/components/game/spyshop/SpyShopFadeOverlay';


const geistSans = GeistSans;
const geistMono = GeistMono;

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
  weight: ['400', '500', '700', '900'],
});

const exo2 = Exo_2({
  subsets: ['latin'],
  variable: '--font-exo2',
  weight: ['300', '400', '500', '600', '700'],
});

const rajdhani = Rajdhani({
  subsets: ['latin'],
  variable: '--font-rajdhani',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Elint Heist TOD',
  description: 'Tactical Overlay Device for Spi Vs Spi: Elint Heist',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.className} ${geistSans.variable} ${geistMono.className} ${geistMono.variable} ${orbitron.variable} ${exo2.variable} ${rajdhani.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning={true} // <-- ADD THIS LINE!
      >
        <ThemeProvider attribute="class" defaultTheme="terminal-green" enableSystem>
          <AppProvider>
            {/* <ThemeUpdater /> */}
            <Toaster />

            <div className="relative h-screen w-screen overflow-hidden">
              {children}

              <SpyShopSectionWrapper />
              <SpyShopFadeOverlay />
            </div>
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}