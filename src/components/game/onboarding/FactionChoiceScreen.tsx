
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
    borderColorClass: "border-blue-500",
    selectedRingClass: "ring-2 ring-blue-400 shadow-blue-500/50",
    primaryColorClass: "text-blue-400",
    selectedBgClass: "bg-blue-600/40", // More subtle than opaque, but visible
    defaultTagline: "Information is Power. Decode the Network.",

  },
  Shadows: {
    theme: "shadows" as Faction | 'neutral',
    icon: <ShieldQuestion className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mb-2 text-red-400 icon-glow" />,
    borderColorClass: "border-red-500",
    selectedRingClass: "ring-2 ring-red-400 shadow-red-500/50",
    primaryColorClass: "text-red-400",
    selectedBgClass: "bg-red-600/40", // More subtle than opaque, but visible
    defaultTagline: "Control the Flow. Infiltrate and Disrupt.",
  }
};

export function FactionChoiceScreen({ setShowAuthPrompt }: FactionChoiceScreenProps) {
  const {
    setFaction: setAppContextFaction,
    setOnboardingStep,
    openTODWindow,
    isTODWindowOpen: isContextTODWindowOpen, 
  } = useAppContext();
  const { theme: currentTheme, setTheme } = useTheme();
  const [selectedFaction, setSelectedFaction] = useState<Faction | null>(null);

  console.log('FactionChoiceScreen rendering. Selected Faction:', selectedFaction, "isTODWindowOpen (from context):", isContextTODWindowOpen);

  useEffect(() => {
    if (selectedFaction && selectedFaction !== 'Observer') {
      setTheme(selectedFaction === 'Cyphers' ? 'cyphers' : 'shadows');
    } else if (currentTheme !== 'neutral') {
      setTheme('neutral');
    }
  }, [selectedFaction, currentTheme, setTheme]);


  const handleFactionSelect = (factionName: Faction) => {
    if (factionName === 'Observer') return;
    setSelectedFaction(prev => {
      const newSelection = prev === factionName ? null : factionName;
      if (newSelection) {
        setTheme(newSelection === 'Cyphers' ? 'cyphers' : 'shadows');
      } else {
        setTheme('neutral'); 
      }
      return newSelection;
    });
  };

  const handleConfirmFaction = (factionName: Faction | null) => {
    console.log('handleConfirmFaction called with:', factionName);
    if (!factionName || factionName === 'Observer') return;

    setAppContextFaction(factionName);
    console.log(`Faction ${factionName} confirmed. Setting onboarding step and opening Codename Input...`);
    
    // Critical change: Set onboarding step first to trigger HomePage re-render similar to Observer flow
    // This will unmount FactionChoiceScreen. The CodenameInput window should appear on the next screen (Fingerprint or its loading state).
    // However, CodenameInput should appear *before* Fingerprint.
    // So, we open TODWindow, then CodenameInput will handle setting step to 'fingerprint'.
    
    // The AppContext's isTODWindowOpen will be true. 
    // When HomePage re-renders for the 'fingerprint' step, it should pick up this state.
    openTODWindow("Agent Codename Assignment", <CodenameInput />);
    // Let CodenameInput handle the transition to 'fingerprint'
    // For instance, after codename is submitted, CodenameInput component will call setOnboardingStep('fingerprint');
  };

  const handleProceedAsObserver = () => {
    setSelectedFaction('Observer');
    setAppContextFaction('Observer');
    setTheme('neutral');
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
          
          const tileBgClass = isSelected ? details.selectedBgClass : ""; 
          // console.log('Rendering tile for', factionName, 'isSelected:', isSelected, 'Applied BG Class:', tileBgClass);

          return (
            <div
              key={factionName}
              className={cn(
                "holographic-panel", 
                "rounded-lg border-2 transition-all cursor-pointer flex flex-col items-center text-center h-full",
                "p-3 sm:p-4", 
                details.borderColorClass,
                tileBgClass, 
                isSelected && details.selectedRingClass
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
                    Align with The {factionName}
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

    