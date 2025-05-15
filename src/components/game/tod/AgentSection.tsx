
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  // const { setTheme } = useTheme(); // setTheme is not directly used here, ThemeUpdater handles it via AppContext.faction

  const handleFactionChange = () => {
    const newFaction = faction === 'Cyphers' ? 'Shadows' : 'Cyphers';
    setAppFaction(newFaction);
    addMessage({type: 'system', text: `Faction allegiance protocols updated to: ${newFaction}. Coordinating with HQ.`});
  };

  const currentLevelXpForDossier = XP_THRESHOLDS[playerStats.level] || 0;
  const nextLevelXpTargetForDossier = XP_THRESHOLDS[playerStats.level + 1] || (currentLevelXpForDossier + (XP_THRESHOLDS[1] - XP_THRESHOLDS[0] || 100));
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
const PEEK_AMOUNT = 20; // How much of the PAD screen peeks out when "off"

export function AgentSection({ parallaxOffset }: SectionProps) {
  const { playerSpyName, faction, playerStats } = useAppContext();
  const [isPadUp, setIsPadUp] = useState(false); // True if PAD is scrolled to "on" position
  const [padScreenView, setPadScreenView] = useState<PadScreenView>('dossier');
  const [transferTimer, setTransferTimer] = useState(0);
  const [isTransferWindowOpen, setIsTransferWindowOpen] = useState(false);

  const titleAreaRef = useRef<HTMLDivElement>(null);
  const infoAreaRef = useRef<HTMLDivElement>(null);
  const mainScrollContainerRef = useRef<HTMLDivElement>(null);
  const thePadRef = useRef<HTMLDivElement>(null);
  const padButtonPanelRef = useRef<HTMLDivElement>(null);

  const [titleAreaHeight, setTitleAreaHeight] = useState(0);
  const [infoAreaHeight, setInfoAreaHeight] = useState(0);
  const [padButtonPanelHeight, setPadButtonPanelHeight] = useState(0);

  useEffect(() => {
    const calculateHeights = () => {
      if (titleAreaRef.current) setTitleAreaHeight(titleAreaRef.current.offsetHeight);
      if (infoAreaRef.current) setInfoAreaHeight(infoAreaRef.current.offsetHeight);
      if (padButtonPanelRef.current) setPadButtonPanelHeight(padButtonPanelRef.current.offsetHeight);
    };

    calculateHeights(); // Initial calculation
    // Add ResizeObserver for dynamic height updates if needed
    // For simplicity, we'll rely on initial calc and stable content for now
    // window.addEventListener('resize', calculateHeights);
    // return () => window.removeEventListener('resize', calculateHeights);
  }, []);
  
  // Scroll to initial "PAD off" position once heights are known
  useEffect(() => {
    if (mainScrollContainerRef.current && infoAreaHeight > 0 && padButtonPanelHeight > 0 && thePadRef.current) {
      // Calculate initial scroll position for "PAD off" state
      // We want the PAD button panel + PEEK_AMOUNT to be visible at the bottom of the scroll container.
      // The scroll container's height is effectively viewport height - titleAreaHeight.
      const scrollContainerHeight = mainScrollContainerRef.current.clientHeight;
      const desiredPadVisibleHeight = padButtonPanelHeight + PEEK_AMOUNT;
      
      // The total height of content inside scroll container when PAD screen is minimal (just button panel + peek)
      // is infoAreaHeight + desiredPadVisibleHeight.
      // scrollTop should be such that this content fits, and desiredPadVisibleHeight is at the bottom.
      const initialScrollTop = Math.max(0, infoAreaHeight + padButtonPanelHeight - (scrollContainerHeight - desiredPadVisibleHeight) + PEEK_AMOUNT);
      // Simpler: scrollTop to place top of PAD such that its bottom is PEEK_AMOUNT from scroll container bottom
      // Total scrollable content height = infoAreaHeight + PAD_FULL_HEIGHT
      // PAD_FULL_HEIGHT = scrollContainerHeight - infoAreaHeight (when pad is 'on')
      // Let's just start with PAD scrolled to show its button panel right under infoArea
      const initialPadOffScrollTop = 0; // PAD is at the very bottom of its scroll content initially
      mainScrollContainerRef.current.scrollTop = initialPadOffScrollTop;
      setIsPadUp(false); // Explicitly set PAD to off
    }
  }, [infoAreaHeight, padButtonPanelHeight, titleAreaHeight]);


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

  const currentLevelXp = XP_THRESHOLDS[playerStats.level] || 0;
  const nextLevelXpTarget = XP_THRESHOLDS[playerStats.level + 1] || (currentLevelXp + (XP_THRESHOLDS[1] - XP_THRESHOLDS[0] || 100));
  const xpForCurrentLevel = playerStats.xp - currentLevelXp;
  const xpToNextLevelSpan = nextLevelXpTarget - currentLevelXp;
  const xpProgress = xpToNextLevelSpan > 0 ? Math.max(0, Math.min(100, (xpForCurrentLevel / xpToNextLevelSpan) * 100)) : 100;

  const handlePowerClick = useCallback(() => {
    if (!mainScrollContainerRef.current || infoAreaHeight === 0) return;

    if (!isPadUp) { // Turning ON
      mainScrollContainerRef.current.scrollTo({ top: infoAreaHeight, behavior: 'smooth' });
      // setIsPadUp(true); // This will be handled by handleMainScroll
    } else { // Turning OFF
      // Scroll to initial "off" position.
      // scrollTop 0 means the PAD is at the very bottom of its scrollable range (under infoArea)
      mainScrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      // setIsPadUp(false); // This will be handled by handleMainScroll
    }
  }, [isPadUp, infoAreaHeight]);

  const handleMainScroll = useCallback(() => {
    if (!mainScrollContainerRef.current || infoAreaHeight === 0) return;
    const scrollTop = mainScrollContainerRef.current.scrollTop;
    const padOnPositionThreshold = infoAreaHeight -10; // Allow some tolerance

    if (scrollTop >= padOnPositionThreshold) {
      if(!isPadUp) setIsPadUp(true);
    } else {
      if(isPadUp) setIsPadUp(false);
    }
  }, [infoAreaHeight, isPadUp]);


  const renderPadScreen = () => {
    switch(padScreenView) {
      case 'dossier': return <AgentDossierView />;
      case 'intel': return <IntelFilesView />;
      case 'settings': return <SettingsView />;
      default: return <AgentDossierView />;
    }
  };
  
  const padHeightWhenOn = titleAreaHeight > 0 ? `calc(100vh - ${titleAreaHeight}px)` : '100%';

  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      {/* Static "Title Area" (Agent Name, Faction) */}
      <div ref={titleAreaRef} className="flex-shrink-0 text-center pt-4 md:pt-2 pb-2 z-20 bg-background"> {/* Added z-20 and bg-background */}
        <div className="absolute inset-x-0 top-0 h-[90px] flex flex-col items-center justify-center -z-10 opacity-50">
           <Fingerprint className="w-32 h-32 md:w-48 md:h-48 text-primary/10" />
        </div>
        <h1 className="text-3xl md:text-4xl font-orbitron holographic-text">{playerSpyName || "Agent"}</h1>
        <p className={`text-lg font-semibold ${faction === 'Cyphers' ? 'text-blue-400' : faction === 'Shadows' ? 'text-red-400' : 'text-gray-400'}`}>{faction}</p>
      </div>

      {/* Static "Info Area" (Agent Rank, XP, ELINT, Timer) */}
      <div ref={infoAreaRef} className="flex-shrink-0 text-center pt-2 pb-4 px-2 z-20 bg-background"> {/* Added z-20 and bg-background */}
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
      
      {/* Main Scroll Container for the PAD */}
      <div
        ref={mainScrollContainerRef}
        className="absolute left-0 right-0 bottom-0 overflow-y-auto scrollbar-hide z-10" // Ensure PAD scrolls on top
        style={{ top: `${titleAreaHeight}px` }} // Starts below the static Title Area
        onScroll={handleMainScroll}
      >
        {/* Spacer div to push "The PAD" down, effectively representing the space InfoArea takes */}
        <div style={{ height: `${infoAreaHeight}px`, flexShrink: 0 }} />

        {/* The PAD itself */}
        <div
          ref={thePadRef}
          className={cn(
            "flex flex-col bg-pad-backing backdrop-blur-sm pad-gloss-effect rounded-t-lg border-t border-l border-r border-white/10 min-h-[100px]", // min-h to ensure it's always somewhat visible
            // When PAD is 'on', it should fill the available space in its scroll container
            isPadUp ? 'h-[calc(100%_-_0px)]' : 'h-auto' // Simplified: when on, fill remaining space, when off, auto height.
                                                        // The `100% - 0px` refers to 100% of mainScrollContainerRef.
                                                        // Or better: let it be defined by its content + min-h
          )}
          style={{
            // Calculate minHeight for "off" state: button panel + PEEK_AMOUNT
            minHeight: isPadUp ? `calc(100vh - ${titleAreaHeight}px)` : `${padButtonPanelHeight + PEEK_AMOUNT}px`,
          }}
        >
          {/* PAD Button Panel */}
          <div
            ref={padButtonPanelRef}
            className="h-[60px] flex-shrink-0 flex items-center justify-between px-4 border-b border-white/5"
          >
            {!isPadUp ? (
              <div className="flex-grow text-center">
                <p className="font-orbitron text-lg holographic-text">{faction === 'Cyphers' ? "Cypher PAD" : faction === 'Shadows' ? "Shadow PAD" : "Agent PAD"}</p>
                <p className="text-xs text-muted-foreground">Personal Assistant Device</p>
              </div>
            ) : (
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
              <Power className={cn("w-5 h-5", isPadUp ? "text-green-400" : "text-red-400")} />
            </HolographicButton>
          </div>

          {/* PAD Screen Area */}
          <div className={cn(
            "flex-grow min-h-0 pad-screen-grid bg-accent/10 border border-primary/20 rounded-md m-2 overflow-hidden",
             !isPadUp && "opacity-0 pointer-events-none h-0" // Hide content but keep structure for peek
          )}>
            {/* Only render content if PAD is fully 'on' and screen view is needed, or always render for consistent grid */}
             {isPadUp && (
                <ScrollArea className="h-full w-full">
                    {renderPadScreen()}
                </ScrollArea>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

    