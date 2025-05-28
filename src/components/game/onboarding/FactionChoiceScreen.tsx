
"use client";
import React, { useState, useEffect } from 'react';
import { HolographicButton } from '@/components/game/shared/HolographicPanel';
import { useAppContext, type Faction } from '@/contexts/AppContext';
import type { Theme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Code, Eye, ShieldQuestion } from 'lucide-react';
// CodenameInput is now opened by AppContext via HomePage's useEffect
// import { CodenameInput } from './CodenameInput';


interface FactionChoiceScreenProps {}

const factionDetails = {
  Cyphers: {
    icon: <Code className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mb-2 text-blue-400 icon-glow" />,
    name: 'Cyphers' as Faction,
    themeName: 'cyphers' as Theme,
    textColorClass: "text-blue-400",
    borderColorClass: "border-blue-500",
    selectedBgClass: "bg-sky-500",
    selectedRingClass: "ring-2 ring-blue-400 ring-offset-2 ring-offset-background",
    defaultTagline: "Information is Power. Decode the Network.",
    alignTagline: "Align with The Cyphers",
  },
  Shadows: {
    icon: <ShieldQuestion className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mb-2 text-red-400 icon-glow" />,
    name: 'Shadows' as Faction,
    themeName: 'shadows' as Theme,
    textColorClass: "text-red-400",
    borderColorClass: "border-red-500",
    selectedBgClass: "bg-rose-500",
    selectedRingClass: "ring-2 ring-red-400 ring-offset-2 ring-offset-background",
    defaultTagline: "Control the Flow. Infiltrate and Disrupt.",
    alignTagline: "Align with The Shadows",
  }
};

export function FactionChoiceScreen({}: FactionChoiceScreenProps) {
  const appContext = useAppContext();
  const {
    // setOnboardingStep, // No longer directly called here to open codename input
    isTODWindowOpen, // Still used for logging if needed
    faction: globalAppFaction, // For logging
  } = appContext;

  const [selectedFaction, setSelectedFaction] = useState<Faction | null>(null);

  useEffect(() => {
    console.log(`FactionChoiceScreen rendering. Selected Faction: ${selectedFaction} isTODWindowOpen (from context): ${isTODWindowOpen} Global App Faction: ${globalAppFaction}`);
  }, [selectedFaction, isTODWindowOpen, globalAppFaction]);


  const handleFactionSelect = (factionName: Faction) => {
    if (factionName === 'Observer') return;
    const newSelectedFaction = selectedFaction === factionName ? null : factionName;
    console.log(`FactionChoiceScreen: handleFactionSelect. New selectedFaction will be: ${newSelectedFaction}`);
    setSelectedFaction(newSelectedFaction);
  };

  const handleConfirmFaction = async (factionNameToConfirm: Faction | null) => {
    if (!factionNameToConfirm || factionNameToConfirm === 'Observer') return;
    console.log(`handleConfirmFaction called with: ${factionNameToConfirm}`);
    const mockPiId = "mock_pi_id_" + Date.now() + "_" + factionNameToConfirm.toLowerCase();
    await appContext.handleAuthentication(mockPiId, factionNameToConfirm);
    // AppContext.handleAuthentication will set the onboardingStep to 'codenameInput',
    // and HomePage's useEffect will open the TODWindow.
    console.log(`Faction ${factionNameToConfirm} confirmed. AppContext updated. HomePage will handle next step.`);
  };

  const handleProceedAsObserver = async () => {
    setSelectedFaction('Observer'); // Local state
    // Use a distinct ID for observers to allow potential specific handling or data
    await appContext.handleAuthentication("mock_observer_id_" + Date.now(), 'Observer');
    // AppContext.handleAuthentication will set onboardingStep to 'tod' for Observers
  };

  return (
    <div className="w-full p-4 sm:p-6 flex flex-col items-center justify-center flex-grow">
      <div // This div now takes max-width and acts like the old HolographicPanel for layout
        className={cn(
          "w-full max-w-2xl p-4 md:p-6 flex flex-col flex-grow h-0 overflow-hidden",
          // Applying holographic panel styles directly here using CSS variables
          "border rounded-lg",
          "border-[var(--hologram-panel-border)]",
          "bg-[var(--hologram-panel-bg)]",
          "shadow-[0_0_15px_var(--hologram-glow-color),_inset_0_0_10px_var(--hologram-glow-color)]"
        )}
      >
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-orbitron py-2 mb-2 sm:mb-4 text-center holographic-text flex-shrink-0">
          Select Your Allegiance
        </h1>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 flex-grow min-h-0 items-start">
          {(Object.values(factionDetails)).map((details) => {
            const factionName = details.name;
            const isSelected = selectedFaction === factionName;
            
            const tileBgClass = isSelected ? details.selectedBgClass : 'bg-gray-700';
            const tileBorderClass = isSelected ? details.borderColorClass : 'border-gray-600';
            
            console.log(`Rendering tile for ${factionName} isSelected: ${isSelected} Applied BG Class should be: ${tileBgClass}`);

            return (
              <div
                key={factionName}
                className={cn(
                  "transition-all duration-300 cursor-pointer flex flex-col h-full items-center text-center p-3 sm:p-4 border",
                  tileBorderClass,
                  tileBgClass,
                  isSelected && details.selectedRingClass,
                )}
                onClick={() => handleFactionSelect(factionName)}
              >
                {details.icon}
                <h2 className={cn(
                  "text-base sm:text-lg md:text-xl font-orbitron mb-1",
                  details.textColorClass
                )}>
                  The {factionName}
                </h2>
                <p className={cn(
                  "text-xs sm:text-sm md:text-base leading-tight flex-grow",
                  details.textColorClass
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
                        e.stopPropagation();
                        console.log(`Confirm button for ${factionName} CLICKED`);
                        handleConfirmFaction(factionName);
                      }}
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
      </div>
    </div>
  );
}

    