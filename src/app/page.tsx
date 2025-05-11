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

  const sectionComponents = React.useMemo(() => [
    <VaultSection key="vault-clone-start" parallaxOffset={parallaxOffset} />,
    <CommandCenterSection key="command-center-actual" parallaxOffset={parallaxOffset} />,
    <ScannerSection key="scanner-actual" parallaxOffset={parallaxOffset} />,
    <SpyShopSection key="spy-shop-actual" parallaxOffset={parallaxOffset} />,
    <VaultSection key="vault-actual" parallaxOffset={parallaxOffset} />,
    <CommandCenterSection key="command-center-clone-end" parallaxOffset={parallaxOffset} />,
  ], [parallaxOffset]);


  const handleScroll = useCallback(() => {
    if (todContainerRef.current) {
      const scrollLeft = todContainerRef.current.scrollLeft;
      const scrollWidth = todContainerRef.current.scrollWidth;
      const clientWidth = todContainerRef.current.clientWidth; 

      setParallaxOffset(scrollLeft);

      if (clientWidth === 0) return; 

      const numSections = sectionComponents.length; // Should be 6

      // Check if at the far left (scrolled past the first actual item, into the left clone)
      if (scrollLeft <= clientWidth * 0.1) { 
        // We are at the first cloned Vault section (index 0). Jump to the actual Vault section (index 4).
        // Index 4 is at scrollLeft = 4 * clientWidth
        todContainerRef.current.scrollLeft = (numSections - 2) * clientWidth + 1; 
      } 
      // Check if at the far right (scrolled past the last actual item, into the right clone)
      else if (scrollLeft >= scrollWidth - clientWidth - (clientWidth * 0.1)) {
        // We are at the last cloned CC section (index 5). Jump to the actual CC section (index 1).
        // Index 1 is at scrollLeft = 1 * clientWidth
        todContainerRef.current.scrollLeft = clientWidth -1;
      }
    }
  }, [setParallaxOffset, sectionComponents.length]); 

  useEffect(() => {
    // This effect handles setting the initial scroll position and attaching/detaching the scroll listener.
    // It should run when onboardingStep is 'tod' and the app is no longer loading and the component is mounted.
    // We use setInterval to repeatedly attempt to set the scroll position until it's correct.

    let intervalId: NodeJS.Timeout | null = null;
    const maxAttempts = 20; // Maximum number of attempts to set scroll
    let attempts = 0;

    const setInitialScrollPosition = () => {
      const container = todContainerRef.current;
      if (container && container.clientWidth > 0) {
        const sectionWidth = container.clientWidth;
        console.log(`Attempting to set initial scroll. clientWidth: ${sectionWidth}`);

        // Log details of each section
        const sectionElements = container.querySelectorAll('.tod-section');
        console.log(`Scroll Width: ${container.scrollWidth}`);
        sectionElements.forEach((element, index) => {
          console.log(`Section ${index}: offsetLeft=${(element as HTMLElement).offsetLeft}, clientWidth=${(element as HTMLElement).clientWidth}`);
        });

        // The target scrollLeft is the offset of the Command Center section (index 1)
        const targetScrollLeft = sectionWidth;

        container.scrollLeft = targetScrollLeft;

        // Check if scrollLeft is close to the target (allowing for potential floating point inaccuracies)
        if (Math.abs(container.scrollLeft - targetScrollLeft) < 1) {
          console.log(`Initial scroll successfully set to: ${container.scrollLeft}`);
          // Stop attempting and attach the scroll listener
          if (intervalId !== null) clearInterval(intervalId);
          container.addEventListener('scroll', handleScroll, { passive: true });
        } else if (attempts < maxAttempts) {
          // If not successful and max attempts not reached, continue trying
          console.log(`Initial scroll set to: ${container.scrollLeft}. Expected: ${targetScrollLeft}. Attempt ${attempts + 1}/${maxAttempts}. Retrying...`);
          attempts++;
        } else {
          console.warn(`Failed to set initial scroll position after ${maxAttempts} attempts.`);
          if (intervalId !== null) clearInterval(intervalId);
        }
      } else {
        // If ref is not available yet, wait for the next render cycle with a small delay
        const timeoutId = setTimeout(() => {
          if (todContainerRef.current) {
            attemptSetInitialScroll();
          }
        }, 50); // Small delay to allow ref to be available
        return () => clearTimeout(timeoutId); // Cleanup the timeout if component unmounts
      }

      return () => {
        // Cleanup function for the effect
        // Remove the scroll event listener
        const container = todContainerRef.current;
        if (container) {
          container.removeEventListener('scroll', handleScroll);
        }
        // Clear the interval if it's active
        if (intervalId !== null) {
          clearInterval(intervalId);
        }
      };
    };

    // Start attempting to set the initial scroll position when the conditions are met
    if (onboardingStep === 'tod' && !isAppLoading && isMounted) {
      // Set an interval to repeatedly check and set the scroll position
      intervalId = setInterval(setInitialScrollPosition, 50); // Attempt every 50ms

      return () => {
        // Cleanup: remove event listener and clear interval
        const container = todContainerRef.current;
        if (container) { // Check if container is still available on cleanup
          container.removeEventListener('scroll', handleScroll);
        }
      };
    }
  }, [onboardingStep, isAppLoading, handleScroll]);


  if (!isMounted || isAppLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <ParallaxBackground parallaxOffset={parallaxOffset} />
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
        <ParallaxBackground parallaxOffset={parallaxOffset} />
        {renderOnboarding()}
        {showAuthPrompt && <AuthPromptModal onClose={() => setShowAuthPrompt(false)} />}
      </main>
    );
  }
  
  return (
    <main className="relative h-screen w-screen overflow-hidden">
      <ParallaxBackground parallaxOffset={parallaxOffset} />
      
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
        className="tod-scroll-container absolute inset-0 z-10 overflow-x-auto overflow-y-hidden scrollbar-hide"
      >
        {/* Inspect the CSS of this div and its parent elements in the browser dev tools for anything interfering with horizontal scrolling. */}
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