
"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAppContext } from '@/contexts/AppContext';
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
    isTODWindowOpen, // Crucial for rendering TODWindow
    todWindowTitle,
    todWindowContent,
    closeTODWindow,
   } = useAppContext();

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
    if (isAuthenticated && onboardingStep !== 'tod') {
      // If already authenticated but not yet at TOD, fast-track to fingerprint
      // This might happen if they authenticated and then reloaded the page
      // or if faction choice leads directly to auth prompt in some flows.
      setOnboardingStep('fingerprint');
    }
    // Trigger boot animation when TOD step is reached
    if (onboardingStep === 'tod' && !playBootAnimation) {
      setTimeout(() => setPlayBootAnimation(true), 100); // Small delay for effect
    }
  }, [isAuthenticated, onboardingStep, setOnboardingStep, playBootAnimation]);

   useEffect(() => {
    if (onboardingStep === 'tod' && isAuthenticated && isMounted && !isAppLoading) {
      setIsLoading(true);
      const isNewUser = !playerStats.xp && !playerStats.elintReserves; // Basic check for new user

      if (isNewUser) {
        // Specific welcome for brand new agents reaching the TOD
        addMessage({
          text: "Welcome, Agent. HQ guidance protocol initiated. Familiarize yourself with the Tactical Overlay Device. Your first objective: explore your Agent PAD.",
          type: 'hq',
          isPinned: true,
        });
        setIsLoading(false);
      } else {
        // Welcome back message for returning agents
        const welcomeInput: WelcomeMessageInput = {
          playerName: playerSpyName || "Agent", // Use spy name if available
          faction: faction,
          elintReserves: playerStats.elintReserves,
          networkActivity: "Medium", // Placeholder, could be dynamic
          vaultDefenses: "Holding",  // Placeholder, could be dynamic
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


  // Order: Vault (clone start), Agent, Control Center, Scanner, Equipment, Vault (actual), Agent (clone end)
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

      if (clientWidth === 0) return; // Avoid division by zero if not yet rendered

      setParallaxOffset(currentScrollLeft); // Update parallax offset based on scroll

      // Infinite scroll logic:
      // sectionComponents.length includes the 2 clones.
      // numActualSections is the count of unique sections in the loop.
      const numActualSections = sectionComponents.length - 2; 
      
      // Scroll position of the *actual* VaultSection (which is second to last in the 'actual' sequence)
      const scrollPosActualVault = (numActualSections -1) * clientWidth; 
      // Scroll position of the *actual* AgentSection (which is first in the 'actual' sequence)
      const scrollPosActualAgent = clientWidth;


      // Maximum scrollable width considering all sections including clones
      const maxPossibleScrollLeft = (sectionComponents.length - 1) * clientWidth;

      // If scrolled to the very beginning (at the left clone of Vault)
      if (currentScrollLeft <= 5) { // Using a small threshold for precision
        // Jump to the actual VaultSection
        todContainerRef.current.scrollLeft = scrollPosActualVault;
      }
      // If scrolled to the very end (at the right clone of Agent)
      else if (currentScrollLeft >= maxPossibleScrollLeft - 5) { // Small threshold
        // Jump to the actual AgentSection
        todContainerRef.current.scrollLeft = scrollPosActualAgent;
      }
    }
  }, [sectionComponents.length]); // parallaxOffset removed as it's a side-effect, not a determinant of scroll logic

  useEffect(() => {
    const container = todContainerRef.current;
    if (onboardingStep === 'tod' && !isAppLoading && isMounted && container) {

      // Set initial scroll position to the first "actual" section (AgentSection)
      const setInitialScroll = () => {
        if (container.clientWidth > 0 && !initialScrollSetRef.current) {
          const sectionWidth = container.clientWidth;
          // The first "actual" section is at index 1 (after the start clone)
          const initialScrollPosition = sectionWidth; // Scrolls one section width to the right
          container.scrollLeft = initialScrollPosition;
          setParallaxOffset(initialScrollPosition); // Set initial parallax

          // Check if scrollLeft was actually set (sometimes needs a frame)
          // and if it's close enough to the target (browser precision)
          if (Math.abs(container.scrollLeft - initialScrollPosition) < 5) {
            initialScrollSetRef.current = true; // Mark as set
            console.log("Initial scroll set to:", initialScrollPosition);
          } else {
            // If not set correctly, retry on next frame
             requestAnimationFrame(setInitialScroll);
          }
        } else if (container.clientWidth === 0) {
            // If clientWidth is 0, container is not yet laid out, retry.
            requestAnimationFrame(setInitialScroll);
        }
      };
      
      if (!initialScrollSetRef.current) {
        setInitialScroll();
      }

      // Add scroll event listener
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        if (container) {
            container.removeEventListener('scroll', handleScroll);
        }
      };
    }
  }, [onboardingStep, isAppLoading, isMounted, handleScroll]); // handleScroll is stable


  if (!isMounted || (isAppLoading && onboardingStep !== 'tod')) {
    // Show a loading screen for initial app load or if onboarding step is not TOD yet (and is loading)
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
        return null; // Or some default error/fallback UI
    }
  };

  // If onboarding is not complete, render the appropriate onboarding screen
  if (onboardingStep !== 'tod') {
    // This main container is for onboarding steps.
    // It's a flex column, centers its content, fills the screen height, and has overall padding.
    // Individual onboarding screens (like WelcomeScreen) will use flex-grow to fill the space within this padded area.
    return (
      <main className="relative flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 sm:p-6">
        <ParallaxBackground parallaxOffset={0} />
        {renderOnboarding()}
        {showAuthPrompt && <AuthPromptModal onClose={() => setShowAuthPrompt(false)} />}
      </main>
    );
  }

  // This is the main view for the TOD itself
  return (
    <main className="relative h-screen w-screen overflow-hidden">
      <ParallaxBackground parallaxOffset={parallaxOffset} />

      {/* Parallax layer for grid effect - a bit slower than main scroll */}
      <div
        className="parallax-layer z-[5]" // Ensure it's above ParallaxBackground but below TOD
        style={{
          transform: `translateX(-${parallaxOffset * 0.5}px)`, // Slower scroll speed
          // Width needs to be larger to accommodate the slower scroll without showing edges
          // If sections are 100vw, and this scrolls at 0.5x, it effectively needs ~0.5x the total content width
          // plus enough to cover the screen. Total content width = sectionComponents.length * 100vw
          // So, this layer's width could be something like: (sectionComponents.length * 100 * 0.5) + 100vw
          width: `${sectionComponents.length * 100 * 0.5 + 100}vw`,
        }}
      >
        <div className="absolute inset-0 opacity-30" style={{ // Increased opacity slightly
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
            "tod-scroll-container absolute inset-0 z-10 scrollbar-hide", // scrollbar-hide is from globals.css
            playBootAnimation && "animate-slide-up-from-bottom"
        )}
        style={{
          // scrollSnapType: 'x mandatory', // Removed for smoother scrolling
          WebkitOverflowScrolling: 'touch', // For smoother scrolling on iOS
        }}
      >
        {sectionComponents.map((SectionComponentInstance, index) => (
          <div
            key={SectionComponentInstance.key || `tod-section-${index}`} // Use the key from the component instance
            className="tod-section" // tod-section: flex-shrink-0 w-screen h-full relative
            // style={{ scrollSnapAlign: 'start' }} // Removed for smoother scrolling
          >
            {SectionComponentInstance}
          </div>
        ))}
      </div>

      {/* TODWindow: Rendered on top of everything if isTODWindowOpen is true */}
      <TODWindow isOpen={isTODWindowOpen} onClose={closeTODWindow} title={todWindowTitle}>
        {todWindowContent}
      </TODWindow>
    </main>
  );
}
    