
"use client";

import { useEffect, useRef, useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { WelcomeScreen } from '@/components/game/onboarding/WelcomeScreen';
import { FactionChoiceScreen } from '@/components/game/onboarding/FactionChoiceScreen';
import { AuthPromptModal } from '@/components/game/onboarding/AuthPromptModal';
import { FingerprintScannerScreen } from '@/components/game/onboarding/FingerprintScannerScreen';
import { ParallaxBackground } from '@/components/game/shared/ParallaxBackground';
import { CommandCenterSection } from '@/components/game/tod/CommandCenterSection';
import { SpyShopSection } from '@/components/game/tod/SpyShopSection';
import { VaultSection } from '@/components/game/tod/VaultSection';
import { ScannerSection } from '@/components/game/tod/ScannerSection';
import { generateWelcomeMessage, type WelcomeMessageInput } from '@/ai/flows/welcome-message';
import { Button } from '@/components/ui/button'; // For TOD navigation if needed
import React from 'react';

const TOD_SECTION_ORDER = ['CommandCenter', 'SpyShop', 'Vault', 'Scanner'] as const;
type TODSectionName = typeof TOD_SECTION_ORDER[number];

export default function HomePage() {
  const { 
    onboardingStep, 
    setOnboardingStep, 
    isAuthenticated, 
    faction,
    playerSpyName,
    playerStats,
    addMessage,
    dailyTeamCode,
    setIsLoading,
    isLoading: isAppLoading,
   } = useAppContext();
  
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const todContainerRef = useRef<HTMLDivElement>(null);
  const [parallaxOffset, setParallaxOffset] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated && onboardingStep !== 'tod') {
      setOnboardingStep('fingerprint');
    }
  }, [isAuthenticated, onboardingStep, setOnboardingStep]);

  useEffect(() => {
    if (onboardingStep === 'tod' && isAuthenticated) {
      setIsLoading(true);
      // New user or first login of day logic
      const isNewUser = !playerStats.xp && !playerStats.elintReserves; // Simple check
      
      if (isNewUser) {
        addMessage({
          text: "Welcome, Agent. HQ guidance protocol initiated. Familiarize yourself with the Tactical Overlay Device. Your first objective: activate the Network Tap in the Command Center.",
          type: 'hq',
          isPinned: true,
        });
        addMessage({ text: `Daily Team Code: ${dailyTeamCode}`, type: 'system', isPinned: true });
        setIsLoading(false);
      } else {
        // Returning user - AI welcome message
        const welcomeInput: WelcomeMessageInput = {
          playerName: playerSpyName || "Agent",
          faction: faction,
          elintReserves: playerStats.elintReserves,
          networkActivity: "Medium", // Placeholder
          vaultDefenses: "Holding", // Placeholder
        };
        generateWelcomeMessage(welcomeInput)
          .then(response => {
            addMessage({ text: response.message, type: 'hq', isPinned: true });
            addMessage({ text: `Daily Team Code: ${dailyTeamCode}`, type: 'system', isPinned: true });
          })
          .catch(error => {
            console.error("Failed to generate welcome message:", error);
            addMessage({ text: "HQ Comms Error. Standard protocols active.", type: 'error', isPinned: true });
            addMessage({ text: `Daily Team Code: ${dailyTeamCode}`, type: 'system', isPinned: true });
          })
          .finally(() => setIsLoading(false));
      }
    }
  }, [onboardingStep, isAuthenticated, playerSpyName, faction, playerStats, addMessage, dailyTeamCode, setIsLoading]);


  const handleScroll = () => {
    if (todContainerRef.current) {
      const scrollLeft = todContainerRef.current.scrollLeft;
      const scrollWidth = todContainerRef.current.scrollWidth;
      const clientWidth = todContainerRef.current.clientWidth;
      const todSectionWidth = clientWidth; // Each section is 100vw

      setParallaxOffset(scrollLeft);

      // Looping logic
      if (scrollLeft <= 0.1) { // Slightly more than 0 to avoid flicker on some browsers
        // Scrolled to the beginning, jump to the end (visual clone of first item)
        todContainerRef.current.scrollLeft = scrollWidth - (2 * todSectionWidth) +1;
      } else if (scrollLeft >= scrollWidth - todSectionWidth - 0.1) {
        // Scrolled to the end, jump to the beginning (visual clone of last item)
        todContainerRef.current.scrollLeft = todSectionWidth -1;
      }
    }
  };

  useEffect(() => {
    const container = todContainerRef.current;
    if (container && onboardingStep === 'tod') {
      // Initial centering on Command Center (or Safe House, which is Command Center)
      // Command Center is the first *actual* section after the prepended clone for looping
      container.scrollLeft = container.clientWidth; 
      container.addEventListener('scroll', handleScroll, { passive: true });
    }
    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, [onboardingStep]);


  if (!isMounted || isAppLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <ParallaxBackground />
        <div className="animate-pulse text-2xl font-orbitron holographic-text">INITIALIZING TOD...</div>
      </div>
    );
  }
  
  const renderOnboarding = () => {
    switch (onboardingStep) {
      case 'welcome':
        return <WelcomeScreen />;
      case 'factionChoice':
        return <FactionChoiceScreen setShowAuthPrompt={setShowAuthPrompt} />;
      case 'fingerprint':
        return <FingerprintScannerScreen />;
      default:
        return null;
    }
  };

  if (onboardingStep !== 'tod') {
    return (
      <main className="relative flex flex-col items-center justify-center min-h-screen bg-background text-foreground overflow-hidden">
        <ParallaxBackground />
        {renderOnboarding()}
        {showAuthPrompt && <AuthPromptModal onClose={() => setShowAuthPrompt(false)} />}
      </main>
    );
  }
  
  const sectionComponents = [
    <ScannerSection key="scanner-clone-start" parallaxOffset={parallaxOffset} />,
    <CommandCenterSection key="command-center" parallaxOffset={parallaxOffset} />,
    <SpyShopSection key="spy-shop" parallaxOffset={parallaxOffset} />,
    <VaultSection key="vault" parallaxOffset={parallaxOffset} />,
    <ScannerSection key="scanner" parallaxOffset={parallaxOffset} />,
    <CommandCenterSection key="command-center-clone-end" parallaxOffset={parallaxOffset} />,
  ];


  return (
    <main className="relative h-screen w-screen overflow-hidden">
      <ParallaxBackground /> {/* Static background, z-index managed by component */}
      
      <div 
        className="parallax-layer z-[5]" 
        style={{ 
          transform: `translateX(-${parallaxOffset * 0.5}px)`,
          width: `${sectionComponents.length * 100 * 0.5}vw`, 
        }}
      >
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            hsl(var(--primary-hsl) / 0.2),
            hsl(var(--primary-hsl) / 0.2) 1px,
            transparent 1px,
            transparent 60px
          ),
          repeating-linear-gradient(
            -45deg,
            hsl(var(--primary-hsl) / 0.2),
            hsl(var(--primary-hsl) / 0.2) 1px,
            transparent 1px,
            transparent 60px
          )`
        }}></div>
      </div>

      <div 
        ref={todContainerRef} 
        className="tod-scroll-container absolute inset-0 z-10 snap-x snap-mandatory_if_needed overflow-x-auto overflow-y-hidden scrollbar-hide"
        // Removed: style={{ scrollBehavior: 'smooth' }} 
      >
        {sectionComponents.map((SectionComponentInstance, index) => (
          <div key={index} className="tod-section">
            {SectionComponentInstance}
          </div>
        ))}
      </div>
    </main>
  );
}

// Helper for scrollbar hiding
// You can add this to a global CSS or keep it here if specific
const scrollbarHideCss = `
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
  }
`;
if (typeof window !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = scrollbarHideCss;
  document.head.appendChild(styleSheet);
}
