
"use client";
import { useAppContext } from '@/contexts/AppContext';
import { HolographicPanel, HolographicButton } from '@/components/game/shared/HolographicPanel';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

export function WelcomeScreen() {
  const { setOnboardingStep } = useAppContext();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (!showContent) {
    // This part is for the "Establishing Secure Connection..."
    // It's a direct child of 'main' in page.tsx which is items-center justify-center
    return (
        <HolographicPanel className="w-full max-w-md p-4 md:p-6 flex flex-col items-center justify-center">
          <div className="flex flex-col items-center text-center">
            <Zap className="w-24 h-24 text-primary animate-pulse icon-glow" />
            <p className="mt-4 text-xl font-orbitron holographic-text">Establishing Secure Connection...</p>
          </div>
        </HolographicPanel>
    );
  }

  // This HolographicPanel is the main content of the WelcomeScreen
  // It needs to take available height from its parent in page.tsx (main for onboarding)
  // 'main' is: flex flex-col items-center justify-center min-h-screen p-4 sm:p-6
  // So, HolographicPanel as a child of 'main' and with 'flex-grow h-0' should fill the available space within 'main's padding.
  return (
    <HolographicPanel
      className="w-full max-w-2xl p-4 md:p-6 flex flex-col flex-grow h-0 overflow-hidden"
      // h-0 with flex-grow is key for the panel to take available space from its flex parent.
      // overflow-hidden is key for ScrollArea to work.
    >
      <h1 className="text-3xl md:text-4xl font-orbitron mb-4 text-center holographic-text flex-shrink-0">
        Welcome Agent
      </h1>

      <h2 className="text-lg font-semibold holographic-text text-primary mb-2 flex-shrink-0">
        Mission Briefing:
      </h2>

      <ScrollArea className="flex-grow min-h-0 mb-6 p-1 border border-primary/30 rounded-md">
        {/* min-h-0 on ScrollArea is important for flex-grow to work correctly in a flex column */}
        <div className="p-3 font-rajdhani text-sm md:text-base space-y-2 text-muted-foreground">
          <ul className="list-disc list-inside space-y-1">
            <li>The Pi Network is now the backbone of a decentralized digital identity system globally.</li>
            <li>Within this system, two clandestine factions have formed: The Cyphers and The Shadows. You must join one of these factions.</li>
            <li>These factions are in conflict, but their actions are part of a larger war against a common enemy: NullChain.</li>
            <li>Your primary objective is to steal ELINT (electronic intelligence) from rival spies while protecting your own and to transfer ELINT to your faction's overall pool (HQ).</li>
            <li>The faction with the most ELINT at the end of a game cycle wins and could potentially earn a Pi payout based on Pi ad network revenue.</li>
            <li>The Pi Network is now the backbone of a decentralized digital identity system globally.</li>
            <li>Within this system, two clandestine factions have formed: The Cyphers and The Shadows. You must join one of these factions.</li>
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
    </HolographicPanel>
  );
}
