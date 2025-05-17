
"use client";
import React, { useState, useEffect } from 'react';
import { HolographicPanel, HolographicButton } from '@/components/game/shared/HolographicPanel';
import { useAppContext, type Faction } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Code, Eye, ShieldQuestion } from 'lucide-react';
import { CodenameInput } from './CodenameInput';
import type { Theme } from '@/contexts/ThemeContext'; // For explicitTheme prop
import { useTheme } from '@/contexts/ThemeContext';


interface FactionChoiceScreenProps {}

const factionDetails = {
  Cyphers: {
    icon: <Code className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mb-2 text-blue-400 icon-glow" />,
    themeName: 'cyphers' as Theme,
    borderColorClass: "border-blue-500", // Used for selected state only
    selectedBgClass: "bg-sky-500", // Bright blue, opaque
    selectedRingClass: "ring-2 ring-blue-400 ring-offset-2 ring-offset-background",
    defaultTagline: "Information is Power. Decode the Network.",
    alignTagline: "Align with The Cyphers",
    textColorClass: "text-blue-400",
  },
  Shadows: {
    icon: <ShieldQuestion className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mb-2 text-red-400 icon-glow" />,
    themeName: 'shadows' as Theme,
    borderColorClass: "border-red-500", // Used for selected state only
    selectedBgClass: "bg-rose-500", // Bright red, opaque
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
    faction: globalAppContextFaction,
    setOnboardingStep,
    isTODWindowOpen,
   } = useAppContext();
  const { theme: currentTheme, setTheme } = useTheme(); // Get global theme context

  const [selectedFaction, setSelectedFaction] = useState<Faction | null>(null);

  // Debug logs to trace component state
  console.log('FactionChoiceScreen rendering. Selected Faction:', selectedFaction, "isTODWindowOpen (from context):", isTODWindowOpen, "Global App Faction:", globalAppContextFaction, "Current ThemeContext Theme:", currentTheme);

  const handleFactionSelect = (factionName: Faction) => {
    if (factionName === 'Observer') return;
    const newSelectedFaction = selectedFaction === factionName ? null : factionName;
    console.log('FactionChoiceScreen: handleFactionSelect. New selectedFaction will be:', newSelectedFaction);
    setSelectedFaction(newSelectedFaction);

    // Change global theme on selection for preview
    if (newSelectedFaction === 'Cyphers') {
      setTheme('cyphers');
    } else if (newSelectedFaction === 'Shadows') {
      setTheme('shadows');
    } else {
      setTheme('terminal-green'); // Revert to default if deselected or Observer
    }
  };

  const handleConfirmFaction = (factionName: Faction | null) => {
    if (!factionName || factionName === 'Observer') {
      console.error("Attempted to confirm with no faction or as Observer directly.");
      return;
    }
    console.log('handleConfirmFaction called with:', factionName);
    setAppContextFaction(factionName); 
    console.log(`Faction ${factionName} confirmed. Opening Codename Input...`);
    
    // The TODWindow will now pick up its theme from the global ThemeContext via HomePage
    // and its explicitTheme prop passed down.
    openTODWindow("Agent Codename", <CodenameInput explicitTheme={factionName === 'Cyphers' ? 'cyphers' : 'shadows'} />);
  };

  const handleProceedAsObserver = () => {
    console.log("Proceeding as Observer");
    setSelectedFaction('Observer');
    setAppContextFaction('Observer'); 
    setTheme('terminal-green'); // Ensure Observer flow sets global theme to terminal-green
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

      <div className="grid grid-cols-2 flex-grow min-h-0 items-start mb-4 sm:mb-6"> {/* Removed gap */}
        {(['Cyphers', 'Shadows'] as const).map((factionName, index) => {
          const details = factionDetails[factionName];
          const isSelected = selectedFaction === factionName;
          
          const tileBgClass = isSelected ? details.selectedBgClass : 'bg-gray-800'; // Use gray-800 for unselected
          const tileBorderClass = isSelected ? details.borderColorClass : 'border-gray-700';

          console.log(`Rendering tile for ${factionName} isSelected: ${isSelected} Applied BG Class should be: ${tileBgClass}`);

          return (
            <div
              key={factionName}
              className={cn(
                "transition-all duration-300 cursor-pointer flex flex-col h-full items-center text-center p-3 sm:p-4",
                tileBorderClass, // Always apply a border
                tileBgClass, // Always apply a background
                isSelected && details.selectedRingClass, // Apply ring effect when selected
                index === 0 ? "rounded-l-lg border-r-0" : "rounded-r-lg", // Round outer corners, remove inner border
                "border" // Ensure border utility is applied
              )}
              onClick={() => handleFactionSelect(factionName)}
            >
              {details.icon}
              <h2 className={cn(
                "text-lg sm:text-xl md:text-2xl font-orbitron mb-1",
                details.textColorClass // Apply faction text color
              )}>
                The {factionName}
              </h2>
              <p className={cn(
                "text-xs sm:text-sm md:text-base leading-tight flex-grow",
                details.textColorClass // Apply faction text color
              )}>
                {details.defaultTagline}
              </p>
              {isSelected && (
                <div className="mt-auto w-full pt-2">
                  <p className={cn("text-sm text-center my-2 font-semibold", details.textColorClass)}>
                    {details.alignTagline}
                  </p>
                  <HolographicButton
                    className="mt-auto w-full py-2 text-sm sm:text-base"
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
