// src/components/game/shared/HolographicPanel.tsx
// This file defines the HolographicPanel and HolographicButton components,
// which provide a futuristic, sci-fi UI aesthetic for the game.

"use client";

import React, { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode, forwardRef } from 'react'; // Added InputHTMLAttributes and forwardRef
import { cn } from '@/lib/utils'; // Utility for conditionally joining Tailwind CSS classes
import type { Theme } from '@/contexts/ThemeContext'; // Assuming Theme is still relevant

// Holographic Panel Component
// This component provides a styled panel with a holographic border effect.

// Define props for HolographicPanel
interface HolographicPanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  glassmorphism?: boolean;
  explicitTheme?: Theme;
}

// Using React.forwardRef to allow this functional component to receive a ref.
// The ref will be attached to the outermost div of the component.
export const HolographicPanel = forwardRef<HTMLDivElement, HolographicPanelProps>(
  ({ children, className, glassmorphism = false, explicitTheme, ...props }, ref) => {
    const themeClass = explicitTheme ? `theme-${explicitTheme}` : '';
    return (
      <div
        ref={ref} // Attach the forwarded ref to the root div
        className={cn(
          "holographic-panel p-4 md:p-6", // Base holographic-panel class
          glassmorphism && "bg-opacity-30 backdrop-blur-md border-opacity-50",
          themeClass, // Apply explicit theme class
          className // Allow additional classes to be passed
        )}
        {...props} // Spread any other standard div props (onClick, style, etc.)
      >
        {children}
      </div>
    );
  }
);

// Set a display name for easier debugging in React DevTools
HolographicPanel.displayName = 'HolographicPanel';


// Holographic Button Component
// This component provides a styled button with a holographic interactive effect.

interface HolographicButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  explicitTheme?: Theme;
}

export const HolographicButton = forwardRef<HTMLButtonElement, HolographicButtonProps>(
  ({ children, className, explicitTheme, ...props }, ref) => {
    const themeClass = explicitTheme ? `theme-${explicitTheme}` : '';
    return (
      <button
        ref={ref} // Attach the forwarded ref to the button
        className={cn(
          "holographic-button", // Base holographic-button class
          themeClass, // Apply explicit theme class
          className // Allow additional classes
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

HolographicButton.displayName = 'HolographicButton';


// Holographic Input Component
// This component provides a styled input field.

interface HolographicInputProps extends InputHTMLAttributes<HTMLInputElement> { // Extends InputHTMLAttributes
  explicitTheme?: Theme;
}

export const HolographicInput = forwardRef<HTMLInputElement, HolographicInputProps>( // Use forwardRef for input
  ({ className, explicitTheme, ...props }, ref) => {
    const themeClass = explicitTheme ? `theme-${explicitTheme}` : '';
    return (
      <input
        ref={ref} // Attach the forwarded ref to the input
        className={cn(
          "holographic-input", // Base holographic-input class
          themeClass, // Apply explicit theme class
          className // Allow additional classes
        )}
        {...props}
      />
    );
  }
);

HolographicInput.displayName = 'HolographicInput';
