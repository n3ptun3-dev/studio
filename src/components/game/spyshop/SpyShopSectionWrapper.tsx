// src/components/game/spyshop/SpyShopSectionWrapper.tsx
"use client"; // <--- This marks it as a client component!

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppContext } from '@/contexts/AppContext';
import { QuantumIndustriesRedesignedShop } from '@/components/game/spyshop/QuantumIndustriesRedesignedShop';

export function SpyShopSectionWrapper() {
  const { isSpyShopOpen } = useAppContext(); // Now safe to call in a client component

  return (
    <AnimatePresence>
      {isSpyShopOpen && (
        <motion.div
          key="spy-shop-portal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[99] flex items-center justify-center bg-black/80 backdrop-blur-sm"
        >
          <QuantumIndustriesRedesignedShop /> {/* <-- RENDER YOUR NEW SHOP COMPONENT */}
        </motion.div>
      )}
    </AnimatePresence>
  );
}