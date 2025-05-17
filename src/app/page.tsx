
"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAppContext, type Faction } from '@/contexts/AppContext';
import { useTheme, type Theme } from '@/contexts/ThemeContext'; // Corrected: Import Theme type
import { WelcomeScreen } from '@/components/game/onboarding/WelcomeScreen';
import { FactionChoiceScreen } from '@/components/game/onboarding/FactionChoiceScreen';
// import { AuthPromptModal } from '@/components/game/onboarding/AuthPromptModal'; // Not currently used
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
    isAuthenticated, // Used to potentially bypass onboarding if already authed and setup
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
    todWindowOptions, // Ensure this is destructured
  } = useAppContext();
  const { theme: currentTheme, themeVersion } = useTheme();

  console.log('HomePage rendering, isTODWindowOpen:', isTODWindowOpen);
  console.log('HomePage rendering. AppContext faction for TODWindow key:', faction);
  console.log('HomePage rendering. Current ThemeContext theme for TODWindow key:', currentTheme);
  console.log('HomePage rendering. Current ThemeContext themeVersion for TODWindow key:', themeVersion);


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
      // If user is authenticated (e.g. returning user) and not already in TOD or fingerprint,
      // skip to fingerprint. Assumes faction & codename are already set.
      // This might need more robust logic based on how player data is stored/retrieved.
      setOnboardingStep('fingerprint');
    }
    if (onboardingStep === 'tod' && !playBootAnimation && isClientMounted) {
      // If we transition to TOD view, trigger the boot animation
      setTimeout(() => setPlayBootAnimation(true), 100); // Short delay for transition
    }
  }, [isAuthenticated, onboardingStep, setOnboardingStep, playBootAnimation, isClientMounted]);

  // Effect to generate welcome message once TOD is loaded and no other window is open
  useEffect(() => {
    if (onboardingStep !== 'tod' || !isClientMounted || isAppLoading || isTODWindowOpen) return;

    setIsLoading(true);
    // Determine if it's a "new" user experience within the TOD (e.g., first time reaching TOD)
    const isNewUser = !playerStats.xp && !playerStats.elintReserves; // Example condition

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
        faction: faction, // faction should be from AppContext
        elintReserves: playerStats.elintReserves,
        networkActivity: "Medium", // Placeholder
        vaultDefenses: "Holding", // Placeholder
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onboardingStep, isClientMounted, playerSpyName, faction, playerStats.xp, playerStats.elintReserves, addMessage, setIsLoading, isAppLoading, isTODWindowOpen]);


  const sectionComponents = React.useMemo(() => [
    // Clones for infinite scroll effect
    <VaultSection key="vault-clone-start" parallaxOffset={parallaxOffset} />, // Example clone
    // Actual sections in order
    <AgentSection key="agent-actual" parallaxOffset={parallaxOffset} />,
    <ControlCenterSection key="control-center-actual" parallaxOffset={parallaxOffset} />,
    <ScannerSection key="scanner-actual" parallaxOffset={parallaxOffset} />,
    <EquipmentLockerSection key="equipment-locker-actual" parallaxOffset={parallaxOffset} />,
    <VaultSection key="vault-actual" parallaxOffset={parallaxOffset} />,
    // Clones for infinite scroll effect
    <AgentSection key="agent-clone-end" parallaxOffset={parallaxOffset} />, // Example clone
  ], [parallaxOffset]);


  const handleScroll = useCallback(() => {
    if (todContainerRef.current) {
      const currentScrollLeft = todContainerRef.current.scrollLeft;
      const clientWidth = todContainerRef.current.clientWidth;

      if (clientWidth === 0) return; // Avoid division by zero if not yet rendered

      setParallaxOffset(currentScrollLeft);

      const maxPossibleScrollLeft = (sectionComponents.length - 1) * clientWidth;

      // Logic for infinite looping
      if (currentScrollLeft <= 5) { // User scrolled to the far left (into the start clone)
        // Jump to the equivalent actual section towards the end
        // The "start clone" (e.g. VaultSection clone) is at index 0.
        // Its "actual" counterpart is at index `sectionComponents.length - 2` if we have one clone at each end.
        // If AgentSection is index 1, Vault is index 5.
        // Cloned Vault (index 0) -> Actual Vault (index 5)
        // Cloned Agent (index 6) -> Actual Agent (index 1)
        todContainerRef.current.scrollLeft = (sectionComponents.length - 2) * clientWidth - 5;
      } else if (currentScrollLeft >= maxPossibleScrollLeft - 5) { // User scrolled to the far right (into the end clone)
        // Jump to the equivalent actual section towards the beginning
        // The "end clone" (e.g. AgentSection clone) is at index `sectionComponents.length - 1`.
        // Its "actual" counterpart is at index 1.
        todContainerRef.current.scrollLeft = clientWidth + 5;
      }
    }
  }, [sectionComponents.length]); // setParallaxOffset is stable

  useEffect(() => {
    const container = todContainerRef.current;
    if (onboardingStep === 'tod' && !isAppLoading && isClientMounted && container && playBootAnimation) {

      const setInitialScroll = () => {
        if (todContainerRef.current && todContainerRef.current.clientWidth > 0 && !initialScrollSetRef.current) {
          const sectionWidth = todContainerRef.current.clientWidth;
          // AgentSection is at index 1 of sectionComponents
          // The actual sections start after the first clone. So if Vault is cloned at start (index 0), Agent is at index 1.
          const targetSectionIndex = 1; 
          const initialScrollPosition = sectionWidth * targetSectionIndex;
          
          console.log(`Attempting initial scroll: TargetIndex=${targetSectionIndex}, Width=${sectionWidth}, ScrollTo=${initialScrollPosition} (Should be AgentSection)`);
          todContainerRef.current.scrollLeft = initialScrollPosition;
          setParallaxOffset(initialScrollPosition);
          initialScrollSetRef.current = true;
          console.log(`Initial scroll DONE. todContainerRef.current.scrollLeft = ${todContainerRef.current.scrollLeft}`);
        } else if (todContainerRef.current && todContainerRef.current.clientWidth === 0 && !initialScrollSetRef.current) {
          console.warn("Initial scroll: clientWidth is 0 even after rAF. Layout might not be stable.");
        }
      };
      
      requestAnimationFrame(setInitialScroll);

      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        if (container) {
          container.removeEventListener('scroll', handleScroll);
        }
      };
    }
  }, [onboardingStep, isAppLoading, isClientMounted, playBootAnimation, handleScroll, sectionComponents.length]);


  if (!isClientMounted) {
    return (
      <main className="relative flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 sm:p-6">
        <ParallaxBackground />
        <div className="animate-pulse text-2xl font-orbitron holographic-text">INITIALIZING TOD...</div>
      </main>
    );
  }

  if (isAppLoading && onboardingStep !== 'tod') {
    return (
      <main className="relative flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 sm:p-6">
        <ParallaxBackground />
        <div className="animate-pulse text-2xl font-orbitron holographic-text">LOADING INTERFACE...</div>
        <TODWindow
          key={`${faction}-${themeVersion}-loading-${isTODWindowOpen}`}
          isOpen={isTODWindowOpen}
          onClose={closeTODWindow}
          title={todWindowTitle}
          explicitTheme={currentTheme}
          themeVersion={themeVersion}
          showCloseButton={todWindowOptions.showCloseButton}
        >
          {todWindowContent}
        </TODWindow>
      </main>
    );
  }

  if (onboardingStep !== 'tod') {
    const renderOnboarding = () => {
      switch (onboardingStep) {
        case 'welcome':
          return <WelcomeScreen />;
        case 'factionChoice':
          return <FactionChoiceScreen />;
        case 'fingerprint':
          return <FingerprintScannerScreen />;
        default:
          // This case should ideally not be hit if onboardingStep is managed correctly
          return <div className="animate-pulse text-2xl font-orbitron holographic-text">LOADING NEXT STEP...</div>;
      }
    };
    return (
      // This main container handles scrolling for tall onboarding screens
      <main className="relative flex flex-col items-stretch justify-start min-h-screen bg-background text-foreground p-4 sm:p-6 overflow-y-auto">
        <ParallaxBackground />
        {renderOnboarding()}
        <TODWindow
          key={`${faction}-${themeVersion}-${onboardingStep}-${isTODWindowOpen}`}
          isOpen={isTODWindowOpen}
          onClose={closeTODWindow}
          title={todWindowTitle}
          explicitTheme={currentTheme}
          themeVersion={themeVersion}
          showCloseButton={todWindowOptions.showCloseButton}
        >
          {todWindowContent}
        </TODWindow>
      </main>
    );
  }

  // This is the main view for the TOD itself
  // It should not scroll the page; internal elements handle their own scrolling
  console.log('HomePage rendering. AppContext faction for TODWindow key:', faction);
  console.log('HomePage rendering. Current ThemeContext theme for TODWindow key:', currentTheme);
  console.log('HomePage rendering. Current ThemeContext themeVersion for TODWindow key:', themeVersion);
  console.log('HomePage rendering. TODWindow options:', todWindowOptions);

  return (
    <main className="relative h-screen w-screen overflow-hidden"> 
      <ParallaxBackground />

      {/* Optional: Parallax layer for grid pattern if desired */}
      <div
        className="parallax-layer z-[5] opacity-20" // Lower opacity
        style={{
          transform: `translateX(-${parallaxOffset * 0.5}px)`, // Slower parallax scroll
          width: `${sectionComponents.length * 100 * 0.5 + 100}vw`, // Ensure width covers parallax movement
          backgroundImage: `
            repeating-linear-gradient(
              45deg,
              hsl(var(--accent-hsl) / 0.2), hsl(var(--accent-hsl) / 0.2) 1px,
              transparent 1px,
              transparent 60px /* Adjust density */
            ),
            repeating-linear-gradient(
              -45deg,
              hsl(var(--accent-hsl) / 0.2), hsl(var(--accent-hsl) / 0.2) 1px,
              transparent 1px,
              transparent 60px /* Adjust density */
            )
          `
        }}
      >
      </div>

      <div
        ref={todContainerRef}
        className={cn(
          "tod-scroll-container absolute inset-0 z-10 scrollbar-hide", // Ensures it's on top of parallax bg
          playBootAnimation && "animate-slide-up-from-bottom" // Apply boot animation
        )}
        style={{
          WebkitOverflowScrolling: 'touch', // For smoother scrolling on iOS
        }}
      >
        {sectionComponents.map((SectionComponentInstance, index) => (
          <div
            key={SectionComponentInstance.key || `tod-section-${index}`} // Ensure unique keys
            className="tod-section" // Ensure this class defines width: 100vw and height: 100%
          >
            {SectionComponentInstance}
          </div>
        ))}
      </div>

      <TODWindow
        key={`${faction}-${themeVersion}-tod-${isTODWindowOpen}`} // Unique key for TOD view
        isOpen={isTODWindowOpen}
        onClose={closeTODWindow}
        title={todWindowTitle}
        explicitTheme={currentTheme} // TODWindow should reflect current global theme
        themeVersion={themeVersion}
        showCloseButton={todWindowOptions.showCloseButton}
      >
        {todWindowContent}
      </TODWindow>
    </main>
  );
}

    