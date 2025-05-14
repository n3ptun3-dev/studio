
"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { WelcomeScreen } from '@/components/game/onboarding/WelcomeScreen';
import { FactionChoiceScreen } from '@/components/game/onboarding/FactionChoiceScreen';
import { AuthPromptModal } from '@/components/game/onboarding/AuthPromptModal';
import { FingerprintScannerScreen } from '@/components/game/onboarding/FingerprintScannerScreen';
import { ParallaxBackground } from '@/components/game/shared/ParallaxBackground';
import { AgentSection } from '@/components/game/tod/AgentSection';
import { ControlCenterSection } from '@/components/game/tod/ControlCenterSection';
import { EquipmentLockerSection } from '@/components/game/tod/EquipmentLockerSection';
import { VaultSection } from '@/components/game/tod/VaultSection';
import { ScannerSection } from '@/components/game/tod/ScannerSection';
import { TODWindow } from '@/components/game/shared/TODWindow';
import { generateWelcomeMessage, type WelcomeMessageInput } from '@/ai/flows/welcome-message';


// Desired actual order: Agent, ControlCenter, Scanner, EquipmentLocker, Vault
// For looping, sections will be: [Vault (clone), Agent, ControlCenter, Scanner, EquipmentLocker, Vault, Agent (clone)]

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
    isTODWindowOpen,
    todWindowTitle,
    todWindowContent,
    closeTODWindow,
   } = useAppContext();
  
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const todContainerRef = useRef<HTMLDivElement>(null);
  const [parallaxOffset, setParallaxOffset] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const initialScrollSetRef = useRef(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated && onboardingStep !== 'tod') {
      setOnboardingStep('fingerprint');
    }
  }, [isAuthenticated, onboardingStep, setOnboardingStep]);

  // Welcome message generation logic might move to AgentSection or be triggered differently
   useEffect(() => {
    if (onboardingStep === 'tod' && isAuthenticated && isMounted && !isAppLoading) { // Ensure not already loading
      setIsLoading(true);
      const isNewUser = !playerStats.xp && !playerStats.elintReserves; 
      
      if (isNewUser) {
        addMessage({
          text: "Welcome, Agent. HQ guidance protocol initiated. Familiarize yourself with the Tactical Overlay Device. Your first objective: explore your Agent PAD.",
          type: 'hq',
          isPinned: true,
        });
        // Daily team code is now handled by the Comms section in ControlCenter
        setIsLoading(false);
      } else {
        const welcomeInput: WelcomeMessageInput = {
          playerName: playerSpyName || "Agent",
          faction: faction,
          elintReserves: playerStats.elintReserves,
          networkActivity: "Medium", // This might come from context later
          vaultDefenses: "Holding", // This might come from context later
        };
        generateWelcomeMessage(welcomeInput)
          .then(response => {
            addMessage({ text: response.message, type: 'hq', isPinned: true });
          })
          .catch(error => {
            console.error("Failed to generate welcome message:", error);
            addMessage({ text: "HQ Comms Error. Standard protocols active.", type: 'error', isPinned: true });
          })
          .finally(() => setIsLoading(false));
      }
    }
  }, [onboardingStep, isAuthenticated, playerSpyName, faction, playerStats, addMessage, setIsLoading, isMounted, isAppLoading]);


  // Order: Agent, ControlCenter, Scanner, EquipmentLocker, Vault
  // Clones: Vault(prev), Agent(actual), CC(actual), Scanner(actual), EL(actual), Vault(actual), Agent(next)
  const sectionComponents = React.useMemo(() => [
    <VaultSection key="vault-clone-start" parallaxOffset={parallaxOffset} />, // Clone of last
    <AgentSection key="agent-actual" parallaxOffset={parallaxOffset} />, // Actual first
    <ControlCenterSection key="control-center-actual" parallaxOffset={parallaxOffset} />,
    <ScannerSection key="scanner-actual" parallaxOffset={parallaxOffset} />,
    <EquipmentLockerSection key="equipment-locker-actual" parallaxOffset={parallaxOffset} />,
    <VaultSection key="vault-actual" parallaxOffset={parallaxOffset} />, // Actual last
    <AgentSection key="agent-clone-end" parallaxOffset={parallaxOffset} />, // Clone of first
  ], [parallaxOffset]);


  const handleScroll = useCallback(() => {
    if (todContainerRef.current) {
      const scrollLeft = todContainerRef.current.scrollLeft;
      const scrollWidth = todContainerRef.current.scrollWidth;
      const clientWidth = todContainerRef.current.clientWidth; 

      setParallaxOffset(scrollLeft);

      if (clientWidth === 0) return; 

      // Number of actual sections is sectionComponents.length - 2 (5 actual sections)
      // Cloned Vault (index 0) maps to actual Vault (index 5 -> sectionComponents.length - 2)
      // Cloned Agent (index 6 -> sectionComponents.length - 1) maps to actual Agent (index 1)
      
      // If scrolled to the far left clone (Vault)
      if (scrollLeft < clientWidth * 0.5) { 
        // Jump to the actual Vault section (index 5 for 7 total sections)
        todContainerRef.current.scrollLeft = (sectionComponents.length - 2) * clientWidth;
      } 
      // If scrolled to the far right clone (Agent)
      else if (scrollLeft >= (scrollWidth - clientWidth) - (clientWidth * 0.5)) {
        // Jump to the actual Agent section (index 1)
        todContainerRef.current.scrollLeft = clientWidth;
      }
    }
  }, [setParallaxOffset, sectionComponents.length]); 

  useEffect(() => {
    const container = todContainerRef.current;
    if (onboardingStep === 'tod' && !isAppLoading && isMounted && container) {
      
      const setInitialScroll = () => {
        if (container.clientWidth > 0 && !initialScrollSetRef.current) {
          const sectionWidth = container.clientWidth;
          // Start at the first "actual" section, which is AgentSection (index 1 in sectionComponents array)
          const initialScrollPosition = sectionWidth; 
          container.scrollLeft = initialScrollPosition;
          setParallaxOffset(initialScrollPosition); // Initialize parallaxOffset here
          
          if (Math.abs(container.scrollLeft - initialScrollPosition) < 5) { // Check if scroll was successful
            initialScrollSetRef.current = true; 
          } else {
            // Retry if scroll wasn't successful (e.g. layout shift)
            // This can happen if clientWidth isn't fully resolved yet or if there's a layout shift
             requestAnimationFrame(setInitialScroll);
          }
        }
      };

      // If clientWidth is 0, the container might not be rendered yet,
      // use a short timeout or rAF to retry.
      if (container.clientWidth === 0) {
        requestAnimationFrame(setInitialScroll);
      } else {
        setInitialScroll();
      }
      
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        container.removeEventListener('scroll', handleScroll);
      };
    }
  }, [onboardingStep, isAppLoading, isMounted, handleScroll]);


  if (!isMounted || (isAppLoading && onboardingStep !== 'tod')) { // Allow TOD to render even if AI message is loading
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <ParallaxBackground parallaxOffset={parallaxOffset}/>
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
    <main className="relative h-screen w-screen">
      <ParallaxBackground parallaxOffset={parallaxOffset} />
      
      <div 
        className="parallax-layer z-[5]" 
        style={{ 
          transform: `translateX(-${parallaxOffset * 0.5}px)`,
          width: `${sectionComponents.length * 100 * 0.5 + 100}vw`, 
        }}
      >
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            hsl(var(--primary-hsl) / 0.2),
            hsl(var(--primary-hsl) / 0.2) 1px,
            transparent 2px,
            transparent 60px
          ),
          repeating-linear-gradient(
            -45deg,
            hsl(var(--primary-hsl) / 0.2),
            hsl(var(--primary-hsl) / 0.2) 1px,
            transparent 2px,
            transparent 60px
          )`
        }}></div>
      </div>

      <div 
        ref={todContainerRef} 
        className="tod-scroll-container absolute inset-0 z-10 scrollbar-hide"
        style={{
          // width: `${sectionComponents.length * 100}vw`, // This is now handled by the flex items directly
          scrollSnapType: 'x mandatory', // Enforce snapping
          WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
        }}
      >
        {sectionComponents.map((SectionComponentInstance, index) => (
          <div 
            key={SectionComponentInstance.key || `tod-section-${index}`} 
            className="tod-section" // tod-section class defines width: 100vw
            style={{ scrollSnapAlign: 'start' }} // Ensure each section snaps
          >
            {SectionComponentInstance}
          </div>
        ))}
      </div>
      
      <TODWindow isOpen={isTODWindowOpen} onClose={closeTODWindow} title={todWindowTitle}>
        {todWindowContent}
      </TODWindow>
    </main>
  );
}

