
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
  // themeVersion is passed from AppContext via HomePage for keying HolographicPanel
  themeVersion?: number;
}

export function TODWindow({ isOpen, onClose, title, children, size = 'default', explicitTheme, themeVersion }: TODWindowProps) {
  const windowThemeClass = explicitTheme ? `theme-${explicitTheme}` : 'theme-terminal-green';

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm",
        "animate-slide-in-right-tod", // Ensure this animation is defined for opening
        // windowThemeClass // Apply theme class to the main overlay div for font/cascade if needed
      )}
      onClick={onClose} // Click on backdrop to close
    >
      <HolographicPanel
        key={explicitTheme ? `${explicitTheme}-${themeVersion}` : `default-${themeVersion}`} // Re-key HolographicPanel on theme change
        className={cn(
          "relative m-4 flex flex-col z-[10000]",
          "w-[calc(100vw-80px)] max-w-[600px]",
          "h-[calc(100vh-100px)] max-h-[600px]",
          // No explicit theme class here; HolographicPanel will apply it based on its prop
        )}
        onClick={(e) => e.stopPropagation()} // Prevent backdrop click when clicking on panel
        explicitTheme={explicitTheme} // Pass the theme to HolographicPanel
      >
        <div className={cn(
            "flex-shrink-0 flex items-center justify-between pb-2 mb-2 border-b",
            "border-current" // Should pick up themed text color via cascade if parent has themed text
          )}
        >
          <h2 className={cn("text-xl font-orbitron text-foreground")}> {/* text-foreground should be themed by HolographicPanel's theme */}
            {title}
          </h2>
          <button
            onClick={onClose}
            className={cn("p-1 text-muted-foreground hover:text-foreground")}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-grow min-h-0 h-[calc(100%-4rem)] overflow-y-auto scrollbar-hide">
           {children}
        </div>
      </HolographicPanel>
    </div>
  );
}
