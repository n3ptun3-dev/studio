
"use client";

import { useState, useEffect, useRef } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { HolographicPanel, HolographicButton } from '@/components/game/shared/HolographicPanel';
import { Progress } from "@/components/ui/progress";
import { Fingerprint, Settings, BookOpen, Info, Power } from 'lucide-react'; // Power for PAD
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext'; // Ensure this is the correct import

interface SectionProps {
  parallaxOffset: number;
}

const XP_LEVELS = [0, 100, 200, 400, 800, 1600, 3200, 6400, 12800]; // XP needed for next level

// Placeholder components for PAD Screen views
const AgentDossierView = () => {
  const { playerSpyName, playerPiName, faction, playerStats, setFaction: setAppFaction } = useAppContext();
  const { setTheme } = useTheme(); 

  const handleFactionChange = () => {
    const newFaction = faction === 'Cyphers' ? 'Shadows' : 'Cyphers';
    setAppFaction(newFaction);
    setTheme(newFaction === 'Cyphers' ? 'cyphers' : 'shadows');
  };

  return (
    <ScrollArea className="h-full p-3">
      <h3 className="text-xl font-orbitron mb-4 holographic-text">Agent Dossier</h3>
      <div className="space-y-3 text-sm">
        <div>
          <p className="font-semibold text-muted-foreground">Agent Identification:</p>
          <p>Code Name: <span className="text-lg text-primary font-semibold">{playerSpyName || "Recruit"}</span></p>
          <p>Real Name: <span className="text-primary">{playerPiName ? `${playerPiName.substring(0,3)}***${playerPiName.slice(-2)}` : "CLASSIFIED"}</span></p>
          <p>Agent ID: <span className="text-primary">UID-{playerPiName || "UNKNOWN"}</span></p>
        </div>
        <div>
          <p className="font-semibold text-muted-foreground">Faction Details:</p>
          <p>Current Faction: <span className={`font-semibold cursor-pointer ${faction === 'Cyphers' ? 'text-blue-400' : 'text-red-400'}`} onClick={handleFactionChange}>{faction}</span></p>
          {/* Faction History & Joined Date placeholder */}
          <p className="text-xs text-muted-foreground">Joined: [Date Placeholder]</p>
        </div>
        <div>
          <p className="font-semibold text-muted-foreground">Stats & Performance:</p>
          <p>Level: {playerStats.level}</p>
          {/* XP progress bar can be added here */}
          <p>XP: {playerStats.xp} / {XP_LEVELS[playerStats.level + 1] || 'MAX'}</p>
        </div>
        {/* Add other stats sections here */}
        <p className="text-xs text-muted-foreground">More stats (Infiltration, ELINT, Generation, Transfer, Economy) coming soon...</p>
      </div>
    </ScrollArea>
  );
};

const IntelFilesView = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { openTODWindow } = useAppContext();

  const categories = [
    "Briefing", "Operational Assets", "Secure Vault Protocols", 
    "Infiltration Techniques", "Field Operations", "Mini-Game Protocols", 
    "Progression Matrix", "Comms & Check-In Protocol", "Agent Handbook"
  ];

  const handleCategorySelect = (category: string) => {
    // For now, just open a TOD window with placeholder content
    openTODWindow("Intel Files", 
      <div>
        <h4 className="text-lg font-orbitron mb-2">{category}</h4>
        <p className="text-muted-foreground">Details for {category} will be displayed here. This section will animate with sliding transitions in a future update.</p>
      </div>
    );
    // Later, implement the slide animation for categories and content.
    // setSelectedCategory(category); 
  };

  if (selectedCategory) {
    // This part will be for displaying category content after animation
    return (
      <ScrollArea className="h-full p-3">
        <HolographicButton onClick={() => setSelectedCategory(null)} className="mb-2 text-xs">Back to Categories</HolographicButton>
        <h3 className="text-xl font-orbitron mb-4 holographic-text">{selectedCategory}</h3>
        <p>Placeholder content for {selectedCategory}.</p>
      </ScrollArea>
    );
  }

  return (
    <ScrollArea className="h-full p-3">
      <h3 className="text-xl font-orbitron mb-4 holographic-text">Intel Files</h3>
      <ul className="space-y-1">
        {categories.map(cat => (
          <li key={cat}>
            <HolographicButton 
              variant="ghost" 
              className="w-full justify-start text-left !bg-transparent hover:!bg-primary/10"
              onClick={() => handleCategorySelect(cat)}
            >
              {cat}
            </HolographicButton>
          </li>
        ))}
      </ul>
    </ScrollArea>
  );
};
const SettingsView = () => (
  <ScrollArea className="h-full p-3">
    <h3 className="text-xl font-orbitron mb-4 holographic-text">Settings</h3>
    <ul className="space-y-1 text-sm">
      <li>Notifications (Placeholder)</li>
      <li>Sound (Placeholder)</li>
      <li>Language (Placeholder)</li>
      <li>Delete History (Placeholder)</li>
    </ul>
  </ScrollArea>
);

type PadScreenView = 'dossier' | 'intel' | 'settings';

export function AgentSection({ parallaxOffset }: SectionProps) {
  const { playerSpyName, faction, playerStats, addMessage } = useAppContext();
  const [isPadUp, setIsPadUp] = useState(false); // PAD position
  const [padScreenView, setPadScreenView] = useState<PadScreenView>('dossier');
  const [transferWindowActive, setTransferWindowActive] = useState(false);
  const [transferTimer, setTransferTimer] = useState(0); // Time in seconds

  const padRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);
  const padStartY = useRef<number | null>(null);


  // Transfer Window Timer Logic (1 hour open, 3 hours closed = 4 hour cycle)
  useEffect(() => {
    const cycleDuration = 4 * 60 * 60; // 4 hours in seconds
    const openDuration = 1 * 60 * 60;   // 1 hour in seconds

    const updateTimer = () => {
      const now = Math.floor(Date.now() / 1000); // Current time in seconds
      const cycleProgress = now % cycleDuration;

      if (cycleProgress < openDuration) { // Window is open
        setTransferWindowActive(true);
        setTransferTimer(openDuration - cycleProgress);
      } else { // Window is closed
        setTransferWindowActive(false);
        setTransferTimer(cycleDuration - cycleProgress);
      }
    };
    updateTimer(); // Initial call
    const interval = setInterval(updateTimer, 1000); // Update every second
    return () => clearInterval(interval);
  }, []);

  const currentLevelXp = XP_LEVELS[playerStats.level] || 0; // Fallback for level 0
  const nextLevelXp = XP_LEVELS[playerStats.level + 1] || XP_LEVELS[playerStats.level] + (XP_LEVELS[1]-XP_LEVELS[0]); // Handle max level or provide a sensible next step
  
  const xpForCurrentLevel = playerStats.xp - currentLevelXp;
  const xpToNextLevel = nextLevelXp - currentLevelXp;
  
  const xpProgress = xpToNextLevel > 0 ? Math.max(0, Math.min(100, (xpForCurrentLevel / xpToNextLevel) * 100)) : 100;


  const handlePowerClick = () => {
    setIsPadUp(!isPadUp);
  };
  
  // Basic PAD dragging (simplified)
  // A more robust solution would use a library or more detailed event handling
  const handlePadDragStart = (e: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>) => {
    dragStartY.current = 'touches' in e ? e.touches[0].clientY : e.clientY;
    if (padRef.current) {
      padStartY.current = padRef.current.getBoundingClientRect().top;
    }
    document.body.style.overflow = 'hidden'; // Prevent page scroll while dragging
  };

  const handlePadDragMove = (e: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>) => {
    if (dragStartY.current === null || padStartY.current === null || !padRef.current) return;
    const currentY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const deltaY = currentY - dragStartY.current;
    // Basic movement, needs constraints and snapping
    // This is a placeholder for more complex drag logic
    // For now, just toggle on significant drag
    if (Math.abs(deltaY) > 50) { // Arbitrary threshold for swipe
        setIsPadUp(deltaY < 0); // Swipe up opens PAD
        dragStartY.current = null; // Reset drag
    }
  };

  const handlePadDragEnd = () => {
    dragStartY.current = null;
    padStartY.current = null;
    document.body.style.overflow = '';
  };

  // Gloss effect - can be a simple CSS animation or a more complex JS one
  // For now, a placeholder class name that would be defined in globals.css
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
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center -z-10">
        <Fingerprint className="w-48 h-48 md:w-64 md:h-64 text-primary/10 opacity-50" />
      </div>
      <div className="flex-grow flex flex-col items-center text-center pt-4 md:pt-8 mb-auto">
        <h1 className="text-3xl md:text-4xl font-orbitron holographic-text">{playerSpyName || "Agent"}</h1>
        <p className={`text-lg font-semibold ${faction === 'Cyphers' ? 'text-blue-400' : faction === 'Shadows' ? 'text-red-400' : 'text-gray-400'}`}>{faction}</p>
        <div className="mt-2 w-full max-w-md">
          <p className="text-sm text-muted-foreground">Agent Rank: {playerStats.level}</p>
          <Progress value={xpProgress} className="w-full h-2 mt-1 bg-primary/20 [&>div]:bg-primary" />
          <p className="text-xs text-muted-foreground">{playerStats.xp} / {nextLevelXp === Infinity ? 'MAX' : nextLevelXp} XP</p>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3 text-sm w-full max-w-md">
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
          <p className={`text-sm font-semibold ${transferWindowActive ? 'text-red-400 animate-pulse' : 'text-green-400'}`}>
            {transferWindowActive ? 'Transfer Window Ends:' : 'Next Transfer Window:'}
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
          "absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm transition-all duration-300 ease-out mx-auto w-full max-w-2xl",
          "border-t border-primary/30", // Subtle top border
          padGlossClass, // For gloss effect
          isPadUp ? "h-[75%]" : "h-[100px]", // Height change
          "rounded-t-lg" // Rounded top corners
        )}
        style={{
           // Basic transform for up/down, can be improved with draggable library
          transform: isPadUp ? 'translateY(0)' : `translateY(calc(100% - 100px - env(safe-area-inset-bottom, 0px)))`,
        }}
        onTouchStart={handlePadDragStart}
        onTouchMove={handlePadDragMove}
        onTouchEnd={handlePadDragEnd}
        onMouseDown={handlePadDragStart} // For desktop debugging
        onMouseMove={handlePadDragMove}
        onMouseUp={handlePadDragEnd}
        onMouseLeave={handlePadDragEnd} // If mouse leaves while pressed
      >
        {/* PAD Button Panel */}
        <div className="h-[60px] flex items-center justify-between px-4 border-b border-primary/20">
          {isPadUp ? (
            <div className="flex-grow flex justify-center gap-4">
              <HolographicButton variant="ghost" size="icon" onClick={() => setPadScreenView('dossier')} className={cn(padScreenView === 'dossier' && "bg-primary/20")}>
                <Info className="w-6 h-6" />
              </HolographicButton>
              <HolographicButton variant="ghost" size="icon" onClick={() => setPadScreenView('intel')} className={cn(padScreenView === 'intel' && "bg-primary/20")}>
                <BookOpen className="w-6 h-6" />
              </HolographicButton>
              <HolographicButton variant="ghost" size="icon" onClick={() => setPadScreenView('settings')} className={cn(padScreenView === 'settings' && "bg-primary/20")}>
                <Settings className="w-6 h-6" />
              </HolographicButton>
            </div>
          ) : (
            <div className="flex-grow text-center">
              <p className="font-orbitron text-lg holographic-text">{faction === 'Cyphers' ? "Cypher PAD" : "Shadow PAD"}</p>
              <p className="text-xs text-muted-foreground">Personal Assistant Device</p>
            </div>
          )}
          <HolographicButton variant="ghost" size="icon" onClick={handlePowerClick} className="ml-auto">
            <Power className={cn("w-6 h-6", isPadUp ? "text-green-400" : "text-red-400")} />
          </HolographicButton>
        </div>

        {/* PAD Screen Area */}
        {isPadUp && (
           <div className="h-[calc(100%-60px)] bg-background/90 border border-primary/20 rounded-md m-2 overflow-hidden">
             {renderPadScreen()}
           </div>
        )}
      </div>
    </div>
  );
}
