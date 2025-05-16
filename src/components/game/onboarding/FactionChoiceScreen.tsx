
"use client";
import { useState, useEffect } from 'react';
import { HolographicPanel, HolographicButton } from '../shared/HolographicPanel';
import type { Dispatch, SetStateAction } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import type { Faction } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Code, Eye, ShieldQuestion } from 'lucide-react';
import { CodenameInput } from './CodenameInput';

interface FactionChoiceScreenProps {
  setShowAuthPrompt: Dispatch<SetStateAction<boolean>>;
}

const factionDetails = {
  Cyphers: {
    theme: "cyphers" as Faction | 'neutral',
    icon: <Code className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mb-2 text-blue-400 icon-glow" />,
    borderColorClass: "border-blue-500", // Persistent border
    selectedRingClass: "ring-2 ring-offset-2 ring-offset-background ring-blue-400 shadow-[0_0_15px_theme(colors.blue.400)]", // Ring and glow for selection
    primaryColorClass: "text-blue-400",
    selectedBgClass: "bg-sky-500", // Test: bright opaque blue
    defaultTagline: "Information is Power. Decode the Network.",
    alignTagline: "Align with The Cyphers",
  },
  Shadows: {
    theme: "shadows" as Faction | 'neutral',
    icon: <ShieldQuestion className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mb-2 text-red-400 icon-glow" />,
    borderColorClass: "border-red-500", // Persistent border
    selectedRingClass: "ring-2 ring-offset-2 ring-offset-background ring-red-400 shadow-[0_0_15px_theme(colors.red.400)]", // Ring and glow for selection
    primaryColorClass: "text-red-400",
    selectedBgClass: "bg-rose-500", // Test: bright opaque red
    defaultTagline: "Control the Flow. Infiltrate and Disrupt.",
    alignTagline: "Align with The Shadows",
  }
};

export function FactionChoiceScreen({ setShowAuthPrompt }: FactionChoiceScreenProps) {
  const {
    setFaction: setAppContextFaction,
    setOnboardingStep,
    openTODWindow,
    isTODWindowOpen: isContextTODWindowOpen, // Renamed to avoid conflict
  } = useAppContext();
  const { theme: currentTheme, setTheme } = useTheme();
  const [selectedFaction, setSelectedFaction] = useState<Faction | null>(null);

  console.log('FactionChoiceScreen rendering. Selected Faction:', selectedFaction, "isTODWindowOpen (from context):", isContextTODWindowOpen);

  useEffect(() => {
    let targetTheme: Faction | 'neutral' = 'neutral';
    if (selectedFaction && selectedFaction !== 'Observer') {
      targetTheme = selectedFaction === 'Cyphers' ? 'cyphers' : 'shadows';
    }
    // Only call setTheme if the targetTheme is different from the currentTheme
    // This prevents the "Cannot update a component (`ThemeProvider`)..." error
    if (targetTheme !== currentTheme) {
        console.log(`FactionChoiceScreen: Changing theme from ${currentTheme} to ${targetTheme}`);
        setTheme(targetTheme);
    }
  }, [selectedFaction, currentTheme, setTheme]);


  const handleFactionSelect = (factionName: Faction) => {
    if (factionName === 'Observer') return; // Observer cannot be "selected" in the same way
    setSelectedFaction(prev => {
      const newSelection = prev === factionName ? null : factionName;
      // If a new faction is selected, or a faction is deselected, update the theme.
      // If newSelection is null (deselected), revert to neutral theme.
      // let newTheme: Faction | 'neutral' = 'neutral';
      // if (newSelection && newSelection !== 'Observer') {
      //   newTheme = newSelection === 'Cyphers' ? 'cyphers' : 'shadows';
      // }
      // setTheme(newTheme); // This is handled by the useEffect above now
      return newSelection;
    });
  };

  const handleConfirmFaction = (factionName: Faction | null) => {
    console.log('handleConfirmFaction called with:', factionName);
    if (!factionName || factionName === 'Observer') return;

    setAppContextFaction(factionName);
    console.log(`Faction ${factionName} confirmed. Setting onboarding step and opening Codename Input...`);
    openTODWindow("Agent Codename", <CodenameInput />);
    // The setOnboardingStep to 'fingerprint' or 'tod' will be handled
    // by the CodenameInput component after successful codename registration.
  };

  const handleProceedAsObserver = () => {
    setSelectedFaction('Observer'); // Set local state for consistency if needed elsewhere on this screen
    setAppContextFaction('Observer');
    if (currentTheme !== 'neutral') { // Ensure theme resets for observer
      setTheme('neutral');
    }
    setOnboardingStep('tod'); // Observers skip codename and fingerprint directly to TOD
  };

  return (
    <HolographicPanel
      className="w-full max-w-2xl p-4 md:p-6 flex flex-col flex-grow h-0 overflow-hidden"
      // key={currentTheme} // Re-add if panel border color still an issue
    >
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-orbitron mb-4 sm:mb-6 py-2 text-center holographic-text flex-shrink-0">
        Select Your Allegiance
      </h1>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 flex-grow min-h-0 mb-4 sm:mb-6 items-start">
        {(['Cyphers', 'Shadows'] as const).map((factionName) => {
          const details = factionDetails[factionName];
          const isSelected = selectedFaction === factionName;
          
          // Use simple Tailwind classes for background testing
          const tileBgClass = factionName === 'Cyphers' 
            ? (isSelected ? details.selectedBgClass : 'bg-gray-700') 
            : (isSelected ? details.selectedBgClass : 'bg-gray-700');
          
          console.log('Rendering tile for', factionName, 'isSelected:', isSelected, 'Applied BG Class:', tileBgClass);

          return (
            <div
              key={factionName}
              className={cn(
                "border-2 transition-all duration-300 cursor-pointer flex flex-col items-center text-center h-full",
                "p-3 sm:p-4", // Explicit padding here
                details.borderColorClass, // Always apply faction border color
                tileBgClass, 
                isSelected && details.selectedRingClass // Apply ring/shadow if selected
              )}
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
