
"use client";

import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import type { Theme } from '@/contexts/ThemeContext';
import { HolographicInput, HolographicButton } from '@/components/game/shared/HolographicPanel';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

interface CodenameInputProps {
  explicitTheme?: Theme;
}

export function CodenameInput({ explicitTheme }: CodenameInputProps) {
  const {
    setPlayerSpyName,
    setOnboardingStep,
    closeTODWindow,
    faction,
    onboardingStep // For logging or more complex conditional logic if needed
  } = useAppContext();
  const [codename, setCodename] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  console.log('[CodenameInput] Rendering. Faction from context:', faction, "Onboarding step:", onboardingStep, "Explicit theme:", explicitTheme);

  useEffect(() => {
    // This safeguard is important if an Observer somehow gets here.
    // It should ideally be prevented by AppContext.handleAuthentication setting step to 'tod' for Observers.
    if (faction === 'Observer' && onboardingStep === 'codenameInput') { // Check step too
      toast({ title: "Observation Protocol", description: "Observers should not set codenames.", variant: "default" });
      closeTODWindow();
      // Let AppContext or HomePage handle the next step for an Observer if this state is reached.
      // Typically, an Observer would already be at 'tod' step.
    }
  }, [faction, onboardingStep, setOnboardingStep, closeTODWindow, toast]);

  const handleSubmit = async () => {
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
    if (!/^[a-zA-Z0-9]+(?: [a-zA-Z0-9]+)*$/.test(trimmedCodename)) {
       setError("Codename can only contain letters, numbers, and single spaces between words.");
       return;
    }

    await setPlayerSpyName(trimmedCodename); // Ensure this async operation completes
    closeTODWindow();
    setOnboardingStep('fingerprint'); // Proceed to fingerprint after codename
  };

  // If faction is Observer and this component somehow renders, return null to show nothing.
  // The useEffect above should handle closing the window.
  if (faction === 'Observer') {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 space-y-4 font-rajdhani">
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

      <p className="text-muted-foreground text-center text-base leading-relaxed mb-2 holographic-text">
        Choose wisely; altering it later may have... consequences.
      </p>
    </div>
  );
}

    