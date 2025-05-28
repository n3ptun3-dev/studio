// src/components/game/spyshop/StickyHeader.tsx
"use client";

import React, { useEffect, useState, RefObject } from 'react';
import { X } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';

interface StickyHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  scrollTargetRef: RefObject<HTMLDivElement>;
}

// Simple throttle utility function
const throttle = (func: (...args: any[]) => void, limit: number) => {
  let inThrottle: boolean;
  let lastResult: any;
  let lastRan: number;

  return function(this: any, ...args: any[]) {
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      lastRan = Date.now();
      inThrottle = true;
    } else {
      clearTimeout(lastResult);
      lastResult = setTimeout(function() {
        if ((Date.now() - lastRan) >= limit) {
          func.apply(context, args);
          lastRan = Date.now();
          inThrottle = false; // Reset throttle after execution
        }
      }, limit - (Date.now() - lastRan));
    }
  };
};


export function StickyHeader({ activeTab, setActiveTab, scrollTargetRef }: StickyHeaderProps) {
  const { closeSpyShop } = useAppContext();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollTargetRef.current) {
        // We can even make the threshold a bit larger, say 70px, for smoother transition
        const currentScrollPos = scrollTargetRef.current.scrollTop;
        setIsScrolled(currentScrollPos > 70); // Slightly increased threshold
      }
    };

    // Throttle the scroll handler to run at most every 100ms
    const throttledHandleScroll = throttle(handleScroll, 100);

    const scrollElement = scrollTargetRef.current;

    // Attach scroll listener to the specific div element
    if (scrollElement) {
      scrollElement.addEventListener('scroll', throttledHandleScroll);
    }

    return () => {
      // Clean up the event listener
      if (scrollElement) {
        scrollElement.removeEventListener('scroll', throttledHandleScroll);
      }
    };
  }, [scrollTargetRef]);

  return (
    <div className={`sticky top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out
                    bg-blue-950 bg-opacity-95 backdrop-blur-md border-b border-sky-700
                    ${isScrolled ? 'py-2 px-4' : 'py-8 px-8'}`}>
      <div className="flex justify-between items-center w-full max-w-6xl mx-auto">
        {/* Close Button */}
        <button
          onClick={closeSpyShop}
          className="p-2 text-sky-400 hover:text-sky-200 transition-colors duration-300 bg-transparent border-2 border-sky-600 hover:border-sky-400 rounded-md"
        >
          <X className="w-8 h-8" />
        </button>

        {/* Dynamic Title - Responsive */}
        <div className={`transition-all duration-300 ease-in-out text-sky-400 text-center
                         ${isScrolled ? 'text-xl sm:text-2xl font-bold' : 'text-3xl sm:text-4xl lg:text-5xl font-extrabold'}`}>
          QUANTUM INDUSTRIES
        </div>

        {/* Tab Buttons - adjusted for smaller screens */}
        <div className="flex space-x-2 sm:space-x-4">
          <button
            onClick={() => setActiveTab('shop')}
            className={`px-3 py-2 text-sm sm:text-base font-semibold border-b-2 ${activeTab === 'shop' ? 'border-sky-400 text-sky-400' : 'border-transparent text-gray-400 hover:text-sky-200'} transition-colors duration-300`}
          >
            Products
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`px-3 py-2 text-sm sm:text-base font-semibold border-b-2 ${activeTab === 'about' ? 'border-sky-400 text-sky-400' : 'border-transparent text-gray-400 hover:text-sky-200'} transition-colors duration-300`}
          >
            About
          </button>
        </div>
      </div>
    </div>
  );
}