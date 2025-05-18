
"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAppContext, type Faction } from '@/contexts/AppContext';
import { useTheme, type Theme } from '@/contexts/ThemeContext';
import { WelcomeScreen } from '@/components/game/onboarding/WelcomeScreen';
import { FactionChoiceScreen } from '@/components/game/onboarding/FactionChoiceScreen';
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
    todWindowOptions,
  } = useAppContext();

  const { theme: currentTheme, themeVersion } = useTheme();

  // Log values for debugging theme propagation
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
      setOnboardingStep('fingerprint');
    }
    if (onboardingStep === 'tod' && isClientMounted) {
      const timer = setTimeout(() => {
        setPlayBootAnimation(true);
      }, 50);
      return () => clearTimeout(timer);
    } else if (onboardingStep !== 'tod') {
      setPlayBootAnimation(false);
    }
  }, [isAuthenticated, onboardingStep, setOnboardingStep, isClientMounted]);


  // AI Welcome Message Effect
 useEffect(() => {
    if (onboardingStep !== 'tod' || !isClientMounted || isAppLoading || isTODWindowOpen || !playBootAnimation) return;

    setIsLoading(true);
    const isNewUser = !playerStats.xp && !playerStats.elintReserves && !playerStats.level;

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
  }, [onboardingStep, isClientMounted, playerSpyName, faction, playerStats, addMessage, setIsLoading, isAppLoading, isTODWindowOpen, playBootAnimation]);


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

      const totalContentWidthForLooping = (sectionComponents.length - 2) * clientWidth;
      const maxPossibleScrollLeft = (sectionComponents.length - 1) * clientWidth;

      if (currentScrollLeft >= maxPossibleScrollLeft - 5) { // Near the very end of the last clone
          todContainerRef.current.scrollLeft = clientWidth + (currentScrollLeft - maxPossibleScrollLeft);
      } else if (currentScrollLeft <= 5) { // Near the very start of the first clone
          todContainerRef.current.scrollLeft = totalContentWidthForLooping + currentScrollLeft;
      }
    }
  }, [sectionComponents.length]);

  useEffect(() => {
    const container = todContainerRef.current;
    if (onboardingStep === 'tod' && !isAppLoading && isClientMounted && playBootAnimation && container) {
      const setInitialScroll = () => {
        if (todContainerRef.current && todContainerRef.current.clientWidth > 0 && !initialScrollSetRef.current) {
          const sectionWidth = todContainerRef.current.clientWidth;
          const targetSectionIndex = 1; // AgentSection is at index 1
          const initialScrollPosition = sectionWidth * targetSectionIndex;

          console.log(`Attempting initial scroll: TargetIndex=${targetSectionIndex}, Width=${sectionWidth}, ScrollTo=${initialScrollPosition}`);
          todContainerRef.current.scrollLeft = initialScrollPosition;
          setParallaxOffset(initialScrollPosition);
          initialScrollSetRef.current = true;
          console.log(`Initial scroll DONE. todContainerRef.current.scrollLeft = ${todContainerRef.current.scrollLeft}. Initial scroll set ref: ${initialScrollSetRef.current}`);
        } else if (todContainerRef.current && todContainerRef.current.clientWidth === 0 && !initialScrollSetRef.current) {
           console.warn("Initial scroll: clientWidth is 0. Layout might not be stable for scroll calc.");
        }
      };

      requestAnimationFrame(setInitialScroll); // Ensure layout is stable

      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        if (container) {
          container.removeEventListener('scroll', handleScroll);
        }
      };
    }
  }, [onboardingStep, isAppLoading, isClientMounted, playBootAnimation, handleScroll]);


  console.log('HomePage rendering. AppContext faction for TODWindow key:', faction);
  console.log('HomePage rendering. Current ThemeContext theme for TODWindow key:', currentTheme);
  console.log('HomePage rendering. Current ThemeContext themeVersion for TODWindow key:', themeVersion);


  // Loading States
  if (!isClientMounted) {
    return (
      <main className="relative flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 sm:p-6">
        <ParallaxBackground parallaxOffset={0} />
        <div className="animate-pulse text-2xl font-orbitron holographic-text">INITIALIZING TOD...</div>
      </main>
    );
  }

  if (isAppLoading && onboardingStep !== 'tod') {
    return (
      <main className="relative flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 sm:p-6">
        <ParallaxBackground parallaxOffset={0} />
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

  // Onboarding Steps
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
          return <div className="animate-pulse text-2xl font-orbitron holographic-text">LOADING NEXT STEP...</div>;
      }
    };
    return (
      <main className="relative flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 sm:p-6 overflow-y-auto">
        <ParallaxBackground parallaxOffset={0} />
        {renderOnboarding()}
        <TODWindow
          key={`${faction}-${themeVersion}-${onboardingStep}-${isTODWindowOpen}`}
          isOpen={isTODWindowOpen}
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

  // Main TOD view
  return (
    <main className="relative h-screen w-screen overflow-hidden">
      <ParallaxBackground parallaxOffset={parallaxOffset} />

      <div
        className="parallax-layer z-[5] opacity-20"
        style={{
          transform: `translateX(-${parallaxOffset * 0.5}px)`,
          width: `${sectionComponents.length * 100 * 0.5 + 100}vw`,
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
      >
      </div>

      {playBootAnimation && (
        <div
          ref={todContainerRef}
          className={cn(
            "tod-scroll-container absolute inset-0 z-10 scrollbar-hide",
            "animate-slide-up-from-bottom"
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
      )}

      <TODWindow
        key={`${faction}-${themeVersion}-tod-${isTODWindowOpen}`}
        isOpen={isTODWindowOpen}
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
