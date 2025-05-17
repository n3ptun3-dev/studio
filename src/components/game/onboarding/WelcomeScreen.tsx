
"use client";

import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { HolographicButton, HolographicPanel } from '@/components/game/shared/HolographicPanel';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Wifi } from 'lucide-react'; // Changed from Zap to Wifi
import { cn } from '@/lib/utils';

export function WelcomeScreen() {
  const { setOnboardingStep, isLoading: isAppLoading, isTODWindowOpen } = useAppContext();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    console.log('[WelcomeScreen] Mounted/Updated. isTODWindowOpen:', isTODWindowOpen, 'isAppLoading:', isAppLoading);
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 2000); // Extended to 2000ms
    return () => clearTimeout(timer);
  }, []); // Removed dependencies to ensure timer runs once on mount

  if (!showContent) {
    // "Establishing Secure Connection..." state - centered
    return (
      <div className="flex flex-col flex-grow items-center justify-center text-center">
        <Wifi className="w-16 h-16 md:w-20 md:h-20 text-primary animate-pulse icon-glow" />
        <p className="mt-4 text-xl font-orbitron holographic-text">Establishing Secure Connection...</p>
      </div>
    );
  }

  // Main content state
  // HolographicPanel uses flex-grow and h-0 to fill space given by page.tsx's main container
  return (
    <HolographicPanel className="w-full max-w-2xl p-4 md:p-6 flex flex-col flex-grow h-0 overflow-hidden">
      <h1 className="text-3xl md:text-4xl font-orbitron mb-2 text-center holographic-text flex-shrink-0">
        Welcome Agent
      </h1>
      <h2 className="text-xl font-orbitron mb-3 text-center holographic-text text-primary flex-shrink-0">
        Mission Briefing:
      </h2>
      <ScrollArea className="flex-grow min-h-0 mb-4"> {/* flex-grow and min-h-0 are key */}
        <div className="space-y-2 text-muted-foreground font-rajdhani pr-2">
          <p>- The Pi Network is now the backbone of a decentralized digital identity system globally.</p>
          <p>- Within this system, two clandestine factions have formed: <span className="font-semibold text-foreground">The Cyphers</span> and <span className="font-semibold text-foreground">The Shadows</span>. You must join one of these factions.</p>
          <p>- These factions are in conflict, but their actions are part of a larger war against a common enemy: NullChain.</p>
          <p>- Your primary objective is to steal ELINT (electronic intelligence) from rival spies while protecting your own and to transfer ELINT to your faction's overall pool (HQ).</p>
          <p>- The faction with the most ELINT at the end of a game cycle wins and could potentially earn a Pi payout based on Pi ad network revenue.</p>
        </div>
      </ScrollArea>
      <HolographicButton
        id="proceed-button" // Added id for clarity
        className="w-full text-lg py-3 mt-auto flex-shrink-0" // mt-auto pushes to bottom
        onClick={() => {
          console.log('[WelcomeScreen] "Proceed" button clicked!');
          setOnboardingStep('factionChoice');
        }}
      >
        Proceed
      </HolographicButton>
    </HolographicPanel>
  );
}
