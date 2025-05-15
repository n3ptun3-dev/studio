
"use client";
import { useEffect, useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { HolographicPanel, HolographicButton } from '@/components/game/shared/HolographicPanel';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Zap } from 'lucide-react';

export function WelcomeScreen() {
  const { setOnboardingStep } = useAppContext();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 500); // Keep a short delay for the "syncing" effect
    return () => clearTimeout(timer);
  }, []);

  if (!showContent) {
    return (
      // This div will grow to fill available vertical space and center its child
      <div className="w-full p-4 md:p-6 flex flex-grow items-center justify-center">
        <HolographicPanel className="w-full max-w-2xl p-4 md:p-6 flex flex-col items-center justify-center"> {/* Removed h-full */}
          <div className="flex flex-col items-center text-center">
            <Zap className="w-24 h-24 text-primary animate-pulse icon-glow" />
            <p className="mt-4 text-xl font-orbitron holographic-text">Establishing Secure Connection...</p>
          </div>
        </HolographicPanel>
      </div>
    );
  }

  return (
    <div className="w-full p-4 md:p-6 flex justify-center">
      <HolographicPanel className="w-full max-w-2xl p-4 md:p-6 flex flex-col">
        <h1 className="text-3xl md:text-4xl font-orbitron mb-4 text-center holographic-text">Welcome Agent</h1>
        
        <h2 className="text-lg font-semibold holographic-text text-primary mb-2 sticky top-0 bg-card/80 backdrop-blur-sm py-2 z-10">Mission Briefing:</h2>
        
        <ScrollArea className="flex-grow h-60 md:h-72 mb-6 p-1 border border-primary/30 rounded-md">
          <div className="p-3 font-rajdhani text-sm md:text-base space-y-2 text-muted-foreground">
            <ul className="list-disc list-inside space-y-1">
              <li>The Pi Network is now the backbone of a decentralized digital identity system globally.</li>
              <li>Within this system, two clandestine factions have formed: The Cyphers and The Shadows. You must join one of these factions.</li>
              <li>These factions are in conflict, but their actions are part of a larger war against a common enemy: NullChain.</li>
              <li>Your primary objective is to steal ELINT (electronic intelligence) from rival spies while protecting your own and to transfer ELINT to your faction's overall pool (HQ).</li>
              <li>The faction with the most ELINT at the end of a game cycle wins and could potentially earn a Pi payout based on Pi ad network revenue.</li>
            </ul>
          </div>
        </ScrollArea>

        <HolographicButton
          className="w-full text-lg py-3 mt-auto"
          onClick={() => setOnboardingStep('factionChoice')}
        >
          Proceed
        </HolographicButton>
      </HolographicPanel>
    </div>
  );
}
