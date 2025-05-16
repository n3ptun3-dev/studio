
"use client";

import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HolographicPanel } from './HolographicPanel';

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

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm",
        isOpen ? "animate-slide-in-right-tod" : "animate-slide-out-right-tod"
      )}
      onClick={onClose} 
    >
      <HolographicPanel
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
        
        <div className="flex-grow min-h-0 overflow-y-auto scrollbar-hide">
           {children}
        </div>
      </HolographicPanel>
    </div>
  );
}
