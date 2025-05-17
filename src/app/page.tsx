
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
  } = useAppContext();
  const { theme: currentTheme, themeVersion } = useTheme();

  console.log('HomePage rendering, isTODWindowOpen:', isTODWindowOpen);
  console.log('HomePage rendering. AppContext faction for TODWindow key:', faction);
  console.log('HomePage rendering. Current ThemeContext theme for TODWindow key:', currentTheme);
  console.log('HomePage rendering. Current ThemeContext themeVersion for TODWindow key:', themeVersion);
  // console.log('HomePage rendering. TODWindow options:', todWindowOptions);


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
      setTimeout(() => setPlayBootAnimation(true), 100);
    }
  }, [isAuthenticated, onboardingStep, setOnboardingStep, playBootAnimation, isClientMounted]);

  useEffect(() => {
    if (onboardingStep !== 'tod' || !isClientMounted || isAppLoading || isTODWindowOpen) return;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onboardingStep, isClientMounted, playerSpyName, faction, playerStats.xp, playerStats.elintReserves, addMessage, setIsLoading, isAppLoading, isTODWindowOpen]);


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

      if (currentScrollLeft <= 5) {
        todContainerRef.current.scrollLeft = (sectionComponents.length - 2) * clientWidth - 5;
      } else if (currentScrollLeft >= maxPossibleScrollLeft - 5) {
        todContainerRef.current.scrollLeft = clientWidth + 5;
      }
    }
  }, [sectionComponents.length]); // setParallaxOffset is stable

  useEffect(() => {
    const container = todContainerRef.current;
    if (onboardingStep === 'tod' && !isAppLoading && isClientMounted && container && playBootAnimation) { // Wait for boot animation to be triggered

      if (!initialScrollSetRef.current) {
        requestAnimationFrame(() => {
          if (todContainerRef.current && todContainerRef.current.clientWidth > 0 && !initialScrollSetRef.current) {
            const sectionWidth = todContainerRef.current.clientWidth;
            const targetSectionIndex = 1; // AgentSection is at index 1 of sectionComponents
            const initialScrollPosition = sectionWidth * targetSectionIndex;
            
            console.log(`Attempting initial scroll: TargetIndex=${targetSectionIndex}, Width=${sectionWidth}, ScrollTo=${initialScrollPosition} (Should be AgentSection)`);
            todContainerRef.current.scrollLeft = initialScrollPosition;
            setParallaxOffset(initialScrollPosition); // Sync parallax with initial scroll
            initialScrollSetRef.current = true;
            console.log(`Initial scroll DONE. todContainerRef.current.scrollLeft = ${todContainerRef.current.scrollLeft}`);
          } else if (todContainerRef.current && todContainerRef.current.clientWidth === 0 && !initialScrollSetRef.current) {
            console.warn("Initial scroll: clientWidth is 0 even after rAF. Layout might not be stable.");
            // Consider a retry mechanism or error if this state persists, though ideally rAF handles it.
          }
        });
      }

      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        if (container) {
          container.removeEventListener('scroll', handleScroll);
        }
      };
    }
  }, [onboardingStep, isAppLoading, isClientMounted, playBootAnimation, handleScroll, sectionComponents.length]); // Added sectionComponents.length due to handleScroll dependency


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
          return <div className="animate-pulse text-2xl font-orbitron holographic-text">LOADING NEXT STEP...</div>;
      }
    };
    return (
      <main className="relative flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 sm:p-6 overflow-y-auto">
        <ParallaxBackground />
        {renderOnboarding()}
        {/* AuthPromptModal was removed in a previous step, assuming Pi Browser integration is handled differently or not primary focus now */}
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

  console.log('HomePage rendering. AppContext faction for TODWindow key:', faction);
  console.log('HomePage rendering. Current ThemeContext theme for TODWindow key:', currentTheme);
  console.log('HomePage rendering. Current ThemeContext themeVersion for TODWindow key:', themeVersion);

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      <ParallaxBackground />

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

      <TODWindow
        key={`${faction}-${themeVersion}-tod-${isTODWindowOpen}`}
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
