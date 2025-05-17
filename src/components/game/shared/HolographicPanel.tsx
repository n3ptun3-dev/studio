
import type { HTMLAttributes, ReactNode } from 'react';
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
        "holographic-panel p-4 md:p-6",
        glassmorphism && "bg-opacity-30 backdrop-blur-md border-opacity-50",
        themeClass,
        className
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
        "holographic-button",
        themeClass,
        className
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
        "holographic-input",
        themeClass,
        className
      )}
      {...props}
    />
  );
}
