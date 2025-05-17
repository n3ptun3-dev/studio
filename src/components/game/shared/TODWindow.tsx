
"use client";

import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Theme } from '@/contexts/ThemeContext';
// HolographicPanel import is not used in this simplified test version
// import { HolographicPanel } from './HolographicPanel'; 

interface TODWindowProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'default' | 'large';
  explicitTheme?: Theme;
  // themeVersion is not directly used by this simplified version if HolographicPanel isn't keyed internally
}

export function TODWindow({ isOpen, onClose, title, children, size = 'default', explicitTheme }: TODWindowProps) {
  // console.log('[TODWindow] Component function executing. isOpen:', isOpen, "Title:", title, "Explicit Theme:", explicitTheme);

  if (!isOpen) {
    // console.log('[TODWindow] Rendering null because isOpen is false.');
    return null;
  }
  // console.log('[TODWindow] Rendering with isOpen true. Title:', title, "Explicit Theme:", explicitTheme);

  const windowThemeClass = explicitTheme ? `theme-${explicitTheme}` : 'theme-terminal-green';

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm",
        "animate-slide-in-right-tod",
        windowThemeClass // Apply theme class to the main overlay div
      )}
      onClick={onClose}
    >
      {/* This div acts as the visual panel, HolographicPanel is removed for this test */}
      <div 
        className={cn( 
          "relative m-4 flex flex-col z-[10000] p-4 md:p-6 border rounded-lg shadow-lg",
          "w-[calc(100vw-80px)] max-w-[600px]",
          "h-[calc(100vh-100px)] max-h-[600px]",
          // Apply theme class directly to this panel for testing variable override
          windowThemeClass 
        )}
        onClick={(e) => e.stopPropagation()} // Prevent backdrop click when clicking on this panel
      >
        <div className={cn(
            "flex-shrink-0 flex items-center justify-between pb-2 mb-2 border-b",
            "border-current" // Should pick up themed text color via cascade
          )}
        >
          <h2 className={cn("text-xl font-orbitron text-foreground")}> {/* text-foreground should be themed */}
            {title}
          </h2>
          <button
            onClick={onClose} // onClose is already passed to parent div, but this is more specific
            className={cn("p-1 text-muted-foreground hover:text-foreground")}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Test Div 1: Tailwind Utility */}
        <div
          className={cn(
            "p-2 my-1 border-2 bg-primary text-primary-foreground border-accent",
             windowThemeClass // Apply theme class directly to test div
          )}
        >
          TEST DIV (Tailwind bg-primary)
        </div>

        {/* Test Div 2: Inline Style with CSS Variables */}
        <div
          className={cn(
            "p-2 my-1 border-2",
            windowThemeClass // Apply theme class directly to test div
          )}
          style={{
            backgroundColor: 'hsl(var(--primary-hsl))',
            color: 'hsl(var(--primary-foreground-hsl))',
            borderColor: `var(--${explicitTheme || 'terminal-green'}-debug-color, orange)`,
            borderWidth: '5px',
            borderStyle: 'solid'
          }}
        >
          TEST DIV (Inline Style var(--primary))
        </div>
        
        <div className="flex-grow min-h-0 h-[calc(100%-10rem)] overflow-y-auto scrollbar-hide"> {/* Adjusted height for test divs + title */}
           {children}
        </div>
      </div>
    </div>
  );
}
