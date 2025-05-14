
"use client";

import { useState, useEffect, useRef } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { HolographicButton } from '@/components/game/shared/HolographicPanel';
import { Progress } from "@/components/ui/progress";
import { Fingerprint, Settings, BookOpen, Info, Power } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

interface SectionProps {
  parallaxOffset: number;
}

const XP_LEVELS = [0, 100, 200, 400, 800, 1600, 3200, 6400, 12800]; // XP needed for next level

const AgentDossierView = () => {
  const { playerSpyName, playerPiName, faction, playerStats, setFaction: setAppFaction, addMessage } = useAppContext();
  // const { setTheme } = useTheme(); // setTheme from useTheme is not used here, ThemeUpdater handles it

  const handleFactionChange = () => {
    const newFaction = faction === 'Cyphers' ? 'Shadows' : 'Cyphers';
    setAppFaction(newFaction);
    // ThemeUpdater will handle setTheme based on faction context change
    addMessage({type: 'system', text: `Faction allegiance protocols updated to: ${newFaction}. Coordinating with HQ.`});
  };

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
          <Progress value={(playerStats.xp - (XP_LEVELS[playerStats.level] || 0)) / ((XP_LEVELS[playerStats.level + 1] || (XP_LEVELS[playerStats.level] + (XP_LEVELS[1]-XP_LEVELS[0]))) - (XP_LEVELS[playerStats.level] || 0)) * 100} className="w-full h-1.5 mt-1 bg-primary/20 [&>div]:bg-primary" />
          <p className="text-xs text-muted-foreground">{playerStats.xp} / {XP_LEVELS[playerStats.level + 1] || 'MAX'} XP</p>
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
  const [isPadUp, setIsPadUp] = useState(false);
  const [padScreenView, setPadScreenView] = useState<PadScreenView>('dossier');
  const [transferTimer, setTransferTimer] = useState(0);
  const [isTransferWindowOpen, setIsTransferWindowOpen] = useState(false);

  const padRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);
  // const padTopPosition = useRef<number>(0); // Store target Y positions for PAD - Not currently used

  useEffect(() => {
    const cycleDuration = 4 * 60 * 60;
    const openDuration = 1 * 60 * 60;

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

  const currentLevelXp = XP_LEVELS[playerStats.level] || 0;
  const nextLevelXpTarget = XP_LEVELS[playerStats.level + 1] || (currentLevelXp + (XP_LEVELS[1] - XP_LEVELS[0])); // Avoid division by zero if max level
  const xpForCurrentLevel = playerStats.xp - currentLevelXp;
  const xpToNextLevelSpan = nextLevelXpTarget - currentLevelXp;
  const xpProgress = xpToNextLevelSpan > 0 ? Math.max(0, Math.min(100, (xpForCurrentLevel / xpToNextLevelSpan) * 100)) : 100;

  const handlePowerClick = () => setIsPadUp(!isPadUp);
  
  const handlePadInteractionStart = (clientY: number) => {
    if (padRef.current) {
      dragStartY.current = clientY;
      padRef.current.style.transition = 'none'; 
    }
  };
  
  const handlePadInteractionMove = (clientY: number) => {
    if (dragStartY.current === null || !padRef.current) return;
    // const deltaY = clientY - dragStartY.current;
    // Drag interaction logic not fully implemented, relying on power button
  };

  const handlePadInteractionEnd = () => {
    if (padRef.current) {
      padRef.current.style.transition = 'transform 0.3s ease-out, height 0.3s ease-out';
    }
    dragStartY.current = null;
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
      {/* Agent Info Area (Static Background) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center -z-10 opacity-50">
        <Fingerprint className="w-48 h-48 md:w-64 md:h-64 text-primary/10" />
      </div>
      <div className="flex-grow flex flex-col items-center text-center pt-4 md:pt-8 mb-auto">
        <h1 className="text-3xl md:text-4xl font-orbitron holographic-text">{playerSpyName || "Agent"}</h1>
        <p className={`text-lg font-semibold ${faction === 'Cyphers' ? 'text-blue-400' : faction === 'Shadows' ? 'text-red-400' : 'text-gray-400'}`}>{faction}</p>
        <div className="mt-2 w-full max-w-md">
          <p className="text-sm text-muted-foreground">Agent Rank: {playerStats.level}</p>
          <Progress value={xpProgress} className="w-full h-2 mt-1 bg-primary/20 [&>div]:bg-primary" />
          <p className="text-xs text-muted-foreground">{playerStats.xp} / {nextLevelXpTarget === Infinity ? 'MAX' : nextLevelXpTarget} XP</p>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3 text-sm w-full max-w-md font-rajdhani">
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

      {/* The PAD */}
      <div
        ref={padRef}
        className={cn(
          "absolute bottom-0 left-0 right-0 transition-all duration-300 ease-out mx-auto w-full max-w-2xl",
          "border-t rounded-t-lg",
          padGlossClass, // "pad-gloss-effect"
          "bg-[hsla(var(--background-hsl),0.3)]", // Apply background using Tailwind arbitrary value
          isPadUp ? "h-[75%]" : "h-[100px]",
        )}
        style={{
          // backgroundColor is now handled by Tailwind class above
          borderColor: 'hsla(var(--background-hsl), 0.5)', 
          transform: isPadUp ? 'translateY(0)' : `translateY(calc(100% - 100px - env(safe-area-inset-bottom, 0px)))`,
        }}
        onTouchStart={(e) => handlePadInteractionStart(e.touches[0].clientY)}
        onTouchMove={(e) => handlePadInteractionMove(e.touches[0].clientY)}
        onTouchEnd={handlePadInteractionEnd}
        onMouseDown={(e) => handlePadInteractionStart(e.clientY)}
        onMouseMove={(e) => handlePadInteractionMove(e.clientY)}
        onMouseUp={handlePadInteractionEnd}
        onMouseLeave={handlePadInteractionEnd}
      >
        {/* PAD Button Panel */}
        <div className="h-[60px] flex items-center justify-between px-4 border-b" style={{ borderColor: 'hsla(var(--background-hsl),0.4)'}}>
          {isPadUp ? (
            <div className="flex-grow flex justify-center gap-4">
              <HolographicButton variant="ghost" size="icon" onClick={() => setPadScreenView('dossier')} className={cn("!p-1.5", padScreenView === 'dossier' && "bg-primary/20")}>
                <Info className="w-5 h-5" />
              </HolographicButton>
              <HolographicButton variant="ghost" size="icon" onClick={() => setPadScreenView('intel')} className={cn("!p-1.5", padScreenView === 'intel' && "bg-primary/20")}>
                <BookOpen className="w-5 h-5" />
              </HolographicButton>
              <HolographicButton variant="ghost" size="icon" onClick={() => setPadScreenView('settings')} className={cn("!p-1.5", padScreenView === 'settings' && "bg-primary/20")}>
                <Settings className="w-5 h-5" />
              </HolographicButton>
            </div>
          ) : (
            <div className="flex-grow text-center">
              <p className="font-orbitron text-lg holographic-text">{faction === 'Cyphers' ? "Cypher PAD" : faction === 'Shadows' ? "Shadow PAD" : "Agent PAD"}</p>
              <p className="text-xs text-muted-foreground">Personal Assistant Device</p>
            </div>
          )}
          <HolographicButton variant="ghost" size="icon" onClick={handlePowerClick} className="ml-auto !p-1.5">
            <Power className={cn("w-5 h-5", isPadUp ? "text-green-400" : "text-red-400")} />
          </HolographicButton>
        </div>

        {/* PAD Screen Area */}
        {isPadUp && (
           <div className={cn(
             "h-[calc(100%-60px)] border rounded-md m-2 overflow-hidden pad-screen-grid",
             "bg-accent/10 border-primary/20" // Off-white translucent bg, primary border
            )}>
             {renderPadScreen()}
           </div>
        )}
      </div>
    </div>
  );
}
