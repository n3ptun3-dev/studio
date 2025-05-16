
"use client";
import { useState, useEffect, type Dispatch, type SetStateAction } from 'react';
import { HolographicPanel, HolographicButton } from '../shared/HolographicPanel';
import { useAppContext, type Faction } from '@/contexts/AppContext';
import type { Theme } from '@/contexts/ThemeContext'; 
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Code, Eye, ShieldQuestion } from 'lucide-react';
import { CodenameInput } from './CodenameInput';

interface FactionChoiceScreenProps {
  // setShowAuthPrompt was removed, assuming it's handled by AppContext or direct navigation
}

const factionDetails = {
  Cyphers: {
    theme: "cyphers" as Theme,
    icon: <Code className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mb-2 text-blue-400 icon-glow" />,
    borderColorClass: "border-blue-500", 
    selectedRingClass: "ring-2 ring-offset-2 ring-offset-background ring-blue-400 shadow-[0_0_15px_theme(colors.blue.400)]",
    selectedBgClass: "bg-blue-600/40", // Translucent blue for selected state
    primaryColorClass: "text-blue-400",
    defaultTagline: "Information is Power. Decode the Network.",
    alignTagline: "Align with The Cyphers",
  },
  Shadows: {
    theme: "shadows" as Theme,
    icon: <ShieldQuestion className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mb-2 text-red-400 icon-glow" />,
    borderColorClass: "border-red-500", 
    selectedRingClass: "ring-2 ring-offset-2 ring-offset-background ring-red-400 shadow-[0_0_15px_theme(colors.red.400)]",
    selectedBgClass: "bg-red-600/40", // Translucent red for selected state
    primaryColorClass: "text-red-400",
    defaultTagline: "Control the Flow. Infiltrate and Disrupt.",
    alignTagline: "Align with The Shadows",
  }
};

export function FactionChoiceScreen({}: FactionChoiceScreenProps) {
  const {
    setFaction: setAppContextFaction,
    openTODWindow,
    isTODWindowOpen: contextIsTODWindowOpen, 
    setOnboardingStep,
  } = useAppContext();
  const { theme: currentTheme, setTheme } = useTheme();
  const [selectedFaction, setSelectedFaction] = useState<Faction | null>(null);

  console.log('FactionChoiceScreen rendering. Selected Faction:', selectedFaction, "isTODWindowOpen (from context):", contextIsTODWindowOpen, "CurrentTheme from ThemeContext:", currentTheme);

  useEffect(() => {
    let targetTheme: Theme;
    if (selectedFaction === 'Cyphers') {
      targetTheme = 'cyphers';
    } else if (selectedFaction === 'Shadows') {
      targetTheme = 'shadows';
    } else {
      targetTheme = 'terminal-green'; // Default or for Observer if selected, or if no faction is selected
    }
    
    console.log(`FactionChoiceScreen: Theme useEffect. Selected Faction: ${selectedFaction}, Current Theme (from context): ${currentTheme}, Target Theme to set: ${targetTheme}`);
    if (targetTheme !== currentTheme) {
        console.log(`FactionChoiceScreen: Changing theme from ${currentTheme} to ${targetTheme}`);
        setTheme(targetTheme); 
    }
  }, [selectedFaction, setTheme]); // Removed currentTheme from dependency array

  const handleFactionSelect = (factionName: Faction) => {
    if (factionName === 'Observer') return;
    setSelectedFaction(prev => prev === factionName ? null : factionName);
  };

  const handleConfirmFaction = (factionName: Faction | null) => {
    console.log('handleConfirmFaction called with:', factionName);
    if (!factionName || factionName === 'Observer') {
      console.error("Attempted to confirm with no faction or as Observer directly.");
      return;
    }
    
    setAppContextFaction(factionName); 
    console.log(`Faction ${factionName} confirmed. Setting onboarding step and opening Codename Input...`);
    openTODWindow("Agent Codename", <CodenameInput />);
  };

  const handleProceedAsObserver = () => {
    setSelectedFaction('Observer'); 
    setAppContextFaction('Observer');
    // Ensure theme is terminal-green for Observer
    if (currentTheme !== 'terminal-green') {
      setTheme('terminal-green');
    }
    setOnboardingStep('tod'); 
  };

  return (
    <HolographicPanel 
      className="w-full max-w-2xl p-4 md:p-6 flex flex-col flex-grow h-0 overflow-hidden"
    >
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-orbitron mb-4 sm:mb-6 py-2 text-center holographic-text flex-shrink-0">
        Select Your Allegiance
      </h1>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 flex-grow min-h-0 mb-4 sm:mb-6 items-start">
        {(['Cyphers', 'Shadows'] as const).map((factionName) => {
          const details = factionDetails[factionName];
          const isSelected = selectedFaction === factionName;
          
          // Use holographic-panel for base styling, then add selectedBgClass conditionally
          const tileClasses = cn(
            "holographic-panel", // Base panel style
            "transition-all duration-300 cursor-pointer flex flex-col h-full",
            details.borderColorClass, 
            isSelected && details.selectedRingClass,
            isSelected && details.selectedBgClass // Apply selected background class
          );
          
           console.log('Rendering tile for', factionName, 'isSelected:', isSelected, 'Applied BG Class:', isSelected ? details.selectedBgClass : 'holographic-panel (default)');

          return (
            <div
              key={factionName}
              className={tileClasses}
              onClick={() => handleFactionSelect(factionName)}
            >
              {details.icon}
              <h2 className={cn("text-lg sm:text-xl md:text-2xl font-orbitron mb-1", details.primaryColorClass)}>
                The {factionName}
              </h2>
              <p className={cn("text-xs sm:text-sm md:text-base leading-tight text-muted-foreground flex-grow")}>
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
                      e.stopPropagation(); 
                      console.log('Confirm button for', factionName, 'CLICKED');
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
    
    
