// src/components/game/spyshop/QuantumIndustriesShop.tsx
"use client";

import React from 'react';
import { HolographicButton } from '@/components/game/shared/HolographicPanel'; // Import HolographicButton
import { X } from 'lucide-react'; // Import the X icon for closing
import { useAppContext } from '@/contexts/AppContext'; // Import useAppContext to access close function

export function QuantumIndustriesShop() {
  const { closeSpyShop } = useAppContext(); // Get the close function from context

  return (
    <div className="w-full h-full bg-blue-950 text-white p-8 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Close Button */}
      <HolographicButton
        onClick={closeSpyShop} // Call the close function when clicked
        className="absolute top-4 right-4 z-10 p-2 text-sky-400 hover:text-sky-200"
        variant="ghost" // Use a ghost variant if available in HolographicButton, otherwise remove
      >
        <X className="w-6 h-6" />
      </HolographicButton>

      <h1 className="text-5xl font-bold mb-4 text-sky-400">Quantum Industries</h1>
      <h2 className="text-2xl text-gray-300 mb-8">Official Elint Heist Spy Shop</h2>
      <p className="text-lg text-center max-w-2xl">
        Welcome to the future of espionage gear! Browse our cutting-edge tech and upgrade your operations.
        (This is your new Spy Shop content!)
      </p>
      {/* You'll add your actual shop UI here */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[size:10px_10px] [background-image:linear-gradient(to_right,rgba(0,128,255,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,128,255,0.1)_1px,transparent_1px)] opacity-50"></div>
        <div className="absolute inset-0 bg-gradient-radial from-blue-700/20 to-transparent blur-3xl opacity-60"></div>
      </div>
    </div>
  );
}