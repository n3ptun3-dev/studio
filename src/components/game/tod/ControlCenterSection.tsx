
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
  currentTime: number; // in seconds, represents time *remaining*
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
  const progress = duration > 0 ? ((duration - currentTime) / duration) * 100 : 0;
  const size = 80 + (progress * 0.7); 

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
    <div className="flex flex-col items-center w-24 md:w-auto"> {/* New parent wrapper */}
      <p className="text-[10px] md:text-xs text-muted-foreground mb-0.5 text-center w-full px-1 truncate h-6 flex items-center justify-center">
        {title}
      </p>
      <div 
        className={cn(
          "relative flex flex-col items-center justify-center rounded-full holographic-panel cursor-pointer transition-all duration-300 ease-out",
          borderColorClass
        )}
        style={{ width: `${size}px`, height: `${size}px` }}
        onClick={onClick}
      >
        {icon && <div className={cn("absolute inset-0 flex items-center justify-center opacity-20 -z-10", isPulsing && "animate-pulse")}>{React.cloneElement(icon as React.ReactElement, { className: "w-1/2 h-1/2"})}</div>}
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
        {/* Content moved out of the circle div below */}
      </div>
      <div className="text-center mt-0.5 h-10 flex flex-col justify-center"> {/* Wrapper for text below circle */}
        {errorState ? (
          <p className="font-digital7 text-lg md:text-xl text-destructive animate-ping">ERROR</p>
        ) : statusText ? (
          <p className={cn("font-orbitron text-sm md:text-base", textColorClass)}>{statusText}</p>
        ) : (
          <p className={cn("font-digital7 text-lg md:text-xl", textColorClass)}>
            {new Date(currentTime * 1000).toISOString().substr(11, 8)}
          </p>
        )}
        {rate && <p className="text-[10px] text-muted-foreground">{rate}</p>}
      </div>
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

  const [networkTapTime, setNetworkTapTime] = useState(0); 
  const [networkTapRate, setNetworkTapRate] = useState(0);
  const [checkInTime, setCheckInTime] = useState(0); 
  const [transferWindowTime, setTransferWindowTime] = useState(0); 
  const [isTransferWindowOpen, setIsTransferWindowOpen] = useState(false);
  const [isVaultRaidedError, setIsVaultRaidedError] = useState(false); 
  const [weeklyCycleTime, setWeeklyCycleTime] = useState(7 * 24 * 60 * 60); 

  const [activeCommsTab, setActiveCommsTab] = useState<'All' | 'HQ' | 'Alerts' | 'System'>('All');

  useEffect(() => { 
    if (networkTapTime > 0) {
      const timer = setInterval(() => setNetworkTapTime(prev => Math.max(0, prev - 1)), 1000);
      return () => clearInterval(timer);
    } else if (networkTapRate > 0) { 
      setNetworkTapRate(0); 
      addMessage({type:'alert', text:'Network Tap depleted. Re-activation required.'});
    }
  }, [networkTapTime, networkTapRate, addMessage]);

  useEffect(() => { 
    if (checkInTime > 0) {
      const timer = setInterval(() => setCheckInTime(prev => Math.max(0, prev - 1)), 1000);
      return () => clearInterval(timer);
    }
  }, [checkInTime]);

  useEffect(() => { 
    const cycleDuration = 4 * 60 * 60; 
    const openDuration = 1 * 60 * 60;  
    
    const updateTransferTimer = () => {
      const nowSeconds = Math.floor(Date.now() / 1000);
      const cycleProgress = nowSeconds % cycleDuration;

      if (cycleProgress < openDuration) { 
        if (!isTransferWindowOpen) setIsTransferWindowOpen(true); 
        setTransferWindowTime(openDuration - cycleProgress);
      } else { 
        if (isTransferWindowOpen) setIsTransferWindowOpen(false); 
        setTransferWindowTime(cycleDuration - cycleProgress);
      }
    };
    updateTransferTimer(); 
    const interval = setInterval(updateTransferTimer, 1000); 
    return () => clearInterval(interval);
  }, [isTransferWindowOpen]); 
  
  useEffect(() => { 
    const timer = setInterval(() => setWeeklyCycleTime(prev => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleNetworkTapClick = () => {
    if (networkTapTime > 0) {
      openTODWindow("Network Tap Status", 
        <div className="font-rajdhani text-center">
          <p>Time Remaining: <span className="font-digital7 text-lg">{new Date(networkTapTime * 1000).toISOString().substr(11, 8)}</span></p>
          <p>Current Rate: <span className="font-digital7 text-lg">{networkTapRate}</span> ELINT/hr</p>
        </div>
      );
    } else {
      openTODWindow("Activate Network Tap", 
        <div className="font-rajdhani text-center space-y-4">
          <p>The Network Tap generates ELINT passively over time. Higher level Taps yield more ELINT.</p>
          <p className="text-muted-foreground text-sm">Activation Cost: 100 ELINT (Placeholder)</p>
          <HolographicButton onClick={() => { 
            setNetworkTapTime(3600); 
            setNetworkTapRate(10 + (playerStats.level * 2)); 
            addMessage({type:'system', text:'Network Tap Activated! Generating ELINT.'}); 
          }}>Activate Lvl 1 Tap</HolographicButton>
        </div>
      );
    }
  };

  const handleCheckInClick = () => {
    if (checkInTime > 0) {
       openTODWindow("Check-In Cooldown", 
        <div className="font-rajdhani text-center">
          <p>Next Check-In Available In:</p>
          <p className="font-digital7 text-2xl my-2">{new Date(checkInTime * 1000).toISOString().substr(11, 8)}</p>
          <HolographicButton 
            variant="ghost" 
            size="sm" 
            className="absolute top-2 right-2 !p-1"
            onClick={() => openTODWindow("Intel: Check-In Protocol", <p className="font-rajdhani">Regular agent check-ins are rewarded with ELINT and potential operational bonuses. Maintain consistent contact with HQ.</p>)}
          >
            <Info className="w-4 h-4" />
          </HolographicButton>
        </div>
      );
    } else {
      openTODWindow("Agent Check-In", 
        <div className="font-rajdhani text-center space-y-4">
          <p>Welcome back, Agent. Your continued dedication is noted.</p>
          <p className="text-green-400 font-semibold">Reward: 50 ELINT + XP Boost (Placeholder)</p>
          <HolographicButton onClick={() => { 
            setCheckInTime(6 * 3600); 
            addMessage({type:'hq', text:'Check-In Successful. Reward credited to your account.'}); 
          }}>Complete Check-In</HolographicButton>
           <HolographicButton 
            variant="ghost" 
            size="sm" 
            className="absolute top-2 right-2 !p-1"
            onClick={() => openTODWindow("Intel: Check-In Protocol", <p className="font-rajdhani">Regular agent check-ins are rewarded with ELINT and potential operational bonuses. Maintain consistent contact with HQ.</p>)}
          >
            <Info className="w-4 h-4" />
          </HolographicButton>
        </div>
      );
    }
  };

  const handleTransferWindowClick = () => {
    if (isTransferWindowOpen) {
      openTODWindow("Transfer ELINT to HQ (Host)", <p className="font-rajdhani text-center">Placeholder for ELINT Transfer Minigame interface. Securely move your ELINT reserves to the faction vault.</p>);
    } else {
      openTODWindow("Transfer Window Closed", 
        <div className="font-rajdhani text-center">
          <p>Next Transfer Window Opens In:</p>
          <p className="font-digital7 text-2xl my-2">{new Date(transferWindowTime * 1000).toISOString().substr(11, 8)}</p>
          <HolographicButton 
            variant="ghost" 
            size="sm" 
            className="absolute top-2 right-2 !p-1"
            onClick={() => openTODWindow("Intel: Transferring ELINT", <p className="font-rajdhani">During active Transfer Windows, agents can securely move their acquired ELINT to their faction's central vault, contributing to the war effort and earning faction loyalty.</p>)}
          >
            <Info className="w-4 h-4" />
          </HolographicButton>
        </div>
      );
    }
  };
  
  const handleWeeklyCycleClick = () => {
    const days = Math.floor(weeklyCycleTime / (24 * 3600));
    const hours = Math.floor((weeklyCycleTime % (24*3600)) / 3600);
    const minutes = Math.floor((weeklyCycleTime % 3600) / 60);
    const seconds = weeklyCycleTime % 60;

    openTODWindow("Weekly Cycle Status", 
      <div className="font-rajdhani text-center">
        <p>Current Cycle Ends In:</p>
        <p className="font-digital7 text-2xl my-2">
          {days > 0 ? `${days}d ` : ""}
          {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </p>
        <HolographicButton 
            variant="ghost" 
            size="sm" 
            className="absolute top-2 right-2 !p-1"
            onClick={() => openTODWindow("Intel: Weekly Cycle", <p className="font-rajdhani">Elint Heist operates in weekly cycles. At the end of each cycle, faction scores are tallied, and rewards are distributed based on performance and contributions.</p>)}
          >
            <Info className="w-4 h-4" />
          </HolographicButton>
      </div>
    );
  };

  const handleCodeCopy = () => {
    if (typeof window !== "undefined" && navigator.clipboard) {
        const codeToCopy = dailyTeamCode[faction] || dailyTeamCode['Observer'];
        navigator.clipboard.writeText(codeToCopy)
        .then(() => {
            toast({ title: "Success", description: "Daily Team Code copied to clipboard!" });
        })
        .catch(err => {
            toast({ variant: "destructive", title: "Error", description: "Failed to copy code." });
            console.error('Failed to copy: ', err);
        });
    } else {
        toast({ variant: "destructive", title: "Error", description: "Clipboard not available."});
    }
  };

  const displayedFactionCode = dailyTeamCode[faction] || dailyTeamCode['Observer'];

  return (
    <div className="flex flex-col p-4 md:p-6 h-full overflow-hidden space-y-4">
      <HolographicPanel className="h-1/3 flex items-center justify-around p-2">
        <CircularTimer 
          id="network-tap"
          title="Network Tap"
          duration={3600} 
          currentTime={networkTapTime}
          onClick={handleNetworkTapClick}
          icon={<Zap className="w-full h-full" />}
          rate={`${networkTapRate} E/hr`}
          statusText={networkTapTime <= 0 ? "INACTIVE" : undefined}
          isPulsing={networkTapTime > 0 && networkTapTime <= 600} 
          warningThresholds={{ mild: 600, strong: 300 }} 
        />
        <CircularTimer 
          id="check-in"
          title="Check-In"
          duration={6 * 3600} 
          currentTime={checkInTime}
          onClick={handleCheckInClick}
          icon={<Fingerprint className="w-full h-full" />}
          statusText={checkInTime <= 0 ? "CHECK IN" : undefined}
          isPulsing={checkInTime > 0 && checkInTime < 300} 
           warningThresholds={{ mild: 600, strong: 300 }}
        />
         <CircularTimer 
          id="transfer-window"
          title={isTransferWindowOpen ? "Transfer Window OPEN" : "Transfer Window"}
          duration={isTransferWindowOpen ? (1 * 60 * 60) : (3 * 60 * 60)} 
          currentTime={transferWindowTime}
          onClick={handleTransferWindowClick}
          icon={<ShieldAlert className="w-full h-full"/>} 
          isPulsing={isTransferWindowOpen}
          warningThresholds={{ mild: 1200, strong: 600 }} 
          errorState={isVaultRaidedError && isTransferWindowOpen} 
        />
        <CircularTimer 
          id="weekly-cycle"
          title="Weekly Cycle"
          duration={7 * 24 * 3600} 
          currentTime={weeklyCycleTime}
          onClick={handleWeeklyCycleClick}
          icon={<Clock className="w-full h-full"/>} 
          isPulsing={weeklyCycleTime < 24 * 3600} 
          warningThresholds={{ mild: 12 * 3600, strong: 6 * 3600 }} 
        />
      </HolographicPanel>

      <HolographicPanel className="flex-grow flex flex-col min-h-0 bg-black/70 backdrop-blur-sm border-primary/30 rounded-lg">
        <div className="flex-none flex items-center justify-between p-2 border-b border-primary/20">
          <div className="flex space-x-1">
            {(['All', 'HQ', 'Alerts', 'System'] as const).map(tab => (
              <HolographicButton 
                key={tab}
                size="sm"
                className={cn("!text-xs !py-1 !px-2", activeCommsTab === tab ? "active-pad-button" : "hover:bg-primary/10")}
                onClick={() => setActiveCommsTab(tab)}
              >
                {tab}
              </HolographicButton>
            ))}
          </div>
        </div>
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
          <MessageFeed filter={activeCommsTab !== 'All' ? activeCommsTab.toLowerCase() as 'hq' | 'alerts' | 'system' : undefined} />
        </div>
      </HolographicPanel>
    </div>
  );
}

    