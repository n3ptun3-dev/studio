
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
  showCloseButton = true,
}: TODWindowProps) {
  const effectiveTheme = explicitTheme || 'terminal-green';

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm",
        "animate-slide-in-right-tod",
        `theme-${effectiveTheme}` // Apply theme class to the overlay
      )}
      onClick={onClose}
    >
      <HolographicPanel
        key={`${effectiveTheme}-${themeVersion}`} // Re-key HolographicPanel on theme change
        className={cn(
          "relative m-4 flex flex-col z-[10000]",
          "w-[calc(100vw-80px)] max-w-[600px]",
          "h-[calc(100vh-100px)] max-h-[600px]",
        )}
        onClick={(e) => e.stopPropagation()}
        explicitTheme={effectiveTheme} // Pass the theme to HolographicPanel
      >
        <div className={cn(
            "flex-shrink-0 flex items-center justify-between pb-2 mb-2 border-b",
            "border-current"
          )}
        >
          <h2 className={cn("text-xl font-orbitron text-foreground holographic-text")}>
            {title}
          </h2>
          {showCloseButton && (
            <button
              onClick={onClose}
              className={cn("p-1 text-muted-foreground hover:text-foreground")}
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
