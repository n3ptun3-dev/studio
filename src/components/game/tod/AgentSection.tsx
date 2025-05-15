
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { HolographicButton, HolographicInput } from '@/components/game/shared/HolographicPanel';
import { Progress } from "@/components/ui/progress";
import { Fingerprint, Settings, BookOpen, Info, Power } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { XP_THRESHOLDS } from '@/lib/constants';

interface SectionProps {
  parallaxOffset: number;
}

const AgentDossierView = () => {
  const { playerSpyName, playerPiName, faction, playerStats, setFaction: setAppFaction, addMessage } = useAppContext();
  const { setTheme } = useTheme(); 

  const handleFactionChange = () => {
    const newFaction = faction === 'Cyphers' ? 'Shadows' : 'Cyphers';
    setAppFaction(newFaction); 
    addMessage({type: 'system', text: `Faction allegiance protocols updated to: ${newFaction}. Coordinating with HQ.`});
  };

  const currentLevelXpForDossier = XP_THRESHOLDS[playerStats.level] || 0;
  const nextLevelXpTargetForDossier = XP_THRESHOLDS[playerStats.level + 1] || (currentLevelXpForDossier + (XP_THRESHOLDS[1] - XP_THRESHOLDS[0]));
  const xpForCurrentLevelInDossier = playerStats.xp - currentLevelXpForDossier;
  const xpToNextLevelSpanInDossier = nextLevelXpTargetForDossier - currentLevelXpForDossier;
  const xpProgressForDossier = xpToNextLevelSpanInDossier > 0 ? Math.max(0, Math.min(100, (xpForCurrentLevelInDossier / xpToNextLevelSpanInDossier) * 100)) : 100;


  return (
    <ScrollArea className="h-full p-3">
      <h3 className="text-xl font-orbitron mb-4 holographic-text">Agent Dossier</h3>
      <div className="space-y-3 text-sm font-rajdhani">
        <div>
          <p className="font-semibold text-muted-foreground">Agent Identification:</p>
          <p>Code Name: <span className="text-lg text-primary font-semibold">{playerSpyName || "Recruit"}</span></p>
          <p>Real Name: <span className="text-primary">{playerPiName ? `${playerPiName.substring(0,3)}***${playerPiName.slice(-2)}` : "CLASSIFIED"}</span></p>
          <p>Agent ID: <span className="text-primary">UID-{playerPiName || "UNKNOWN"}</span></p>
        </div>
        <div>
          <p className="font-semibold text-muted-foreground">Faction Details:</p>
          <p>Current Faction: <span className={`font-semibold cursor-pointer ${faction === 'Cyphers' ? 'text-blue-400 hover:text-blue-300' : 'text-red-400 hover:text-red-300'}`} onClick={handleFactionChange}>{faction}</span></p>
          <p className="text-xs text-muted-foreground">Faction History: [Placeholder - Requires data storage]</p>
          <p className="text-xs text-muted-foreground">Joined: [Date Placeholder]</p>
        </div>
        <div>
          <p className="font-semibold text-muted-foreground">Stats & Performance:</p>
          <p>Level: {playerStats.level}</p>
          <Progress value={xpProgressForDossier} className="w-full h-1.5 mt-1 bg-primary/20 [&>div]:bg-primary" />
          <p className="text-xs text-muted-foreground">{playerStats.xp} / {nextLevelXpTargetForDossier === Infinity || !XP_THRESHOLDS[playerStats.level+1] ? 'MAX' : XP_THRESHOLDS[playerStats.level + 1]} XP</p>
        </div>
         <div>
          <p className="font-semibold text-muted-foreground">Infiltration Stats:</p>
          <p>Successful Vault Infiltrations: {playerStats.successfulVaultInfiltrations}</p>
          <p>Successful Lock Infiltrations: {playerStats.successfulLockInfiltrations}</p>
        </div>
        <div>
          <p className="font-semibold text-muted-foreground">ELINT Stats (Total):</p>
          <p>Obtained: {playerStats.elintObtainedTotal}</p>
          <p>Lost: {playerStats.elintLostTotal}</p>
          <p>Generated: {playerStats.elintGeneratedTotal}</p>
        </div>
        <div>
          <p className="font-semibold text-muted-foreground">ELINT Stats (This Cycle):</p>
          <p>Obtained: {playerStats.elintObtainedCycle}</p>
          <p>Lost: {playerStats.elintLostCycle}</p>
          <p>Generated: {playerStats.elintGeneratedCycle}</p>
        </div>
        <div>
          <p className="font-semibold text-muted-foreground">Transfer Stats:</p>
          <p>All Time ELINT Transferred to HQ: {playerStats.elintTransferred}</p>
          <p>ELINT Transferred to HQ (This Cycle): {playerStats.elintTransferredToHQCyle}</p>
          <p>Successful Interferences: {playerStats.successfulInterferences}</p>
        </div>
        <div>
          <p className="font-semibold text-muted-foreground">Economy Stats:</p>
          <p>ELINT Spent (Spy Shop): {playerStats.elintSpentSpyShop}</p>
        </div>
      </div>
    </ScrollArea>
  );
};

const IntelFilesView = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [contentTitle, setContentTitle] = useState<string>("Intel Files");
  const { openTODWindow } = useAppContext();

  const categories = [
    { id: "briefing", title: "Briefing", heading: "Current Situation & Objectives", content: "Placeholder content for Briefing: Overview of the current game state, active global events, and primary objectives for agents." },
    { id: "assets", title: "Operational Assets", heading: "Currency & Network Tap", content: "Placeholder for Operational Assets: Details on ELINT, how to acquire it, and the functionality of the Network Tap for passive generation." },
    { id: "vault_protocols", title: "Secure Vault Protocols", heading: "Vault & Defense", content: "Placeholder for Secure Vault Protocols: Information on vault security, hardware, fortifiers, and defense strategies." },
    { id: "infiltration_techniques", title: "Infiltration Techniques", heading: "Attacking & Entry", content: "Placeholder for Infiltration Techniques: Guide on entry tools, assault tech, and methods for bypassing vault defenses." },
    { id: "field_ops", title: "Field Operations", heading: "Scanner & Dead Drops", content: "Placeholder for Field Operations: Using the Network Scanner, locating targets, and interacting with Dead Drops for team sharing." },
    { id: "minigames", title: "Mini-Game Protocols", heading: "Infiltration & Transfer", content: "Placeholder for Mini-Game Protocols: Instructions and tips for the Infiltration (vault hacking) and ELINT Transfer minigames." },
    { id: "progression", title: "Progression Matrix", heading: "XP & Leveling", content: "Placeholder for Progression Matrix: How XP is earned, agent level benefits, and the path to becoming an elite operative." },
    { id: "comms_checkin", title: "Comms & Check-In Protocol", heading: "Messages & Daily Rewards", content: "Placeholder for Comms & Check-In Protocol: Understanding the message feed, daily check-in rewards, and team communication." },
    { id: "handbook", title: "Agent Handbook", heading: "Glossary", content: "Placeholder for Agent Handbook: A glossary of common terms, acronyms, and spy jargon used within the Elint Heist universe." },
  ];

  const handleCategorySelect = (category: (typeof categories[0]) | null) => {
    if (category) {
      setSelectedCategory(category.id);
      setContentTitle(category.title);
      openTODWindow(category.title, 
        <div className="font-rajdhani">
          <h4 className="text-lg font-orbitron mb-2 holographic-text">{category.heading}</h4>
          <p className="text-muted-foreground whitespace-pre-line">{category.content}</p>
        </div>
      );
    } else {
      setSelectedCategory(null);
      setContentTitle("Intel Files");
    }
  };

  return (
    <ScrollArea className="h-full p-3">
      <div className="flex items-center mb-4">
        {selectedCategory && ( 
          <HolographicButton onClick={() => handleCategorySelect(null)} className="mr-2 text-xs !py-1 !px-2">Back</HolographicButton>
        )}
        <h3 className="text-xl font-orbitron holographic-text">{contentTitle}</h3>
      </div>
      
      {!selectedCategory ? (
        <ul className="space-y-1 font-rajdhani">
          {categories.map(cat => (
            <li key={cat.id}>
              <HolographicButton
                className="w-full justify-start text-left !bg-transparent hover:!bg-primary/10 !py-1.5"
                onClick={() => handleCategorySelect(cat)}
              >
                {cat.title}
              </HolographicButton>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground font-rajdhani">Details for {contentTitle} are displayed in a TOD Window.</p>
      )}
    </ScrollArea>
  );
};


const SettingsView = () => (
  <ScrollArea className="h-full p-3 font-rajdhani">
    <h3 className="text-xl font-orbitron mb-4 holographic-text">Settings</h3>
    <ul className="space-y-2 text-sm">
      <li><HolographicButton className="w-full justify-start text-left !bg-transparent hover:!bg-primary/10 !py-1.5">Notifications (Placeholder)</HolographicButton></li>
      <li><HolographicButton className="w-full justify-start text-left !bg-transparent hover:!bg-primary/10 !py-1.5">Sound (Placeholder)</HolographicButton></li>
      <li><HolographicButton className="w-full justify-start text-left !bg-transparent hover:!bg-primary/10 !py-1.5">Language (Placeholder)</HolographicButton></li>
      <li><HolographicButton className="w-full justify-start text-left !bg-transparent hover:!bg-primary/10 !py-1.5 text-destructive">Delete History (Placeholder)</HolographicButton></li>
    </ul>
  </ScrollArea>
);

type PadScreenView = 'dossier' | 'intel' | 'settings';

export function AgentSection({ parallaxOffset }: SectionProps) {
  const { playerSpyName, faction, playerStats } = useAppContext();
  const [isPadUp, setIsPadUp] = useState(false); // True = PAD screen content is visible (scrolled to)
  const [padScreenView, setPadScreenView] = useState<PadScreenView>('dossier');
  const [transferTimer, setTransferTimer] = useState(0);
  const [isTransferWindowOpen, setIsTransferWindowOpen] = useState(false);

  const padScrollContainerRef = useRef<HTMLDivElement>(null);
  const padButtonPanelRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const cycleDuration = 4 * 60 * 60; // 4 hours in seconds
    const openDuration = 1 * 60 * 60; // 1 hour in seconds

    const updateTimer = () => {
      const now = Math.floor(Date.now() / 1000); 
      const cycleProgress = now % cycleDuration;

      if (cycleProgress < openDuration) {
        setIsTransferWindowOpen(true);
        setTransferTimer(openDuration - cycleProgress);
      } else {
        setIsTransferWindowOpen(false);
        setTransferTimer(cycleDuration - cycleProgress);
      }
    };
    updateTimer(); 
    const interval = setInterval(updateTimer, 1000); 
    return () => clearInterval(interval); 
  }, []);

  const currentLevelXp = XP_THRESHOLDS[playerStats.level] || 0;
  const nextLevelXpTarget = XP_THRESHOLDS[playerStats.level + 1] || (currentLevelXp + (XP_THRESHOLDS[1] - XP_THRESHOLDS[0] || 100));
  const xpForCurrentLevel = playerStats.xp - currentLevelXp;
  const xpToNextLevelSpan = nextLevelXpTarget - currentLevelXp;
  const xpProgress = xpToNextLevelSpan > 0 ? Math.max(0, Math.min(100, (xpForCurrentLevel / xpToNextLevelSpan) * 100)) : 100;

  const handlePowerClick = () => {
    const shouldBeUp = !isPadUp;
    setIsPadUp(shouldBeUp);
    if (padScrollContainerRef.current && padButtonPanelRef.current) {
      if (shouldBeUp) {
        // Scroll to bring the button panel to the top of the scrollable container
        padScrollContainerRef.current.scrollTo({ 
          top: padButtonPanelRef.current.offsetTop - padScrollContainerRef.current.offsetTop, // Adjust if scroll container has padding
          behavior: 'smooth' 
        });
      } else {
        // Scroll to the top of the scrollable container
        padScrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };
  
  const padGlossClass = "pad-gloss-effect";

  const renderPadScreen = () => {
    switch(padScreenView) {
      case 'dossier': return <AgentDossierView />;
      case 'intel': return <IntelFilesView />;
      case 'settings': return <SettingsView />;
      default: return <AgentDossierView />;
    }
  };

  return (
    <div className="relative flex flex-col p-4 md:p-6 h-full overflow-hidden">
      {/* Static Banner Area */}
      <div className="flex-shrink-0 text-center pt-4 md:pt-2 pb-2">
        <div className="absolute inset-x-0 top-0 h-[90px] flex flex-col items-center justify-center -z-10 opacity-50">
           <Fingerprint className="w-32 h-32 md:w-48 md:h-48 text-primary/10" />
        </div>
        <h1 className="text-3xl md:text-4xl font-orbitron holographic-text">{playerSpyName || "Agent"}</h1>
        <p className={`text-lg font-semibold ${faction === 'Cyphers' ? 'text-blue-400' : faction === 'Shadows' ? 'text-red-400' : 'text-gray-400'}`}>{faction}</p>
      </div>

      {/* Main Scrollable PAD Area */}
      <div
        ref={padScrollContainerRef}
        className={cn(
          "flex-grow flex flex-col overflow-y-auto scrollbar-hide relative rounded-t-lg",
          "bg-pad-backing backdrop-blur-sm", 
          padGlossClass 
        )}
      >
        {/* Scrollable Agent Info (Stats, Timer) - Placed before button panel */}
        <div className="text-center pt-2 pb-4 px-2 flex-shrink-0">
            <div className="w-full max-w-md mx-auto">
                <p className="text-sm text-muted-foreground">Agent Rank: {playerStats.level}</p>
                <Progress value={xpProgress} className="w-full h-2 mt-1 bg-primary/20 [&>div]:bg-primary" />
                <p className="text-xs text-muted-foreground">{playerStats.xp} / {nextLevelXpTarget === Infinity || !XP_THRESHOLDS[playerStats.level+1] ? 'MAX' : XP_THRESHOLDS[playerStats.level + 1]} XP</p>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3 text-sm w-full max-w-md mx-auto font-rajdhani">
            <div>
                <p className="text-muted-foreground">ELINT Reserves</p>
                <p className="font-digital7 text-xl holographic-text">{playerStats.elintReserves}</p>
            </div>
            <div>
                <p className="text-muted-foreground">ELINT Transferred (HQ)</p>
                <p className="font-digital7 text-xl holographic-text">{playerStats.elintTransferred}</p>
            </div>
            </div>
            
            <div className="mt-3">
            <p className={`text-sm font-semibold font-rajdhani ${isTransferWindowOpen ? 'text-green-400 animate-pulse' : 'text-yellow-400'}`}>
                {isTransferWindowOpen ? 'Transfer Window Ends:' : 'Next Transfer Window:'}
            </p>
            <p className="font-digital7 text-xl holographic-text">
                {new Date(transferTimer * 1000).toISOString().substr(11, 8)}
            </p>
            </div>
        </div>

        {/* PAD Button Panel - This is the visual "top" of the PAD screen itself */}
        <div 
            ref={padButtonPanelRef}
            className="h-[60px] flex-shrink-0 flex items-center justify-between px-4 border-b sticky top-0 z-10 bg-pad-backing" 
            style={{ borderColor: 'hsla(var(--background-hsl),0.4)'}}
        >
          {!isPadUp ? ( // When PAD is "closed"/scrolled to top, show title
            <div className="flex-grow text-center">
              <p className="font-orbitron text-lg holographic-text">{faction === 'Cyphers' ? "Cypher PAD" : faction === 'Shadows' ? "Shadow PAD" : "Agent PAD"}</p>
              <p className="text-xs text-muted-foreground">Personal Assistant Device</p>
            </div>
          ) : ( // When PAD is "open"/scrolled to screen, show buttons
            <div className="flex-grow flex justify-center gap-4">
              <HolographicButton onClick={() => setPadScreenView('dossier')} className={cn("!p-1.5", padScreenView === 'dossier' && "bg-primary/20")}>
                <Info className="w-5 h-5" />
              </HolographicButton>
              <HolographicButton onClick={() => setPadScreenView('intel')} className={cn("!p-1.5", padScreenView === 'intel' && "bg-primary/20")}>
                <BookOpen className="w-5 h-5" />
              </HolographicButton>
              <HolographicButton onClick={() => setPadScreenView('settings')} className={cn("!p-1.5", padScreenView === 'settings' && "bg-primary/20")}>
                <Settings className="w-5 h-5" />
              </HolographicButton>
            </div>
          )}
          <HolographicButton onClick={handlePowerClick} className="ml-auto !p-1.5">
            {/* Power icon changes based on whether PAD screen is meant to be visible */}
            <Power className={cn("w-5 h-5", isPadUp ? "text-green-400" : "text-red-400")} />
          </HolographicButton>
        </div>

        {/* PAD Screen Area */}
        <div className={cn(
            "flex-grow min-h-0 p-2", // PAD Screen content area
            !isPadUp && "hidden" // Hide screen content when PAD is "closed"
            // isPadUp must control visibility, not just scroll position,
            // or we ensure it's scrolled out of view completely.
            // For now, simple hide/show. Or, rely on parent scrolling to hide it.
            // The content below button panel is here:
        )}>
             <div className="h-full pad-screen-grid bg-accent/10 border border-primary/20 rounded-md overflow-hidden">
                {renderPadScreen()}
             </div>
        </div>
      </div>
    </div>
  );
}
