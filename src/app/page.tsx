
"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext'; // Import useTheme
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
  const { theme: currentTheme } = useTheme(); // Consume theme context

  console.log('HomePage rendering, isTODWindowOpen:', isTODWindowOpen); // DEBUG: Log isTODWindowOpen

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
    if (isAuthenticated && onboardingStep !== 'tod' && onboardingStep !== 'fingerprint') { // Ensure fingerprint is also a valid post-auth step
      setOnboardingStep('fingerprint');
    }
    if (onboardingStep === 'tod' && !playBootAnimation) {
      // Delay boot animation slightly to allow other elements to mount if needed
      setTimeout(() => setPlayBootAnimation(true), 100);
    }
  }, [isAuthenticated, onboardingStep, setOnboardingStep, playBootAnimation]);

   useEffect(() => {
    // IMPORTANT: Only run welcome message logic if onboarding is complete and TOD is active
    if (onboardingStep === 'tod' && isAuthenticated && isMounted && !isAppLoading) {
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
    }
  }, [onboardingStep, isAuthenticated, playerSpyName, faction, playerStats, addMessage, setIsLoading, isMounted, isAppLoading]);


  const sectionComponents = React.useMemo(() => [
    <VaultSection key="vault-clone-start" parallaxOffset={parallaxOffset} />, // Clone for start
    <AgentSection key="agent-actual" parallaxOffset={parallaxOffset} />,
    <ControlCenterSection key="control-center-actual" parallaxOffset={parallaxOffset} />,
    <ScannerSection key="scanner-actual" parallaxOffset={parallaxOffset} />,
    <EquipmentLockerSection key="equipment-locker-actual" parallaxOffset={parallaxOffset} />,
    <VaultSection key="vault-actual" parallaxOffset={parallaxOffset} />, // Actual last section
    <AgentSection key="agent-clone-end" parallaxOffset={parallaxOffset} />,   // Clone for end
  ], [parallaxOffset]);


  const handleScroll = useCallback(() => {
    if (todContainerRef.current) {
      const currentScrollLeft = todContainerRef.current.scrollLeft;
      const clientWidth = todContainerRef.current.clientWidth;

      if (clientWidth === 0) return;

      setParallaxOffset(currentScrollLeft);

      const numActualSections = sectionComponents.length - 2; // Total sections minus the two clones
      const scrollPosActualVault = (numActualSections -1) * clientWidth; // Index of VaultSection (actual)
      const scrollPosActualAgent = clientWidth; // AgentSection (actual) is the second item (index 1)
      const maxPossibleScrollLeft = (sectionComponents.length - 1) * clientWidth;


      // If scrolled to the very beginning (clone of Vault), jump to the actual VaultSection
      if (currentScrollLeft <= 5) { // Using a small threshold
        todContainerRef.current.scrollLeft = scrollPosActualVault;
      }
      // If scrolled to the very end (clone of Agent), jump to the actual AgentSection
      else if (currentScrollLeft >= maxPossibleScrollLeft - 5) { // Using a small threshold
        todContainerRef.current.scrollLeft = scrollPosActualAgent;
      }
    }
  }, [sectionComponents.length]); // Only depends on the number of sections

  useEffect(() => {
    const container = todContainerRef.current;
    if (onboardingStep === 'tod' && !isAppLoading && isMounted && container) {

      const setInitialScroll = () => {
        if (container.clientWidth > 0 && !initialScrollSetRef.current) {
          const sectionWidth = container.clientWidth;
          // Start at the Agent Section (which is the second item, index 1, after the Vault clone)
          const initialScrollPosition = sectionWidth;
          container.scrollLeft = initialScrollPosition;
          setParallaxOffset(initialScrollPosition); // Set initial parallax

          // Check if scrollLeft has been set, if not, retry.
          // Sometimes clientWidth is available but scrollLeft assignment is not immediate.
          if (Math.abs(container.scrollLeft - initialScrollPosition) < 5) { // Allow small deviation
            initialScrollSetRef.current = true; // Mark as set
            console.log("Initial scroll set to:", initialScrollPosition);
          } else {
             requestAnimationFrame(setInitialScroll); // Retry on next frame
          }
        } else if (container.clientWidth === 0) {
            // If clientWidth is 0, container is not yet laid out, retry.
            requestAnimationFrame(setInitialScroll);
        }
      };
      
      if (!initialScrollSetRef.current) {
        setInitialScroll();
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
    return (
      <main className="relative flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
        <ParallaxBackground parallaxOffset={0} /> {/* No offset during loading */}
        <div className="animate-pulse text-2xl font-orbitron holographic-text">INITIALIZING TOD...</div>
      </main>
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
        return null; // Should not happen
    }
  };

  // Onboarding Steps
  if (onboardingStep !== 'tod') {
    return (
      <main className="relative flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 sm:p-6">
        <ParallaxBackground parallaxOffset={0} />
        {renderOnboarding()}
        {showAuthPrompt && <AuthPromptModal onClose={() => setShowAuthPrompt(false)} />}
        {/* TODWindow is rendered below but will only be visible if isTODWindowOpen is true */}
         <TODWindow key={currentTheme + "-onboarding"} isOpen={isTODWindowOpen} onClose={closeTODWindow} title={todWindowTitle}>
          {todWindowContent}
        </TODWindow>
      </main>
    );
  }
  
  // This is the main view for the TOD itself
  return (
    <main className="relative h-screen w-screen"> 
      <ParallaxBackground parallaxOffset={parallaxOffset} />

      {/* Parallax Grid Layer */}
      <div
        className="parallax-layer z-[5] opacity-30" // Increased base opacity slightly
        style={{
          transform: `translateX(-${parallaxOffset * 0.5}px)`,
          width: `${sectionComponents.length * 100 * 0.5 + 100}vw`, // Adjusted width for parallax
        }}
      >
        <div className="absolute inset-0" style={{ 
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
        }}></div>
      </div>

      {/* TOD Scroll Container */}
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
            key={SectionComponentInstance.key || `tod-section-${index}`} // Use component's key or generate one
            className="tod-section" // Ensures each section takes full viewport width
          >
            {SectionComponentInstance}
          </div>
        ))}
      </div>

      {/* Global TOD Window, re-keyed by theme to force style update */}
      <TODWindow key={currentTheme + "-tod"} isOpen={isTODWindowOpen} onClose={closeTODWindow} title={todWindowTitle}>
        {todWindowContent}
      </TODWindow>
    </main>
  );
}
    
