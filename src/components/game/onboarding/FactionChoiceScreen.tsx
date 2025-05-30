
"use client";
import React, { useState, useEffect } from 'react';
import { HolographicButton, HolographicPanel } from '@/components/game/shared/HolographicPanel';
import { useAppContext, type Faction } from '@/contexts/AppContext';
import type { Theme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Code, Eye, ShieldQuestion } from 'lucide-react';
// CodenameInput is opened by AppContext after handleAuthentication

interface FactionChoiceScreenProps {}

const factionDetails = {
  Cyphers: {
    icon: <Code className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mb-2 text-blue-400 icon-glow" />,
    name: 'Cyphers' as Faction,
    themeName: 'cyphers' as Theme,
    textColorClass: "text-blue-400",
    borderColorClass: "border-blue-500", // For selected state
    defaultBorderClass: "border-blue-700", // For unselected state
    selectedBgClass: "bg-blue-600/40", // More opaque selection
    selectedRingClass: "ring-2 ring-blue-400 ring-offset-2 ring-offset-background",
    defaultTagline: "Information is Power. Decode the Network.",
    alignTagline: "Align with The Cyphers",
  },
  Shadows: {
    icon: <ShieldQuestion className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mb-2 text-red-400 icon-glow" />,
    name: 'Shadows' as Faction,
    themeName: 'shadows' as Theme,
    textColorClass: "text-red-400",
    borderColorClass: "border-red-500", // For selected state
    defaultBorderClass: "border-red-700", // For unselected state
    selectedBgClass: "bg-red-600/40", // More opaque selection
    selectedRingClass: "ring-2 ring-red-400 ring-offset-2 ring-offset-background",
    defaultTagline: "Control the Flow. Infiltrate and Disrupt.",
    alignTagline: "Align with The Shadows",
  }
};

export function FactionChoiceScreen({}: FactionChoiceScreenProps) {
  const appContext = useAppContext();
  const {
    handleAuthentication, // Use this to handle player creation/update and step transition
    isTODWindowOpen,
    faction: globalAppFaction, // From AppContext
    openTODWindow,
  } = appContext;

  const [selectedFaction, setSelectedFaction] = useState<Faction | null>(null);

  // This useEffect is for debugging and can be removed later
  useEffect(() => {
    console.log(`FactionChoiceScreen rendering. Selected Faction: ${selectedFaction} isTODWindowOpen (from context): ${isTODWindowOpen} Global App Faction (from AppContext): ${globalAppFaction}`);
  }, [selectedFaction, isTODWindowOpen, globalAppFaction]);


  const handleFactionSelect = (factionName: Faction) => {
    if (factionName === 'Observer') return; // Observer path is separate
    const newSelectedFaction = selectedFaction === factionName ? null : factionName;
    console.log(`FactionChoiceScreen: handleFactionSelect. New selectedFaction will be: ${newSelectedFaction}`);
    setSelectedFaction(newSelectedFaction);
    // No global theme change here, only local tile selection
  };

  const handleConfirmFaction = async (factionNameToConfirm: Faction | null) => {
    if (!factionNameToConfirm || factionNameToConfirm === 'Observer') return;
    console.log(`handleConfirmFaction called with: ${factionNameToConfirm}`);
    
    // Simulate Pi Auth - generate a unique ID for this new player
    const mockPiId = "mock_pi_id_" + Date.now() + "_" + factionNameToConfirm.toLowerCase();
    
    // AppContext.handleAuthentication will manage player creation/update,
    // setting faction, and transitioning to 'codenameInput' step.
    // It will also open the CodenameInput TODWindow.
    await handleAuthentication(mockPiId, factionNameToConfirm);
    
    console.log(`Faction ${factionNameToConfirm} confirmed. AppContext updated. AppContext will handle next step (opening CodenameInput).`);
  };

  const handleProceedAsObserver = async () => {
    setSelectedFaction('Observer'); // Local state if needed for UI feedback
    await handleAuthentication("mock_observer_id_" + Date.now(), 'Observer');
    // AppContext.handleAuthentication will set onboardingStep to 'tod' for Observers
  };

  return (
    <HolographicPanel 
        className="w-full max-w-2xl p-4 md:p-6 flex flex-col flex-grow h-0 overflow-hidden"
        explicitTheme="terminal-green" // Faction choice screen is always terminal-green initially
    >
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-orbitron py-2 mb-2 sm:mb-4 text-center holographic-text flex-shrink-0">
        Select Your Allegiance
      </h1>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 flex-grow min-h-0 items-start">
        {(Object.values(factionDetails)).map((details) => {
          const factionName = details.name;
          const isSelected = selectedFaction === factionName;
          
          // Use direct Tailwind for unselected state, selected state adds overlay
          const tileBgClass = isSelected ? details.selectedBgClass : 'bg-gray-700'; // Fallback or explicit unselected bg
          const tileBorderClass = isSelected ? details.borderColorClass : details.defaultBorderClass;
          
          console.log(`Rendering tile for ${factionName} isSelected: ${isSelected} Applied BG Class should be: ${tileBgClass}`);

          return (
            <div
              key={factionName}
              className={cn(
                "holographic-panel", // Base holographic styling for panel look
                "transition-all duration-300 cursor-pointer flex flex-col h-full items-center text-center",
                // No explicit padding here, holographic-panel provides p-4 md:p-6
                tileBorderClass, // Always apply faction border
                isSelected ? details.selectedBgClass : '', // Apply selected BG overlay
                isSelected && details.selectedRingClass
              )}
              onClick={() => handleFactionSelect(factionName)}
            >
              {details.icon}
              <h2 className={cn("text-lg sm:text-xl md:text-2xl font-orbitron mb-1", details.textColorClass)}>
                The {details.name}
              </h2>
              <p className={cn("text-xs sm:text-sm md:text-base leading-tight flex-grow", details.textColorClass)}>
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
                      e.stopPropagation(); 
                      console.log(`Confirm button for ${factionName} CLICKED`);
                      handleConfirmFaction(factionName);
                    }}
                    // Button should be themed to the tile it's in, even if global theme hasn't changed
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
