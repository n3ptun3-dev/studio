
"use client";
import { useState, useEffect, useRef } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { HolographicPanel, HolographicButton } from '@/components/game/shared/HolographicPanel';
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Settings, MessageSquare, User, BookOpen, Briefcase, Zap, Info, Wifi, CheckCircle, Fingerprint } from 'lucide-react';
import { MessageFeed } from '@/components/game/shared/MessageFeed';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface SectionProps {
  parallaxOffset: number;
  // style?: React.CSSProperties; // Removed as it's no longer needed for root transform
}

const XP_LEVELS = [0, 100, 200, 400, 800, 1600, 3200, 6400, 12800]; // XP needed for next level

type InfoAreaView = 'networkTap' | 'comms' | 'settings' | 'agentDossier' | 'intelFiles' | 'equipmentLocker';


// Placeholder components for Info Area views
const NetworkTapInterface = () => {
  const { playerStats, addXp, addMessage } = useAppContext();
  const [isTapActive, setIsTapActive] = useState(false);
  const [tapCountdown, setTapCountdown] = useState(0);
  const [showBoostOption, setShowBoostOption] = useState(false);
  const [elintRate, setElintRate] = useState(0); // ELINT per hour

  useEffect(() => {
    // Calculate ELINT rate based on game logic (e.g. player level, faction size etc)
    setElintRate(10 + (playerStats.level * 5)); // Example formula
  }, [playerStats.level]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isTapActive && tapCountdown > 0) {
      timer = setInterval(() => {
        setTapCountdown(prev => prev - 1);
      }, 1000);
    } else if (tapCountdown === 0 && isTapActive) {
      setIsTapActive(false);
      addMessage({ text: "Network Tap deactivated.", type: 'system' });
    }
    return () => clearInterval(timer);
  }, [isTapActive, tapCountdown, addMessage]);

  const handleActivateTap = (isBoosted: boolean) => {
    // Check vault security (placeholder)
    const isVaultSecure = true; // Replace with actual check
    if (!isVaultSecure) {
      addMessage({text: "Vault not secure! Install at least one lock to activate Network Tap.", type: 'error'});
      return;
    }

    setIsTapActive(true);
    setTapCountdown(3600); // 1 hour
    addXp(25); // XP for activating tap
    const boostedRate = isBoosted ? elintRate * 1.5 : elintRate; // Example boost
    addMessage({ text: `Network Tap activated. Generating ELINT at ${boostedRate.toFixed(0)}/hr.`, type: 'system' });
    setShowBoostOption(false);
    // TODO: Logic for ELINT generation adding to vault
  };

  const handleTapButtonClick = () => {
    if (!isTapActive) {
      setShowBoostOption(true);
    }
  };

  return (
    <HolographicPanel className="h-full flex flex-col p-4">
      <h3 className="text-xl font-orbitron mb-4 holographic-text">Network Tap</h3>
      <div className="flex-grow flex flex-col items-center justify-center">
        {showBoostOption ? (
          <div className="text-center">
            <p className="mb-2 holographic-text">System scan complete. Potential for ELINT multiplier detected.</p>
            <p className="mb-4 text-sm text-muted-foreground">View sponsored feed for max efficiency?</p>
            <div className="flex gap-4 justify-center">
              <HolographicButton onClick={() => handleActivateTap(false)}>Standard Tap</HolographicButton>
              <HolographicButton onClick={() => handleActivateTap(true)} className="border-green-500 text-green-400 hover:bg-green-500">Engage Multiplier</HolographicButton>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Watching ads strengthens faction reserves for cycle payouts.</p>
          </div>
        ) : isTapActive ? (
          <div className="text-center">
            <Wifi className="w-16 h-16 text-green-400 mx-auto mb-2 animate-pulse icon-glow" />
            <p className="text-2xl font-digital7 holographic-text">{new Date(tapCountdown * 1000).toISOString().substr(14, 5)}</p>
            <p className="text-sm text-muted-foreground">Tap Active</p>
          </div>
        ) : (
          <HolographicButton onClick={handleTapButtonClick} className="p-0 w-24 h-24 rounded-full flex items-center justify-center">
            <Zap className="w-12 h-12" />
          </HolographicButton>
        )}
         <div className="mt-auto text-center p-2 border border-dashed border-primary/30 rounded">
            <p className="text-sm text-muted-foreground">Current Rate:</p>
            <p className="text-lg font-digital7 holographic-text">{elintRate.toFixed(0)} ELINT/hr</p>
        </div>
      </div>
      <HolographicButton variant="ghost" size="icon" className="absolute top-2 right-2 p-1" onClick={() => addMessage({text: "Network Tap passively generates ELINT by intercepting network traffic. The current rate is dynamically calculated. ELINT generated is added to your vault.", type: 'lore'})}>
        <Info className="w-4 h-4" />
      </HolographicButton>
    </HolographicPanel>
  );
};

const CommsInterface = () => {
  const { dailyTeamCode, addMessage, addXp } = useAppContext();
  const [checkInCooldown, setCheckInCooldown] = useState(0); // Cooldown in seconds
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkInProgress, setCheckInProgress] = useState(0);
  const checkInDuration = 1500; // 1.5 seconds
  const checkInIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [showReward, setShowReward] = useState(false);

  useEffect(() => {
    // Load cooldown from local storage or set to 0
    const savedCooldownEnd = localStorage.getItem('checkInCooldownEnd');
    if (savedCooldownEnd) {
      const remaining = Math.max(0, (parseInt(savedCooldownEnd, 10) - Date.now()) / 1000);
      setCheckInCooldown(remaining);
    }
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (checkInCooldown > 0) {
      timer = setInterval(() => {
        setCheckInCooldown(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [checkInCooldown]);

  const handleCheckInPress = () => {
    if (checkInCooldown === 0 && !isCheckingIn) {
      setIsCheckingIn(true);
      setCheckInProgress(0);
      if (checkInIntervalRef.current) clearInterval(checkInIntervalRef.current);
      checkInIntervalRef.current = setInterval(() => {
        setCheckInProgress(prev => {
          const next = prev + (100 / (checkInDuration / 50));
          if (next >= 100) {
            clearInterval(checkInIntervalRef.current!);
            handleCheckInSuccess();
            return 100;
          }
          return next;
        });
      }, 50);
    }
  };

  const handleCheckInRelease = () => {
    if (isCheckingIn && checkInProgress < 100) {
      setIsCheckingIn(false);
      setCheckInProgress(0);
      if (checkInIntervalRef.current) clearInterval(checkInIntervalRef.current);
    }
  };
  
  const handleCheckInSuccess = () => {
    setIsCheckingIn(false);
    setCheckInProgress(0);
    addMessage({ text: "Check-In Successful! HQ acknowledges your diligence.", type: 'hq' });
    addXp(100);
    // TODO: Reward single Cypher Lock = player level
    addMessage({ text: "Cypher Lock (Lvl X) added to inventory.", type: 'system' });
    
    const newCooldownEnd = Date.now() + 6 * 60 * 60 * 1000; // 6 hours
    localStorage.setItem('checkInCooldownEnd', newCooldownEnd.toString());
    setCheckInCooldown(6 * 60 * 60);
    setShowReward(true);
  };

  if (showReward) {
    return (
      <HolographicPanel className="h-full flex flex-col items-center justify-center p-4 text-center">
        <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4 icon-glow" />
        <h3 className="text-xl font-orbitron mb-2 holographic-text">HQ COMMUNIQUE</h3>
        <p className="text-muted-foreground mb-1">Agent, your dedication is noted.</p>
        <p className="mb-4">Reward: <span className="text-primary">Cypher Lock (Lvl X)</span> & <span className="text-primary">100XP</span> acquired.</p>
        <img data-ai-hint="lock security" src="https://picsum.photos/seed/cypherlock/100/100" alt="Cypher Lock" className="w-24 h-24 mx-auto rounded-md border border-primary mb-4" />
        <HolographicButton onClick={() => setShowReward(false)}>Confirm</HolographicButton>
      </HolographicPanel>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <HolographicPanel className="p-4 mb-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Check-In Status</p>
            {checkInCooldown > 0 ? (
              <p className="font-digital7 text-2xl text-destructive">{new Date(checkInCooldown * 1000).toISOString().substr(11, 8)}</p>
            ) : (
              <p className="font-orbitron text-2xl text-green-400">READY</p>
            )}
          </div>
          <div 
            className={cn(
              "relative w-20 h-20 rounded-full border-2 flex items-center justify-center cursor-pointer select-none",
              checkInCooldown > 0 ? "border-muted text-muted-foreground" : "border-primary text-primary",
              isCheckingIn && "border-accent text-accent"
            )}
            onMouseDown={handleCheckInPress}
            onTouchStart={handleCheckInPress}
            onMouseUp={handleCheckInRelease}
            onTouchEnd={handleCheckInRelease}
          >
            <Fingerprint className="w-10 h-10" />
             {checkInCooldown > 0 && <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center"><Zap className="w-8 h-8 text-destructive" /></div>}
             {isCheckingIn && (
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 36 36">
                  <path
                    className="text-accent icon-glow"
                    strokeDasharray={`${checkInProgress}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" strokeWidth="2" strokeLinecap="round" transform = "rotate(-90 18 18)"
                  />
                </svg>
             )}
          </div>
        </div>
      </HolographicPanel>
      <div className="flex-grow min-h-0">
         <MessageFeed />
      </div>
    </div>
  );
};
const SettingsInterface = () => <HolographicPanel className="h-full p-4"><h3 className="text-xl font-orbitron holographic-text">Settings (Placeholder)</h3></HolographicPanel>;
const AgentDossierInterface = () => <HolographicPanel className="h-full p-4"><h3 className="text-xl font-orbitron holographic-text">Agent Dossier (Placeholder)</h3></HolographicPanel>;
const IntelFilesInterface = () => <HolographicPanel className="h-full p-4"><h3 className="text-xl font-orbitron holographic-text">Intel Files (Placeholder)</h3></HolographicPanel>;
const EquipmentLockerInterface = () => <HolographicPanel className="h-full p-4"><h3 className="text-xl font-orbitron holographic-text">Equipment Locker (Placeholder)</h3></HolographicPanel>;



export function CommandCenterSection({ parallaxOffset }: SectionProps) {
  const { playerSpyName, faction, playerStats } = useAppContext();
  const [activeInfoView, setActiveInfoView] = useState<InfoAreaView>('networkTap');
  const [transferWindowActive, setTransferWindowActive] = useState(false);
  const [transferTimer, setTransferTimer] = useState(0); // Time in seconds

  useEffect(() => {
    // Transfer Window: 1 hour open, 3 hours closed = 4 hour cycle
    const cycleDuration = 4 * 60 * 60;
    const openDuration = 1 * 60 * 60;

    const updateTimer = () => {
      const now = Math.floor(Date.now() / 1000);
      const cycleProgress = now % cycleDuration;

      if (cycleProgress < openDuration) { // Window is open
        setTransferWindowActive(true);
        setTransferTimer(openDuration - cycleProgress);
      } else { // Window is closed
        setTransferWindowActive(false);
        setTransferTimer(cycleDuration - cycleProgress);
      }
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const currentLevelXp = XP_LEVELS[playerStats.level];
  const nextLevelXp = XP_LEVELS[playerStats.level + 1] || Infinity;
  const xpProgress = nextLevelXp === Infinity ? 100 : Math.max(0, Math.min(100, ((playerStats.xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100));

  const consoleButtons = [
    { id: 'networkTap', label: 'Network Tap', icon: Zap, tapStatus: true }, // Special handling for tap status
    { id: 'comms', label: 'Comms', icon: MessageSquare, newMessages: true }, // Special handling for new messages
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'agentDossier', label: 'Agent Dossier', icon: User },
    { id: 'intelFiles', label: 'Intel Files', icon: BookOpen },
    { id: 'equipmentLocker', label: 'Equipment Locker', icon: Briefcase },
  ] as const;

  const renderInfoArea = () => {
    switch (activeInfoView) {
      case 'networkTap': return <NetworkTapInterface />;
      case 'comms': return <CommsInterface />;
      case 'settings': return <SettingsInterface />;
      case 'agentDossier': return <AgentDossierInterface />;
      case 'intelFiles': return <IntelFilesInterface />;
      case 'equipmentLocker': return <EquipmentLockerInterface />;
      default: return null;
    }
  };


  return (
    <div className="flex flex-col p-4 md:p-6 h-full overflow-hidden">
      <ScrollArea className="flex-grow"> 
        <div className="min-h-full flex flex-col">
          {/* Player Info Header */}
          <HolographicPanel className="mb-4 text-center">
            <h1 className="text-3xl md:text-4xl font-orbitron holographic-text">{playerSpyName || "Agent"}</h1>
            <p className={`text-lg font-semibold ${faction === 'Cyphers' ? 'text-blue-400' : faction === 'Shadows' ? 'text-red-400' : 'text-gray-400'}`}>{faction}</p>
            <div className="mt-2">
              <p className="text-sm text-muted-foreground">Agent Rank: {playerStats.level}</p>
              <Progress value={xpProgress} className="w-full h-2 mt-1 bg-primary/20 [&>div]:bg-primary" />
              <p className="text-xs text-muted-foreground">{playerStats.xp} / {nextLevelXp === Infinity ? 'MAX' : nextLevelXp} XP</p>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
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
                Transfer Window: {transferWindowActive ? 'ACTIVE' : 'OPENS IN'}
              </p>
              <p className="font-digital7 text-xl holographic-text">
                {new Date(transferTimer * 1000).toISOString().substr(11, 8)}
              </p>
              {transferWindowActive && (
                <HolographicButton className="mt-2 w-full md:w-auto border-red-500 text-red-400 hover:bg-red-500">
                  Transfer to HQ
                </HolographicButton>
              )}
            </div>
          </HolographicPanel>

          {/* Button Console */}
          <HolographicPanel className="mb-4 p-2">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {consoleButtons.map(btn => (
                <Button
                  key={btn.id}
                  variant="ghost"
                  className={cn(
                    "flex flex-col items-center justify-center h-20 p-1 aspect-square holographic-button !bg-transparent",
                    activeInfoView === btn.id && (faction === 'Cyphers' ? '!border-blue-300 !shadow-blue-400/50' : '!border-red-300 !shadow-red-400/50'),
                    btn.id === 'networkTap' && "relative", // For tap light
                    btn.id === 'comms' && "relative" // For new message indicator
                  )}
                  onClick={() => setActiveInfoView(btn.id as InfoAreaView)}
                  title={btn.label}
                >
                  <btn.icon className={cn("w-6 h-6 mb-1 icon-glow", activeInfoView === btn.id && "text-accent")} />
                  <span className="text-xs text-center truncate w-full hidden sm:block">{btn.label}</span>
                  {btn.id === 'networkTap' && btn.tapStatus && ( // Placeholder for tap status
                    <div className={cn("network-tap-light absolute top-1 right-1", true ? "green" : "red flashing" )}></div>
                  )}
                   {btn.id === 'comms' && btn.newMessages && ( // Placeholder for new messages
                    <div className="w-2 h-2 bg-green-400 rounded-full absolute top-1 right-1 animate-pulse"></div>
                  )}
                </Button>
              ))}
            </div>
          </HolographicPanel>

          {/* Info Area - takes remaining height */}
          <div className="flex-grow min-h-[300px] md:min-h-[400px]"> {/* Ensure minimum height */}
            {renderInfoArea()}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
