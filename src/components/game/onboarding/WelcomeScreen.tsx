
"use client";
import { useEffect, useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { HolographicPanel, HolographicButton } from '@/components/game/shared/HolographicPanel';
import { ScrollArea } from '@/components/ui/scroll-area'; // Import ScrollArea
import { Zap } from 'lucide-react'; 

export function WelcomeScreen() {
  const { setOnboardingStep } = useAppContext();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Simulate initial animation or loading if needed
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 500); // Short delay for content to appear
    return () => clearTimeout(timer);
  }, []);

  if (!showContent) {
    return (
      <div className="w-full max-w-2xl mx-auto p-4 flex flex-col items-center justify-center h-full">
        <div className="flex flex-col items-center text-center">
          <Zap className="w-24 h-24 text-primary animate-pulse icon-glow" />
          <p className="mt-4 text-xl font-orbitron holographic-text">Establishing Secure Connection...</p>
        </div>
      </div>
    );
  }

  return (
    <HolographicPanel className="w-full max-w-2xl mx-auto p-4 md:p-6 flex flex-col">
      <h1 className="text-3xl md:text-4xl font-orbitron mb-4 text-center holographic-text">Welcome Agent</h1>
      
      <ScrollArea className="flex-grow h-64 md:h-80 mb-6 p-1 border border-primary/30 rounded-md">
        <div className="p-3 font-rajdhani text-sm md:text-base space-y-2 text-muted-foreground">
          <h2 className="text-lg font-semibold holographic-text text-primary">Mission Briefing:</h2>
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
        className="w-full text-lg py-3 mt-auto" // mt-auto to push to bottom if panel has fixed height or parent is flex-col
        onClick={() => setOnboardingStep('factionChoice')}
      >
        Proceed
      </HolographicButton>
    </HolographicPanel>
  );
}
