
"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAppContext, type Faction } from '@/contexts/AppContext';
import { useTheme, type Theme } from '@/contexts/ThemeContext';
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
    faction, // AppContext faction
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
  const { theme: currentTheme, themeVersion } = useTheme(); // ThemeContext theme

  console.log('HomePage rendering, isTODWindowOpen:', isTODWindowOpen);
  console.log('HomePage rendering. AppContext faction for TODWindow key:', faction);
  console.log('HomePage rendering. Current ThemeContext theme for TODWindow key:', currentTheme);
  console.log('HomePage rendering. Current ThemeContext themeVersion for TODWindow key:', themeVersion);


  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const todContainerRef = useRef<HTMLDivElement>(null);
  const [parallaxOffset, setParallaxOffset] = useState(0);
  const [isClientMounted, setIsClientMounted] = useState(false);
  const initialScrollSetRef = useRef(false);
  const [playBootAnimation, setPlayBootAnimation] = useState(false);

  useEffect(() => {
    setIsClientMounted(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated && onboardingStep !== 'tod' && onboardingStep !== 'fingerprint') {
      setOnboardingStep('fingerprint');
    }
    if (onboardingStep === 'tod' && !playBootAnimation && isClientMounted) {
      setTimeout(() => setPlayBootAnimation(true), 100); // Trigger boot animation
    }
  }, [isAuthenticated, onboardingStep, setOnboardingStep, playBootAnimation, isClientMounted]);

   useEffect(() => {
    if (onboardingStep !== 'tod' || !isClientMounted || isAppLoading) return;

    // Prevent AI welcome message if TOD window is open (e.g. codename input)
    if (isTODWindowOpen) return;


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
        faction: faction, // Use faction from AppContext
        elintReserves: playerStats.elintReserves,
        networkActivity: "Medium", 
        vaultDefenses: "Holding",
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
  }, [onboardingStep, isAuthenticated, playerSpyName, faction, playerStats, addMessage, setIsLoading, isClientMounted, isAppLoading, isTODWindowOpen]);


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

      const maxPossibleScrollLeft = (sectionComponents.length - 1) * clientWidth;

      if (currentScrollLeft <= 5) { // Adjust threshold for smoother loop
         todContainerRef.current.scrollLeft = (sectionComponents.length - 2) * clientWidth - 5;
      }
      else if (currentScrollLeft >= maxPossibleScrollLeft - 5) { // Adjust threshold
        todContainerRef.current.scrollLeft = clientWidth + 5;
      }
    }
  }, [sectionComponents.length]); // parallaxOffset removed as it's set inside

  useEffect(() => {
    const container = todContainerRef.current;
    if (onboardingStep === 'tod' && !isAppLoading && isClientMounted && container) {

      const setInitialScroll = () => {
        if (container.clientWidth > 0 && !initialScrollSetRef.current) {
          const sectionWidth = container.clientWidth;
          const initialScrollPosition = sectionWidth; // Start on the first "actual" AgentSection
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


  if (!isClientMounted) {
    return (
      <main className="relative flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 sm:p-6">
        <ParallaxBackground parallaxOffset={0} />
        <div className="animate-pulse text-2xl font-orbitron holographic-text">INITIALIZING SYSTEM...</div>
      </main>
    );
  }

  if (isAppLoading && onboardingStep !== 'tod') {
      return (
        <main className="relative flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 sm:p-6">
          <ParallaxBackground parallaxOffset={0} />
          <div className="animate-pulse text-2xl font-orbitron holographic-text">LOADING INTERFACE...</div>
           <TODWindow
            key={`${faction}-${themeVersion}-loading-${isTODWindowOpen}`} // faction from AppContext
            isOpen={isTODWindowOpen}
            onClose={closeTODWindow}
            title={todWindowTitle}
            explicitTheme={currentTheme} // Pass currentTheme for direct application
          >
            {todWindowContent}
          </TODWindow>
        </main>
      );
  }

  // Onboarding steps
  if (onboardingStep !== 'tod') {
    const renderOnboarding = () => {
      switch (onboardingStep) {
        case 'welcome':
          return <WelcomeScreen />;
        case 'factionChoice':
          return <FactionChoiceScreen setShowAuthPrompt={setShowAuthPrompt} />;
        case 'fingerprint':
          return <FingerprintScannerScreen />;
        default:
          return <div className="animate-pulse text-2xl font-orbitron holographic-text">LOADING NEXT STEP...</div>;
      }
    };
    return (
      <main className="relative flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 sm:p-6 overflow-y-auto">
        <ParallaxBackground parallaxOffset={0} />
        {renderOnboarding()}
        {showAuthPrompt && <AuthPromptModal onClose={() => setShowAuthPrompt(false)} />}
        <TODWindow
          key={`${faction}-${themeVersion}-onboarding-${isTODWindowOpen}-${onboardingStep}`} // faction from AppContext
          isOpen={isTODWindowOpen}
          onClose={closeTODWindow}
          title={todWindowTitle}
          explicitTheme={currentTheme} // Pass currentTheme for direct application
        >
          {todWindowContent}
        </TODWindow>
      </main>
    );
  }

  // Main TOD view
  console.log('HomePage rendering. AppContext faction for TODWindow key:', faction);
  console.log('HomePage rendering. Current ThemeContext theme for TODWindow key:', currentTheme);
  console.log('HomePage rendering. Current ThemeContext themeVersion for TODWindow key:', themeVersion);

  return (
    <main className="relative h-screen w-screen"> 
      <ParallaxBackground parallaxOffset={parallaxOffset} />

      <div
        className="parallax-layer z-[5] opacity-30" // Increased opacity slightly for accent grid
        style={{
          transform: `translateX(-${parallaxOffset * 0.5}px)`, // Slower parallax scroll
          width: `${sectionComponents.length * 100 * 0.5 + 100}vw`, // Adjust width calculation
          backgroundImage: `
            repeating-linear-gradient(
              45deg,
              hsl(var(--accent-hsl) / 0.2), /* Using accent color with reduced opacity */
              hsl(var(--accent-hsl) / 0.2) 1px,
              transparent 1px,
              transparent 60px
            ),
            repeating-linear-gradient(
              -45deg,
              hsl(var(--accent-hsl) / 0.2), /* Using accent color with reduced opacity */
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
            playBootAnimation && "animate-slide-up-from-bottom" // Boot-up animation
        )}
        style={{
          WebkitOverflowScrolling: 'touch', // For smoother scrolling on iOS
        }}
      >
        {sectionComponents.map((SectionComponentInstance) => (
          <div
            key={SectionComponentInstance.key || `tod-section-${SectionComponentInstance.type?.name || 'unknown'}-${Math.random()}`}
            className="tod-section"
          >
            {SectionComponentInstance}
          </div>
        ))}
      </div>

      <TODWindow
        key={`${faction}-${themeVersion}-tod-${isTODWindowOpen}`} // faction from AppContext
        isOpen={isTODWindowOpen}
        onClose={closeTODWindow}
        title={todWindowTitle}
        explicitTheme={currentTheme} // Pass currentTheme for direct application
      >
        {todWindowContent}
      </TODWindow>
    </main>
  );
}

    
