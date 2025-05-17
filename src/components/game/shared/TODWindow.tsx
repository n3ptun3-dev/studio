
"use client";

import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HolographicPanel } from './HolographicPanel';
import type { Theme } from '@/contexts/ThemeContext'; // Import Theme type

interface TODWindowProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'default' | 'large';
  explicitTheme?: Theme; // New prop to receive the theme name
}

export function TODWindow({ isOpen, onClose, title, children, size = 'default', explicitTheme }: TODWindowProps) {
  console.log('[TODWindow] Component function executing. isOpen:', isOpen, "Title:", title, "Explicit Theme:", explicitTheme);

  if (!isOpen) {
    console.log('[TODWindow] Rendering null because isOpen is false.');
    return null;
  }
  console.log('[TODWindow] Rendering with isOpen true. Title:', title, "Explicit Theme:", explicitTheme);

  // Apply the theme class directly to the outermost div of the TODWindow
  const windowThemeClass = explicitTheme ? `theme-${explicitTheme}` : '';

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm",
        isOpen ? "animate-slide-in-right-tod" : "animate-slide-out-right-tod", // Animation classes
        windowThemeClass // Apply the explicit theme class here
      )}
      onClick={onClose}
    >
      <HolographicPanel
        // Keying the HolographicPanel with explicitTheme ensures it re-renders if the theme name changes
        key={explicitTheme || 'default-theme'} 
        className={cn(
          "relative m-4 flex flex-col z-[10000]",
          "w-[calc(100vw-80px)] max-w-[600px]",
          "h-[calc(100vh-100px)] max-h-[600px]",
          // No explicit theme class needed here if parent has it, but it doesn't hurt if HolographicPanel adapts
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-shrink-0 flex items-center justify-between pb-2 mb-2 border-b border-current">
          <h2 className="text-xl font-orbitron holographic-text">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* THEME TEST DIV - To be removed after testing */}
        <div className="p-2 my-2 bg-primary text-primary-foreground border-2 border-accent">
          THEME TEST DIV (Should be Faction Colored)
        </div>
        {/* END THEME TEST DIV */}

        <div className="flex-grow min-h-0 h-[calc(100%-4rem)] overflow-y-auto scrollbar-hide">
           {children}
        </div>
      </HolographicPanel>
    </div>
  );
}

