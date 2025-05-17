
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
  const { theme: currentTheme, themeVersion } = useTheme();

  console.log('HomePage rendering, isTODWindowOpen:', isTODWindowOpen);
  console.log('HomePage rendering. AppContext faction for TODWindow key:', faction, "Current Theme from useTheme():", currentTheme, "ThemeVersion:", themeVersion);


  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const todContainerRef = useRef<HTMLDivElement>(null);
  const [parallaxOffset, setParallaxOffset] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const initialScrollSetRef = useRef(false);
  const [playBootAnimation, setPlayBootAnimation] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated && onboardingStep !== 'tod' && onboardingStep !== 'fingerprint') {
      setOnboardingStep('fingerprint');
    }
    if (onboardingStep === 'tod' && !playBootAnimation) {
      setTimeout(() => setPlayBootAnimation(true), 100);
    }
  }, [isAuthenticated, onboardingStep, setOnboardingStep, playBootAnimation]);

   useEffect(() => {
    if (onboardingStep !== 'tod') return; // Only run if TOD is active

    if (isAuthenticated && isMounted && !isAppLoading) {
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
    }
  }, [onboardingStep, isAuthenticated, playerSpyName, faction, playerStats, addMessage, setIsLoading, isMounted, isAppLoading]);


  const sectionComponents = React.useMemo(() => [
    <VaultSection key="vault-clone-start" parallaxOffset={parallaxOffset} />,
    <AgentSection key="agent-actual" parallaxOffset={parallaxOffset} />,
    <ControlCenterSection key="control-center-actual" parallaxOffset={parallaxOffset} />,
    <ScannerSection key="scanner-actual" parallaxOffset={parallaxOffset} />,
    <EquipmentLockerSection key="equipment-locker-actual" parallaxOffset={parallaxOffset} />,
    <VaultSection key="vault-actual" parallaxOffset={parallaxOffset} />, // This is the one that stays as the 6th actual section
    <AgentSection key="agent-clone-end" parallaxOffset={parallaxOffset} />,
  ], [parallaxOffset]);


  const handleScroll = useCallback(() => {
    if (todContainerRef.current) {
      const currentScrollLeft = todContainerRef.current.scrollLeft;
      const clientWidth = todContainerRef.current.clientWidth;

      if (clientWidth === 0) return;

      setParallaxOffset(currentScrollLeft);

      const numActualSections = sectionComponents.length - 2; // Agent, Control, Scanner, Equip, Vault = 5 actual
      const scrollPosActualVaultEnd = (numActualSections) * clientWidth; // Position of the *start* of the cloned Agent section (which is after the actual Vault)
                                                                        // The actual vault is at (numActualSections-1) * clientWidth.
                                                                        // So the end of the scrollable area is (sectionComponents.length - 1) * clientWidth.

      const scrollPosActualAgentStart = clientWidth; // This is the start of the first "actual" Agent section (index 1)
      const maxPossibleScrollLeft = (sectionComponents.length - 1) * clientWidth;


      // If scrolled to the very beginning (clone of Vault)
      if (currentScrollLeft <= 5) { // Using a small threshold for precision
        // Jump to the actual Vault section (index 5 which is sectionComponents.length - 2)
        // The cloned vault is at index 0. The actual one is at index (numActualSections = 5).
        // sectionComponents has 7 items. Clone start (Vault), Agent, Control, Scanner, Equip, Vault (Actual), Clone end (Agent)
        // Actual Vault is at index 5. So scrollLeft should be 5 * clientWidth.
         todContainerRef.current.scrollLeft = (sectionComponents.length - 2) * clientWidth;
      }
      // If scrolled to the very end (clone of Agent)
      else if (currentScrollLeft >= maxPossibleScrollLeft - 5) { // Using a small threshold
        // Jump to the actual Agent section (index 1)
        todContainerRef.current.scrollLeft = clientWidth;
      }
    }
  }, [sectionComponents.length]); // parallaxOffset removed as it causes re-runs; setParallaxOffset is stable

  useEffect(() => {
    const container = todContainerRef.current;
    if (onboardingStep === 'tod' && !isAppLoading && isMounted && container) {

      const setInitialScroll = () => {
        if (container.clientWidth > 0 && !initialScrollSetRef.current) {
          const sectionWidth = container.clientWidth;
          // Start at the first "actual" Agent section (index 1)
          const initialScrollPosition = sectionWidth;
          container.scrollLeft = initialScrollPosition;
          setParallaxOffset(initialScrollPosition);
          console.log("Initial scroll set to:", initialScrollPosition);
          initialScrollSetRef.current = true; // Set true once attempted
        } else if (container.clientWidth === 0 && !initialScrollSetRef.current) {
            // Retry if clientWidth is not yet available
            requestAnimationFrame(setInitialScroll);
        }
      };

      if (!initialScrollSetRef.current) {
        requestAnimationFrame(setInitialScroll); // Use rAF for initial setup
      }

      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        if (container) {
            container.removeEventListener('scroll', handleScroll);
        }
      };
    }
  }, [onboardingStep, isAppLoading, isMounted, handleScroll]);


  if (!isMounted || (isAppLoading && onboardingStep !== 'tod')) {
    // This is the view for initial loading or onboarding steps other than 'tod'
    return (
      <main className="relative flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 sm:p-6">
        <ParallaxBackground parallaxOffset={0} />
        {onboardingStep === 'welcome' && <WelcomeScreen />}
        {onboardingStep === 'factionChoice' && <FactionChoiceScreen setShowAuthPrompt={setShowAuthPrompt} />}
        {onboardingStep === 'fingerprint' && <FingerprintScannerScreen />}
        {onboardingStep !== 'welcome' && onboardingStep !== 'factionChoice' && onboardingStep !== 'fingerprint' && onboardingStep !== 'tod' && (
          <div className="animate-pulse text-2xl font-orbitron holographic-text">LOADING INTERFACE...</div>
        )}
        {showAuthPrompt && <AuthPromptModal onClose={() => setShowAuthPrompt(false)} />}
        <TODWindow key={`${faction}-${themeVersion}-onboarding-${isTODWindowOpen}`} isOpen={isTODWindowOpen} onClose={closeTODWindow} title={todWindowTitle}>
          {todWindowContent}
        </TODWindow>
      </main>
    );
  }

  // This is the main view for the TOD itself
  return (
    <main className="relative h-screen w-screen">
      <ParallaxBackground parallaxOffset={parallaxOffset} />

      <div
        className="parallax-layer z-[5] opacity-20" // Reduced opacity from 0.3 to 0.2
        style={{
          transform: `translateX(-${parallaxOffset * 0.5}px)`,
          width: `${sectionComponents.length * 100 * 0.5 + 100}vw`, // Adjusted width calculation
        }}
      >
        <div className="absolute inset-0" style={{
          backgroundImage: `
            repeating-linear-gradient(
              45deg,
              hsl(var(--accent-hsl) / 0.2), /* Was 0.3, now 0.2 for thinner/more transparent */
              hsl(var(--accent-hsl) / 0.2) 1px,
              transparent 1px,
              transparent 60px
            ),
            repeating-linear-gradient(
              -45deg,
              hsl(var(--accent-hsl) / 0.2), /* Was 0.3, now 0.2 */
              hsl(var(--accent-hsl) / 0.2) 1px,
              transparent 1px,
              transparent 60px
            )
          `
        }}></div>
      </div>

      <div
        ref={todContainerRef}
        className={cn(
            "tod-scroll-container absolute inset-0 z-10 scrollbar-hide",
            playBootAnimation && "animate-slide-up-from-bottom"
        )}
        style={{
          WebkitOverflowScrolling: 'touch', // For smoother scrolling on iOS
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
