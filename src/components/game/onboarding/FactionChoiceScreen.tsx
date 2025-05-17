
"use client";
import React, { useState, useEffect } from 'react';
import { HolographicPanel, HolographicButton } from '../shared/HolographicPanel';
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
    borderColorClass: "border-blue-500", // For selected border
    selectedBgClass: "bg-sky-500", // Opaque blue for selected
    defaultTagline: "Information is Power. Decode the Network.",
    alignTagline: "Align with The Cyphers",
    themeName: 'cyphers' as const,
  },
  Shadows: {
    icon: <ShieldQuestion className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mb-2 text-red-400 icon-glow" />,
    borderColorClass: "border-red-500", // For selected border
    selectedBgClass: "bg-rose-500", // Opaque red for selected
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
    faction: globalAppContextFaction, // Renamed to avoid conflict
  } = useAppContext();
  
  const { theme: currentTheme, setTheme: setThemeContext } = useTheme(); // from ThemeContext
  const [selectedFaction, setSelectedFaction] = useState<Faction | null>(null);

  console.log('FactionChoiceScreen rendering. Selected Faction:', selectedFaction, "isTODWindowOpen (from context):", contextIsTODWindowOpen, "Global App Faction:", globalAppContextFaction);

  const handleFactionSelect = (factionName: Faction) => {
    if (factionName === 'Observer') return;
    console.log('FactionChoiceScreen: handleFactionSelect. New selectedFaction will be:', factionName);
    setSelectedFaction(prev => prev === factionName ? null : factionName);
    // No global theme change here
  };

  const handleConfirmFaction = (factionToConfirm: Faction | null) => {
    console.log('Confirm button for', factionToConfirm, 'CLICKED');
    if (!factionToConfirm || factionToConfirm === 'Observer') {
      console.error("Attempted to confirm with no faction or as Observer directly.");
      return;
    }
    setAppContextFaction(factionToConfirm); // This will trigger ThemeUpdater via AppContext
    console.log(`Faction ${factionToConfirm} confirmed. Opening Codename Input...`);
    openTODWindow("Agent Codename", <CodenameInput />);
  };

  const handleProceedAsObserver = () => {
    console.log("Proceeding as Observer");
    setAppContextFaction('Observer'); // This will trigger ThemeUpdater
    openTODWindow("Agent Codename", <CodenameInput />);
  };

  // Determine the theme for the HolographicPanel border based on globalAppContextFaction
  // This screen itself should reflect the overall application theme once a faction is *confirmed*
  // For now, it defaults to terminal-green (or whatever the :root is)
  // The individual tiles will show selection locally.

  return (
    <HolographicPanel 
      className="w-full max-w-2xl p-4 md:p-6 flex flex-col flex-grow h-0 overflow-hidden"
      // key={currentTheme} // Removed for now to simplify, relies on CSS var cascade
    >
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-orbitron py-2 mb-2 sm:mb-4 text-center holographic-text flex-shrink-0">
        Select Your Allegiance
      </h1>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 flex-grow min-h-0 items-start mb-4 sm:mb-6">
        {(['Cyphers', 'Shadows'] as const).map((factionName) => {
          const details = factionDetails[factionName];
          const isSelected = selectedFaction === factionName;
          
          const tileBgClass = isSelected ? details.selectedBgClass : 'bg-gray-700'; // Direct Tailwind for testing
          const tileBorderClass = isSelected ? details.borderColorClass : 'border-gray-600'; // Direct Tailwind for testing

          console.log(`Rendering tile for ${factionName} isSelected: ${isSelected} Applied BG Class should be: ${tileBgClass}`);
          
          const tileClasses = cn(
            "border-2 rounded-lg p-3 sm:p-4",
            "transition-all duration-300 cursor-pointer flex flex-col h-full",
            tileBorderClass,
            tileBgClass,
            isSelected && "ring-2 ring-offset-1 ring-offset-background ring-accent shadow-[0_0_15px_theme(colors.accent)]" // Generic accent ring
          );

          return (
            <div
              key={factionName}
              className={tileClasses}
              onClick={() => handleFactionSelect(factionName)}
            >
              {React.cloneElement(details.icon, { className: cn(details.icon.props.className, isSelected ? 'text-white' : (factionName === 'Cyphers' ? 'text-blue-400' : 'text-red-400'))})}
              <h2 className={cn(
                  "text-lg sm:text-xl md:text-2xl font-orbitron mb-1",
                  isSelected ? 'text-white' : (factionName === 'Cyphers' ? 'text-blue-400' : 'text-red-400')
              )}>
                The {factionName}
              </h2>
              <p className={cn(
                  "text-xs sm:text-sm md:text-base leading-tight flex-grow", // flex-grow here
                  isSelected ? 'text-gray-200' : 'text-muted-foreground'
              )}>
                {details.defaultTagline}
              </p>
              {isSelected && (
                <>
                  <p className={cn("text-sm text-center my-2", isSelected ? 'text-white' : (factionName === 'Cyphers' ? 'text-blue-300' : 'text-red-300') )}>
                    {details.alignTagline}
                  </p>
                  <HolographicButton
                    className={cn(
                      "mt-auto w-full py-2 text-sm sm:text-base",
                      // Button color remains neutral or themed by its own class, not directly by faction selection state here
                    )}
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent tile's onClick from firing again
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
