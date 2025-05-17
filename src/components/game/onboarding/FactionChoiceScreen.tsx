
"use client";
import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { HolographicPanel, HolographicButton } from '../shared/HolographicPanel';
import { useAppContext, type Faction } from '@/contexts/AppContext';
// import { useTheme, type Theme } from '@/contexts/ThemeContext'; // Local theme preview removed
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Code, Eye, ShieldQuestion } from 'lucide-react';
import { CodenameInput } from './CodenameInput';

interface FactionChoiceScreenProps {
  // setShowAuthPrompt: (show: boolean) => void; // Not currently used
}

const factionDetails = {
  Cyphers: {
    icon: <Code className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mb-2 text-blue-400 icon-glow" />,
    selectedRingClass: "ring-2 ring-offset-1 ring-offset-background ring-blue-400 shadow-[0_0_15px_theme(colors.blue.400)]",
    unselectedBorderClass: "border-blue-500",
    selectedBorderClass: "border-sky-300",
    selectedBgClass: "bg-sky-500", // Test color
    unselectedBgClass: "bg-gray-700", // Test color for unselected
    defaultTagline: "Information is Power. Decode the Network.",
    alignTagline: "Align with The Cyphers",
    primaryColorClass: "text-blue-400",
  },
  Shadows: {
    icon: <ShieldQuestion className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mb-2 text-red-400 icon-glow" />,
    selectedRingClass: "ring-2 ring-offset-1 ring-offset-background ring-red-400 shadow-[0_0_15px_theme(colors.red.400)]",
    unselectedBorderClass: "border-red-500",
    selectedBorderClass: "border-rose-300",
    selectedBgClass: "bg-rose-500", // Test color
    unselectedBgClass: "bg-gray-700", // Test color for unselected
    defaultTagline: "Control the Flow. Infiltrate and Disrupt.",
    alignTagline: "Align with The Shadows",
    primaryColorClass: "text-red-400",
  }
};

export function FactionChoiceScreen({}: FactionChoiceScreenProps) {
  const {
    setFaction: setAppContextFaction,
    openTODWindow,
    isTODWindowOpen: contextIsTODWindowOpen,
    faction: globalAppContextFaction, // Renamed to avoid conflict
  } = useAppContext();

  const [selectedFaction, setSelectedFaction] = useState<Faction | null>(null);

  console.log('FactionChoiceScreen rendering. Selected Faction:', selectedFaction, "isTODWindowOpen (from context):", contextIsTODWindowOpen, "Global App Faction:", globalAppContextFaction);

  const handleFactionSelect = (factionName: Faction) => {
    if (factionName === 'Observer') return;
    console.log('FactionChoiceScreen: handleFactionSelect. New selectedFaction will be:', factionName);
    setSelectedFaction(prev => prev === factionName ? null : factionName);
    // No global theme change here anymore. Global theme changes only on confirm.
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
  };

  const handleProceedAsObserver = () => {
    console.log("Proceeding as Observer");
    setAppContextFaction('Observer'); 
    openTODWindow("Agent Codename", <CodenameInput />); 
  };

  return (
    <HolographicPanel
      className="w-full max-w-2xl p-4 md:p-6 flex flex-col flex-grow h-0 overflow-hidden"
    >
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-orbitron py-2 mb-2 text-center holographic-text flex-shrink-0">
        Select Your Allegiance
      </h1>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 flex-grow min-h-0 items-start mb-4 sm:mb-6">
        {(['Cyphers', 'Shadows'] as const).map((factionName) => {
          const details = factionDetails[factionName];
          const isSelected = selectedFaction === factionName;
          
          const tileBgClass = isSelected ? details.selectedBgClass : details.unselectedBgClass;
          const tileBorderClass = isSelected ? details.selectedBorderClass : details.unselectedBorderClass;
          console.log(`Rendering tile for ${factionName} isSelected: ${isSelected} Applied BG Class should be: ${tileBgClass}`);

          const tileClasses = cn(
            "border-2", 
            tileBorderClass,
            tileBgClass,
            "transition-all duration-300 cursor-pointer flex flex-col h-full rounded-lg p-3 sm:p-4",
            isSelected && details.selectedRingClass,
            isSelected && (factionName === 'Cyphers' ? 'text-sky-300' : 'text-rose-300')
          );

          return (
            <div
              key={factionName}
              className={tileClasses}
              onClick={() => handleFactionSelect(factionName)}
            >
              {React.cloneElement(details.icon, { className: cn(details.icon.props.className, isSelected ? (factionName === 'Cyphers' ? 'text-sky-300' : 'text-rose-300') : details.primaryColorClass)})}
              <h2 className={cn(
                  "text-lg sm:text-xl md:text-2xl font-orbitron mb-1",
                  isSelected ? 'text-white' : details.primaryColorClass
              )}>
                The {factionName}
              </h2>
              <p className={cn(
                  "text-xs sm:text-sm md:text-base leading-tight flex-grow", 
                  isSelected ? 'text-gray-200' : 'text-muted-foreground'
              )}>
                {details.defaultTagline}
              </p>
              {isSelected && (
                <>
                  <p className={cn("text-sm text-center my-2", isSelected ? 'holographic-text' : details.primaryColorClass )}>
                    {details.alignTagline}
                  </p>
                  <HolographicButton
                    className={cn(
                      "mt-auto w-full py-2 text-sm sm:text-base",
                      factionName === 'Cyphers' ? "border-blue-500 hover:bg-blue-500" : "border-red-500 hover:bg-red-500",
                      isSelected ? "text-white hover:text-background" : details.primaryColorClass
                    )}
                    onClick={(e) => {
                      e.stopPropagation(); 
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
