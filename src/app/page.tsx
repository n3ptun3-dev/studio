
// src/app/page.tsx

"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useAppContext, type Faction, type PlayerStats, type GameItemBase } from '@/contexts/AppContext'; // Added PlayerStats
import { useTheme, type Theme } from '@/contexts/ThemeContext';
import { WelcomeScreen } from '@/components/game/onboarding/WelcomeScreen';
import { FactionChoiceScreen } from '@/components/game/onboarding/FactionChoiceScreen';
import { FingerprintScannerScreen } from '@/components/game/onboarding/FingerprintScannerScreen';
import { ParallaxBackground } from '@/components/game/shared/ParallaxBackground';
import { AgentSection } from '@/components/game/tod/AgentSection';
import ControlCenterSection from '@/components/game/tod/ControlCenterSection';
import { EquipmentLockerSection } from '@/components/game/tod/EquipmentLockerSection';
import { VaultSection } from '@/components/game/tod/VaultSection';
import { ScannerSection } from '@/components/game/tod/ScannerSection';
import { TODWindow } from '@/components/game/shared/TODWindow';
import { InventoryBrowserInTOD } from '@/components/game/inventory/InventoryBrowserInTOD';
// import { generateWelcomeMessage, type WelcomeMessageInput } from '@/ai/flows/welcome-message'; // AI Disabled
import { cn } from '@/lib/utils';
import { CodenameInput } from '@/components/game/onboarding/CodenameInput';


const DEFAULT_PLAYER_STATS_FOR_NEW_PLAYER: PlayerStats = {
  xp: 0, level: 0, elintReserves: 0, elintTransferred: 0,
  successfulVaultInfiltrations: 0, successfulLockInfiltrations: 0,
  elintObtainedTotal: 0, elintObtainedCycle: 0, elintLostTotal: 0, elintLostCycle: 0,
  elintGeneratedTotal: 0, elintGeneratedCycle: 0, elintTransferredToHQCyle: 0,
  successfulInterferences: 0, elintSpentSpyShop: 0,
  hasPlacedFirstLock: false,
};


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
    openTODWindow, 
    isScrollLockActive, // Get scroll lock state from AppContext
  } = appContext;

  const { theme: currentThemeContextTheme, themeVersion } = useTheme(); 

  const todContainerRef = useRef<HTMLDivElement>(null);
  const [parallaxOffset, setParallaxOffset] = useState(0);
  const [isClientMounted, setIsClientMounted] = useState(false);
  const initialScrollSetRef = useRef(false);
  const [playBootAnimation, setPlayBootAnimation] = useState(false);

  useEffect(() => {
    setIsClientMounted(true);
  }, []);

  useEffect(() => {
    if (onboardingStep === 'tod' && isClientMounted) {
      const timer = setTimeout(() => {
        setPlayBootAnimation(true);
      }, 50);
      return () => clearTimeout(timer);
    } else if (onboardingStep !== 'tod') {
      setPlayBootAnimation(false);
    }
  }, [onboardingStep, isClientMounted]);


  useEffect(() => {
    if (onboardingStep !== 'tod' || !isClientMounted || isAppLoading || isTODWindowOpen || !playBootAnimation) return;
    
    const isNewPlayer = !playerStats.xp && playerStats.elintReserves <= DEFAULT_PLAYER_STATS_FOR_NEW_PLAYER.elintReserves && playerStats.level <= 1;

    if (faction === 'Observer') {
      addMessage({
        text: "Observation deck online. Monitoring network activity.",
        type: 'system',
        isPinned: true,
      });
      setIsLoading(false); 
    } else if (isNewPlayer && playerSpyName) {
      addMessage({
        text: `Welcome, Agent ${playerSpyName}. HQ guidance protocol initiated. Familiarize yourself with the Tactical Overlay Device. Your first objective: explore your Agent PAD.`,
        type: 'hq',
        isPinned: true,
      });
       setIsLoading(false); 
    } else if (playerSpyName) { 
      // AI Welcome Message Disabled
      addMessage({
        text: `Agent ${playerSpyName}, welcome back. Standard operational parameters active. HQ awaits your report.`,
        type: 'hq',
        isPinned: true,
      });
       setIsLoading(false); 
    } else {
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
    if (isScrollLockActive) return; // Do not handle scroll if lock is active

    if (todContainerRef.current) {
      const currentScrollLeft = todContainerRef.current.scrollLeft;
      const clientWidth = todContainerRef.current.clientWidth;
      if (clientWidth === 0) return;
      setParallaxOffset(currentScrollLeft);

      const totalContentWidthForLooping = (sectionComponents.length - 2) * clientWidth; 
      const maxPossibleScrollLeft = (sectionComponents.length - 1) * clientWidth;

      if (currentScrollLeft >= maxPossibleScrollLeft - 5) { 
        todContainerRef.current.scrollLeft = clientWidth + (currentScrollLeft - maxPossibleScrollLeft);
      } else if (currentScrollLeft <= 5) { 
        todContainerRef.current.scrollLeft = totalContentWidthForLooping + currentScrollLeft;
      }
    }
  }, [sectionComponents.length, isScrollLockActive]); // Add isScrollLockActive to dependencies

  useEffect(() => {
    const container = todContainerRef.current;
    if (onboardingStep === 'tod' && !isAppLoading && isClientMounted && playBootAnimation && container) {
      const setInitialScroll = () => {
        if (todContainerRef.current && todContainerRef.current.clientWidth > 0 && !initialScrollSetRef.current) {
          const sectionWidth = todContainerRef.current.clientWidth;
          const targetSectionIndex = 1; 
          const initialScrollPosition = sectionWidth * targetSectionIndex;
          todContainerRef.current.scrollLeft = initialScrollPosition;
          setParallaxOffset(initialScrollPosition); 
          initialScrollSetRef.current = true;
        }
      };
      
      requestAnimationFrame(setInitialScroll);

      // Conditionally add/remove scroll listener based on isScrollLockActive
      // The passive option is important. If we need to call preventDefault() inside handleScroll,
      // we cannot use { passive: true }. However, for performance, it's generally good.
      // Since EquipmentLockerSection will manage its own preventDefault, this can remain passive.
      const scrollListenerOptions = { passive: true };
      
      if (!isScrollLockActive) {
        container.addEventListener('scroll', handleScroll, scrollListenerOptions);
      } else {
        // If scroll lock becomes active, remove the listener to prevent TOD scrolling
        container.removeEventListener('scroll', handleScroll);
      }
      
      return () => {
        if (container) {
          container.removeEventListener('scroll', handleScroll);
        }
      };
    }
  }, [onboardingStep, isAppLoading, isClientMounted, playBootAnimation, handleScroll, isScrollLockActive]); // Add isScrollLockActive to dependencies

  const renderOnboarding = () => {
    switch (onboardingStep) {
      case 'welcome':
        return <WelcomeScreen />;
      case 'factionChoice':
        return <FactionChoiceScreen />;
      case 'fingerprint':
        return <FingerprintScannerScreen />;
      default: 
        return <div className="animate-pulse text-2xl font-orbitron holographic-text text-center">LOADING SYSTEM DATA...</div>;
    }
  };

  if (!isClientMounted) {
    return (
      <main className="relative flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 sm:p-6">
        <ParallaxBackground /> 
        <div className="text-2xl font-orbitron holographic-text text-center animate-pulse">INITIALIZING TOD...</div>
      </main>
    );
  }

  if (isAppLoading && onboardingStep !== 'tod') {
    return (
      <main className="relative flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 sm:p-6">
        <ParallaxBackground />
        <div className="animate-pulse text-2xl font-orbitron holographic-text text-center">LOADING INTERFACE...</div>
         <TODWindow
            key={`${faction}-${currentThemeContextTheme}-${themeVersion}-loading-${isTODWindowOpen}`}
            isOpen={isTODWindowOpen && !todInventoryContext}
            onClose={closeTODWindow}
            title={todWindowTitle}
            explicitTheme={currentThemeContextTheme} 
            themeVersion={themeVersion}
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
           key={`${faction}-${currentThemeContextTheme}-${themeVersion}-onboarding-${isTODWindowOpen}-${onboardingStep}`}
          isOpen={isTODWindowOpen && !todInventoryContext}
          onClose={closeTODWindow}
          title={todWindowTitle}
          explicitTheme={todWindowOptions.explicitTheme || currentThemeContextTheme} 
          themeVersion={todWindowOptions.themeVersion || themeVersion}
          showCloseButton={todWindowOptions.showCloseButton !== undefined ? todWindowOptions.showCloseButton : true}
        >
          {todWindowContent}
        </TODWindow>
      </main>
    );
  }
  
  return (
    <main className="relative h-screen w-screen overflow-hidden"> 
      <ParallaxBackground />
      
      <div 
        className="parallax-layer z-[5] opacity-30"
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
      />

      {isSpyShopActive && (
        <div
          className="fixed inset-0 z-[9998] transition-colors duration-200 ease-in-out"
          style={{ backgroundColor: `hsl(var(--primary-hsl) / 0.5)` }} 
        />
      )}

      {playBootAnimation && (
        <div
          ref={todContainerRef}
          className={cn(
            "tod-scroll-container absolute inset-0 z-10 scrollbar-hide",
            "animate-slide-up-from-bottom"
          )}
          style={{ WebkitOverflowScrolling: 'touch' }}
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
        key={`${faction}-${todWindowOptions.explicitTheme || currentThemeContextTheme}-${todWindowOptions.themeVersion || themeVersion}-tod-${isTODWindowOpen}-${todInventoryContext ? 'inv-open' : 'inv-closed'}`}
        isOpen={isTODWindowOpen && !todInventoryContext}
        onClose={closeTODWindow}
        title={todWindowTitle}
        explicitTheme={todWindowOptions.explicitTheme || currentThemeContextTheme} 
        themeVersion={todWindowOptions.themeVersion || themeVersion} 
        showCloseButton={todWindowOptions.showCloseButton !== undefined ? todWindowOptions.showCloseButton : true}
      >
        {todWindowContent}
      </TODWindow>

      {todInventoryContext && (
        <TODWindow
          key={`${faction}-${todWindowOptions.explicitTheme || currentThemeContextTheme}-${todWindowOptions.themeVersion || themeVersion}-inventory-${todInventoryContext.category}-${isTODWindowOpen}`}
          isOpen={!!todInventoryContext}
          onClose={closeInventoryTOD}
          title={todInventoryContext.title}
          explicitTheme={todWindowOptions.explicitTheme || currentThemeContextTheme} 
          themeVersion={todWindowOptions.themeVersion || themeVersion} 
          showCloseButton={true}
        >
          <InventoryBrowserInTOD context={todInventoryContext} />
        </TODWindow>
      )}
    </main>
  );
}

