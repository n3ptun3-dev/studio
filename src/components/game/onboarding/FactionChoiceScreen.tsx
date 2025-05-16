
"use client";
import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { HolographicPanel, HolographicButton } from '../shared/HolographicPanel';
import { useAppContext, type Faction } from '@/contexts/AppContext';
import type { Theme } from '@/contexts/ThemeContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Code, Eye, ShieldQuestion } from 'lucide-react';
import { CodenameInput } from './CodenameInput';

interface FactionChoiceScreenProps {
  // setShowAuthPrompt was removed, assuming it's handled by AppContext or direct navigation
}

const factionDetails = {
  Cyphers: {
    theme: "cyphers" as Theme,
    icon: <Code className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mb-2 text-blue-400 icon-glow" />,
    borderColorClass: "border-blue-500", // For persistent border
    selectedRingClass: "ring-2 ring-offset-2 ring-offset-background ring-blue-400 shadow-[0_0_15px_theme(colors.blue.400)]",
    selectedBgClass: "bg-blue-600/40", // More subtle translucent blue overlay
    primaryColorClass: "text-blue-400",
    defaultTagline: "Information is Power. Decode the Network.",
    alignTagline: "Align with The Cyphers",
  },
  Shadows: {
    theme: "shadows" as Theme,
    icon: <ShieldQuestion className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mb-2 text-red-400 icon-glow" />,
    borderColorClass: "border-red-500", // For persistent border
    selectedRingClass: "ring-2 ring-offset-2 ring-offset-background ring-red-400 shadow-[0_0_15px_theme(colors.red.400)]",
    selectedBgClass: "bg-red-600/40", // More subtle translucent red overlay
    primaryColorClass: "text-red-400",
    defaultTagline: "Control the Flow. Infiltrate and Disrupt.",
    alignTagline: "Align with The Shadows",
  }
};

export function FactionChoiceScreen({}: FactionChoiceScreenProps) {
  const {
    setFaction: setAppContextFaction,
    openTODWindow,
    isTODWindowOpen: contextIsTODWindowOpen,
    setOnboardingStep,
    faction: globalAppContextFaction,
  } = useAppContext();

  const { theme: currentTheme, setTheme } = useTheme();
  const [selectedFaction, setSelectedFaction] = useState<Faction | null>(null);

  console.log('FactionChoiceScreen rendering. Selected Faction:', selectedFaction, "isTODWindowOpen (from context):", contextIsTODWindowOpen, "Global App Faction:", globalAppContextFaction, "Current ThemeContext Theme:", currentTheme);

  // This useEffect was causing "Cannot update component while rendering another"
  // It's removed because ThemeUpdater will handle global theme changes based on AppContext.faction
  // Local visual feedback for tile selection (bg color, ring) is handled by local state.

  const handleFactionSelect = (factionName: Faction) => {
    if (factionName === 'Observer') return;
    setSelectedFaction(prev => {
      const newSelection = prev === factionName ? null : factionName;
      console.log(`FactionChoiceScreen: handleFactionSelect. New selectedFaction will be: ${newSelection}`);
      return newSelection;
    });
    // No global theme change here anymore for preview
  };

  const handleConfirmFaction = (factionToConfirm: Faction | null) => {
    console.log('handleConfirmFaction called with:', factionToConfirm);
    if (!factionToConfirm || factionToConfirm === 'Observer') {
      console.error("Attempted to confirm with no faction or as Observer directly from tile confirm.");
      return;
    }
    
    setAppContextFaction(factionToConfirm); // Set global faction
    // ThemeUpdater will now pick this up and change the global theme
    console.log(`Faction ${factionToConfirm} confirmed. Opening Codename Input...`);
    openTODWindow("Agent Codename", <CodenameInput />);
  };

  const handleProceedAsObserver = () => {
    console.log("Proceeding as Observer");
    setSelectedFaction('Observer'); 
    setAppContextFaction('Observer');
    setOnboardingStep('tod');
  };
  
  // The root HolographicPanel uses currentTheme implicitly via CSS variables
  // No key={currentTheme} here to simplify and rely on CSS var updates
  return (
    <HolographicPanel
      className="w-full max-w-2xl p-4 md:p-6 flex flex-col flex-grow h-0 overflow-hidden"
    >
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-orbitron mb-4 sm:mb-6 py-2 text-center holographic-text flex-shrink-0">
        Select Your Allegiance
      </h1>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 flex-grow min-h-0 items-start mb-4 sm:mb-6">
        {(['Cyphers', 'Shadows'] as const).map((factionName) => {
          const details = factionDetails[factionName];
          const isSelected = selectedFaction === factionName;
          
          // Apply holographic-panel for default tile look, then overlay selectedBgClass
          const tileClasses = cn(
            "holographic-panel", // Base panel style for default themed holographic look
            "transition-all duration-300 cursor-pointer flex flex-col h-full", 
            details.borderColorClass, // Persistent team-colored border
            isSelected && details.selectedRingClass,
            isSelected && details.selectedBgClass // Conditional background overlay
          );
          
          console.log('Rendering tile for', factionName, 'isSelected:', isSelected, 'Applied BG Class should be:', isSelected ? details.selectedBgClass : "holographic-panel (default)");

          return (
            <div
              key={factionName}
              className={tileClasses}
              onClick={() => handleFactionSelect(factionName)}
            >
              <div className="p-3 sm:p-4 flex flex-col h-full">
                {details.icon}
                <h2 className={cn("text-lg sm:text-xl md:text-2xl font-orbitron mb-1", details.primaryColorClass)}>
                  The {factionName}
                </h2>
                <p className={cn("text-xs sm:text-sm md:text-base leading-tight text-muted-foreground flex-grow")}>
                  {details.defaultTagline}
                </p>
                {isSelected && (
                  <>
                    <p className="text-sm text-center my-2 holographic-text">
                      {details.alignTagline}
                    </p>
                    <HolographicButton
                      className="mt-auto w-full py-2 text-sm sm:text-base"
                      onClick={(e) => {
                        e.stopPropagation(); 
                        console.log('Confirm button for', factionName, 'CLICKED');
                        handleConfirmFaction(factionName);
                      }}
                    >
                      Confirm
                    </HolographicButton>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Button
        variant="ghost"
        className="w-full md:w-3/4 mx-auto text-muted-foreground hover:text-foreground flex items-center justify-center gap-2 py-2 sm:py-3 mt-auto flex-shrink-0"
        onClick={handleProceedAsObserver}
      >
        <Eye className="w-4 h-4 sm:w-5 sm:h-5" /> Proceed as Observer
      </Button>
    </HolographicPanel>
  );
}
