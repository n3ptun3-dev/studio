// src/app/page.tsx

"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useAppContext, type Faction, type GameItemBase } from '@/contexts/AppContext';
import { useTheme, type Theme } from '@/contexts/ThemeContext';
import { WelcomeScreen } from '@/components/game/onboarding/WelcomeScreen';
import { FactionChoiceScreen } from '@/components/game/onboarding/FactionChoiceScreen';
import { FingerprintScannerScreen } from '@/components/game/onboarding/FingerprintScannerScreen';
import { ParallaxBackground } from '@/components/game/shared/ParallaxBackground';
import AgentSection from '@/components/game/tod/AgentSection';
import ControlCenterSection from '@/components/game/tod/ControlCenterSection';
import { EquipmentLockerSection } from '@/components/game/tod/EquipmentLockerSection';
import { VaultSection } from '@/components/game/tod/VaultSection';
import { ScannerSection } from '@/components/game/tod/ScannerSection';
import { TODWindow } from '@/components/game/shared/TODWindow';
import { InventoryBrowserInTOD } from '@/components/game/inventory/InventoryBrowserInTOD';
import { generateWelcomeMessage, type WelcomeMessageInput } from '@/ai/flows/welcome-message';
import { cn } from '@/lib/utils';
import { CodenameInput } from '@/components/game/onboarding/CodenameInput'; // Ensure this is imported

export default function HomePage() {
  const appContext = useAppContext();
  const {
    onboardingStep,
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
    todWindowOptions,
    isSpyShopActive,
    todInventoryContext,
    closeInventoryTOD,
    openTODWindow, // For CodenameInput flow
  } = appContext;

  const { theme: currentTheme, themeVersion } = useTheme();

  const todContainerRef = useRef<HTMLDivElement>(null);
  const [parallaxOffset, setParallaxOffset] = useState(0);
  const [isClientMounted, setIsClientMounted] = useState(false);
  const initialScrollSetRef = useRef(false);
  const [playBootAnimation, setPlayBootAnimation] = useState(false);

  console.log('HomePage rendering, isTODWindowOpen:', isTODWindowOpen, "Onboarding step:", onboardingStep);
  console.log('HomePage rendering. AppContext faction for TODWindow key:', faction);
  console.log('HomePage rendering. Current ThemeContext theme for TODWindow key:', currentTheme);
  console.log('HomePage rendering. Current ThemeContext themeVersion for TODWindow key:', themeVersion);


  useEffect(() => {
    setIsClientMounted(true);
  }, []);

  useEffect(() => {
    if (onboardingStep === 'tod' && isClientMounted) {
      const timer = setTimeout(() => {
        setPlayBootAnimation(true);
      }, 50); // Short delay to allow initial render
      return () => clearTimeout(timer);
    } else if (onboardingStep !== 'tod') {
      setPlayBootAnimation(false); // Reset if not in TOD
    }
  }, [onboardingStep, isClientMounted]);


  // Effect to open CodenameInput window when onboardingStep dictates
  useEffect(() => {
    if (isClientMounted && onboardingStep === 'codenameInput' && !isTODWindowOpen) {
      const factionTheme = faction === 'Cyphers' ? 'cyphers' : faction === 'Shadows' ? 'shadows' : 'terminal-green';
      console.log(`[HomePage] onboardingStep is codenameInput, opening TODWindow. Faction for theme: ${faction}`);
      openTODWindow(
        "Agent Codename",
        <CodenameInput explicitTheme={factionTheme} />,
        { showCloseButton: false }
      );
    }
  }, [isClientMounted, onboardingStep, openTODWindow, isTODWindowOpen, faction]);


  useEffect(() => {
    if (onboardingStep !== 'tod' || !isClientMounted || isAppLoading || isTODWindowOpen || !playBootAnimation) return;
    if (faction !== 'Observer' && !playerSpyName) { // For non-observers, require spyName
        console.log("Welcome message generation skipped: playerSpyName not set for non-Observer.");
        return;
    }


    setIsLoading(true);
    const isNewUser = !playerStats.xp && !playerStats.elintReserves && !playerStats.level;

    if (faction === 'Observer') {
        addMessage({
            text: "Observation deck online. Monitoring network activity.",
            type: 'system',
            isPinned: true,
        });
        setIsLoading(false);
    } else if (isNewUser && playerSpyName) { // Ensure spyName is set for new user welcome
      addMessage({
        text: `Welcome, Agent ${playerSpyName}. HQ guidance protocol initiated. Familiarize yourself with the Tactical Overlay Device. Your first objective: explore your Agent PAD.`,
        type: 'hq',
        isPinned: true,
      });
      setIsLoading(false);
    } else if (playerSpyName) { // Existing, named player
      const welcomeInput: WelcomeMessageInput = {
        playerName: playerSpyName,
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
    } else {
        // Should not happen if logic above is correct, but as a fallback:
        console.log("Welcome message generation skipped: conditions not fully met.");
        setIsLoading(false);
    }
  }, [onboardingStep, isClientMounted, playerSpyName, faction, playerStats, addMessage, setIsLoading, isAppLoading, isTODWindowOpen, playBootAnimation]);

  const sectionComponents = useMemo(() => [
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
      if (clientWidth === 0) return; // Avoid division by zero if not yet rendered
      setParallaxOffset(currentScrollLeft);

      const totalContentWidthForLooping = (sectionComponents.length - 2) * clientWidth;
      const maxPossibleScrollLeft = (sectionComponents.length - 1) * clientWidth;

      if (currentScrollLeft >= maxPossibleScrollLeft - 5) { // Check if near the end
        todContainerRef.current.scrollLeft = clientWidth + (currentScrollLeft - maxPossibleScrollLeft);
      } else if (currentScrollLeft <= 5) { // Check if near the beginning
        todContainerRef.current.scrollLeft = totalContentWidthForLooping + currentScrollLeft;
      }
    }
  }, [sectionComponents.length]); // Only depends on sectionComponents.length

  useEffect(() => {
    const container = todContainerRef.current;
    if (onboardingStep === 'tod' && !isAppLoading && isClientMounted && playBootAnimation && container) {
      const setInitialScroll = () => {
        if (todContainerRef.current && todContainerRef.current.clientWidth > 0 && !initialScrollSetRef.current) {
          const sectionWidth = todContainerRef.current.clientWidth;
          const targetSectionIndex = 1; // AgentSection is at index 1 (0-indexed)
          const initialScrollPosition = sectionWidth * targetSectionIndex;
          todContainerRef.current.scrollLeft = initialScrollPosition;
          setParallaxOffset(initialScrollPosition); // Initialize parallaxOffset
          initialScrollSetRef.current = true;
          console.log(`[HomePage] Initial scroll set to: ${initialScrollPosition} for section index ${targetSectionIndex}`);
        }
      };
      requestAnimationFrame(setInitialScroll); // Use rAF for layout-dependent operations
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        if (container) {
          container.removeEventListener('scroll', handleScroll);
        }
      };
    }
  }, [onboardingStep, isAppLoading, isClientMounted, playBootAnimation, handleScroll]);

  const renderOnboarding = () => {
    switch (onboardingStep) {
      case 'welcome':
        return <WelcomeScreen />;
      case 'factionChoice':
        return <FactionChoiceScreen />;
      // CodenameInput is now handled by TODWindow opened from AppContext/HomePage useEffect
      case 'fingerprint':
        return <FingerprintScannerScreen />;
      default: // Handles 'authPrompt' or 'codenameInput' if they are intermediate steps before window opens
        return <div className="animate-pulse text-2xl font-orbitron holographic-text text-center">LOADING NEXT STEP...</div>;
    }
  };

  if (!isClientMounted) {
    return (
      <main className="relative flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 sm:p-6">
        <ParallaxBackground />
        <div className="animate-pulse text-2xl font-orbitron holographic-text text-center">INITIALIZING TOD...</div>
      </main>
    );
  }

  if (isAppLoading && onboardingStep !== 'tod') {
    return (
      <main className="relative flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 sm:p-6">
        <ParallaxBackground />
        <div className="animate-pulse text-2xl font-orbitron holographic-text text-center">LOADING INTERFACE...</div>
         <TODWindow
            key={`${faction}-${themeVersion}-loading-${isTODWindowOpen}`} // Key ensures re-render on theme/state change
            isOpen={isTODWindowOpen && !todInventoryContext} // Only general TOD window, not inventory
            onClose={closeTODWindow}
            title={todWindowTitle}
            explicitTheme={currentTheme} // Pass current theme from ThemeContext
            themeVersion={themeVersion}   // Pass theme version
            showCloseButton={todWindowOptions.showCloseButton}
          >
            {todWindowContent}
        </TODWindow>
      </main>
    );
  }

  if (onboardingStep !== 'tod') {
    return (
      <main className="relative flex flex-col items-center justify-start min-h-screen bg-background text-foreground p-4 sm:p-6 overflow-y-auto">
        <ParallaxBackground />
        {renderOnboarding()}
        <TODWindow
          key={`${faction}-${themeVersion}-onboarding-${isTODWindowOpen}-${onboardingStep}`}
          isOpen={isTODWindowOpen && !todInventoryContext}
          onClose={closeTODWindow}
          title={todWindowTitle}
          explicitTheme={currentTheme}
          themeVersion={themeVersion}
          showCloseButton={todWindowOptions.showCloseButton !== undefined ? todWindowOptions.showCloseButton : true}
        >
          {todWindowContent}
        </TODWindow>
      </main>
    );
  }

  // Main TOD View
  return (
    <main className="relative h-screen w-screen overflow-hidden">
      <ParallaxBackground />
      {/* Parallax grid layer */}
      <div
        className="parallax-layer z-[5] opacity-30"
        style={{
          transform: `translateX(-${parallaxOffset * 0.5}px)`,
          width: `${sectionComponents.length * 100 * 0.5 + 100}vw`, // Ensure width covers parallax movement
          backgroundImage: `
            repeating-linear-gradient(
              45deg,
              hsl(var(--accent-hsl) / 0.2), hsl(var(--accent-hsl) / 0.2) 1px,
              transparent 1px,
              transparent 60px
            ),
            repeating-linear-gradient(
              -45deg,
              hsl(var(--accent-hsl) / 0.2), hsl(var(--accent-hsl) / 0.2) 1px,
              transparent 1px,
              transparent 60px
            )
          `
        }}
      />

      {isSpyShopActive && (
        <div
          className="fixed inset-0 z-[9998] transition-colors duration-200 ease-in-out"
          style={{ backgroundColor: `hsl(var(--primary-hsl) / 0.5)` }} // Example spy shop active overlay
        />
      )}

      {playBootAnimation && (
        <div
          ref={todContainerRef}
          className={cn(
            "tod-scroll-container absolute inset-0 z-10 scrollbar-hide",
            "animate-slide-up-from-bottom" // Apply boot animation
          )}
          style={{ WebkitOverflowScrolling: 'touch' }} // For smoother scrolling on iOS
        >
          {sectionComponents.map((SectionComponentInstance, index) => (
            <div
              key={SectionComponentInstance.key || `tod-section-${index}`} // Ensure unique key for each section instance
              className="tod-section"
            >
              {SectionComponentInstance}
            </div>
          ))}
        </div>
      )}
      
      {/* General Purpose TOD Window */}
      <TODWindow
        key={`${faction}-${themeVersion}-tod-${isTODWindowOpen}`}
        isOpen={isTODWindowOpen && !todInventoryContext}
        onClose={closeTODWindow}
        title={todWindowTitle}
        explicitTheme={currentTheme}
        themeVersion={themeVersion}
        showCloseButton={todWindowOptions.showCloseButton !== undefined ? todWindowOptions.showCloseButton : true}
      >
        {todWindowContent}
      </TODWindow>

      {/* Inventory Browser TOD Window */}
      {todInventoryContext && (
        <TODWindow
          key={`${faction}-${themeVersion}-inventory-${todInventoryContext.category}-${isTODWindowOpen}`}
          isOpen={!!todInventoryContext} // Controlled by todInventoryContext presence
          onClose={closeInventoryTOD}
          title={todInventoryContext.title}
          explicitTheme={currentTheme}
          themeVersion={themeVersion}
          showCloseButton={true} // Inventory browser should always have a close button
        >
          <InventoryBrowserInTOD context={todInventoryContext} />
        </TODWindow>
      )}
    </main>
  );
}
