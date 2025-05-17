
"use client";
import React, { useState, useEffect } from 'react';
// Removed HolographicButton import for this test, will use placeholder
// import { HolographicButton, HolographicPanel } from '@/components/game/shared/HolographicPanel';
import { HolographicPanel } from '@/components/game/shared/HolographicPanel';
import { useAppContext, type Faction } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Code, Eye, ShieldQuestion } from 'lucide-react';
import { CodenameInput } from './CodenameInput';
import type { Theme } from '@/contexts/ThemeContext';

interface FactionChoiceScreenProps {}

const factionDetails = {
  Cyphers: {
    icon: <Code className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mb-2 text-blue-400 icon-glow" />,
    themeName: 'cyphers' as const,
    borderColorClass: "border-blue-500",
    selectedBgClass: "bg-sky-500", // Using direct Tailwind for testing
    selectedRingClass: "ring-2 ring-sky-400",
    defaultTagline: "Information is Power. Decode the Network.",
    alignTagline: "Align with The Cyphers",
  },
  Shadows: {
    icon: <ShieldQuestion className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mb-2 text-red-400 icon-glow" />,
    themeName: 'shadows' as const,
    borderColorClass: "border-red-500",
    selectedBgClass: "bg-rose-500", // Using direct Tailwind for testing
    selectedRingClass: "ring-2 ring-rose-400",
    defaultTagline: "Control the Flow. Infiltrate and Disrupt.",
    alignTagline: "Align with The Shadows",
  }
};

export function FactionChoiceScreen({}: FactionChoiceScreenProps) {
  const {
    setFaction: setAppContextFaction,
    openTODWindow,
    faction: globalAppContextFaction,
    setOnboardingStep,
    isTODWindowOpen,
  } = useAppContext();

  const [selectedFaction, setSelectedFaction] = useState<Faction | null>(null);

  console.log('FactionChoiceScreen rendering. Selected Faction:', selectedFaction, "isTODWindowOpen (from context):", isTODWindowOpen, "Global App Faction:", globalAppContextFaction);

  const handleFactionSelect = (factionName: Faction) => {
    if (factionName === 'Observer') return;
    console.log('FactionChoiceScreen: handleFactionSelect. New selectedFaction will be:', factionName);
    setSelectedFaction(prev => (prev === factionName ? null : factionName));
  };

  const handleConfirmFaction = (factionName: Faction | null) => {
    if (!factionName || factionName === 'Observer') {
      console.error("Attempted to confirm with no faction or as Observer directly.");
      return;
    }
    console.log('Confirm button for', factionName, 'CLICKED');
    setAppContextFaction(factionName);
    console.log(`Faction ${factionName} confirmed. Opening Codename Input...`);
    let explicitThemeForCodenameWindow: Theme = factionName === 'Cyphers' ? 'cyphers' : 'shadows';
    openTODWindow("Agent Codename", <CodenameInput explicitTheme={explicitThemeForCodenameWindow} />);
  };

  const handleProceedAsObserver = () => {
    console.log("Proceeding as Observer");
    setSelectedFaction('Observer');
    setAppContextFaction('Observer');
    setOnboardingStep('tod');
  };

  return (
    <HolographicPanel
      className={cn(
        "w-full max-w-2xl p-4 md:p-6 flex flex-col flex-grow h-0 overflow-hidden"
      )}
    >
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-orbitron py-2 mb-2 sm:mb-4 text-center holographic-text flex-shrink-0">
        Select Your Allegiance
      </h1>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 flex-grow min-h-0 items-start mb-4 sm:mb-6">
        {(['Cyphers', 'Shadows'] as const).map((factionName) => {
          const details = factionDetails[factionName];
          const isSelected = selectedFaction === factionName;
          
          let tileBgClass = 'bg-gray-700';
          let tileBorderClass = 'border-gray-600';

          if (isSelected) {
            tileBgClass = details.selectedBgClass;
            tileBorderClass = details.borderColorClass;
          }
          console.log(`Rendering tile for ${factionName} isSelected: ${isSelected} Applied BG Class should be: ${tileBgClass}`);

          return (
            <div
              key={factionName}
              className={cn(
                "transition-all duration-300 cursor-pointer flex flex-col h-full items-center text-center p-3 sm:p-4 rounded-lg border", // Added base border class
                tileBgClass,
                tileBorderClass,
                isSelected && details.selectedRingClass
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
                  {/* Using a simple div as a button placeholder for this test */}
                  <div
                    className="mt-auto w-full py-2 text-sm sm:text-base border border-primary rounded-md text-primary-foreground bg-primary/80 hover:bg-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Confirm placeholder for', factionName, 'CLICKED');
                      handleConfirmFaction(factionName);
                    }}
                  >
                    Confirm
                  </div>
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
