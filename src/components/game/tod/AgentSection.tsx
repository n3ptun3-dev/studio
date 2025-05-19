
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { HolographicButton } from '@/components/game/shared/HolographicPanel';
import { Progress } from "@/components/ui/progress";
import { Fingerprint, Settings, BookOpen, Info, Power } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { XP_THRESHOLDS } from '@/lib/constants';
import { useTheme } from '@/contexts/ThemeContext'; // For active button theming

const PEEK_AMOUNT = 20; // Height of the visible part of the PAD screen when "off"

// --- PAD Screen Views ---
const AgentDossierView = () => {
  const { playerSpyName, playerPiName, faction, playerStats, setFaction: setAppFaction, addMessage } = useAppContext();
  const { theme: currentTheme } = useTheme();

  const handleFactionChange = () => {
    let newFaction = faction === 'Cyphers' ? 'Shadows' : 'Cyphers';
    if (faction === 'Observer') {
        newFaction = 'Cyphers'; 
        addMessage({ type: 'system', text: `Observer protocol overridden. Faction allegiance protocols engaged. Defaulting to Cyphers.` });
    } else {
        addMessage({ type: 'system', text: `Faction allegiance protocols updated to: ${newFaction}. Coordinating with HQ.` });
    }
    setAppFaction(newFaction);
  };

  const currentLevelXpForDossier = XP_THRESHOLDS[playerStats.level] || 0;
  const nextLevelXpTargetForDossier = XP_THRESHOLDS[playerStats.level + 1] || (XP_THRESHOLDS[XP_THRESHOLDS.length -1] + (XP_THRESHOLDS[XP_THRESHOLDS.length - 1] - XP_THRESHOLDS[XP_THRESHOLDS.length - 2] || 100));
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
          <p>Pi Name: <span className="text-primary">{playerPiName ? `${playerPiName.substring(0, 3)}***${playerPiName.slice(-2)}` : "CLASSIFIED"}</span></p>
          <p>Agent ID: <span className="text-primary">UID-{playerPiName || "UNKNOWN"}</span></p>
        </div>
        <div>
          <p className="font-semibold text-muted-foreground">Faction Details:</p>
          <p>Current Faction: <span className={`font-semibold cursor-pointer ${faction === 'Cyphers' ? 'text-blue-400 hover:text-blue-300' : faction === 'Shadows' ? 'text-red-400 hover:text-red-300' : 'text-gray-400 hover:text-gray-300'}`} onClick={handleFactionChange}>{faction}</span></p>
          <p className="text-xs text-muted-foreground">Faction History: [Placeholder]</p>
          <p className="text-xs text-muted-foreground">Joined: [Date Placeholder]</p>
        </div>
        <div>
          <p className="font-semibold text-muted-foreground">Stats & Performance:</p>
          <p>Level: {playerStats.level}</p>
          <Progress value={xpProgressForDossier} className="w-full h-1.5 mt-1 bg-primary/20 [&>div]:bg-primary" />
          <p className="text-xs text-muted-foreground">{playerStats.xp} / {nextLevelXpTargetForDossier} XP</p>
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
  const { theme: currentTheme } = useTheme();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

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

  const selectedCategoryData = categories.find(cat => cat.id === activeCategory);

  if (activeCategory && selectedCategoryData) {
    return (
      <div className="p-3 animate-slide-in-right-tod h-full flex flex-col">
        <HolographicButton
          onClick={() => setActiveCategory(null)}
          className="mb-4 !py-1 !px-2 text-xs flex-shrink-0"
          explicitTheme={currentTheme}
        >
          &larr; Back to Intel Files
        </HolographicButton>
        <h4 className="text-lg font-orbitron mb-2 holographic-text flex-shrink-0">{selectedCategoryData.heading}</h4>
        <ScrollArea className="flex-grow min-h-0">
          <p className="text-muted-foreground whitespace-pre-line font-rajdhani pr-2">{selectedCategoryData.content}</p>
        </ScrollArea>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full p-3">
      <div className="flex items-center mb-4">
        <h3 className="text-xl font-orbitron holographic-text">Intel Files</h3>
      </div>
      <ul className="space-y-1 font-rajdhani">
        {categories.map(cat => (
          <li key={cat.id}>
            <HolographicButton
              className="w-full justify-start text-left !bg-transparent hover:!bg-primary/10 !py-1.5"
              onClick={() => setActiveCategory(cat.id)}
              explicitTheme={currentTheme}
            >
              {cat.title}
            </HolographicButton>
          </li>
        ))}
      </ul>
    </ScrollArea>
  );
};

const SettingsView = () => {
  const { theme: currentTheme } = useTheme();
  return (
    <ScrollArea className="h-full p-3 font-rajdhani">
      <h3 className="text-xl font-orbitron mb-4 holographic-text">Settings</h3>
      <ul className="space-y-2 text-sm">
        <li><HolographicButton explicitTheme={currentTheme} className="w-full justify-start text-left !bg-transparent hover:!bg-primary/10 !py-1.5">Notifications (Placeholder)</HolographicButton></li>
        <li><HolographicButton explicitTheme={currentTheme} className="w-full justify-start text-left !bg-transparent hover:!bg-primary/10 !py-1.5">Sound (Placeholder)</HolographicButton></li>
        <li><HolographicButton explicitTheme={currentTheme} className="w-full justify-start text-left !bg-transparent hover:!bg-primary/10 !py-1.5">Language (Placeholder)</HolographicButton></li>
        <li><HolographicButton explicitTheme={currentTheme} className="w-full justify-start text-left !bg-transparent hover:!bg-primary/10 !py-1.5 text-destructive">Delete History (Placeholder)</HolographicButton></li>
      </ul>
    </ScrollArea>
  );
};

type PadScreenView = 'dossier' | 'intel' | 'settings';

interface SectionProps {
  parallaxOffset: number;
}

export function AgentSection({ parallaxOffset }: SectionProps) {
  const { playerSpyName, faction, playerStats } = useAppContext();
  const { theme: currentTheme } = useTheme();

  const [isPadUp, setIsPadUp] = useState(false);
  const [padScreenView, setPadScreenView] = useState<PadScreenView>('dossier');
  const [padButtonPanelHeight, setPadButtonPanelHeight] = useState(60); // Initial estimate
  const [padPeekPlusButtonHeight, setPadPeekPlusButtonHeight] = useState(padButtonPanelHeight + PEEK_AMOUNT);

  const titleAreaContentRef = useRef<HTMLDivElement>(null);
  const statsAreaRef = useRef<HTMLDivElement>(null);
  const topContentRef = useRef<HTMLDivElement>(null);
  const thePadRef = useRef<HTMLDivElement>(null);
  const padButtonPanelRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (padButtonPanelRef.current) {
      const measuredHeight = padButtonPanelRef.current.offsetHeight;
      if (measuredHeight > 0 && measuredHeight !== padButtonPanelHeight) {
        setPadButtonPanelHeight(measuredHeight);
      }
    }
  }, [padButtonPanelHeight]); 

  useEffect(() => {
    setPadPeekPlusButtonHeight(padButtonPanelHeight + PEEK_AMOUNT);
  }, [padButtonPanelHeight]);

  const handlePowerClick = useCallback(() => {
    setIsPadUp(prev => !prev);
  }, []);

  const currentLevelXp = XP_THRESHOLDS[playerStats.level] || 0;
  const nextLevelXpTarget = XP_THRESHOLDS[playerStats.level + 1] || (XP_THRESHOLDS[XP_THRESHOLDS.length -1] + (XP_THRESHOLDS[XP_THRESHOLDS.length - 1] - XP_THRESHOLDS[XP_THRESHOLDS.length - 2] || 100));
  const xpForCurrentLevel = playerStats.xp - currentLevelXp;
  const xpToNextLevelSpan = nextLevelXpTarget - currentLevelXp;
  const xpProgress = xpToNextLevelSpan > 0 ? Math.max(0, Math.min(100, (xpForCurrentLevel / xpToNextLevelSpan) * 100)) : 100;

  const renderPadScreenContent = () => {
    switch (padScreenView) {
      case 'dossier': return <AgentDossierView />;
      case 'intel': return <IntelFilesView />;
      case 'settings': return <SettingsView />;
      default: return <AgentDossierView />;
    }
  };
  
  const padDynamicStyle: React.CSSProperties = {
    top: isPadUp ? '0px' : `calc(100% - ${padPeekPlusButtonHeight}px)`,
    height: isPadUp ? '100%' : `${padPeekPlusButtonHeight}px`,
  };

  return (
    // AgentSection Root: No internal scroll, relative for absolute PAD.
    <div className="relative h-full overflow-hidden">
      {/* Static Background Layer (Title + Stats) - Fills AgentSection, behind the PAD */}
      <div 
        ref={topContentRef}
        className="absolute inset-0 flex flex-col z-10 pointer-events-none" 
      >
        {/* Title Area - Expands to fill space above Stats Area */}
        <div 
          ref={titleAreaContentRef}
          className="flex-grow flex flex-col items-center justify-center pt-4 md:pt-2 pb-2 text-center relative overflow-hidden"
        >
            <div className="absolute inset-0 flex items-center justify-center -z-10 opacity-10">
                <Fingerprint className="w-48 h-48 md:w-64 md:h-64 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-orbitron holographic-text">{playerSpyName || "Agent"}</h1>
            <p className={`text-lg font-semibold ${faction === 'Cyphers' ? 'text-blue-400' : faction === 'Shadows' ? 'text-red-400' : 'text-gray-400'}`}>{faction}</p>
        </div>

        {/* Stats Area - Sits at the bottom of the topContentRef */}
        <div 
          ref={statsAreaRef}
          className="flex-shrink-0 text-center pt-2 pb-4 px-2"
        >
            <div className="w-full max-w-md mx-auto">
                <p className="text-sm text-muted-foreground">Agent Rank: {playerStats.level}</p>
                <Progress value={xpProgress} className="w-full h-2 mt-1 bg-primary/20 [&>div]:bg-primary" />
                <p className="text-xs text-muted-foreground">{playerStats.xp} / {nextLevelXpTarget} XP</p>
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
                <p className="text-sm font-semibold font-rajdhani text-yellow-400">
                Next Transfer Window: {/* Placeholder */}
                </p>
                <p className="font-digital7 text-xl holographic-text">
                02:34:56 {/* Placeholder */}
                </p>
            </div>
        </div>
        {/* Invisible Spacer to reserve space for the PAD's button panel when PAD is 'off' */}
        <div style={{ height: `${padPeekPlusButtonHeight}px` }} className="flex-shrink-0"></div>
      </div>

      {/* The PAD - Absolutely positioned, slides up/down over the static background content */}
      <div
        ref={thePadRef}
        style={padDynamicStyle}
        className={cn(
          "absolute inset-x-0 w-[90%] mx-auto flex flex-col shadow-lg z-20",
          "bg-[var(--pad-background-color)] border border-[var(--pad-border-color)] rounded-lg", // Using arbitrary values for bg and border
          "backdrop-blur-sm pad-gloss-effect",
          "transition-all duration-500 ease-in-out" 
        )}
      >
        {/* PAD Button Panel */}
        <div
          ref={padButtonPanelRef}
          className={cn(
            "h-[60px] flex-shrink-0 flex items-center justify-between px-4",
            "bg-[var(--pad-background-color)] border-b border-[var(--pad-button-panel-separator-color)] rounded-t-lg"
          )}
        >
          {isPadUp ? (
            <div className="flex-grow flex justify-center gap-4">
              <HolographicButton 
                onClick={() => setPadScreenView('dossier')} 
                className={cn("!p-1.5", padScreenView === 'dossier' && "active-pad-button")}
                explicitTheme={currentTheme}
                aria-label="Agent Dossier"
              >
                <Info className="w-5 h-5" />
              </HolographicButton>
              <HolographicButton 
                onClick={() => setPadScreenView('intel')} 
                className={cn("!p-1.5", padScreenView === 'intel' && "active-pad-button")}
                explicitTheme={currentTheme}
                aria-label="Intel Files"
              >
                <BookOpen className="w-5 h-5" />
              </HolographicButton>
              <HolographicButton 
                onClick={() => setPadScreenView('settings')} 
                className={cn("!p-1.5", padScreenView === 'settings' && "active-pad-button")}
                explicitTheme={currentTheme}
                aria-label="Settings"
              >
                <Settings className="w-5 h-5" />
              </HolographicButton>
            </div>
          ) : (
            <div className="flex-grow text-center">
              <p className="font-orbitron text-lg holographic-text">{faction === 'Cyphers' ? "Cypher PAD" : faction === 'Shadows' ? "Shadow PAD" : "Agent PAD"}</p>
              <p className="text-xs text-muted-foreground">Personal Assistant Device</p>
            </div>
          )}
          <HolographicButton 
            onClick={handlePowerClick} 
            className="ml-auto !p-1.5" 
            explicitTheme={currentTheme}
            aria-label={isPadUp ? "Close PAD" : "Open PAD"}
          >
            <Power className={cn("w-5 h-5 icon-glow", isPadUp ? "text-green-400" : "text-red-400")} />
          </HolographicButton>
        </div>

        {/* PAD Screen Area Wrapper - This gets the PAD's main background via bg-[var(--pad-background-color)] and bottom rounding */}
        <div 
          className={cn(
            "flex-grow min-h-0", 
            "bg-[var(--pad-background-color)] rounded-b-lg"
            )}
        >
          {/* Conditional rendering of screen content or peek area */}
          {isPadUp ? (
             <div className="h-full w-full pad-screen-grid bg-accent/10 border border-primary/20 rounded-md m-2">
                <ScrollArea className="h-full w-full"> 
                    {renderPadScreenContent()}
                </ScrollArea>
             </div>
          ) : (
            <div 
              className={cn(
                "pad-screen-grid bg-accent/10 border border-primary/20 rounded-b-md m-2 opacity-50",
                `h-[${PEEK_AMOUNT}px]` 
              )}
            >
              {/* Intentionally empty for the peek */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
