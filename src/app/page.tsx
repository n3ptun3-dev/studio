"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
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
import React from 'react';

// Desired actual order: CommandCenter, Scanner, SpyShop, Vault
// For looping, sections will be: [Vault (clone), CC, Scanner, SpyShop, Vault, CC (clone)]

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
      const isNewUser = !playerStats.xp && !playerStats.elintReserves; 
      
      if (isNewUser) {
        addMessage({
          text: "Welcome, Agent. HQ guidance protocol initiated. Familiarize yourself with the Tactical Overlay Device. Your first objective: activate the Network Tap in the Command Center.",
          type: 'hq',
          isPinned: true,
        });
        addMessage({ text: `Daily Team Code: ${dailyTeamCode}`, type: 'system', isPinned: true });
        setIsLoading(false);
      } else {
        const welcomeInput: WelcomeMessageInput = {
          playerName: playerSpyName || "Agent",
          faction: faction,
          elintReserves: playerStats.elintReserves,
          networkActivity: "Medium", 
          vaultDefenses: "Holding", 
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


  const handleScroll = useCallback(() => {
    if (todContainerRef.current) {
      const scrollLeft = todContainerRef.current.scrollLeft;
      const scrollWidth = todContainerRef.current.scrollWidth;
      const clientWidth = todContainerRef.current.clientWidth; 

      setParallaxOffset(scrollLeft);

      if (clientWidth === 0) return; 

      if (scrollLeft <= 0.1) { 
        todContainerRef.current.scrollLeft = scrollWidth - (2 * clientWidth) + 1; 
      } else if (scrollLeft >= scrollWidth - clientWidth - 0.1) {
        todContainerRef.current.scrollLeft = clientWidth - 1;
      }
    }
  }, []); // setParallaxOffset is stable

  useEffect(() => {
    const container = todContainerRef.current;
    // Only setup scroll when TOD is active, not loading, and the container element exists.
    if (onboardingStep === 'tod' && !isAppLoading && container) {
      const setInitialScrollPosition = () => {
        if (todContainerRef.current) { // Re-check ref in case of unmount during async operation
          const currentContainer = todContainerRef.current;
          // Each .tod-section is 100vw.
          // The container's clientWidth should also be 100vw if it fills the screen.
          const sectionWidth = currentContainer.clientWidth;

          if (sectionWidth > 0) {
            // Scroll to the second section (index 1, which is Command Center)
            currentContainer.scrollLeft = sectionWidth;
          } else {
            // This case indicates a layout timing issue.
            // Retry on the next animation frame if clientWidth is still not available.
            console.warn("TOD container clientWidth is 0 during initial scroll setup. Retrying on next frame.");
            requestAnimationFrame(() => {
              if (todContainerRef.current) {
                todContainerRef.current.scrollLeft = todContainerRef.current.clientWidth;
              }
            });
          }
        }
      };

      // Use requestAnimationFrame to ensure DOM is painted and dimensions are available.
      const animationFrameId = requestAnimationFrame(setInitialScrollPosition);
      
      container.addEventListener('scroll', handleScroll, { passive: true });

      return () => {
        cancelAnimationFrame(animationFrameId);
        // Use the 'container' variable captured at effect run time for removal
        // to avoid issues if todContainerRef.current changes.
        if (container) { 
          container.removeEventListener('scroll', handleScroll);
        }
      };
    }
  }, [onboardingStep, isAppLoading, handleScroll]);


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
    <VaultSection key="vault-clone-start" parallaxOffset={parallaxOffset} />,
    <CommandCenterSection key="command-center-actual" parallaxOffset={parallaxOffset} />,
    <ScannerSection key="scanner-actual" parallaxOffset={parallaxOffset} />,
    <SpyShopSection key="spy-shop-actual" parallaxOffset={parallaxOffset} />,
    <VaultSection key="vault-actual" parallaxOffset={parallaxOffset} />,
    <CommandCenterSection key="command-center-clone-end" parallaxOffset={parallaxOffset} />,
  ];

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      <ParallaxBackground />
      
      <div 
        className="parallax-layer z-[5]" 
        style={{ 
          transform: `translateX(-${parallaxOffset * 0.5}px)`,
          width: `${sectionComponents.length * 100 * 0.5 + 100}vw`, 
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
      >
        {sectionComponents.map((SectionComponentInstance, index) => (
          <div key={SectionComponentInstance.key || `tod-section-${index}`} className="tod-section">
            {SectionComponentInstance}
          </div>
        ))}
      </div>
    </main>
  );
}

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
  if (!document.head.querySelector('style[data-scrollbar-hide="true"]')) {
    styleSheet.setAttribute('data-scrollbar-hide', 'true');
    document.head.appendChild(styleSheet);
  }
}