
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { HolographicButton } from '@/components/game/shared/HolographicPanel';
import { Progress } from "@/components/ui/progress";
import { Fingerprint, Settings, BookOpen, Info, Power } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { XP_THRESHOLDS } from '@/lib/constants';
import { useTheme } from '@/contexts/ThemeContext'; // Import useTheme

const PEEK_AMOUNT = 20; // Height of the visible part of the PAD screen when "off"

// --- PAD Screen Views ---
const AgentDossierView = () => {
  const { playerSpyName, playerPiName, faction, playerStats, setFaction: setAppFaction, addMessage } = useAppContext();
  const { theme: currentTheme } = useTheme(); // Use theme for explicitTheme on buttons

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

export function AgentSection({ parallaxOffset }: { parallaxOffset: number }) {
  const { playerSpyName, faction, playerStats } = useAppContext();
  const { theme: currentGlobalTheme } = useTheme();

  const [isPadUp, setIsPadUp] = useState(false);
  const [padScreenView, setPadScreenView] = useState<PadScreenView>('dossier');
  const [padButtonPanelHeight, setPadButtonPanelHeight] = useState(60);
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
  }, []); 

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

  const padDynamicStyle: React.CSSProperties = isPadUp
    ? { top: '0px', height: '100%' }
    : { top: `calc(100% - ${padPeekPlusButtonHeight}px)`, height: `${padPeekPlusButtonHeight}px` };

  const currentPadStyle: React.CSSProperties = {
    ...padDynamicStyle,
    backgroundColor: `hsla(var(--pad-bg-hsl), 0.85)`, 
    borderColor: `hsl(var(--pad-border-hsl))`,
    borderRadius: '0.5rem', 
    borderWidth: '1px',
    borderStyle: 'solid',
  };

  const buttonPanelStyle: React.CSSProperties = {
    backgroundColor: `hsla(var(--pad-bg-hsl), 0.85)`,
    borderBottomColor: `hsla(var(--pad-button-panel-separator-hsl), 0.5)`,
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderTopLeftRadius: '0.5rem',
    borderTopRightRadius: '0.5rem',
  };
  
  const screenWrapperStyle: React.CSSProperties = {
    backgroundColor: `hsla(var(--pad-bg-hsl), 0.85)`,
    borderBottomLeftRadius: '0.5rem',
    borderBottomRightRadius: '0.5rem',
  };

  return (
    <div className="relative h-full overflow-hidden"> {/* AgentSection Root */}
      {/* Static Background Layer - Fills AgentSection, PAD slides over this */}
      <div ref={topContentRef} className="absolute inset-0 flex flex-col z-10 pointer-events-none">
        {/* Title Area - Expands to push Stats to bottom of this layer */}
        <div ref={titleAreaContentRef} className="flex-grow flex flex-col items-center justify-center pt-4 md:pt-2 pb-2 text-center relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center -z-10 opacity-10">
            <Fingerprint className="w-48 h-48 md:w-64 md:h-64 text-primary icon-glow" />
          </div>
          <h1 className="text-3xl md:text-4xl font-orbitron holographic-text">{playerSpyName || "Agent"}</h1>
          <p className={`text-lg font-semibold ${faction === 'Cyphers' ? 'text-blue-400' : faction === 'Shadows' ? 'text-red-400' : 'text-gray-400'}`}>{faction}</p>
        </div>
        {/* Stats Area - Sits at the bottom of the static background layer */}
        <div ref={statsAreaRef} className="flex-shrink-0 text-center pt-2 pb-4 px-2">
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
              Next Transfer Window:
            </p>
            <p className="font-digital7 text-xl holographic-text">
              {/* Placeholder for actual timer component/logic */}
              02:34:56 
            </p>
          </div>
        </div>
        {/* Invisible Spacer - Reserves space at the bottom of the static layer for the PAD's "off" state */}
        <div className="flex-shrink-0" style={{ height: `${padPeekPlusButtonHeight}px` }}></div>
      </div>

      {/* The PAD - Absolutely Positioned Sliding Layer */}
      <div
        ref={thePadRef}
        className={cn(
          "absolute inset-x-0 w-[90%] mx-auto flex flex-col shadow-lg z-20 transition-all duration-500 ease-in-out",
          // Removed direct bg/border/rounded from className, will be applied by inline style
          // "backdrop-blur-sm pad-gloss-effect" // Temporarily removed for focused bg test
        )}
        style={currentPadStyle}
      >
        {/* PAD Button Panel */}
        <div
          ref={padButtonPanelRef}
          className={cn(
            "h-[60px] flex-shrink-0 flex items-center justify-between px-4"
            // Styling for bg and border-b via inline `buttonPanelStyle`
            // Tailwind's rounded-t-lg applied directly
          )}
          style={buttonPanelStyle}
        >
          {isPadUp ? (
            <div className="flex-grow flex justify-center gap-4">
              <HolographicButton
                onClick={() => setPadScreenView('dossier')}
                className={cn("!p-1.5", padScreenView === 'dossier' && "active-pad-button")}
                explicitTheme={currentGlobalTheme}
                aria-label="Agent Dossier"
              >
                <Info className="w-5 h-5" />
              </HolographicButton>
              <HolographicButton
                onClick={() => setPadScreenView('intel')}
                className={cn("!p-1.5", padScreenView === 'intel' && "active-pad-button")}
                explicitTheme={currentGlobalTheme}
                aria-label="Intel Files"
              >
                <BookOpen className="w-5 h-5" />
              </HolographicButton>
              <HolographicButton
                onClick={() => setPadScreenView('settings')}
                className={cn("!p-1.5", padScreenView === 'settings' && "active-pad-button")}
                explicitTheme={currentGlobalTheme}
                aria-label="Settings"
              >
                <Settings className="w-5 h-5" />
              </HolographicButton>
            </div>
          ) : (
            <div className="flex-grow text-center">
              <p className="font-orbitron text-lg holographic-text">
                {faction === 'Cyphers' ? "Cypher PAD" : faction === 'Shadows' ? "Shadow PAD" : "Agent PAD"}
              </p>
              <p className="text-xs text-muted-foreground">Personal Assistant Device</p>
            </div>
          )}
          <HolographicButton
            onClick={handlePowerClick}
            className="ml-auto !p-1.5"
            explicitTheme={currentGlobalTheme}
            aria-label={isPadUp ? "Close PAD" : "Open PAD"}
          >
            <Power className={cn("w-5 h-5 icon-glow", isPadUp ? "text-green-400" : "text-red-400")} />
          </HolographicButton>
        </div>

        {/* PAD Screen Area Wrapper */}
        <div 
          className={cn(
            "flex-grow min-h-0"
            // Styling for bg and rounded-b-lg via inline `screenWrapperStyle`
          )}
          style={screenWrapperStyle}
        >
          {isPadUp ? (
             <div className="h-full w-full pad-screen-grid bg-accent/10 border border-[hsl(var(--primary-hsl))] rounded-md m-2">
                <ScrollArea className="h-full w-full">
                    {renderPadScreenContent()}
                </ScrollArea>
             </div>
          ) : (
            // When PAD is off, show just a peek of the grid
            <div className="h-[20px] pad-screen-grid bg-accent/10 border border-[hsl(var(--primary-hsl))] rounded-md m-2"></div>
          )}
        </div>
      </div>
    </div>
  );
}
