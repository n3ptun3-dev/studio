
"use client";
import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import type { Faction } from '@/contexts/AppContext';
import { HolographicPanel, HolographicButton } from '@/components/game/shared/HolographicPanel';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Code, Eye, ShieldQuestion } from 'lucide-react'; // Example icons

interface FactionChoiceScreenProps {
  setShowAuthPrompt: Dispatch<SetStateAction<boolean>>;
}

export function FactionChoiceScreen({ setShowAuthPrompt }: FactionChoiceScreenProps) {
  const { setFaction, setOnboardingStep, isPiBrowser, setIsAuthenticated, setPlayerSpyName, setPlayerPiName } = useAppContext();
  const [selectedFaction, setSelectedFaction] = useState<Faction | null>(null);

  const handleFactionSelect = (faction: Faction) => {
    setSelectedFaction(faction);
  };

  const handleJoinFaction = () => {
    if (!selectedFaction || selectedFaction === 'Observer') return;

    if (isPiBrowser) {
      // Simulate Pi Auth Success
      console.log(`Initiating Pi Auth for ${selectedFaction}...`);
      setTimeout(() => {
        setIsAuthenticated(true);
        setFaction(selectedFaction);
        // Simulate getting Pi username and setting a default spy name
        const piName = "PiUser" + Math.floor(Math.random() * 1000);
        setPlayerPiName(piName);
        setPlayerSpyName(`Agent${piName}`);
        setOnboardingStep('fingerprint');
      }, 1000);
    } else {
      setShowAuthPrompt(true);
    }
  };

  const handleProceedAsObserver = () => {
    setFaction('Observer');
    setIsAuthenticated(false); // Observers are not "authenticated" in game terms
    setOnboardingStep('tod');
  };
  
  const factionDetails = {
    Cyphers: {
      tagline: "Information is Power. Decode the Network.",
      theme: "theme-cyphers", // Class from globals.css
      icon: <Code className="w-12 h-12 mb-2 text-blue-400 icon-glow" />,
      color: "border-blue-500 hover:border-blue-400",
      primaryColorClass: "text-blue-400",
    },
    Shadows: {
      tagline: "Control the Flow. Infiltrate and Disrupt.",
      theme: "theme-shadows",
      icon: <ShieldQuestion className="w-12 h-12 mb-2 text-red-400 icon-glow" />,
      color: "border-red-500 hover:border-red-400",
      primaryColorClass: "text-red-400",
    }
  };

  return (
    <HolographicPanel className="w-full max-w-4xl mx-auto p-6">
      <h1 className="text-3xl md:text-4xl font-orbitron mb-8 text-center holographic-text">Select Your Allegiance</h1>
      
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {(['Cyphers', 'Shadows'] as const).map((factionName) => (
          <div
            key={factionName}
            className={cn(
              "p-6 rounded-lg border-2 transition-all cursor-pointer flex flex-col items-center text-center holographic-panel bg-opacity-50",
              factionDetails[factionName].color,
              selectedFaction === factionName ? (factionName === 'Cyphers' ? 'ring-2 ring-blue-400 shadow-blue-500/50' : 'ring-2 ring-red-400 shadow-red-500/50') : 'border-opacity-50'
            )}
            onClick={() => handleFactionSelect(factionName)}
          >
            {factionDetails[factionName].icon}
            <h2 className={cn("text-2xl font-orbitron mb-2", factionDetails[factionName].primaryColorClass)}>
              The {factionName}
            </h2>
            <p className="text-sm text-muted-foreground">{factionDetails[factionName].tagline}</p>
          </div>
        ))}
      </div>

      {selectedFaction && selectedFaction !== 'Observer' && (
        <HolographicButton 
          className="w-full md:w-1/2 mx-auto text-lg py-3 mb-6 block"
          onClick={handleJoinFaction}
        >
          {selectedFaction === 'Cyphers' ? "Join The Cyphers" : "Align with The Shadows"}
        </HolographicButton>
      )}

      <Button 
        variant="ghost" 
        className="w-full md:w-1/2 mx-auto text-muted-foreground hover:text-foreground flex items-center justify-center gap-2"
        onClick={handleProceedAsObserver}
      >
        <Eye className="w-5 h-5" /> Proceed as Observer
      </Button>
    </HolographicPanel>
  );
}

    