
"use client";

import { useState, useEffect } from 'react';
import { useAppContext, type Faction } from '@/contexts/AppContext'; // Added Faction type import
import { HolographicInput, HolographicButton } from '@/components/game/shared/HolographicPanel';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import type { Theme } from '@/contexts/ThemeContext'; // Added Theme type import

interface CodenameInputProps {
  explicitTheme?: Theme; // Prop to receive the theme
}

export function CodenameInput({ explicitTheme }: CodenameInputProps) {
  const { 
    setPlayerSpyName, 
    setOnboardingStep, 
    closeTODWindow, 
    faction,
    onboardingStep
  } = useAppContext();
  const [codename, setCodename] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (faction === 'Observer') {
      toast({ title: "Observation Protocol", description: "Observers do not set codenames. System engaging.", variant: "default" });
      closeTODWindow();
      if (onboardingStep !== 'tod' && onboardingStep !== 'fingerprint') {
        // Ensure observer flow doesn't get stuck if they land here out of order
        setOnboardingStep('tod'); 
      }
    }
  }, [faction, closeTODWindow, setOnboardingStep, toast, onboardingStep]);

  const handleSubmit = () => {
    setError(null);
    const trimmedCodename = codename.trim();

    if (!trimmedCodename) {
      setError("Codename cannot be empty.");
      return;
    }
    if (trimmedCodename.length < 3 || trimmedCodename.length > 20) {
      setError("Codename must be between 3 and 20 characters.");
      return;
    }
    if (!/^[a-zA-Z0-9]+(?: [a-zA-Z0-9]+)*$/.test(trimmedCodename)) { // Allow single spaces
       setError("Codename can only contain letters, numbers, and single spaces between words.");
       return;
    }
    
    // const offensiveCheck = filterOffensiveWords(trimmedCodename);
    // if (!offensiveCheck) {
    //   setError("This codename is not permitted. Please choose another.");
    //   toast({
    //     variant: "destructive",
    //     title: "Invalid Codename",
    //     description: "The chosen codename is not allowed. Please try a different one.",
    //   });
    //   return;
    // }

    setPlayerSpyName(trimmedCodename);
    toast({
        title: "Codename Assigned",
        description: `Welcome, Agent ${trimmedCodename}. Prepare for deployment.`,
    });
    closeTODWindow();
    setOnboardingStep('fingerprint'); 
  };
  
  if (faction === 'Observer') {
    return null; 
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 space-y-4 font-rajdhani">
      <p className="text-muted-foreground text-center text-base leading-relaxed mb-2">
        Agent, your operational codename is critical for field identification.
        Choose wisely. It cannot be changed once registered with HQ.
      </p>

      <div className="w-full max-w-sm space-y-1">
        <Label htmlFor="codename-input" className="text-sm text-muted-foreground holographic-text">Enter Your Codename:</Label>
        <HolographicInput
          id="codename-input"
          type="text"
          value={codename}
          onChange={(e) => setCodename(e.target.value)}
          className="w-full text-center text-lg"
          maxLength={20}
          explicitTheme={explicitTheme}
        />
        {error && <p className="text-xs text-destructive text-center pt-1">{error}</p>}
      </div>

      <HolographicButton
        onClick={handleSubmit}
        className="w-full max-w-sm py-3 text-lg mt-2"
        disabled={!codename.trim()}
        explicitTheme={explicitTheme}
      >
        Register
      </HolographicButton>
    </div>
  );
}
