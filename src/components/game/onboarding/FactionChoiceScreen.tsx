
"use client";
import { useState } from 'react';
import { HolographicPanel } from '../shared/HolographicPanel';
import type { Dispatch, SetStateAction } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import type { Faction } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Code, Eye, ShieldQuestion, Fingerprint } from 'lucide-react'; // Example icons // Added Fingerprint for completeness if needed

interface FactionChoiceScreenProps {
  setShowAuthPrompt: Dispatch<SetStateAction<boolean>>;
}

export function FactionChoiceScreen({ setShowAuthPrompt }: FactionChoiceScreenProps) {
  const { 
    setFaction: setAppContextFaction, 
    setOnboardingStep, 
    isPiBrowser, 
    setIsAuthenticated, 
    setPlayerSpyName, 
    setPlayerPiName 
  } = useAppContext();
  const { setTheme } = useTheme();
  const [selectedFaction, setSelectedFaction] = useState<Faction | null>(null);

  const handleFactionSelect = (faction: Faction) => {
    setSelectedFaction(faction);
    setAppContextFaction(faction); // Update AppContext faction state
    if (faction === 'Cyphers') {
      setTheme('cyphers');
    } else if (faction === 'Shadows') {
      setTheme('shadows');
    }
  };

  const handleJoinFaction = () => {
    if (!selectedFaction || selectedFaction === 'Observer') return;

    // For local dev, bypass Pi auth logic shown in original comments
    // if (!isPiBrowser) {
    //   setShowAuthPrompt(true);
    //   return;
    // }

    const piName = "DevBypassUser" + Math.floor(Math.random() * 1000); 

    setIsAuthenticated(true);
    setAppContextFaction(selectedFaction); // Corrected
    if (selectedFaction === 'Cyphers') {
      setTheme('cyphers');
    } else if (selectedFaction === 'Shadows') {
      setTheme('shadows');
    }
    setPlayerPiName(piName);
    setPlayerSpyName(`Agent-${piName.slice(-4)}`); // Simplified SpyName
    setOnboardingStep('fingerprint');
  };

  const handleProceedAsObserver = () => {
    setAppContextFaction('Observer'); // Corrected
    setIsAuthenticated(false); 
    setTheme('cyphers'); // Observers use default/Cyphers theme
    setOnboardingStep('tod');
  };
  
  const factionDetails = {
    Cyphers: {
      tagline: "Information is Power. Decode the Network.",
      theme: "theme-cyphers", 
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
        <Button 
          className={cn(
            "w-full md:w-1/2 mx-auto text-lg py-3 mb-6 block holographic-button",
            selectedFaction === 'Cyphers' ? "border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-primary-foreground" : "border-red-500 text-red-400 hover:bg-red-500 hover:text-primary-foreground"
          )}
          onClick={handleJoinFaction}
        >
          {selectedFaction === 'Cyphers' ? "Join The Cyphers" : "Align with The Shadows"}
        </Button>
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
