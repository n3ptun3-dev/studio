
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

interface FactionChoiceScreenProps {
  setShowAuthPrompt: Dispatch<SetStateAction<boolean>>;
}

const factionDetails = {
  Cyphers: {
    defaultTagline: "Information is Power. Decode the Network.",
    theme: "cyphers" as Faction | 'neutral',
    icon: <Code className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mb-2 text-blue-400 icon-glow" />,
    borderColorClass: "border-blue-500",
    selectedRingClass: "ring-2 ring-blue-400 shadow-blue-500/50",
    primaryColorClass: "text-blue-400",
    selectedBgClass: "bg-blue-700/30", // Faint blue background when selected
  },
  Shadows: {
    defaultTagline: "Control the Flow. Infiltrate and Disrupt.",
    theme: "shadows" as Faction | 'neutral',
    icon: <ShieldQuestion className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mb-2 text-red-400 icon-glow" />,
    borderColorClass: "border-red-500",
    selectedRingClass: "ring-2 ring-red-400 shadow-red-500/50",
    primaryColorClass: "text-red-400",
    selectedBgClass: "bg-red-700/30", // Faint red background when selected
  }
};

export function FactionChoiceScreen({ setShowAuthPrompt }: FactionChoiceScreenProps) {
  const {
    setFaction: setAppContextFaction,
    setOnboardingStep,
    openTODWindow,
  } = useAppContext();
  const { theme: currentTheme, setTheme } = useTheme();
  const [selectedFaction, setSelectedFaction] = useState<Faction | null>(null);

  useEffect(() => {
    // Set initial theme to neutral or if no faction is selected, revert to neutral
    if (!selectedFaction && currentTheme !== 'neutral') {
      setTheme('neutral');
    }
  }, [selectedFaction, currentTheme, setTheme]);


  const handleFactionSelect = (factionName: Faction) => {
    if (factionName === 'Observer') return; // Observer is handled separately

    setSelectedFaction(factionName);
    setTheme(factionName === 'Cyphers' ? 'cyphers' : 'shadows');
  };

  const handleConfirmFaction = (factionName: Faction) => {
    if (!factionName || factionName === 'Observer') return;

    setAppContextFaction(factionName);
    console.log(`Faction ${factionName} confirmed. Opening Codename Input...`);
    openTODWindow("Agent Codename Assignment", <div>Placeholder for Codename Input UI</div>);
    // Note: setOnboardingStep('fingerprint') or 'tod' will be handled by the AppContext after codename
  };

  const handleProceedAsObserver = () => {
    setSelectedFaction('Observer'); // Visually indicate observer choice if needed
    setAppContextFaction('Observer');
    setTheme('neutral'); // Observer uses neutral theme
    setOnboardingStep('tod');
  };

  return (
    <HolographicPanel
      className={cn(
        "w-full max-w-2xl p-4 md:p-6 flex flex-col flex-grow h-0 overflow-hidden",
        // The panel's border color will change based on the theme set by handleFactionSelect
      )}
    >
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-orbitron mb-4 sm:mb-6 text-center holographic-text flex-shrink-0 py-2">
        Select Your Allegiance
      </h1>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 flex-grow min-h-0 mb-4 sm:mb-6">
        {(['Cyphers', 'Shadows'] as const).map((factionName) => {
          const details = factionDetails[factionName];
          const isSelected = selectedFaction === factionName;

          return (
            <div
              key={factionName}
              className={cn(
                "p-3 sm:p-4 rounded-lg border-2 transition-all cursor-pointer flex flex-col items-center text-center holographic-panel bg-background/70 hover:shadow-accent/30 h-full",
                details.borderColorClass, // Always apply team-specific border color
                isSelected && details.selectedRingClass,
                isSelected && details.selectedBgClass
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
                <HolographicButton
                  className="mt-auto w-full py-2 text-sm sm:text-base"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent tile's onClick from re-firing
                    handleConfirmFaction(factionName);
                  }}
                >
                  Confirm Allegiance
                </HolographicButton>
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
