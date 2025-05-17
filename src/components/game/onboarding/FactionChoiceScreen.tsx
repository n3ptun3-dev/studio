
"use client";
import React, { useState, useEffect } from 'react';
import { HolographicButton, HolographicPanel } from '@/components/game/shared/HolographicPanel';
import { useAppContext, type Faction } from '@/contexts/AppContext';
import { useTheme, type Theme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Code, Eye, ShieldQuestion } from 'lucide-react';
import { CodenameInput } from './CodenameInput';


interface FactionChoiceScreenProps {}

const factionDetails = {
  Cyphers: {
    icon: <Code className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mb-2 text-blue-400 icon-glow" />,
    borderColorClass: "border-blue-500", // For selected state border
    selectedBgClass: "bg-blue-600/40", // For selected state background overlay
    selectedRingClass: "ring-sky-400", // For selected state outer ring/glow
    defaultTagline: "Information is Power. Decode the Network.",
    alignTagline: "Align with The Cyphers",
    themeName: 'cyphers' as const,
  },
  Shadows: {
    icon: <ShieldQuestion className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mb-2 text-red-400 icon-glow" />,
    borderColorClass: "border-red-500",
    selectedBgClass: "bg-red-600/40",
    selectedRingClass: "ring-rose-400",
    defaultTagline: "Control the Flow. Infiltrate and Disrupt.",
    alignTagline: "Align with The Shadows",
    themeName: 'shadows' as const,
  }
};

export function FactionChoiceScreen({}: FactionChoiceScreenProps) {
  const {
    setFaction: setAppContextFaction,
    openTODWindow,
    isTODWindowOpen: contextIsTODWindowOpen, 
    faction: globalAppContextFaction, 
    setOnboardingStep,
  } = useAppContext();
  const { theme: currentTheme, setTheme } = useTheme();
  
  const [selectedFaction, setSelectedFaction] = useState<Faction | null>(null);

  console.log('FactionChoiceScreen rendering. Selected Faction:', selectedFaction, "isTODWindowOpen (from context):", contextIsTODWindowOpen, "Global App Faction:", globalAppContextFaction, "Current ThemeContext Theme:", currentTheme);
  
  useEffect(() => {
    let targetTheme: Theme = 'terminal-green';
    if (selectedFaction && selectedFaction !== 'Observer') {
      targetTheme = selectedFaction === 'Cyphers' ? 'cyphers' : 'shadows';
    }
    
    console.log(`FactionChoiceScreen: Theme useEffect. Selected: ${selectedFaction}, Current Theme (from context): ${currentTheme}, Target Theme to set: ${targetTheme}`);
    if (targetTheme !== currentTheme) {
        console.log(`FactionChoiceScreen: Changing theme from ${currentTheme} to ${targetTheme}`);
        setTheme(targetTheme);
    }
  }, [selectedFaction, setTheme, currentTheme]); // currentTheme is needed to prevent unnecessary setTheme calls

  const handleFactionSelect = (factionName: Faction) => {
    if (factionName === 'Observer') return; 
    console.log('FactionChoiceScreen: handleFactionSelect. New selectedFaction will be:', factionName);
    setSelectedFaction(prev => prev === factionName ? null : factionName);
  };

  const handleConfirmFaction = (factionToConfirm: Faction | null) => {
    if (!factionToConfirm || factionToConfirm === 'Observer') {
      console.error("Attempted to confirm with no faction or as Observer directly.");
      return;
    }
    console.log('Confirm button for', factionToConfirm, 'CLICKED');
    setAppContextFaction(factionToConfirm); 
    console.log(`Faction ${factionToConfirm} confirmed. Opening Codename Input...`);
    // The theme of CodenameInput's TODWindow will be handled by the global theme set by ThemeUpdater
    openTODWindow("Agent Codename", <CodenameInput />); 
  };

  const handleProceedAsObserver = () => {
    console.log("Proceeding as Observer");
    setSelectedFaction('Observer'); // Visually indicate selection
    setAppContextFaction('Observer'); 
    setTheme('terminal-green'); // Ensure global theme is terminal-green
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
          
          // Unselected tiles get their specific faction border color.
          // Selected tiles enhance this with a background overlay and ring.
          const tileClasses = cn(
            "holographic-panel", // Base panel style (will pick up current theme)
            "transition-all duration-300 cursor-pointer flex flex-col h-full items-center text-center",
            details.borderColorClass, // Persistent faction-colored border
            isSelected && details.selectedBgClass, // Translucent faction color overlay when selected
            isSelected && details.selectedRingClass // Ring/glow effect when selected
          );

          console.log(`Rendering tile for ${factionName} isSelected: ${isSelected} Applied BG Class should be: ${isSelected ? details.selectedBgClass : 'holographic-panel (default)'}`);

          return (
            <div
              key={factionName}
              className={tileClasses}
              onClick={() => handleFactionSelect(factionName)}
            >
              {details.icon}
              <h2 className={cn(
                  "text-lg sm:text-xl md:text-2xl font-orbitron mb-1 holographic-text",
              )}>
                The {factionName}
              </h2>
              <p className={cn(
                  "text-xs sm:text-sm md:text-base leading-tight flex-grow text-muted-foreground"
              )}>
                {details.defaultTagline}
              </p>
              {isSelected && (
                <>
                  <p className={cn("text-sm text-center my-2 font-semibold holographic-text" )}>
                    {details.alignTagline}
                  </p>
                  <HolographicButton
                    className="mt-auto w-full py-2 text-sm sm:text-base"
                    onClick={(e) => {
                      e.stopPropagation(); 
                      handleConfirmFaction(factionName);
                    }}
                    // Button inherits theme from the screen, which changes on tile selection
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
