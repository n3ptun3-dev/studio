
"use client";
import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { HolographicPanel, HolographicButton } from '../shared/HolographicPanel';
import { useAppContext, type Faction } from '@/contexts/AppContext';
// import { useTheme, type Theme } from '@/contexts/ThemeContext'; // No longer directly setting theme here for preview
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Code, Eye, ShieldQuestion } from 'lucide-react';
import { CodenameInput } from './CodenameInput';

interface FactionChoiceScreenProps {
  setShowAuthPrompt: (show: boolean) => void;
}

const factionDetails = {
  Cyphers: {
    icon: <Code className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mb-2 text-blue-400 icon-glow" />,
    borderColorClass: "border-blue-500", // For unselected state, if different
    selectedRingClass: "ring-2 ring-offset-2 ring-offset-background ring-blue-400 shadow-[0_0_15px_theme(colors.blue.400)]",
    selectedBgClass: "bg-blue-600/60", // More opaque for better visibility over holographic-panel base
    defaultTagline: "Information is Power. Decode the Network.",
    alignTagline: "Align with The Cyphers",
    primaryColorClass: "text-blue-400",
  },
  Shadows: {
    icon: <ShieldQuestion className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mb-2 text-red-400 icon-glow" />,
    borderColorClass: "border-red-500", // For unselected state, if different
    selectedRingClass: "ring-2 ring-offset-2 ring-offset-background ring-red-400 shadow-[0_0_15px_theme(colors.red.400)]",
    selectedBgClass: "bg-red-600/60", // More opaque for better visibility
    defaultTagline: "Control the Flow. Infiltrate and Disrupt.",
    alignTagline: "Align with The Shadows",
    primaryColorClass: "text-red-400",
  }
};

export function FactionChoiceScreen({ setShowAuthPrompt }: FactionChoiceScreenProps) {
  const {
    setFaction: setAppContextFaction,
    openTODWindow,
    isTODWindowOpen: contextIsTODWindowOpen,
    setOnboardingStep,
    faction: globalAppContextFaction, // Renamed to avoid conflict
  } = useAppContext();

  // const { theme: currentTheme, setTheme } = useTheme(); // No longer setting theme directly from here for preview

  const [selectedFaction, setSelectedFaction] = useState<Faction | null>(null);

  console.log('FactionChoiceScreen rendering. Selected Faction:', selectedFaction, "isTODWindowOpen (from context):", contextIsTODWindowOpen, "Global App Faction:", globalAppContextFaction);


  const handleFactionSelect = (factionName: Faction) => {
    if (factionName === 'Observer') return;
    console.log('FactionChoiceScreen: handleFactionSelect. New selectedFaction will be:', factionName);
    setSelectedFaction(prev => prev === factionName ? null : factionName);
    // Global theme change is handled by ThemeUpdater after AppContext.faction is set via handleConfirmFaction.
  };

  const handleConfirmFaction = (factionToConfirm: Faction | null) => {
    console.log('Confirm button for', factionToConfirm, 'CLICKED');
    if (!factionToConfirm || factionToConfirm === 'Observer') {
      console.error("Attempted to confirm with no faction or as Observer directly.");
      return;
    }

    console.log('handleConfirmFaction called with:', factionToConfirm);
    setAppContextFaction(factionToConfirm);
    console.log(`Faction ${factionToConfirm} confirmed. Opening Codename Input...`);
    openTODWindow("Agent Codename", <CodenameInput />);
    // setOnboardingStep is handled by CodenameInput after successful submission
  };

  const handleProceedAsObserver = () => {
    console.log("Proceeding as Observer");
    setAppContextFaction('Observer'); // This will trigger ThemeUpdater
    setOnboardingStep('tod'); // Directly to TOD for observer
  };

  return (
    <HolographicPanel
      className="w-full max-w-2xl p-4 md:p-6 flex flex-col flex-grow h-0 overflow-hidden" // Uses theme from ThemeContext
    >
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-orbitron mb-2 py-2 text-center holographic-text flex-shrink-0">
        Select Your Allegiance
      </h1>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 flex-grow min-h-0 items-start mb-4 sm:mb-6">
        {(['Cyphers', 'Shadows'] as const).map((factionName) => {
          const details = factionDetails[factionName];
          const isSelected = selectedFaction === factionName;
          
          // Log the applied background class for debugging
          const currentBgClass = isSelected ? details.selectedBgClass : 'holographic-panel (default)';
          console.log(`Rendering tile for ${factionName} isSelected: ${isSelected} Applied BG Class should be: ${currentBgClass}`);

          const tileClasses = cn(
            "holographic-panel", // Base panel styling from globals.css (will be terminal-green themed initially)
            "transition-all duration-300 cursor-pointer flex flex-col h-full rounded-lg p-3 sm:p-4",
            details.borderColorClass, // Always show faction border color
            isSelected && details.selectedRingClass, // Ring/shadow effect on selection
            isSelected && details.selectedBgClass // Conditional background overlay on selection
          );

          return (
            <div
              key={factionName}
              className={tileClasses}
              onClick={() => handleFactionSelect(factionName)}
            >
              {details.icon}
              <h2 className={cn(
                  "text-lg sm:text-xl md:text-2xl font-orbitron mb-1",
                  isSelected ? 'text-white' : details.primaryColorClass // Text color changes on selection
              )}>
                The {factionName}
              </h2>
              <p className={cn(
                  "text-xs sm:text-sm md:text-base leading-tight flex-grow", // flex-grow helps push button down
                  isSelected ? 'text-gray-200' : 'text-muted-foreground'
              )}>
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
                      e.stopPropagation(); // Prevent tile's onClick from firing
                      handleConfirmFaction(factionName);
                    }}
                  >
                    Confirm
                  </HolographicButton>
                </>
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

