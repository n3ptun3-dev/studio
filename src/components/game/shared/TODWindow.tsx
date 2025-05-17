
"use client";

import React, { useState, useEffect } from 'react';
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
  themeVersion?: number;
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
  showCloseButton = true, // Default to true if not provided by props
}: TODWindowProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsAnimating(true);
    } else {
      setIsAnimating(true); 
      // Don't set isVisible to false immediately, let animation play out
    }
  }, [isOpen]);

  const handleAnimationEnd = () => {
    setIsAnimating(false);
    if (!isOpen) {
      setIsVisible(false);
    }
  };
  
  const effectiveTheme = explicitTheme || 'terminal-green';
  console.log('[TODWindow] Component function executing. isOpen:', isOpen, "isVisible:", isVisible, "isAnimating:", isAnimating, "Title:", title, "Explicit Theme:", explicitTheme, "ShowCloseButton:", showCloseButton);

  if (!isVisible && !isAnimating) { // Only return null if not visible AND not animating
    console.log('[TODWindow] Rendering null because !isVisible and !isAnimating.');
    return null;
  }
  
  return (
    // Overlay: fades in/out
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-200",
        isOpen && isVisible ? "opacity-100" : "opacity-0", // Fade based on isOpen & isVisible
        !isVisible && !isAnimating && "pointer-events-none" // Allow clicks through when fully hidden
      )}
      onClick={onClose} 
    >
      {/* Content Panel: slides in/out, has the backdrop blur & themed background */}
      <HolographicPanel
        key={`${effectiveTheme}-${themeVersion}`} // Re-key HolographicPanel on theme or version change
        className={cn(
          "relative m-4 flex flex-col z-[10000]",
          "w-[calc(100vw-80px)] max-w-[600px]", 
          "h-[calc(100vh-100px)] max-h-[600px]",
          // Apply overlay styles directly to the sliding panel
          "bg-black/70 backdrop-blur-sm", 
          // Animations
          (isOpen && isVisible) ? "animate-slide-in-right-tod" : (!isOpen && isVisible) ? "animate-slide-out-right-tod" : ""
        )}
        onClick={(e) => e.stopPropagation()} 
        explicitTheme={effectiveTheme} 
        onAnimationEnd={handleAnimationEnd}
      >
        <div className={cn(
            "flex-shrink-0 flex items-center justify-between pb-2 mb-2 border-b",
            "border-current opacity-50" 
          )}
        >
          <h2 className={cn("text-xl font-orbitron text-foreground holographic-text")}>
            {title}
          </h2>
          {showCloseButton && ( // Correctly use the prop
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent overlay click
                onClose();
              }}
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

    