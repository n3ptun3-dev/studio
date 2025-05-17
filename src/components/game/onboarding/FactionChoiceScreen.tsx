"use client";
import React, { useState, useEffect } from 'react';
import { HolographicPanel, HolographicButton } from '@/components/game/shared/HolographicPanel';
import { useAppContext, type Faction } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Code, Eye, ShieldQuestion } from 'lucide-react';
import { CodenameInput } from './CodenameInput';
import type { Theme } from '@/contexts/ThemeContext'; // For explicitTheme prop

interface FactionChoiceScreenProps {}

const factionDetails = {
  Cyphers: {
    icon: <Code className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mb-2 text-blue-400 icon-glow" />,
    themeName: 'cyphers' as Theme,
    borderColorClass: "border-blue-500", // Used for selected state only
    selectedBgClass: "bg-blue-600/40", // Translucent blue overlay for selected tile
    selectedRingClass: "ring-2 ring-blue-400 ring-offset-2 ring-offset-background", // More prominent ring
    defaultTagline: "Information is Power. Decode the Network.",
    alignTagline: "Align with The Cyphers",
  },
  Shadows: {
    icon: <ShieldQuestion className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mb-2 text-red-400 icon-glow" />,
    themeName: 'shadows' as Theme,
    borderColorClass: "border-red-500", // Used for selected state only
    selectedBgClass: "bg-red-600/40", // Translucent red overlay for selected tile
    selectedRingClass: "ring-2 ring-red-400 ring-offset-2 ring-offset-background",
    defaultTagline: "Control the Flow. Infiltrate and Disrupt.",
    alignTagline: "Align with The Shadows",
  }
};

export function FactionChoiceScreen({}: FactionChoiceScreenProps) {
  const {
    setFaction: setAppContextFaction,
    openTODWindow,
    faction: globalAppContextFaction, // Renamed for clarity
    setOnboardingStep,
    isTODWindowOpen,
   } = useAppContext();

  const [selectedFaction, setSelectedFaction] = useState<Faction | null>(null);

  // Debug logs to trace component state
  console.log('FactionChoiceScreen rendering. Selected Faction:', selectedFaction, "isTODWindowOpen (from context):", isTODWindowOpen, "Global App Faction:", globalAppContextFaction);


  const handleFactionSelect = (factionName: Faction) => {
    if (factionName === 'Observer') return; // Observers don't select this way
    console.log('FactionChoiceScreen: handleFactionSelect. New selectedFaction will be:', factionName);
    setSelectedFaction(prev => (prev === factionName ? null : factionName));
  };

  const handleConfirmFaction = (factionName: Faction | null) => {
    if (!factionName || factionName === 'Observer') {
      console.error("Attempted to confirm with no faction or as Observer directly.");
      return;
    }
    console.log('handleConfirmFaction called with:', factionName);
    setAppContextFaction(factionName); 
    console.log(`Faction ${factionName} confirmed. Opening Codename Input...`);
    
    // Pass the faction's theme to the CodenameInput window
    let themeForCodenameWindow: Theme = factionName === 'Cyphers' ? 'cyphers' : 'shadows';
    openTODWindow("Agent Codename", <CodenameInput explicitTheme={themeForCodenameWindow} />);
  };

  const handleProceedAsObserver = () => {
    console.log("Proceeding as Observer");
    setSelectedFaction('Observer');
    setAppContextFaction('Observer'); 
    setOnboardingStep('tod');
  };
  

  return (
    <HolographicPanel 
      className="w-full max-w-2xl p-4 md:p-6 flex flex-col flex-grow h-0 overflow-hidden"
      // The explicitTheme prop is removed here. This panel will use the global theme.
    >
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-orbitron py-2 mb-2 sm:mb-4 text-center holographic-text flex-shrink-0">
        Select Your Allegiance
      </h1>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 flex-grow min-h-0 items-start mb-4 sm:mb-6">
        {(['Cyphers', 'Shadows'] as const).map((factionName) => {
          const details = factionDetails[factionName];
          const isSelected = selectedFaction === factionName;
          
          // Log applied classes for debugging
          const tileBgClass = isSelected ? details.selectedBgClass : ''; // Only apply selected BG
          console.log(`Rendering tile for ${factionName} isSelected: ${isSelected} Applied BG Class should be: ${tileBgClass || 'holographic-panel (default)'}`);

          return (
            <div
              key={factionName}
              className={cn(
                "holographic-panel", // Base panel styling (will be green initially)
                "transition-all duration-300 cursor-pointer flex flex-col h-full items-center text-center",
                // factionName === 'Cyphers' ? "border-blue-500" : "border-red-500", // Persistent faction border
                isSelected && details.borderColorClass, // Override border color when selected
                isSelected && details.selectedRingClass, // Apply ring effect when selected
                tileBgClass // Apply translucent overlay when selected
              )}
              onClick={() => handleFactionSelect(factionName)}
            >
              {details.icon}
              <h2 className={cn("text-lg sm:text-xl md:text-2xl font-orbitron mb-1 holographic-text")}>
                The {factionName}
              </h2>
              <p className={cn("text-xs sm:text-sm md:text-base leading-tight flex-grow text-muted-foreground")}>
                {details.defaultTagline}
              </p>
              {isSelected && (
                <div className="mt-auto w-full pt-2">
                  <p className={cn("text-sm text-center my-2 font-semibold holographic-text")}>
                    {details.alignTagline}
                  </p>
                  <HolographicButton
                    className="mt-auto w-full py-2 text-sm sm:text-base"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent tile click from re-toggling selection
                      handleConfirmFaction(factionName);
                    }}
                    // The button will get its theme from the HolographicPanel it's in,
                    // which now correctly receives explicitTheme in TODWindow.
                    // For buttons directly on FactionChoiceScreen tiles, we pass explicitTheme.
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