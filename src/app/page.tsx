
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


// Desired actual order: Agent, ControlCenter, Scanner, EquipmentLocker, Vault
// For looping, sections will be: [Vault (clone), Agent, ControlCenter, Scanner, EquipmentLocker, Vault, Agent (clone)]

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
      setOnboardingStep('fingerprint');
    }
    if (onboardingStep === 'tod' && !playBootAnimation) {
      // Delay slightly to ensure component is rendered before animation starts
      setTimeout(() => setPlayBootAnimation(true), 100);
    }
  }, [isAuthenticated, onboardingStep, setOnboardingStep, playBootAnimation]);

  // Welcome message generation logic
   useEffect(() => {
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

      const numActualSections = sectionComponents.length - 2; 
      const scrollPosActualAgent = clientWidth; 
      const scrollPosActualVault = (sectionComponents.length - 2) * clientWidth; 


      const maxPossibleScrollLeft = (sectionComponents.length - 1) * clientWidth;

      if (currentScrollLeft <= 5) { 
        todContainerRef.current.scrollLeft = scrollPosActualVault;
      }
      else if (currentScrollLeft >= maxPossibleScrollLeft - 5) { 
        todContainerRef.current.scrollLeft = scrollPosActualAgent;
      }
    }
  }, [sectionComponents.length]);

  useEffect(() => {
    const container = todContainerRef.current;
    if (onboardingStep === 'tod' && !isAppLoading && isMounted && container) {

      const setInitialScroll = () => {
        if (container.clientWidth > 0 && !initialScrollSetRef.current) {
          const sectionWidth = container.clientWidth;
          const initialScrollPosition = sectionWidth; 
          container.scrollLeft = initialScrollPosition;
          setParallaxOffset(initialScrollPosition);

          if (Math.abs(container.scrollLeft - initialScrollPosition) < 5) { 
            initialScrollSetRef.current = true;
          } else {
             requestAnimationFrame(setInitialScroll);
          }
        }
      };

      if (container.clientWidth === 0) {
        requestAnimationFrame(setInitialScroll);
      } else {
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
        <ParallaxBackground parallaxOffset={0} />
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
        return null;
    }
  };

  if (onboardingStep !== 'tod') {
    return (
      <main className="relative flex flex-col items-center justify-start min-h-screen bg-background text-foreground p-4 sm:p-6 overflow-y-auto">
        <ParallaxBackground parallaxOffset={0} />
        {renderOnboarding()}
        {showAuthPrompt && <AuthPromptModal onClose={() => setShowAuthPrompt(false)} />}
      </main>
    );
  }

  return (
    <main className="relative h-screen w-screen overflow-hidden"> 
      <ParallaxBackground parallaxOffset={parallaxOffset} />

      <div
        className="parallax-layer z-[5]"
        style={{
          transform: `translateX(-${parallaxOffset * 0.5}px)`,
          width: `${sectionComponents.length * 100 * 0.5 + 100}vw`, // Ensure it's wide enough
        }}
      >
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `repeating-linear-gradient(
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
          )`
        }}></div>
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

      <TODWindow isOpen={isTODWindowOpen} onClose={closeTODWindow} title={todWindowTitle}>
        {todWindowContent}
      </TODWindow>
    </main>
  );
}
