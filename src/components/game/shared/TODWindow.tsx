"use client";

import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Theme } from '@/contexts/ThemeContext';
import { HolographicPanel } from './HolographicPanel'; // Assuming HolographicPanel is used for the main body

interface TODWindowProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'default' | 'large';
  explicitTheme?: Theme; // To force a specific theme for this window
  themeVersion?: number; // For re-keying its internal HolographicPanel
}

export function TODWindow({ isOpen, onClose, title, children, size = 'default', explicitTheme }: TODWindowProps) {
  // Construct theme class. Default to terminal-green if explicitTheme is not provided.
  const windowThemeClass = explicitTheme ? `theme-${explicitTheme}` : 'theme-terminal-green';

  // Log when the component function itself is executing and what its props are.
  console.log('[TODWindow] Component function executing. isOpen:', isOpen, "Title:", title, "Explicit Theme:", explicitTheme);

  if (!isOpen) {
    console.log('[TODWindow] Rendering null because isOpen is false.');
    return null;
  }
  console.log('[TODWindow] Rendering with isOpen true. Title:', title, "Explicit Theme:", explicitTheme);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm",
        "animate-slide-in-right-tod", // Apply animation class
        windowThemeClass // Apply the determined theme class to the overlay
      )}
      onClick={onClose}
    >
      {/* Use HolographicPanel for the main window body, passing the explicit theme for its styling */}
      <HolographicPanel
        key={explicitTheme || 'default-panel-theme'} // Re-key HolographicPanel if theme changes
        className={cn(
          "relative m-4 flex flex-col z-[10000]",
          "w-[calc(100vw-80px)] max-w-[600px]",
          "h-[calc(100vh-100px)] max-h-[600px]",
           // explicitTheme is already applied by parent, but can be explicit here if HP needs it
        )}
        onClick={(e) => e.stopPropagation()}
        explicitTheme={explicitTheme} // Pass theme to HolographicPanel
      >
        <div className={cn(
            "flex-shrink-0 flex items-center justify-between pb-2 mb-2 border-b",
            "border-current" // Use current text color (themed) for border
          )}
        >
          <h2 className="text-xl font-orbitron text-foreground">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Test Div 1: Using Tailwind Utility (e.g., bg-primary) */}
        <div className={cn(
            "p-2 my-1 border-2 bg-primary text-primary-foreground border-accent",
            // Apply theme class directly to this test div
            explicitTheme ? `theme-${explicitTheme}` : 'theme-terminal-green' 
          )}
        >
          TEST DIV (Tailwind bg-primary)
        </div>

        {/* Test Div 2: Using Inline Style with CSS Variable */}
        <div
          className={cn(
            "p-2 my-1 border-2",
            // Apply theme class directly to this test div
            explicitTheme ? `theme-${explicitTheme}` : 'theme-terminal-green'
          )}
          style={{
            backgroundColor: 'var(--primary)', 
            color: 'var(--primary-foreground)',
            borderColor: `var(--${explicitTheme}-debug-color, orange)`, // Directly use the debug color for the current theme
            borderWidth: '5px',
            borderStyle: 'solid'
          }}
        >
          TEST DIV (Inline Style var(--primary))
        </div>
        
        <div className="flex-grow min-h-0 h-[calc(100%-4rem)] overflow-y-auto scrollbar-hide">
           {children}
        </div>
      </HolographicPanel>
    </div>
  );
}