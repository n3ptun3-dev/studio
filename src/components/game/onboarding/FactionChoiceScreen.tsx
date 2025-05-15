
"use client";
import { useState, useEffect } from 'react';
import { HolographicPanel } from '../shared/HolographicPanel';
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
    confirmTagline: "Align with The Cyphers",
    theme: "cyphers" as Faction | 'neutral',
    icon: <Code className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mb-2 text-blue-400 icon-glow" />,
    colorClass: "border-blue-500 hover:border-blue-400",
    selectedColorClass: "ring-2 ring-blue-400 shadow-blue-500/50",
    primaryColorClass: "text-blue-400",
  },
  Shadows: {
    defaultTagline: "Control the Flow. Infiltrate and Disrupt.",
    confirmTagline: "Align with The Shadows",
    theme: "shadows" as Faction | 'neutral',
    icon: <ShieldQuestion className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mb-2 text-red-400 icon-glow" />,
    colorClass: "border-red-500 hover:border-red-400",
    selectedColorClass: "ring-2 ring-red-400 shadow-red-500/50",
    primaryColorClass: "text-red-400",
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
    if (!selectedFaction && currentTheme !== 'neutral') {
      setTheme('neutral');
    }
  }, [selectedFaction, currentTheme, setTheme]);


  const handleFactionSelect = (factionName: Faction) => {
    if (factionName === 'Observer') return;

    if (selectedFaction === factionName) {
      setAppContextFaction(factionName);
      console.log(`Faction ${factionName} confirmed. Opening Codename Input...`);
      openTODWindow("Agent Codename Assignment", <div>Placeholder for Codename Input UI</div>);
      // Note: setOnboardingStep('fingerprint') or 'tod' will be handled by the AppContext after codename
    } else {
      setSelectedFaction(factionName);
      setTheme(factionName === 'Cyphers' ? 'cyphers' : 'shadows');
    }
  };

  const handleProceedAsObserver = () => {
    setSelectedFaction('Observer');
    setAppContextFaction('Observer');
    setTheme('neutral');
    setOnboardingStep('tod');
  };

  // The HolographicPanel is now the root, similar to WelcomeScreen.
  // It will be centered by the `main` element in page.tsx which has p-4 sm:p-6.
  // Its own padding (p-4 md:p-6) is for its internal content.
  return (
    <HolographicPanel className="w-full max-w-2xl p-4 md:p-6">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-orbitron mb-4 sm:mb-6 text-center holographic-text">Select Your Allegiance</h1>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
        {(['Cyphers', 'Shadows'] as const).map((factionName) => {
          const details = factionDetails[factionName];
          const isSelected = selectedFaction === factionName;
          const tagline = isSelected ? details.confirmTagline : details.defaultTagline;

          return (
            <div
              key={factionName}
              className={cn(
                "p-3 sm:p-4 rounded-lg border-2 transition-all cursor-pointer flex flex-col items-center text-center holographic-panel bg-opacity-50 hover:shadow-accent/30",
                isSelected ? details.selectedColorClass : details.colorClass,
                !isSelected && "border-opacity-50"
              )}
              onClick={() => handleFactionSelect(factionName)}
            >
              {details.icon}
              <h2 className={cn("text-base sm:text-lg md:text-xl font-orbitron mb-1", details.primaryColorClass)}>
                The {factionName}
              </h2>
              <p className={cn("text-[10px] xxs:text-xs sm:text-sm min-h-[2.5em] leading-tight", isSelected ? "text-accent font-semibold" : "text-muted-foreground")}>{tagline}</p>
            </div>
          );
        })}
      </div>

      <Button
        variant="ghost"
        className="w-full md:w-3/4 mx-auto text-muted-foreground hover:text-foreground flex items-center justify-center gap-2 py-2 sm:py-3"
        onClick={handleProceedAsObserver}
      >
        <Eye className="w-4 h-4 sm:w-5 sm:h-5" /> Proceed as Observer
      </Button>
    </HolographicPanel>
  );
}
