
"use client";

import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
// import { HolographicPanel } from './HolographicPanel'; // Still keep this out for maximum debug simplicity

interface TODWindowProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode; // Children prop is still here
  size?: 'default' | 'large';
}

export function TODWindow({ isOpen, onClose, title, children, size = 'default' }: TODWindowProps) {
  if (!isOpen) {
    console.log('[TODWindow] Rendering null because isOpen is false.');
    return null;
  }
  console.log('[TODWindow] Rendering with isOpen true. Title:', title);

  // DEBUG: Drastically simplified rendering, no children initially for this test
  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex items-center justify-center bg-black/70"
      )}
      onClick={onClose} 
    >
      <div
        className={cn(
          "relative m-4 p-4 overflow-auto scrollbar-hide z-[10000]",
          "w-[calc(100vw-80px)] max-w-[600px]",
          "h-[calc(100vh-100px)] max-h-[600px]",
          "bg-purple-600 border-4 border-lime-400 text-white" // EXTREMELY visible debug style
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-lime-300">
          <h2 className="text-xl font-orbitron">{title}</h2>
          <button onClick={onClose} className="p-1 text-lime-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Render children directly for this debug step */}
        <div className="text-black bg-white p-2"> {/* Ensure children content is visible if any */}
           {children} {/* Children are rendered here */}
        </div>
      </div>
    </div>
  );
}

    