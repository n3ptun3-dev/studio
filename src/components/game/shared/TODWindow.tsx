
"use client";

import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HolographicPanel } from './HolographicPanel';
import type { Theme } from '@/contexts/ThemeContext'; 

interface TODWindowProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'default' | 'large';
  explicitTheme?: Theme; 
}

export function TODWindow({ isOpen, onClose, title, children, size = 'default', explicitTheme }: TODWindowProps) {
  console.log('[TODWindow] Component function executing. isOpen:', isOpen, "Title:", title, "Explicit Theme:", explicitTheme);

  if (!isOpen) {
    console.log('[TODWindow] Rendering null because isOpen is false.');
    return null;
  }
  console.log('[TODWindow] Rendering with isOpen true. Title:', title, "Explicit Theme:", explicitTheme);

  const windowThemeClass = explicitTheme ? `theme-${explicitTheme}` : 'theme-terminal-green';

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm",
        isOpen ? "animate-slide-in-right-tod" : "animate-slide-out-right-tod", 
        windowThemeClass 
      )}
      onClick={onClose}
    >
      <HolographicPanel
        key={explicitTheme || 'default-theme'} 
        className={cn(
          "relative m-4 flex flex-col z-[10000]",
          "w-[calc(100vw-80px)] max-w-[600px]",
          "h-[calc(100vh-100px)] max-h-[600px]",
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

        {/* THEME TEST DIV - Now uses direct inline styles with CSS variables */}
        <div
          className="p-2 my-2 border-2"
          style={{
            backgroundColor: 'hsl(var(--primary-hsl))',
            color: 'hsl(var(--primary-foreground-hsl))',
            borderColor: 'hsl(var(--accent-hsl))',
          }}
        >
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
