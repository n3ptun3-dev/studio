
"use client";

import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
// import { HolographicPanel, HolographicButton } from './HolographicPanel'; // DEBUG: Temporarily removed

interface TODWindowProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'default' | 'large';
}

export function TODWindow({ isOpen, onClose, title, children, size = 'default' }: TODWindowProps) {
  if (!isOpen) { // Re-instated this guard
    return null;
  }

  // DEBUG: Drastically simplified rendering
  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex items-center justify-center bg-black/70"
        // No conditional hidden class, relies on isOpen guard above
      )}
      onClick={onClose} // Allow closing by clicking overlay
    >
      <div
        className={cn(
          "relative m-4 p-4 overflow-auto scrollbar-hide z-[10000]",
          "w-[calc(100vw-80px)] max-w-[600px]", // Default size
          "h-[calc(100vh-100px)] max-h-[600px]", // Default size
          "bg-purple-600 border-4 border-lime-400 text-white" // EXTREMELY visible debug style
        )}
        onClick={(e) => e.stopPropagation()} // Prevent clicks inside from closing
      >
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-lime-300">
          <h2 className="text-xl font-orbitron">{title}</h2>
          <button onClick={onClose} className="p-1 text-lime-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Render children directly for this debug step */}
        <div>
          {children}
        </div>
      </div>
    </div>
  );
}
