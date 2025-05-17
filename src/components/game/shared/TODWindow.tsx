
"use client";

import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Theme } from '@/contexts/ThemeContext';
import { HolographicPanel } from './HolographicPanel';

interface TODWindowProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'default' | 'large';
  explicitTheme?: Theme;
  themeVersion?: number; // For keying HolographicPanel if needed
  showCloseButton?: boolean;
}

export function TODWindow({
  isOpen,
  onClose,
  title,
  children,
  size = 'default',
  explicitTheme,
  themeVersion,
  showCloseButton = true, // Default to true
}: TODWindowProps) {
  const effectiveTheme = explicitTheme || 'terminal-green';

  // console.log('[TODWindow] Component function executing. isOpen:', isOpen, "Title:", title, "Explicit Theme:", explicitTheme, "ThemeVersion for HP key:", themeVersion);

  if (!isOpen) {
    // console.log('[TODWindow] Rendering null because isOpen is false.');
    return null;
  }

  // console.log('[TODWindow] Rendering with isOpen true. Title:', title, "Explicit Theme:", explicitTheme);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm",
        "animate-slide-in-right-tod", // Always apply open animation when isOpen is true
        `theme-${effectiveTheme}` // Apply theme class to the overlay
      )}
      onClick={onClose} // Allow closing by clicking overlay if showCloseButton is true, or always? For now, always.
    >
      <HolographicPanel
        key={`${effectiveTheme}-${themeVersion}`} // Re-key HolographicPanel on theme or version change
        className={cn(
          "relative m-4 flex flex-col z-[10000]",
          "w-[calc(100vw-80px)] max-w-[600px]", // Adjusted for slightly more padding
          "h-[calc(100vh-100px)] max-h-[600px]", // Adjusted for slightly more padding
        )}
        onClick={(e) => e.stopPropagation()} // Prevent click on panel from closing window
        explicitTheme={effectiveTheme} // Pass the theme to HolographicPanel
      >
        <div className={cn(
            "flex-shrink-0 flex items-center justify-between pb-2 mb-2 border-b",
            "border-current opacity-50" // Use current color (themed) for border, reduced opacity
          )}
        >
          <h2 className={cn("text-xl font-orbitron text-foreground holographic-text")}>
            {title}
          </h2>
          {showCloseButton && ( // Conditionally render the close button
            <button
              onClick={onClose}
              className={cn("p-1 text-muted-foreground hover:text-foreground")}
              aria-label="Close window"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        
        <div className="flex-grow min-h-0 h-[calc(100%-4rem)] overflow-y-auto scrollbar-hide">
           {children}
        </div>
      </HolographicPanel>
    </div>
  );
}
