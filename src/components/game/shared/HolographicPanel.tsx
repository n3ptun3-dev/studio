
import type { HTMLAttributes, ReactNode } from 'react';
import React from 'react'; // Ensure React is imported for JSX
import { cn } from "@/lib/utils";
import type { Theme } from '@/contexts/ThemeContext';

interface HolographicPanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  glassmorphism?: boolean;
  explicitTheme?: Theme;
}

export function HolographicPanel({ children, className, glassmorphism = false, explicitTheme, ...props }: HolographicPanelProps) {
  const themeClass = explicitTheme ? `theme-${explicitTheme}` : '';
  return (
    <div
      className={cn(
        "holographic-panel p-4 md:p-6", // Base holographic-panel class
        glassmorphism && "bg-opacity-30 backdrop-blur-md border-opacity-50",
        themeClass, // Apply explicit theme class
        className // Allow additional classes to be passed
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface HolographicButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  explicitTheme?: Theme;
}

export function HolographicButton({ children, className, explicitTheme, ...props }: HolographicButtonProps) {
  const themeClass = explicitTheme ? `theme-${explicitTheme}` : '';
  return (
    <button
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

interface HolographicInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  explicitTheme?: Theme;
}

export function HolographicInput({ className, explicitTheme, ...props }: HolographicInputProps) {
  const themeClass = explicitTheme ? `theme-${explicitTheme}` : '';
  return (
    <input
      className={cn(
        "holographic-input", // Base holographic-input class
        themeClass, // Apply explicit theme class
        className // Allow additional classes
      )}
      {...props}
    />
  );
}
