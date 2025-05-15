
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
    // This HolographicPanel is for the "Establishing Secure Connection..." state.
    // Its parent in page.tsx uses items-center justify-center for this initial loading state.
    return (
      <HolographicPanel className="w-full max-w-2xl p-4 md:p-6 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center text-center">
          <Zap className="w-24 h-24 text-primary animate-pulse icon-glow" />
          <p className="mt-4 text-xl font-orbitron holographic-text">Establishing Secure Connection...</p>
        </div>
      </HolographicPanel>
    );
  }

  // This HolographicPanel is the main content of the WelcomeScreen.
  // It's the root element returned. Its parent ('main' in page.tsx) has 'items-center',
  // so this panel (with 'max-w-2xl') will be centered.
  // 'flex flex-col overflow-hidden' and 'max-h-[calc(100vh-var(--main-padding-y))]' (approx) helps constrain its height.
  // The variable --main-padding-y would conceptually be 4rem (pt-8 + pb-8 from main).
  // A simpler approach is max-h-[calc(100vh-4rem)] if its direct parent in page.tsx handles the outer page padding.
  // Since page.tsx <main> has pt-8 pb-8, this panel can try to take full height of that padded area.
  return (
    <HolographicPanel 
      className="w-full max-w-2xl p-4 md:p-6 flex flex-col overflow-hidden my-4"
      // This style aims to make the panel fit within the viewport, accounting for main's padding and its own margin
      style={{ maxHeight: 'calc(100vh - (2 * 1rem) - (2 * 2rem))' }} // my-4 (2rem total) + main's pt/pb-8 (4rem total) = 6rem. Adjust as needed.
    >
      <h1 className="text-3xl md:text-4xl font-orbitron mb-4 text-center holographic-text flex-shrink-0">
        Welcome Agent
      </h1>
      
      <h2 className="text-lg font-semibold holographic-text text-primary mb-2 flex-shrink-0">
        Mission Briefing:
      </h2>
      
      {/* ScrollArea uses flex-grow and min-h-0 to take space between titles and button */}
      <ScrollArea className="flex-grow min-h-0 mb-6 p-1 border border-primary/30 rounded-md">
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
        className="w-full text-lg py-3 mt-auto flex-shrink-0"
        onClick={() => setOnboardingStep('factionChoice')}
      >
        Proceed
      </HolographicButton>
    </HolographicPanel>
  );
}
