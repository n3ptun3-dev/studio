
"use client";

import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
// Intentionally not using HolographicPanel here for this specific debug phase
// import { HolographicPanel } from './HolographicPanel'; 
import type { Theme } from '@/contexts/ThemeContext';

interface TODWindowProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'default' | 'large';
  explicitTheme?: Theme;
  themeVersion?: number; 
}

export function TODWindow({ isOpen, onClose, title, children, size = 'default', explicitTheme, themeVersion }: TODWindowProps) {
  const windowThemeClass = explicitTheme ? `theme-${explicitTheme}` : 'theme-terminal-green';

  // console.log('[TODWindow] Component function executing. isOpen:', isOpen, "Title:", title, "Explicit Theme:", explicitTheme);

  if (!isOpen) {
    // console.log('[TODWindow] Rendering null because isOpen is false.');
    return null;
  }
  // console.log('[TODWindow] Rendering with isOpen true. Title:', title, "Explicit Theme:", explicitTheme);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm",
        "animate-slide-in-right-tod",
        windowThemeClass // Apply theme class to the main overlay/container of TODWindow
      )}
      onClick={onClose} 
    >
      {/* Removed HolographicPanel wrapper for this test - direct div */}
      <div       
        className={cn(
          "relative m-4 flex flex-col z-[10000] p-4 md:p-6 rounded-lg border shadow-lg",
          // Applying theme class also directly here for good measure
          windowThemeClass, 
          // Base styling to mimic HolographicPanel without relying on its CSS vars for this test
          "bg-[hsl(var(--card-hsl))] border-[hsl(var(--border-hsl))]", 
          "w-[calc(100vw-80px)] max-w-[600px]", 
          "h-[calc(100vh-100px)] max-h-[600px]",
        )}
        onClick={(e) => e.stopPropagation()} 
      >
        <div className={cn(
            "flex-shrink-0 flex items-center justify-between pb-2 mb-2 border-b",
            "border-[hsl(var(--border-hsl))]" // Use themed border
          )}
        >
          <h2 className={cn(
              "text-xl font-orbitron",
              "text-[hsl(var(--foreground-hsl))]" // Use themed foreground
            )}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className={cn(
              "p-1",
              "text-[hsl(var(--muted-foreground-hsl))] hover:text-[hsl(var(--foreground-hsl))]"
            )}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Test Div 1: Using Tailwind Utility (e.g., bg-primary) */}
        {/* This div will also have the windowThemeClass applied from its grandparent for the test */}
        <div className={cn(
            "p-2 my-1 border-2 bg-primary text-primary-foreground border-accent"
          )}
        >
          TEST DIV (Using Tailwind bg-primary)
        </div>

        {/* Test Div 2: Using Inline Style with CSS Variable and specific debug vars */}
        <div
          className={cn("p-2 my-1 border-2")}
          style={{
            backgroundColor: 'hsl(var(--primary-hsl))',
            color: 'hsl(var(--primary-foreground-hsl))',
            // Use theme-specific debug variables for border. Fallback to orange if none defined.
            borderColor: `var(--${explicitTheme}-debug-color, orange)`,
            borderWidth: '5px', 
            borderStyle: 'solid'
          }}
        >
          TEST DIV (Inline Style - BG: --primary-hsl, Border: --[theme]-debug-color)
        </div>
        
        <div className="flex-grow min-h-0 h-[calc(100%-4rem)] overflow-y-auto scrollbar-hide">
           {children}
        </div>
      </div>
    </div>
  );
}
