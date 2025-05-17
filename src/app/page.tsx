
"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
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
import { cn } from '@/lib/utils';


export default function HomePage() {
  const {
    onboardingStep,
    setOnboardingStep,
    isAuthenticated,
    faction,
    playerSpyName,
    playerStats,
    addMessage,
    setIsLoading,
    isLoading: isAppLoading,
    isTODWindowOpen,
    todWindowTitle,
    todWindowContent,
    closeTODWindow,
   } = useAppContext();
  const { theme: currentTheme, themeVersion } = useTheme(); // currentTheme is the string like 'terminal-green'

  console.log('HomePage rendering, isTODWindowOpen:', isTODWindowOpen);
  console.log('HomePage rendering. AppContext faction for TODWindow key:', faction);


  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const todContainerRef = useRef<HTMLDivElement>(null);
  const [parallaxOffset, setParallaxOffset] = useState(0);
  const [isClientMounted, setIsClientMounted] = useState(false); // Renamed from isMounted
  const initialScrollSetRef = useRef(false);
  const [playBootAnimation, setPlayBootAnimation] = useState(false);

  useEffect(() => {
    setIsClientMounted(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated && onboardingStep !== 'tod' && onboardingStep !== 'fingerprint') {
      setOnboardingStep('fingerprint');
    }
    if (onboardingStep === 'tod' && !playBootAnimation && isClientMounted) { // Check isClientMounted
      setTimeout(() => setPlayBootAnimation(true), 100);
    }
  }, [isAuthenticated, onboardingStep, setOnboardingStep, playBootAnimation, isClientMounted]);

   useEffect(() => {
    // Only run if TOD is active AND client is mounted AND App is not loading
    if (onboardingStep !== 'tod' || !isClientMounted || isAppLoading) return;

    setIsLoading(true);
    const isNewUser = !playerStats.xp && !playerStats.elintReserves;

    if (isNewUser) {
      addMessage({
        text: "Welcome, Agent. HQ guidance protocol initiated. Familiarize yourself with the Tactical Overlay Device. Your first objective: explore your Agent PAD.",
        type: 'hq',
        isPinned: true,
      });
      setIsLoading(false);
    } else {
      const welcomeInput: WelcomeMessageInput = {
        playerName: playerSpyName || "Agent",
        faction: faction,
        elintReserves: playerStats.elintReserves,
        networkActivity: "Medium", // Placeholder
        vaultDefenses: "Holding",  // Placeholder
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
  }, [onboardingStep, isAuthenticated, playerSpyName, faction, playerStats, addMessage, setIsLoading, isClientMounted, isAppLoading]);


  const sectionComponents = React.useMemo(() => [
    <VaultSection key="vault-clone-start" parallaxOffset={parallaxOffset} />,
    <AgentSection key="agent-actual" parallaxOffset={parallaxOffset} />,
    <ControlCenterSection key="control-center-actual" parallaxOffset={parallaxOffset} />,
    <ScannerSection key="scanner-actual" parallaxOffset={parallaxOffset} />,
    <EquipmentLockerSection key="equipment-locker-actual" parallaxOffset={parallaxOffset} />,
    <VaultSection key="vault-actual" parallaxOffset={parallaxOffset} />, 
    <AgentSection key="agent-clone-end" parallaxOffset={parallaxOffset} />,
  ], [parallaxOffset]);


  const handleScroll = useCallback(() => {
    if (todContainerRef.current) {
      const currentScrollLeft = todContainerRef.current.scrollLeft;
      const clientWidth = todContainerRef.current.clientWidth;

      if (clientWidth === 0) return;

      setParallaxOffset(currentScrollLeft);

      const numActualSections = sectionComponents.length - 2; 
      const maxPossibleScrollLeft = (sectionComponents.length - 1) * clientWidth;

      if (currentScrollLeft <= 5) { 
         todContainerRef.current.scrollLeft = (sectionComponents.length - 2) * clientWidth;
      }
      else if (currentScrollLeft >= maxPossibleScrollLeft - 5) { 
        todContainerRef.current.scrollLeft = clientWidth;
      }
    }
  }, [sectionComponents.length]);

  useEffect(() => {
    const container = todContainerRef.current;
    if (onboardingStep === 'tod' && !isAppLoading && isClientMounted && container) {

      const setInitialScroll = () => {
        if (container.clientWidth > 0 && !initialScrollSetRef.current) {
          const sectionWidth = container.clientWidth;
          const initialScrollPosition = sectionWidth;
          container.scrollLeft = initialScrollPosition;
          setParallaxOffset(initialScrollPosition);
          console.log("Initial scroll set to:", initialScrollPosition);
          initialScrollSetRef.current = true; 
        } else if (container.clientWidth === 0 && !initialScrollSetRef.current) {
            requestAnimationFrame(setInitialScroll);
        }
      };

      if (!initialScrollSetRef.current) {
        requestAnimationFrame(setInitialScroll); 
      }

      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        if (container) {
            container.removeEventListener('scroll', handleScroll);
        }
      };
    }
  }, [onboardingStep, isAppLoading, isClientMounted, handleScroll]);


  // Render null or a very minimal skeleton during server render / pre-hydration.
  if (!isClientMounted) {
    return (
      <main className="relative flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 sm:p-6">
        <ParallaxBackground parallaxOffset={0} />
        <div className="animate-pulse text-2xl font-orbitron holographic-text">INITIALIZING SYSTEM...</div>
      </main>
    );
  }

  // Show global app loading if AppContext is still loading and we're not yet in the TOD state.
  if (isAppLoading && onboardingStep !== 'tod') {
      return (
        <main className="relative flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 sm:p-6">
          <ParallaxBackground parallaxOffset={0} />
          <div className="animate-pulse text-2xl font-orbitron holographic-text">LOADING INTERFACE...</div>
          {/* TODWindow might be needed here if an error during loading opens it, ensure key is unique */}
           <TODWindow key={`${faction}-${themeVersion}-loading-${isTODWindowOpen}`} isOpen={isTODWindowOpen} onClose={closeTODWindow} title={todWindowTitle}>
            {todWindowContent}
          </TODWindow>
        </main>
      );
  }

  // Render onboarding steps if not yet in TOD state.
  if (onboardingStep !== 'tod') {
    return (
      <main className="relative flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 sm:p-6">
        <ParallaxBackground parallaxOffset={0} />
        {onboardingStep === 'welcome' && <WelcomeScreen />}
        {onboardingStep === 'factionChoice' && <FactionChoiceScreen setShowAuthPrompt={setShowAuthPrompt} />}
        {onboardingStep === 'fingerprint' && <FingerprintScannerScreen />}
        {onboardingStep !== 'welcome' && onboardingStep !== 'factionChoice' && onboardingStep !== 'fingerprint' && (
          <div className="animate-pulse text-2xl font-orbitron holographic-text">LOADING NEXT STEP...</div>
        )}
        {showAuthPrompt && <AuthPromptModal onClose={() => setShowAuthPrompt(false)} />}
        <TODWindow key={`${faction}-${themeVersion}-${onboardingStep}-${isTODWindowOpen}`} isOpen={isTODWindowOpen} onClose={closeTODWindow} title={todWindowTitle}>
          {todWindowContent}
        </TODWindow>
      </main>
    );
  }

  // This is the main view for the TOD itself
  // console.log('HomePage rendering. Current Theme for TODWindow key:', currentTheme);
  return (
    <main className="relative h-screen w-screen">
      <ParallaxBackground parallaxOffset={parallaxOffset} />

      <div
        className="parallax-layer z-[5] opacity-20"
        style={{
          transform: `translateX(-${parallaxOffset * 0.5}px)`,
          width: `${sectionComponents.length * 100 * 0.5 + 100}vw`, 
          backgroundImage: `
            repeating-linear-gradient(
              45deg,
              hsl(var(--accent-hsl) / 0.2), 
              hsl(var(--accent-hsl) / 0.2) 1px,
              transparent 1px,
              transparent 60px
            ),
            repeating-linear-gradient(
              -45deg,
              hsl(var(--accent-hsl) / 0.2), 
              hsl(var(--accent-hsl) / 0.2) 1px,
              transparent 1px,
              transparent 60px
            )
          `
        }}
      >
      </div>

      <div
        ref={todContainerRef}
        className={cn(
            "tod-scroll-container absolute inset-0 z-10 scrollbar-hide",
            playBootAnimation && "animate-slide-up-from-bottom"
        )}
        style={{
          WebkitOverflowScrolling: 'touch', 
        }}
      >
        {sectionComponents.map((SectionComponentInstance, index) => (
          <div
            key={SectionComponentInstance.key || `tod-section-${index}`}
            className="tod-section"
          >
            {SectionComponentInstance}
          </div>
        ))}
      </div>

      <TODWindow key={`${faction}-${themeVersion}-tod-${isTODWindowOpen}`} isOpen={isTODWindowOpen} onClose={closeTODWindow} title={todWindowTitle}>
        {todWindowContent}
      </TODWindow>
    </main>
  );
}
