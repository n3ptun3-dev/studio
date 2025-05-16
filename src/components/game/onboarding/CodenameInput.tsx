
"use client";

import { useState, useEffect } from 'react'; // Added useEffect
import { useAppContext } from '@/contexts/AppContext';
import { HolographicInput, HolographicButton } from '@/components/game/shared/HolographicPanel';
// import { filterOffensiveWords } from '@/lib/constants'; // Offensive filter bypassed for dev
import { useToast } from '@/hooks/use-toast';

export function CodenameInput() {
  const { 
    setPlayerSpyName, 
    setOnboardingStep, 
    closeTODWindow, 
    faction, // Get faction from context
    onboardingStep // Get current onboarding step
  } = useAppContext();
  const [codename, setCodename] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Safeguard for Observer faction
    if (faction === 'Observer') {
      toast({ title: "Observation Protocol", description: "Observers do not set codenames. System engaging.", variant: "default" });
      closeTODWindow();
      // Ensure the observer proceeds correctly if they somehow reach here
      if (onboardingStep !== 'tod' && onboardingStep !== 'fingerprint') {
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
    if (!/^[a-zA-Z0-9]+(?: [a-zA-Z0-9]+)*$/.test(trimmedCodename)) {
       setError("Codename can only contain letters, numbers, and single spaces between words.");
       return;
    }
    
    // Offensive word filter (development bypass for now, as requested)
    // const offensiveCheck = filterOffensiveWords(trimmedCodename); // Assuming filterOffensiveWords returns true if NOT offensive
    // if (!offensiveCheck) { // If it IS offensive
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
  
  // If observer, this component shouldn't render its main UI.
  // The useEffect above handles closing, but this prevents flash of content.
  if (faction === 'Observer') {
    return null; 
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 space-y-6 font-rajdhani">
      <h3 className="text-xl font-orbitron holographic-text text-center">Secure Channel Established</h3>
      <p className="text-muted-foreground text-center text-sm">
        Agent, your operational codename is critical for field identification.
        Choose wisely. It cannot be changed once registered with HQ.
      </p>

      <div className="w-full max-w-sm space-y-2">
        <HolographicInput
          type="text"
          placeholder="Enter Your Codename"
          value={codename}
          onChange={(e) => setCodename(e.target.value)}
          className="w-full text-center text-lg"
          maxLength={20}
        />
        {error && <p className="text-xs text-destructive text-center">{error}</p>}
      </div>

      <HolographicButton
        onClick={handleSubmit}
        className="w-full max-w-sm py-3 text-lg"
        disabled={!codename.trim()}
      >
        Register Codename
      </HolographicButton>
    </div>
  );
}
