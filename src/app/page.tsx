
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

  const todContainerRef = useRef<HTMLDivElement>(null);
  const [parallaxOffset, setParallaxOffset] = useState(0);
  const [isClientMounted, setIsClientMounted] = useState(false);
  const initialScrollSetRef = useRef(false);
  const [playBootAnimation, setPlayBootAnimation] = useState(false);

  useEffect(() => {
    setIsClientMounted(true);
  }, []);

  // console.log('HomePage rendering. AppContext faction for TODWindow key:', faction);
  // console.log('HomePage rendering. Current ThemeContext theme for TODWindow key:', currentTheme);
  // console.log('HomePage rendering. Current ThemeContext themeVersion for TODWindow key:', themeVersion);


  useEffect(() => {
    if (onboardingStep === 'tod' && isClientMounted) {
      const timer = setTimeout(() => {
        setPlayBootAnimation(true);
      }, 50); // Short delay to allow initial render
      return () => clearTimeout(timer);
    } else if (onboardingStep !== 'tod') {
      setPlayBootAnimation(false); // Reset animation if navigating away from TOD
    }
  }, [onboardingStep, isClientMounted]);


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
  }, [onboardingStep, isClientMounted, playerSpyName, faction, playerStats, addMessage, setIsLoading, isAppLoading, isTODWindowOpen, playBootAnimation]);


  const sectionComponents = React.useMemo(() => [
    // Clones for infinite looping effect
    <VaultSection key="vault-clone-start" parallaxOffset={parallaxOffset} />, // End of loop, shows start
    // Actual sections in order
    <AgentSection key="agent-actual" parallaxOffset={parallaxOffset} />,
    <ControlCenterSection key="control-center-actual" parallaxOffset={parallaxOffset} />,
    <ScannerSection key="scanner-actual" parallaxOffset={parallaxOffset} />,
    <EquipmentLockerSection key="equipment-locker-actual" parallaxOffset={parallaxOffset} />,
    <VaultSection key="vault-actual" parallaxOffset={parallaxOffset} />,
    // Clone for infinite looping effect
    <AgentSection key="agent-clone-end" parallaxOffset={parallaxOffset} />, // Start of loop, shows end
  ], [parallaxOffset]);


  const handleScroll = useCallback(() => {
    if (todContainerRef.current) {
      const currentScrollLeft = todContainerRef.current.scrollLeft;
      const clientWidth = todContainerRef.current.clientWidth;

      if (clientWidth === 0) return; // Avoid division by zero if not yet rendered

      setParallaxOffset(currentScrollLeft);

      // Infinite scroll logic
      // Assuming 5 actual sections + 2 clones (one at start, one at end)
      // Actual content width for looping is (sectionComponents.length - 2) * clientWidth
      // Max possible scrollLeft before needing to jump to start clone is (sectionComponents.length - 1) * clientWidth
      const totalContentWidthForLooping = (sectionComponents.length - 2) * clientWidth;
      const maxPossibleScrollLeft = (sectionComponents.length - 1) * clientWidth;

      if (currentScrollLeft >= maxPossibleScrollLeft - 5) { // Near the very end of the last clone
          // Jump to the equivalent position in the actual content (which starts after the first clone)
          // The last clone is effectively the first actual section
          todContainerRef.current.scrollLeft = clientWidth + (currentScrollLeft - maxPossibleScrollLeft);
      } else if (currentScrollLeft <= 5) { // Near the very start of the first clone
          // Jump to the equivalent position in the actual content (which ends before the last clone)
          // The first clone is effectively the last actual section
          todContainerRef.current.scrollLeft = totalContentWidthForLooping + currentScrollLeft;
      }
    }
  }, [sectionComponents.length]); // Depends only on the number of sections for calculation logic


  useEffect(() => {
    const container = todContainerRef.current;
    if (onboardingStep === 'tod' && !isAppLoading && isClientMounted && playBootAnimation && container) {
      const setInitialScroll = () => {
        if (todContainerRef.current && todContainerRef.current.clientWidth > 0 && !initialScrollSetRef.current) {
          const sectionWidth = todContainerRef.current.clientWidth;
          // AgentSection is at index 1 in the sectionComponents array (0 is vault-clone-start)
          const targetSectionIndex = 1;
          const initialScrollPosition = sectionWidth * targetSectionIndex;
          
          // console.log(`Attempting initial scroll: TargetIndex=${targetSectionIndex}, Width=${sectionWidth}, ScrollTo=${initialScrollPosition}`);
          todContainerRef.current.scrollLeft = initialScrollPosition;
          setParallaxOffset(initialScrollPosition); // Initialize parallax based on this scroll
          initialScrollSetRef.current = true; // Mark as set
          // console.log(`Initial scroll DONE. todContainerRef.current.scrollLeft = ${todContainerRef.current.scrollLeft}. Initial scroll set ref: ${initialScrollSetRef.current}`);
        } else if (todContainerRef.current && todContainerRef.current.clientWidth === 0 && !initialScrollSetRef.current) {
           // console.warn("Initial scroll: clientWidth is 0. Layout might not be stable for scroll calc.");
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
  }, [onboardingStep, isAppLoading, isClientMounted, playBootAnimation, handleScroll]);


  if (!isClientMounted) {
    return (
      <main className="relative flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 sm:p-6">
        <ParallaxBackground parallaxOffset={0} />
        <div
 className="animate-pulse text-2xl font-orbitron holographic-text text-center"
          style={{
            color: 'lime',
 textShadow: '0 0 5px lime, 0 0 10px lime',
          }}
        >INITIALIZING TOD...</div>
      </main>
    );
  }

  if (isAppLoading && onboardingStep !== 'tod') {
    return (
      <main className="relative flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 sm:p-6">
        <ParallaxBackground parallaxOffset={0} />
        <div className="animate-pulse text-2xl font-orbitron holographic-text text-center">LOADING INTERFACE...</div>
        <TODWindow
          key={`${faction}-${themeVersion}-loading-${isTODWindowOpen}`}
          isOpen={isTODWindowOpen}
          onClose={closeTODWindow}
          title={todWindowTitle}
          explicitTheme={currentTheme}
          themeVersion={themeVersion} // Pass themeVersion here
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
          return <div className="animate-pulse text-2xl font-orbitron holographic-text text-center">LOADING NEXT STEP...</div>;
      }
    };
    return (
      // Ensure this main allows scrolling if its content (e.g., FactionChoiceScreen) is too tall
      <main className="relative flex flex-col items-center justify-start min-h-screen bg-background text-foreground p-4 sm:p-6 overflow-y-auto">
        <ParallaxBackground parallaxOffset={0} />
        {renderOnboarding()}
        <TODWindow
          key={`${faction}-${themeVersion}-${onboardingStep}-${isTODWindowOpen}`}
          isOpen={isTODWindowOpen}
          onClose={closeTODWindow}
          title={todWindowTitle}
          explicitTheme={currentTheme}
          themeVersion={themeVersion} // Pass themeVersion here
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
          width: `${sectionComponents.length * 100 * 0.5 + 100}vw`, // Adjust width based on parallax factor
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
            // scrollSnapType: 'x mandatory', // Removed for smoother scroll
            WebkitOverflowScrolling: 'touch', // For smoother scrolling on iOS
          }}
        >
          {sectionComponents.map((SectionComponentInstance, index) => (
            <div
              key={SectionComponentInstance.key || `tod-section-${index}`}
              className="tod-section"
              // style={{ scrollSnapAlign: 'start' }} // Removed for smoother scroll
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
        themeVersion={themeVersion} // Pass themeVersion here
        showCloseButton={todWindowOptions.showCloseButton !== undefined ? todWindowOptions.showCloseButton : true}
      >
        {todWindowContent}
      </TODWindow>
    </main>
  );
}

