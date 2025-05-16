
"use client";

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HolographicPanel, HolographicButton } from './HolographicPanel';

interface TODWindowProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'default' | 'large'; // Example sizes
}

export function TODWindow({ isOpen, onClose, title, children, size = 'default' }: TODWindowProps) {
  const [isRendered, setIsRendered] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
    } else {
      // Delay unmounting for animation
      const timer = setTimeout(() => setIsRendered(false), 250); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isRendered) {
    return null;
  }

  const windowWidth = size === 'large' ? 'w-[calc(100vw-80px)] max-w-[1000px]' : 'w-[calc(100vw-80px)] max-w-[600px]';
  const windowHeight = size === 'large' ? 'h-[calc(100vh-100px)] max-h-[800px]' : 'h-[calc(100vh-100px)] max-h-[600px]';


  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-opacity duration-200",
        // isOpen ? "opacity-100" : "opacity-0 pointer-events-none" // DEBUG: Temporarily always visible
        "opacity-100" 
      )}
      onClick={onClose} // Optional: close on overlay click
    >
      <HolographicPanel
        className={cn(
          "relative flex flex-col m-4 p-0 overflow-hidden",
          "fixed top-10 bottom-5 left-5 right-5", 
          "max-w-[calc(100vw-40px)] max-h-[calc(100vh-60px)]", 
          "transition-transform duration-200 ease-out",
          // isOpen ? "animate-slide-in-right-tod" : "animate-slide-out-right-tod", // DEBUG: Temporarily remove animation
          "bg-opacity-70 backdrop-blur-lg border-opacity-80",
          "bg-pink-500 border-4 border-yellow-300" // DEBUG: Highly visible style
        )}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside window
      >
        <div className="flex items-center justify-between p-3 border-b border-primary/30">
          <h2 className="text-xl font-orbitron holographic-text">{title}</h2>
          <HolographicButton onClick={onClose} variant="ghost" size="icon" className="!p-1">
            <X className="w-5 h-5" />
          </HolographicButton>
        </div>
        <div className="flex-grow p-4 overflow-y-auto scrollbar-hide">
          {children}
        </div>
      </HolographicPanel>
    </div>
  );
}
