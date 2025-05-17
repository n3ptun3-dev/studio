
"use client";
import React from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';

export function WelcomeScreen() {
  const { setOnboardingStep, isLoading: isAppLoading, isTODWindowOpen } = useAppContext();
  const [showContent, setShowContent] = React.useState(false);

  React.useEffect(() => {
    console.log('[WelcomeScreen] Mounted/Updated. isTODWindowOpen:', isTODWindowOpen, 'isAppLoading:', isAppLoading);

    const timer = setTimeout(() => {
      setShowContent(true);
    }, 2000); // Extended duration
    return () => clearTimeout(timer);
  }, [isTODWindowOpen, isAppLoading]);

  if (!showContent) {
    return (
      <div className="flex flex-col flex-grow items-center justify-center text-center">
        <Wifi className="w-16 h-16 md:w-20 md:h-20 text-primary animate-pulse icon-glow" />
        <p className="mt-4 text-xl font-orbitron holographic-text">Establishing Secure Connection...</p>
      </div>
    );
  }

  // Simplified content for debugging button
  return (
    <div className="w-full max-w-2xl p-6 flex flex-col items-center justify-center text-foreground mx-auto my-auto bg-neutral-900/80 backdrop-blur-sm rounded-lg shadow-xl border border-neutral-700">
      <h1 className="text-3xl md:text-4xl font-orbitron mb-4 text-center text-green-400" style={{textShadow: '0 0 5px currentColor'}}>
        Welcome Agent (Test Version)
      </h1>
      <div className="mb-6 font-rajdhani text-sm md:text-base space-y-2 text-neutral-300">
        <p>This is a simplified Welcome Screen to test button interactivity.</p>
        <p>The main TODWindow should be closed (isTODWindowOpen: {isTODWindowOpen ? 'true' : 'false'}).</p>
      </div>
      <button
        id="proceed-button-test"
        className="w-full text-lg py-3 mt-auto flex-shrink-0 bg-green-500 hover:bg-green-600 rounded text-white font-semibold focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75"
        onClick={() => {
          console.log('[WelcomeScreen] "Proceed (Test)" button clicked!');
          setOnboardingStep('factionChoice');
        }}
      >
        Proceed (Test)
      </button>
    </div>
  );
}
