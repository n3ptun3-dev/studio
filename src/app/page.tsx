
"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAppContext, type Faction } from '@/contexts/AppContext';
import { useTheme, type Theme } from '@/contexts/ThemeContext'; // Import useTheme
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
import { CodenameInput } from '@/components/game/onboarding/CodenameInput';


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
  const { theme: currentTheme, themeVersion } = useTheme(); // Get currentTheme and themeVersion for TODWindow key

  // Debug logs
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
    // Only run AI welcome message if we are in the TOD, client is mounted, not loading, and no TOD window is open.
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
  }, [onboardingStep, isClientMounted, playerSpyName, faction, playerStats.xp, playerStats.elintReserves, addMessage, setIsLoading]); // isAppLoading, isTODWindowOpen removed to avoid potential loops if they toggle frequently


  const sectionComponents = React.useMemo(() => [
    // Start with a clone of the last "real" section for smooth looping from right to left
    <AgentSection key="agent-clone-start" parallaxOffset={parallaxOffset} />,
    <ControlCenterSection key="control-center-actual" parallaxOffset={parallaxOffset} />,
    <ScannerSection key="scanner-actual" parallaxOffset={parallaxOffset} />,
    <EquipmentLockerSection key="equipment-locker-actual" parallaxOffset={parallaxOffset} />,
    <VaultSection key="vault-actual" parallaxOffset={parallaxOffset} />,
    // The first "real" section, which is AgentSection after VaultSection in the loop
    <AgentSection key="agent-actual" parallaxOffset={parallaxOffset} />,
    // End with a clone of the second "real" section for smooth looping from left to right
    <ControlCenterSection key="control-center-clone-end" parallaxOffset={parallaxOffset} />,
  ], [parallaxOffset]);


  const handleScroll = useCallback(() => {
    if (todContainerRef.current) {
      const currentScrollLeft = todContainerRef.current.scrollLeft;
      const clientWidth = todContainerRef.current.clientWidth;

      if (clientWidth === 0) return; // Avoid division by zero if not rendered yet

      setParallaxOffset(currentScrollLeft);

      const maxPossibleScrollLeft = (sectionComponents.length - 1) * clientWidth;
      
      // Adjusted conditions for smoother looping
      if (currentScrollLeft <= 5) { // If scrolled to the far left (into the first clone)
         todContainerRef.current.scrollLeft = (sectionComponents.length - 2) * clientWidth - 5;
      }
      else if (currentScrollLeft >= maxPossibleScrollLeft - 5) { // If scrolled to the far right (into the last clone)
        todContainerRef.current.scrollLeft = clientWidth + 5;
      }
    }
  }, [sectionComponents.length]); // parallaxOffset removed as it was causing re-runs of this effect when it changed

  useEffect(() => {
    const container = todContainerRef.current;
    if (onboardingStep === 'tod' && !isAppLoading && isClientMounted && container) {

      const setInitialScroll = () => {
        if (container.clientWidth > 0 && !initialScrollSetRef.current) {
          const sectionWidth = container.clientWidth;
          // Start on the first "real" AgentSection, which is the second item if Vault is cloned at start,
          // or more generally, the (N-1)th visual section before the final clone.
          // Given the new order: VaultClone, AgentActual, CCActual, ScannerActual, EquipActual, VaultActual, AgentCloneEnd
          // We want to start on AgentActual, which is the second item (index 1).
          // So, if sectionComponents has length L, the actual content starts at index 1 and ends at L-2.
          // The "Agent" section is the first *actual* section after the initial clone.
          // If sections are [VaultCloneStart, AgentActual, CCActual, ScannerActual, EquipActual, VaultActual, AgentCloneEnd] (length 7)
          // VaultActual (original end) is at index 5.
          // AgentActual (original start) is at index 1.
          // We want to start at AgentActual (index 1).
          const initialScrollPosition = sectionWidth * 1; // Start at the first *actual* Agent section
          container.scrollLeft = initialScrollPosition;
          setParallaxOffset(initialScrollPosition);
          console.log("Initial scroll set to:", initialScrollPosition);
          initialScrollSetRef.current = true;
        } else if (container.clientWidth === 0 && !initialScrollSetRef.current) {
            // If clientWidth is 0, the container isn't rendered yet.
            // Wait for the next frame to try again.
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
  }, [onboardingStep, isAppLoading, isClientMounted, handleScroll]); // Removed parallaxOffset, sectionComponents.length


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
          return <FactionChoiceScreen />;
        case 'fingerprint':
          return <FingerprintScannerScreen />;
        default: // Should include 'authPrompt' if we re-add it
          return <div className="animate-pulse text-2xl font-orbitron holographic-text">LOADING NEXT STEP...</div>;
      }
    };
    // This main container handles padding and scrolling for onboarding screens
    return (
      <main className="relative flex flex-col items-center justify-start min-h-screen bg-background text-foreground p-4 sm:p-6 overflow-y-auto">
        <ParallaxBackground />
        {renderOnboarding()}
        {showAuthPrompt && <AuthPromptModal onClose={() => setShowAuthPrompt(false)} />}
        <TODWindow
          key={`${faction}-${themeVersion}-onboarding-${onboardingStep}-${isTODWindowOpen}`}
          isOpen={isTODWindowOpen}
          onClose={closeTODWindow}
          title={todWindowTitle}
          explicitTheme={currentTheme} // TODWindow needs the current theme
          themeVersion={themeVersion}   // And themeVersion to re-key its internal panel
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
  console.log('HomePage rendering. TODWindow props: explicitTheme=', currentTheme, 'key=', `${faction}-${themeVersion}-tod-${isTODWindowOpen}`);


  return (
    <main className="relative h-screen w-screen"> {/* Removed overflow-hidden from here */}
      <ParallaxBackground /> {/* parallaxOffset removed from here */}

      <div
        className="parallax-layer z-[5] opacity-20"
        style={{
          transform: `translateX(-${parallaxOffset * 0.5}px)`,
          width: `${sectionComponents.length * 100 * 0.5 + 100}vw`, // Ensure it's wide enough
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
          // scrollSnapType: 'x mandatory', // Removed for smoother scroll
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

      <TODWindow
        key={`${faction}-${themeVersion}-tod-${isTODWindowOpen}`} // Key includes faction and themeVersion
        isOpen={isTODWindowOpen}
        onClose={closeTODWindow}
        title={todWindowTitle}
        explicitTheme={currentTheme} // Pass the current theme
        themeVersion={themeVersion} // Pass themeVersion to re-key internal HolographicPanel
      >
        {todWindowContent}
      </TODWindow>
    </main>
  );
}
