
"use client";
import React, { useState, useEffect } from 'react';
import { HolographicButton } from '@/components/game/shared/HolographicPanel';
import { useAppContext, type Faction } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Code, Eye, ShieldQuestion } from 'lucide-react';
import { CodenameInput } from './CodenameInput';
import { HolographicPanel } from '@/components/game/shared/HolographicPanel';


interface FactionChoiceScreenProps {}

const factionDetails = {
  Cyphers: {
    icon: <Code className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mb-2 text-blue-400 icon-glow" />,
    name: 'Cyphers' as Faction,
    themeName: 'cyphers' as Theme,
    borderColorClass: "border-blue-500",
    selectedBgClass: "bg-sky-500", // Test color
    selectedRingClass: "ring-2 ring-blue-400 ring-offset-2 ring-offset-background",
    defaultTagline: "Information is Power. Decode the Network.",
    alignTagline: "Align with The Cyphers",
    textColorClass: "text-blue-400",
  },
  Shadows: {
    icon: <ShieldQuestion className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mb-2 text-red-400 icon-glow" />,
    name: 'Shadows' as Faction,
    themeName: 'shadows' as Theme,
    borderColorClass: "border-red-500",
    selectedBgClass: "bg-rose-500", // Test color
    selectedRingClass: "ring-2 ring-red-400 ring-offset-2 ring-offset-background",
    defaultTagline: "Control the Flow. Infiltrate and Disrupt.",
    alignTagline: "Align with The Shadows",
    textColorClass: "text-red-400",
  }
};

export function FactionChoiceScreen({}: FactionChoiceScreenProps) {
  const {
    setFaction: setAppContextFaction,
    openTODWindow,
    setOnboardingStep,
   } = useAppContext();

  const [selectedFaction, setSelectedFaction] = useState<Faction | null>(null);

  const handleFactionSelect = (factionName: Faction) => {
    if (factionName === 'Observer') return;
    const newSelectedFaction = selectedFaction === factionName ? null : factionName;
    setSelectedFaction(newSelectedFaction);
  };

  const handleConfirmFaction = (factionNameToConfirm: Faction | null) => {
    if (!factionNameToConfirm || factionNameToConfirm === 'Observer') return;
    setAppContextFaction(factionNameToConfirm);
    // ThemeUpdater will pick up appContextFaction change and set global theme
    openTODWindow(
      "Agent Codename",
      <CodenameInput explicitTheme={factionNameToConfirm === 'Cyphers' ? 'cyphers' : 'shadows'} />,
      { showCloseButton: false } // Pass options object
    );
  };

  const handleProceedAsObserver = () => {
    setSelectedFaction('Observer');
    setAppContextFaction('Observer');
    // ThemeUpdater will set theme to terminal-green
    setOnboardingStep('tod');
  };

  return (
    <HolographicPanel
      className="w-full max-w-2xl p-4 md:p-6 flex flex-col flex-grow h-0 overflow-hidden"
      explicitTheme="terminal-green" // Screen itself remains terminal-green
    >
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-orbitron py-2 mb-2 sm:mb-4 text-center holographic-text flex-shrink-0">
        Select Your Allegiance
      </h1>

      <div className="grid grid-cols-2 flex-grow min-h-0 items-start">
        {(Object.values(factionDetails)).map((details, index) => {
          const factionName = details.name;
          const isSelected = selectedFaction === factionName;
          const tileBgClass = isSelected ? details.selectedBgClass : 'bg-gray-800';
          const tileBorderClass = isSelected ? details.borderColorClass : 'border-gray-700';

          return (
            <div
              key={factionName}
              className={cn(
                "transition-all duration-300 cursor-pointer flex flex-col h-full items-center text-center p-3 sm:p-4 border",
                tileBorderClass,
                tileBgClass,
                isSelected && details.selectedRingClass,
                index === 0 ? "rounded-l-lg border-r-0" : "rounded-r-lg"
              )}
              onClick={() => handleFactionSelect(factionName)}
            >
              {details.icon}
              <h2 className={cn(
                "text-lg sm:text-xl md:text-2xl font-orbitron mb-1",
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
    </HolographicPanel>
  );
}
