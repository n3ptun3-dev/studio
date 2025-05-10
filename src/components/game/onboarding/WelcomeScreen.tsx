
"use client";
import { useEffect, useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { HolographicPanel, HolographicButton } from '@/components/game/shared/HolographicPanel';
import { Zap } from 'lucide-react'; // For network lines

export function WelcomeScreen() {
  const { setOnboardingStep } = useAppContext();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Simulate initial animation
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 1500); // Animation duration
    // Play sound effect (mock)
    console.log("Playing network charging/pulse sound");
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto p-4 flex flex-col items-center justify-center h-full">
      {!showContent ? (
        <div className="flex flex-col items-center text-center">
          <Zap className="w-24 h-24 text-primary animate-pulse icon-glow" />
          <p className="mt-4 text-xl font-orbitron holographic-text">Network Syncing...</p>
        </div>
      ) : (
        <HolographicPanel className="w-full text-center">
          <h1 className="text-4xl font-orbitron mb-8 holographic-text">Choose a Faction</h1>
          <HolographicButton 
            className="w-full text-lg py-3"
            onClick={() => setOnboardingStep('factionChoice')}
          >
            Proceed
          </HolographicButton>
        </HolographicPanel>
      )}
    </div>
  );
}

    