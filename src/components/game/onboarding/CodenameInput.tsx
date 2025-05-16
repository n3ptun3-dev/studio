
"use client";

import { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { HolographicInput, HolographicButton } from '@/components/game/shared/HolographicPanel';
import { filterOffensiveWords } from '@/lib/constants'; // Assuming this function exists
import { useToast } from '@/hooks/use-toast';

export function CodenameInput() {
  const { setPlayerSpyName, setOnboardingStep, closeTODWindow } = useAppContext();
  const [codename, setCodename] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

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
    // Basic alphanumeric check (allowing spaces internally, but not leading/trailing)
    if (!/^[a-zA-Z0-9]+(?: [a-zA-Z0-9]+)*$/.test(trimmedCodename)) {
       setError("Codename can only contain letters, numbers, and single spaces between words.");
       return;
    }
    
    // Offensive word filter (development bypass for now, as requested)
    // if (!filterOffensiveWords(trimmedCodename)) {
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
