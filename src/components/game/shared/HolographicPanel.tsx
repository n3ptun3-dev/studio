import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from "@/lib/utils";

interface HolographicPanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  glassmorphism?: boolean; // For a slightly more solid, blurred glass look
}

export function HolographicPanel({ children, className, glassmorphism = false, ...props }: HolographicPanelProps) {
  return (
    <div
      className={cn(
        "holographic-panel p-4 md:p-6", // Uses styles from globals.css
        glassmorphism && "bg-opacity-30 backdrop-blur-md border-opacity-50", // More pronounced glass effect
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function HolographicButton({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "holographic-button", // Uses styles from globals.css
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function HolographicInput({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "holographic-input", // Uses styles from globals.css
        className
      )}
      {...props}
    />
  );
}

    