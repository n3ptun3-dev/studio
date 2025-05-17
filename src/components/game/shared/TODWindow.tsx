
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
  themeVersion?: number; // To help ensure re-render when theme changes
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
  const [isVisible, setIsVisible] = useState(isOpen);
  const [isAnimating, setIsAnimating] = useState(false);

  // Enhanced logging
  useEffect(() => {
    console.log(`[TODWindow] Render/Props Update. isOpen: ${isOpen}, Title: "${title}", explicitTheme: ${explicitTheme}, themeVersion: ${themeVersion}, showCloseButton: ${showCloseButton}, isVisible: ${isVisible}, isAnimating: ${isAnimating}`);
  }, [isOpen, title, explicitTheme, themeVersion, showCloseButton, isVisible, isAnimating]);


  useEffect(() => {
    console.log(`[TODWindow] isOpen Effect. New isOpen: ${isOpen}, Current isVisible: ${isVisible}`);
    if (isOpen) {
      if (!isVisible) {
        setIsVisible(true);
        console.log(`[TODWindow] isOpen Effect: Set isVisible to true.`);
        requestAnimationFrame(() => {
          setIsAnimating(true);
          console.log(`[TODWindow] isOpen Effect: Set isAnimating to true (starting enter animation).`);
        });
      }
    } else {
      if (isVisible || isAnimating) {
        setIsAnimating(true);
        console.log(`[TODWindow] isOpen Effect: Set isAnimating to true (starting close animation).`);
      }
    }
  }, [isOpen]);

  const handleAnimationEnd = () => {
    console.log(`[TODWindow] Animation ended. Current isOpen: ${isOpen}, Current isAnimating: ${isAnimating}`);
    setIsAnimating(false);
    if (!isOpen) {
      setIsVisible(false);
      console.log(`[TODWindow] Animation ended: Set isVisible to false.`);
    } else {
      console.log(`[TODWindow] Animation ended: Window is open, isVisible remains true.`);
    }
  };
  
  const effectiveTheme = explicitTheme || 'terminal-green'; // Default if not specified

  if (!isOpen && !isAnimating && !isVisible) {
     console.log(`[TODWindow] Rendering null: isOpen=${isOpen}, isAnimating=${isAnimating}, isVisible=${isVisible}`);
     return null;
  }
  
  const overlayClasses = cn(
    "fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm transition-opacity duration-200",
    (isOpen && isVisible) ? "opacity-100" : "opacity-0",
    (!isOpen && !isAnimating) && "pointer-events-none"
  );

  console.log(`[TODWindow] Applying overlayClasses: "${overlayClasses}"`);

  return (
    <div
      className={overlayClasses}
      onClick={showCloseButton ? onClose : undefined} // Only allow overlay click to close if showCloseButton is true
      aria-hidden={!isOpen}
    >
      <HolographicPanel
        key={`${effectiveTheme}-${themeVersion}-window-panel`}
        className={cn(
          "relative m-4 flex flex-col z-[10000]",
          "w-[calc(100vw-80px)] max-w-[600px]", 
          "h-[calc(100vh-100px)] max-h-[600px]",
          // Background and blur removed from here, applied to overlay
          (isOpen && isVisible) ? "animate-slide-in-right-tod" : (!isOpen && isAnimating) ? "animate-slide-out-right-tod" : "",
          (!isVisible && !isAnimating) && "hidden" 
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
          {showCloseButton && (
            <button
              onClick={(e) => {
                e.stopPropagation();
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
           {/* THEME TEST DIV - REMOVE AFTER DEBUGGING */}
           {/* <div
            className={cn("p-2 my-1 border-2", `theme-${explicitTheme}`)}
            style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)', borderColor: `var(--${explicitTheme}-debug-color, orange)`, borderWidth: '5px', borderStyle: 'solid' }}
           >
            TEST DIV (Inline Style Var --primary, Border theme-debug-color) on {explicitTheme}
           </div> */}
           {children}
        </div>
      </HolographicPanel>
    </div>
  );
}
