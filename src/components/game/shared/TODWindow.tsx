
"use client";

import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HolographicPanel } from './HolographicPanel'; // Restore for styling if needed
import { CodenameInput } from '../onboarding/CodenameInput'; // Example content

interface TODWindowProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'default' | 'large';
}

export function TODWindow({ isOpen, onClose, title, children, size = 'default' }: TODWindowProps) {
  console.log('[TODWindow] Component function executing. isOpen:', isOpen, "Title:", title, "Children:", children);

  if (!isOpen) {
    console.log('[TODWindow] Rendering null because isOpen is false.');
    return null;
  }
  console.log('[TODWindow] Rendering with isOpen true. Title:', title);

  // Using EXTREMELY visible debug style for the outermost div
  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex items-center justify-center bg-black/70", // Dimmed background
        // isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none", // Control visibility
        // "transition-opacity duration-200 ease-in-out"
      )}
      onClick={onClose} // Click outside to close
    >
      {/* This is the actual window panel with debug styles */}
      <div
        className={cn(
          "relative m-4 p-4 overflow-auto scrollbar-hide z-[10000]",
          "w-[calc(100vw-80px)] max-w-[600px]", // Responsive width
          "h-[calc(100vh-100px)] max-h-[600px]", // Responsive height
          // EXTREMELY visible debug style for the panel
          "bg-purple-600 border-4 border-lime-400 text-white" 
          // isOpen ? "animate-slide-in-right-tod" : "animate-slide-out-right-tod" // Apply animations
        )}
        onClick={(e) => e.stopPropagation()} // Prevent click inside from closing
      >
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-lime-300">
          <h2 className="text-xl font-orbitron">{title}</h2>
          <button onClick={onClose} className="p-1 text-lime-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Render children directly */}
        <div className="text-black bg-white p-2"> {/* Ensure children content is visible if any */}
           {children}
        </div>
      </div>
    </div>
  );
}
