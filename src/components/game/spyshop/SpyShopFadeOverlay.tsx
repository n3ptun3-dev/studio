// src/components/game/spyshop/SpyShopFadeOverlay.tsx
"use client"; // <--- This marks it as a client component!

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppContext } from '@/contexts/AppContext';

export function SpyShopFadeOverlay() {
  const { isSpyShopActive } = useAppContext(); // Now safe to call in a client component

  return (
    <AnimatePresence>
      {isSpyShopActive && (
        <motion.div
          key="global-fade-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: "easeInOut" }}
          className="fixed inset-0 bg-black z-[100]"
        />
      )}
    </AnimatePresence>
  );
}