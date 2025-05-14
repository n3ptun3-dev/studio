
"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { WelcomeScreen } from '@/components/game/onboarding/WelcomeScreen';
import { FactionChoiceScreen } from '@/components/game/onboarding/FactionChoiceScreen';
import { AuthPromptModal } from '@/components/game/onboarding/AuthPromptModal';
import { FingerprintScannerScreen } from '@/components/game/onboarding/FingerprintScannerScreen';
import { ParallaxBackground } from '@/components/game/shared/ParallaxBackground';
import { CommandCenterSection } from '@/components/game/tod/CommandCenterSection';
import { EquipmentLockerSection } from '@/components/game/tod/EquipmentLockerSection';
import { VaultSection } from '@/components/game/tod/VaultSection';
import { ScannerSection } from '@/components/game/tod/ScannerSection';
import { generateWelcomeMessage, type WelcomeMessageInput } from '@/ai/flows/welcome-message';
import React from 'react';

// Desired actual order: CommandCenter, Scanner, EquipmentLocker, Vault
// For looping, sections will be: [Vault (clone), CC, Scanner, EquipmentLocker, Vault, CC (clone)]

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
  const initialScrollSetRef = useRef(false);


  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated && onboardingStep !== 'tod') {
      setOnboardingStep('fingerprint');
    }
  }, [isAuthenticated, onboardingStep, setOnboardingStep]);

  useEffect(() => {
    if (onboardingStep === 'tod' && isAuthenticated && isMounted) {
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
  }, [onboardingStep, isAuthenticated, playerSpyName, faction, playerStats, addMessage, dailyTeamCode, setIsLoading, isMounted]);

  const sectionComponents = React.useMemo(() => [
    <VaultSection key="vault-clone-start" parallaxOffset={parallaxOffset} />,
    <CommandCenterSection key="command-center-actual" parallaxOffset={parallaxOffset} />,
    <ScannerSection key="scanner-actual" parallaxOffset={parallaxOffset} />,
    <EquipmentLockerSection key="equipment-locker-actual" parallaxOffset={parallaxOffset} />,
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

      // Number of actual sections is sectionComponents.length - 2
      // Cloned Vault (index 0) maps to actual Vault (index sectionComponents.length - 2)
      // Cloned CC (index sectionComponents.length - 1) maps to actual CC (index 1)
      
      // If scrolled to the far left clone (Vault)
      if (scrollLeft < clientWidth * 0.5) { 
        // Jump to the actual Vault section (index 4 for 6 total sections)
        // scrollLeft value for actual Vault is (sectionComponents.length - 2) * clientWidth
        todContainerRef.current.scrollLeft = (sectionComponents.length - 2) * clientWidth;
      } 
      // If scrolled to the far right clone (Command Center)
      else if (scrollLeft >= (scrollWidth - clientWidth) - (clientWidth * 0.5)) {
        // Jump to the actual Command Center section (index 1)
        // scrollLeft value for actual CC is 1 * clientWidth
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
          // Start at the first "actual" section, which is CommandCenterSection (index 1 in sectionComponents array)
          const initialScrollPosition = sectionWidth; 
          container.scrollLeft = initialScrollPosition;
          console.log(`Initial scroll attempted to: ${initialScrollPosition}, actual: ${container.scrollLeft}`);
          
          // Check if scroll was successful (within a small tolerance)
          if (Math.abs(container.scrollLeft - initialScrollPosition) < 5) {
            initialScrollSetRef.current = true; // Mark as set
          }
        }
      };

      // Attempt to set initial scroll. If clientWidth is not yet available,
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


  if (!isMounted || isAppLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <ParallaxBackground parallaxOffset={0} />
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
        <ParallaxBackground parallaxOffset={0} />
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
