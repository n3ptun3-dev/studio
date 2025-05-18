
"use client";
import React, { useState, useEffect } from 'react';
import { HolographicButton, HolographicPanel } from '@/components/game/shared/HolographicPanel';
import { useAppContext, type Faction } from '@/contexts/AppContext';
import type { Theme } from '@/contexts/ThemeContext';
// import { useTheme } from '@/contexts/ThemeContext'; // Not used directly for theme switching here
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Code, Eye, ShieldQuestion } from 'lucide-react';
import { CodenameInput } from './CodenameInput';


interface FactionChoiceScreenProps {}

const factionDetails = {
  Cyphers: {
    icon: <Code className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mb-2 text-blue-400 icon-glow" />,
    name: 'Cyphers' as Faction,
    themeName: 'cyphers' as Theme,
    textColorClass: "text-blue-400",
    borderColorClass: "border-blue-500", // For selected state border
    selectedBgClass: "bg-sky-500", // Test color - Direct Tailwind for selected tile background
    selectedRingClass: "ring-2 ring-blue-400 ring-offset-2 ring-offset-background", // Glow/ring for selected
    defaultTagline: "Information is Power. Decode the Network.",
    alignTagline: "Align with The Cyphers",
  },
  Shadows: {
    icon: <ShieldQuestion className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mb-2 text-red-400 icon-glow" />,
    name: 'Shadows' as Faction,
    themeName: 'shadows' as Theme,
    textColorClass: "text-red-400",
    borderColorClass: "border-red-500", // For selected state border
    selectedBgClass: "bg-rose-500",  // Test color - Direct Tailwind for selected tile background
    selectedRingClass: "ring-2 ring-red-400 ring-offset-2 ring-offset-background", // Glow/ring for selected
    defaultTagline: "Control the Flow. Infiltrate and Disrupt.",
    alignTagline: "Align with The Shadows",
  }
};

export function FactionChoiceScreen({}: FactionChoiceScreenProps) {
  const {
    setFaction: setAppContextFaction,
    openTODWindow,
    setOnboardingStep,
    faction: globalAppFaction, // To get the confirmed global faction
    isTODWindowOpen,
  } = useAppContext();

  // const { theme: currentTheme, setTheme } = useTheme();
  const [selectedFaction, setSelectedFaction] = useState<Faction | null>(null);

  // Debug log
  useEffect(() => {
    console.log(`FactionChoiceScreen rendering. Selected Faction: ${selectedFaction} isTODWindowOpen (from context): ${isTODWindowOpen} Global App Faction: ${globalAppFaction}`);
  }, [selectedFaction, isTODWindowOpen, globalAppFaction]);


  const handleFactionSelect = (factionName: Faction) => {
    if (factionName === 'Observer') return; // Should not happen with current UI
    const newSelectedFaction = selectedFaction === factionName ? null : factionName;
    console.log(`FactionChoiceScreen: handleFactionSelect. New selectedFaction will be: ${newSelectedFaction}`);
    setSelectedFaction(newSelectedFaction);
    // Global theme change is now handled by ThemeUpdater after faction confirmation
  };

  const handleConfirmFaction = (factionNameToConfirm: Faction | null) => {
    if (!factionNameToConfirm || factionNameToConfirm === 'Observer') return;
    console.log(`handleConfirmFaction called with: ${factionNameToConfirm}`);
    setAppContextFaction(factionNameToConfirm); // This will trigger ThemeUpdater
    
    // Determine the theme for the CodenameInput window based on the just-confirmed faction
    const codenameInputTheme = factionNameToConfirm === 'Cyphers' ? 'cyphers' : 'shadows';
    console.log(`Faction ${factionNameToConfirm} confirmed. Opening Codename Input...`);
    openTODWindow(
      "Agent Codename",
      <CodenameInput explicitTheme={codenameInputTheme} />,
      { showCloseButton: false } 
    );
  };

  const handleProceedAsObserver = () => {
    setSelectedFaction('Observer'); // Local state
    setAppContextFaction('Observer'); // Global state
    setOnboardingStep('tod'); // Observers skip codename/fingerprint directly to TOD
  };

  return (
    <HolographicPanel
      className="w-full max-w-2xl p-4 md:p-6 flex flex-col flex-grow h-0 overflow-hidden mx-auto"
      explicitTheme="terminal-green" // This screen itself remains terminal-green until faction is globally set
    >
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-orbitron py-2 mb-2 sm:mb-4 text-center holographic-text flex-shrink-0">
        Select Your Allegiance
      </h1>

      <div className="grid grid-cols-2 gap-0 flex-grow min-h-0 items-start">
        {(Object.values(factionDetails)).map((details, index) => {
          const factionName = details.name;
          const isSelected = selectedFaction === factionName;

          // Use direct Tailwind for selected/unselected backgrounds for clarity
          let tileBgClass = "bg-gray-800"; // Default unselected
          if (isSelected) {
            tileBgClass = factionName === 'Cyphers' ? 'bg-sky-500' : 'bg-rose-500';
          }
          
          // Determine border class
          let tileBorderClass = factionName === 'Cyphers' ? 'border-blue-500' : 'border-red-500';
          if (!isSelected) {
            tileBorderClass = 'border-gray-700'; // Default unselected border
          }
          
          // Debug log for tile rendering
          console.log(`Rendering tile for ${factionName} isSelected: ${isSelected} Applied BG Class should be: ${isSelected ? details.selectedBgClass : 'bg-gray-700'}`);


          return (
            <div
              key={factionName}
              className={cn(
                "transition-all duration-300 cursor-pointer flex flex-col h-full items-center text-center p-3 sm:p-4 border",
                tileBorderClass, // Always show faction border, or selected border
                tileBgClass, // Handles selected/unselected background
                isSelected && details.selectedRingClass,
                index === 0 ? "rounded-l-lg border-r-0" : "rounded-r-lg rounded-l-none",
              )}
              onClick={() => handleFactionSelect(factionName)}
            >
              {details.icon}
              <h2 className={cn(
                "text-lg sm:text-xl md:text-2xl font-orbitron mb-1",
                details.textColorClass // Faction-specific text color
              )}>
                The {factionName}
              </h2>
              <p className={cn(
                "text-xs sm:text-sm md:text-base leading-tight flex-grow",
                details.textColorClass // Faction-specific text color
              )}>
                {details.defaultTagline}
              </p>
              {isSelected && (
                <div className="mt-auto w-full pt-2 flex flex-col items-center">
                  <p className={cn("text-sm text-center my-2 font-semibold", details.textColorClass)}>
                    {details.alignTagline}
                  </p>
                  <HolographicButton
                    className="w-full py-2 text-sm sm:text-base"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent tile's onClick from firing again
                      console.log(`Confirm button for ${factionName} CLICKED`);
                      handleConfirmFaction(factionName);
                    }}
                    // Button should be themed according to its faction when it appears
                    explicitTheme={factionName === 'Cyphers' ? 'cyphers' : 'shadows'}
                  >
                    Confirm
                  </HolographicButton>
                </div>
              )}
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

