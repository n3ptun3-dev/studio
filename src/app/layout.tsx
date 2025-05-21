
import React from 'react';
import type { Metadata } from 'next';
import { Orbitron, Exo_2, Rajdhani } from 'next/font/google';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AppProvider } from '@/contexts/AppContext';
import { ThemeUpdater } from '@/components/theme-updater';
import { Toaster } from "@/components/ui/toaster"; // Assuming Toaster will be used later.

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
      {/* 
        The inline <style jsx global> block for setting :root CSS variables 
        has been removed. ThemeContext.tsx now handles dynamic injection of 
        these variables onto document.documentElement.style.
        The globals.css file provides initial defaults within .theme-terminal-green (formerly :root).
      */}
      <body 
        className={`${geistSans.className} ${geistSans.variable} ${geistMono.className} ${geistMono.variable} ${orbitron.variable} ${exo2.variable} ${rajdhani.variable} antialiased bg-background text-foreground`}>
        <ThemeProvider attribute="class" defaultTheme="terminal-green" enableSystem disableTransitionOnChange>
          <AppProvider>
            {children}
            <ThemeUpdater />
            {/* <Toaster /> Ensure Toaster is rendered if used */}
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
