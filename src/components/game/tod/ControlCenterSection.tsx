
"use client";

import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { HolographicPanel, HolographicButton } from '@/components/game/shared/HolographicPanel';
import { MessageFeed } from '@/components/game/shared/MessageFeed';
import { Zap, Fingerprint, ShieldAlert, Info, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface SectionProps {
  parallaxOffset: number;
}

interface CircularTimerProps {
  id: string;
  title: string;
  duration: number; // in seconds
  currentTime: number; // in seconds
  onTimeUp?: () => void;
  onClick?: () => void;
  icon?: React.ReactNode;
  rate?: string; // e.g., ELINT/hr
  statusText?: string; // e.g., "CHECK IN" or "ACTIVE"
  warningThresholds?: { mild: number; strong: number }; // seconds remaining for color change
  isPulsing?: boolean;
  errorState?: boolean; // For Transfer Window flashing "ERROR"
}

const CircularTimer: React.FC<CircularTimerProps> = ({
  id, title, duration, currentTime, onClick, icon, rate, statusText, warningThresholds, isPulsing, errorState
}) => {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const size = Math.max(80, 150 - (progress * 0.5)); // Dynamic size: gets larger as time runs out

  let borderColorClass = 'border-primary';
  let textColorClass = 'text-primary';
  if (errorState) {
    borderColorClass = 'border-destructive animate-pulse';
    textColorClass = 'text-destructive animate-pulse';
  } else if (warningThresholds) {
    if (currentTime <= warningThresholds.strong) {
      borderColorClass = 'border-destructive';
      textColorClass = 'text-destructive';
    } else if (currentTime <= warningThresholds.mild) {
      borderColorClass = 'border-yellow-400';
      textColorClass = 'text-yellow-400';
    }
  }


  return (
    <div 
      className={cn(
        "relative flex flex-col items-center justify-center rounded-full holographic-panel cursor-pointer transition-all duration-300 ease-out",
        borderColorClass
      )}
      style={{ width: `${size}px`, height: `${size}px` }}
      onClick={onClick}
    >
      {/* Background Icon */}
      {icon && <div className={cn("absolute inset-0 flex items-center justify-center opacity-20 -z-10", isPulsing && "animate-pulse")}>{React.cloneElement(icon as React.ReactElement, { className: "w-1/2 h-1/2"})}</div>}

      {/* Outer progress ring */}
      <svg className="absolute inset-0" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)'}}>
        <circle
          className="text-transparent"
          strokeWidth="2"
          stroke="currentColor"
          fill="transparent"
          r="15.9155"
          cx="18"
          cy="18"
          opacity="0.3"
        />
        <circle
          className={cn("transition-all duration-500", textColorClass)}
          strokeWidth="2"
          strokeDasharray={`${progress}, 100`}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r="15.9155"
          cx="18"
          cy="18"
        />
      </svg>
      
      {/* Timer Content */}
      <div className="text-center z-10">
        {errorState ? (
          <p className="font-digital7 text-lg md:text-xl text-destructive animate-ping">ERROR</p>
        ) : statusText ? (
          <p className={cn("font-orbitron text-sm md:text-base", textColorClass)}>{statusText}</p>
        ) : (
          <p className={cn("font-digital7 text-lg md:text-xl", textColorClass)}>
            {new Date(currentTime * 1000).toISOString().substr(11, 8)}
          </p>
        )}
        {rate && <p className="text-xs text-muted-foreground">{rate}</p>}
      </div>
      <p className="absolute bottom-1 text-[8px] md:text-[10px] text-center text-muted-foreground w-full px-1 truncate">{title}</p>
    </div>
  );
};


export function ControlCenterSection({ parallaxOffset }: SectionProps) {
  const { 
    addMessage, 
    openTODWindow, 
    playerStats, 
    dailyTeamCode,
    faction 
  } = useAppContext();
  const { toast } = useToast();

  // Timers State - These would ideally come from context or backend
  const [networkTapTime, setNetworkTapTime] = useState(0); // 0 = inactive
  const [networkTapRate, setNetworkTapRate] = useState(0);
  const [checkInTime, setCheckInTime] = useState(0); // 0 = ready
  const [transferWindowTime, setTransferWindowTime] = useState(0);
  const [isTransferWindowOpen, setIsTransferWindowOpen] = useState(false);
  const [isVaultRaidedError, setIsVaultRaidedError] = useState(false); // Placeholder
  const [weeklyCycleTime, setWeeklyCycleTime] = useState(7 * 24 * 60 * 60); // 7 days

  const [activeCommsTab, setActiveCommsTab] = useState<'All' | 'HQ' | 'Alerts' | 'System'>('All');

  // --- Timer Logic (Simplified for now) ---
  useEffect(() => { // Network Tap placeholder
    // Simulate tap active for 1 hour then deactivates
    if (networkTapTime > 0) {
      const timer = setInterval(() => setNetworkTapTime(prev => Math.max(0, prev - 1)), 1000);
      return () => clearInterval(timer);
    } else {
      setNetworkTapRate(0);
    }
  }, [networkTapTime]);

  useEffect(() => { // Check-in placeholder (6 hour cooldown)
    if (checkInTime > 0) {
      const timer = setInterval(() => setCheckInTime(prev => Math.max(0, prev - 1)), 1000);
      return () => clearInterval(timer);
    }
  }, [checkInTime]);

  useEffect(() => { // Transfer Window placeholder (1h open, 3h closed)
    const cycleDuration = 4 * 60 * 60;
    const openDuration = 1 * 60 * 60;
    const updateTransferTimer = () => {
      const nowSeconds = Math.floor(Date.now() / 1000);
      const cycleProgress = nowSeconds % cycleDuration;
      if (cycleProgress < openDuration) {
        setIsTransferWindowOpen(true);
        setTransferWindowTime(openDuration - cycleProgress);
      } else {
        setIsTransferWindowOpen(false);
        setTransferWindowTime(cycleDuration - cycleProgress);
      }
    };
    updateTransferTimer();
    const interval = setInterval(updateTransferTimer, 1000);
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => { // Weekly Cycle placeholder
    const timer = setInterval(() => setWeeklyCycleTime(prev => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(timer);
  }, []);


  // --- Interactions ---
  const handleNetworkTapClick = () => {
    if (networkTapTime > 0) {
      openTODWindow("Network Tap Status", 
        <div>
          <p>Time Remaining: {new Date(networkTapTime * 1000).toISOString().substr(11, 8)}</p>
          <p>Current Rate: {networkTapRate} ELINT/hr</p>
        </div>
      );
    } else {
      openTODWindow("Activate Network Tap", 
        <div>
          <p>Placeholder for Network Tap activation interface.</p>
          <HolographicButton onClick={() => { setNetworkTapTime(3600); setNetworkTapRate(10 + (playerStats.level * 5)); addMessage({type:'system', text:'Network Tap Activated!'}); }}>Activate Tap</HolographicButton>
        </div>
      );
    }
  };

  const handleCheckInClick = () => {
    if (checkInTime > 0) {
       openTODWindow("Check-In Status", 
        <div>
          <p>Next Check-In: {new Date(checkInTime * 1000).toISOString().substr(11, 8)}</p>
          <HolographicButton 
            variant="ghost" 
            size="icon" 
            className="absolute top-2 right-2"
            onClick={() => openTODWindow("Intel Files: Check-In Protocol", <p>Check-In Protocol details...</p>)}
          >
            <Info className="w-4 h-4" />
          </HolographicButton>
        </div>
      );
    } else {
      openTODWindow("Agent Check-In", 
        <div>
          <p>Placeholder for Check-In process.</p>
          <HolographicButton onClick={() => { setCheckInTime(6 * 3600); addMessage({type:'hq', text:'Check-In Successful. Reward granted.'}); }}>Complete Check-In</HolographicButton>
          <HolographicButton 
            variant="ghost" 
            size="icon" 
            className="absolute top-2 right-2"
            onClick={() => openTODWindow("Intel Files: Check-In Protocol", <p>Check-In Protocol details...</p>)}
          >
            <Info className="w-4 h-4" />
          </HolographicButton>
        </div>
      );
    }
  };

  const handleTransferWindowClick = () => {
    if (isTransferWindowOpen) {
      openTODWindow("Transfer Minigame (Host)", <p>Placeholder for Transfer Minigame interface.</p>);
    } else {
      openTODWindow("Transfer Window Closed", 
        <div>
          <p>Next Transfer Window Opens In: {new Date(transferWindowTime * 1000).toISOString().substr(11, 8)}</p>
          <HolographicButton 
            variant="ghost" 
            size="icon" 
            className="absolute top-2 right-2"
            onClick={() => openTODWindow("Intel Files: Transferring ELINT", <p>Details about transferring ELINT to HQ...</p>)}
          >
            <Info className="w-4 h-4" />
          </HolographicButton>
        </div>
      );
    }
  };
  
  const handleWeeklyCycleClick = () => {
    openTODWindow("Weekly Cycle Status", 
      <div>
        <p>Current Cycle Ends In: {new Date(weeklyCycleTime * 1000).toISOString().substr(8, 2).replace(/^0+/, '')}d {new Date(weeklyCycleTime * 1000).toISOString().substr(11, 8)}</p>
        <HolographicButton 
          variant="ghost" 
          size="icon" 
          className="absolute top-2 right-2"
          onClick={() => openTODWindow("Intel Files: Weekly Cycle", <p>Details about the weekly game cycle...</p>)}
        >
          <Info className="w-4 h-4" />
        </HolographicButton>
      </div>
    );
  };

  const handleCodeCopy = () => {
    navigator.clipboard.writeText(dailyTeamCode[faction] || dailyTeamCode['Observer'])
      .then(() => {
        toast({ title: "Success", description: "Daily Team Code copied to clipboard!" });
      })
      .catch(err => {
        toast({ variant: "destructive", title: "Error", description: "Failed to copy code." });
        console.error('Failed to copy: ', err);
      });
  };

  const displayedFactionCode = dailyTeamCode[faction] || dailyTeamCode['Observer'];


  return (
    <div className="flex flex-col p-4 md:p-6 h-full overflow-hidden space-y-4">
      {/* Timer Container */}
      <HolographicPanel className="h-1/3 flex items-center justify-around p-2">
        <CircularTimer 
          id="network-tap"
          title="Network Tap"
          duration={3600} // Assuming 1 hour active duration
          currentTime={networkTapTime}
          onClick={handleNetworkTapClick}
          icon={<Zap />}
          rate={`${networkTapRate} E/hr`}
          statusText={networkTapTime <= 0 ? "INACTIVE" : undefined}
          isPulsing={networkTapTime > 0}
          warningThresholds={{ mild: 600, strong: 300 }} // Example thresholds
        />
        <CircularTimer 
          id="check-in"
          title="Daily Check-In"
          duration={6 * 3600} // 6 hour cooldown
          currentTime={checkInTime}
          onClick={handleCheckInClick}
          icon={<Fingerprint />}
          statusText={checkInTime <= 0 ? "CHECK IN" : undefined}
          isPulsing={checkInTime > 0 && checkInTime < 300} // Pulse when about to be ready
           warningThresholds={{ mild: 600, strong: 300 }}
        />
         <CircularTimer 
          id="transfer-window"
          title={isTransferWindowOpen ? "Transfer Window OPEN" : "Transfer Window"}
          duration={isTransferWindowOpen ? 1 * 3600 : 3 * 3600}
          currentTime={transferWindowTime}
          onClick={handleTransferWindowClick}
          icon={<ShieldAlert />} // Placeholder for Bank/Building
          isPulsing={isTransferWindowOpen}
          warningThresholds={{ mild: 1200, strong: 600 }} // 20min, 10min
          errorState={isVaultRaidedError && isTransferWindowOpen}
        />
        <CircularTimer 
          id="weekly-cycle"
          title="Weekly Cycle"
          duration={7 * 24 * 3600}
          currentTime={weeklyCycleTime}
          onClick={handleWeeklyCycleClick}
          icon={<Clock />} // Placeholder for bomb with clock
          isPulsing={weeklyCycleTime < 24 * 3600} // Pulse if <24h left
          warningThresholds={{ mild: 12 * 3600, strong: 6 * 3600 }} // 12h, 6h
        />
      </HolographicPanel>

      {/* Comms Container */}
      <HolographicPanel className="flex-grow flex flex-col min-h-0 bg-black/70 backdrop-blur-sm border-primary/30 rounded-lg">
        <div className="flex-none flex items-center justify-between p-2 border-b border-primary/20">
          <div className="flex space-x-1">
            {(['All', 'HQ', 'Alerts', 'System'] as const).map(tab => (
              <HolographicButton 
                key={tab}
                variant="ghost"
                size="sm"
                className={cn("!text-xs !py-1 !px-2", activeCommsTab === tab && "bg-primary/30 text-accent")}
                onClick={() => setActiveCommsTab(tab)}
              >
                {tab}
              </HolographicButton>
            ))}
          </div>
        </div>
        {/* Pinned Daily Team Code */}
        <div 
            className="p-2 border-b border-primary/20 bg-primary/10 cursor-pointer hover:bg-primary/20"
            onClick={handleCodeCopy}
            title="Click to copy"
          >
            <p className="text-sm font-rajdhani text-center">
              <span className="font-semibold text-primary">Daily Team Code ({faction}): </span> 
              <span className="text-accent font-digital7 tracking-wider">{displayedFactionCode}</span>
            </p>
        </div>
        <div className="flex-grow min-h-0">
          <MessageFeed filter={activeCommsTab !== 'All' ? activeCommsTab.toLowerCase() as any : undefined} />
        </div>
      </HolographicPanel>
    </div>
  );
}

