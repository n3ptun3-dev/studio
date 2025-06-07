
"use client";
import React, { useState, useEffect } from 'react';
import { HolographicButton, HolographicPanel } from '@/components/game/shared/HolographicPanel';
import { useAppContext, type Faction } from '@/contexts/AppContext';
import type { Theme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Code, ShieldQuestion } from 'lucide-react';

interface FactionChoiceScreenProps {}

const factionDetails = {
  Cyphers: {
    icon: <Code className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mb-2 text-blue-400 icon-glow" />,
    name: 'Cyphers' as Faction,
    themeName: 'cyphers' as Theme,
    textColorClass: "text-blue-400",
    borderColorClass: "border-blue-500",
    defaultBorderClass: "border-blue-700",
    selectedBgClass: "bg-blue-600/40",
    selectedRingClass: "ring-2 ring-blue-400 ring-offset-2 ring-offset-background",
    defaultTagline: "Information is Power. Decode the Network.",
    alignButtonText: "Align with The Cyphers", // New button text
  },
  Shadows: {
    icon: <ShieldQuestion className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mb-2 text-red-400 icon-glow" />,
    name: 'Shadows' as Faction,
    themeName: 'shadows' as Theme,
    textColorClass: "text-red-400",
    borderColorClass: "border-red-500",
    defaultBorderClass: "border-red-700",
    selectedBgClass: "bg-red-600/40",
    selectedRingClass: "ring-2 ring-red-400 ring-offset-2 ring-offset-background",
    defaultTagline: "Control the Flow. Infiltrate and Disrupt.",
    alignButtonText: "Align with The Shadows", // New button text
  }
};

export function FactionChoiceScreen({}: FactionChoiceScreenProps) {
  const appContext = useAppContext();
  const {
    handleAuthentication,
    pendingPiId, // Get the Pi ID that was authenticated on Welcome screen
    addMessage,
  } = appContext;

  const [selectedFaction, setSelectedFaction] = useState<Faction | null>(null);

  const handleFactionSelect = (factionName: Faction) => {
    if (factionName === 'Observer') return;
    const newSelectedFaction = selectedFaction === factionName ? null : factionName;
    setSelectedFaction(newSelectedFaction);
  };

  const handleConfirmFaction = async (factionNameToConfirm: Faction | null) => {
    if (!factionNameToConfirm || factionNameToConfirm === 'Observer') {
      addMessage({ type: 'error', text: 'Invalid faction selection.' });
      return;
    }
    if (!pendingPiId) {
      addMessage({ type: 'error', text: 'Authentication incomplete. Please go back and authenticate with Pi.' });
      // Potentially redirect to welcome or show a modal
      return;
    }

    // AppContext.handleAuthentication will manage player creation (since pendingPiId implies new user for this ID),
    // setting faction, and transitioning to 'codenameInput' step.
    await handleAuthentication(pendingPiId, factionNameToConfirm);
    addMessage({ type: 'system', text: `Faction ${factionNameToConfirm} chosen. Proceed to codename assignment.` });
  };

  return (
    <HolographicPanel
        className="w-full max-w-2xl p-4 md:p-6 flex flex-col flex-grow h-0 overflow-hidden"
        explicitTheme="terminal-green"
    >
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-orbitron py-2 mb-2 sm:mb-4 text-center holographic-text flex-shrink-0">
        Select Your Allegiance
      </h1>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 flex-grow min-h-0 items-start">
        {(Object.values(factionDetails)).map((details) => {
          const factionName = details.name;
          const isSelected = selectedFaction === factionName;
          const tileBgClass = isSelected ? details.selectedBgClass : 'bg-gray-700/20';
          const tileBorderClass = isSelected ? details.borderColorClass : details.defaultBorderClass;

          return (
            <div
              key={factionName}
              className={cn(
                "holographic-panel",
                "transition-all duration-300 cursor-pointer flex flex-col h-full items-center text-center",
                tileBorderClass,
                isSelected ? details.selectedBgClass : 'hover:bg-gray-700/40', // Hover effect for unselected
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
                  {/* Removed the extra tagline text that was here */}
                  <HolographicButton
                    className="w-full py-2 text-sm sm:text-base"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleConfirmFaction(factionName);
                    }}
                    explicitTheme={factionName === 'Cyphers' ? 'cyphers' : 'shadows'}
                  >
                    {details.alignButtonText} {/* Using the new button label */}
                  </HolographicButton>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* "Proceed as Observer" button removed from this screen */}
    </HolographicPanel>
  );
}
