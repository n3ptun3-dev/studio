
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
    icon: <Code className="w-12 h-12 mb-2 text-blue-400 icon-glow" />,
    colorClass: "border-blue-500 hover:border-blue-400",
    selectedColorClass: "ring-2 ring-blue-400 shadow-blue-500/50",
    primaryColorClass: "text-blue-400",
  },
  Shadows: {
    defaultTagline: "Control the Flow. Infiltrate and Disrupt.",
    confirmTagline: "Align with The Shadows",
    theme: "shadows" as Faction | 'neutral',
    icon: <ShieldQuestion className="w-12 h-12 mb-2 text-red-400 icon-glow" />,
    colorClass: "border-red-500 hover:border-red-400",
    selectedColorClass: "ring-2 ring-red-400 shadow-red-500/50",
    primaryColorClass: "text-red-400",
  }
};

export function FactionChoiceScreen({ setShowAuthPrompt }: FactionChoiceScreenProps) {
  const { 
    setFaction: setAppContextFaction, 
    setOnboardingStep, 
    openTODWindow, // For codename input later
    // isPiBrowser, 
    // setIsAuthenticated, 
    // setPlayerSpyName, 
    // setPlayerPiName 
  } = useAppContext();
  const { theme: currentTheme, setTheme } = useTheme();
  const [selectedFaction, setSelectedFaction] = useState<Faction | null>(null);

  // Ensure theme reverts to neutral if no faction is selected or navigating away
  useEffect(() => {
    if (!selectedFaction && currentTheme !== 'neutral') {
      setTheme('neutral');
    }
  }, [selectedFaction, currentTheme, setTheme]);


  const handleFactionSelect = (factionName: Faction) => {
    if (factionName === 'Observer') return; // Should not happen with tile clicks

    if (selectedFaction === factionName) {
      // This is confirmation click
      setAppContextFaction(factionName);
      // TODO: Open Codename Input TODWindow here
      // For now, proceed to fingerprint scanner
      console.log(`Faction ${factionName} confirmed. TODO: Open Codename Input Window.`);
      setOnboardingStep('fingerprint'); 
    } else {
      // This is the first click or switching selection
      setSelectedFaction(factionName);
      setTheme(factionName === 'Cyphers' ? 'cyphers' : 'shadows');
    }
  };

  const handleProceedAsObserver = () => {
    setSelectedFaction('Observer');
    setAppContextFaction('Observer'); 
    setTheme('neutral'); // Observers use neutral theme
    setOnboardingStep('tod'); // Observers skip fingerprint & codename
  };
  

  return (
    <HolographicPanel className="w-full max-w-2xl mx-auto p-4 md:p-6 my-8"> {/* Added my-8 for some spacing if needed */}
      <h1 className="text-3xl md:text-4xl font-orbitron mb-6 text-center holographic-text">Select Your Allegiance</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
        {(['Cyphers', 'Shadows'] as const).map((factionName) => {
          const details = factionDetails[factionName];
          const isSelected = selectedFaction === factionName;
          const tagline = isSelected ? details.confirmTagline : details.defaultTagline;

          return (
            <div
              key={factionName}
              className={cn(
                "p-4 rounded-lg border-2 transition-all cursor-pointer flex flex-col items-center text-center holographic-panel bg-opacity-50 hover:shadow-accent/30",
                isSelected ? details.selectedColorClass : details.colorClass,
                !isSelected && "border-opacity-50" 
              )}
              onClick={() => handleFactionSelect(factionName)}
            >
              {details.icon}
              <h2 className={cn("text-xl md:text-2xl font-orbitron mb-1", details.primaryColorClass)}>
                The {factionName}
              </h2>
              <p className={cn("text-xs md:text-sm min-h-[2.5em]", isSelected ? "text-accent font-semibold" : "text-muted-foreground")}>{tagline}</p>
            </div>
          );
        })}
      </div>

      <Button 
        variant="ghost" 
        className="w-full md:w-3/4 mx-auto text-muted-foreground hover:text-foreground flex items-center justify-center gap-2 py-3"
        onClick={handleProceedAsObserver}
      >
        <Eye className="w-5 h-5" /> Proceed as Observer
      </Button>
    </HolographicPanel>
  );
}


    