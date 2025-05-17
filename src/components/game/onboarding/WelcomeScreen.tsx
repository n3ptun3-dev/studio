
"use client";
import React, { useEffect, useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { HolographicButton } from '@/components/game/shared/HolographicPanel';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Wifi } from 'lucide-react'; // Changed from Zap
import { cn } from '@/lib/utils';

export function WelcomeScreen() {
  const { setOnboardingStep } = useAppContext();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 2000); // Increased duration to 2 seconds
    return () => clearTimeout(timer);
  }, []);

  if (!showContent) {
    return (
      // This div will be centered by its parent <main> in page.tsx
      <div className="flex flex-col items-center justify-center text-center flex-grow">
        <Wifi className="w-16 h-16 md:w-20 md:h-20 text-primary animate-pulse icon-glow" />
        <p className="mt-4 text-xl font-orbitron holographic-text">Establishing Secure Connection...</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-full max-w-2xl p-4 md:p-6 flex flex-col flex-grow h-0 overflow-hidden", // Use flex-grow and h-0
        "holographic-panel"
      )}
    >
      <h1 className="text-3xl md:text-4xl font-orbitron mb-4 text-center holographic-text flex-shrink-0">
        Welcome Agent
      </h1>

      <h2 className="text-lg font-semibold holographic-text text-primary mb-2 flex-shrink-0">
        Mission Briefing:
      </h2>

      <ScrollArea className="flex-grow min-h-0 mb-6 p-1 border border-primary/30 rounded-md">
        <div className="p-3 font-rajdhani text-sm md:text-base space-y-2 text-muted-foreground">
          <ul className="list-disc list-inside space-y-1">
            <li>The Pi Network is now the backbone of a decentralized digital identity system globally.</li>
            <li>Within this system, two clandestine factions have formed: <span className="font-semibold text-foreground">The Cyphers</span> and <span className="font-semibold text-foreground">The Shadows</span>. You must join one of these factions.</li>
            <li>These factions are in conflict, but their actions are part of a larger war against a common enemy: NullChain.</li>
            <li>Your primary objective is to steal ELINT (electronic intelligence) from rival spies while protecting your own and to transfer ELINT to your faction's overall pool (HQ).</li>
            <li>The faction with the most ELINT at the end of a game cycle wins and could potentially earn a Pi payout based on Pi ad network revenue.</li>
          </ul>
        </div>
      </ScrollArea>

      <HolographicButton
        className="w-full text-lg py-3 mt-auto flex-shrink-0"
        onClick={() => setOnboardingStep('factionChoice')}
      >
        Proceed
      </HolographicButton>
    </div>
  );
}
