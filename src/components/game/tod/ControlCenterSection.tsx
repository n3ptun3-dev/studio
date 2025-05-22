"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { HolographicButton } from '@/components/game/shared/HolographicPanel';
import { MessageFeed } from '@/components/game/shared/MessageFeed';
import { Zap, Fingerprint, ShieldAlert, Info, Clock, AlertTriangle, CheckSquare, Activity, Timer as TimerIcon, Copy, Lock, LockOpen, Trophy, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import CircularTimer from '@/components/game/shared/CircularTimer'; // Make sure this path is correct

// Interface for SimpleIconTimer (if you still use it elsewhere, keep it)
// For this refactor, we are focusing on CircularTimer, so SimpleIconTimer definition is removed from here
// unless it's specifically needed in this file. If it was just for reference, it's okay to remove.

type SectionProps = {
  parallaxOffset: number;
};

const SELECTABLE_COMMS_TABS = ['All', 'HQ', 'Alerts', 'System'] as const;
type SelectableCommsTab = typeof SELECTABLE_COMMS_TABS[number];


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

  const [activeCommsTab, setActiveCommsTab] = useState<SelectableCommsTab>('All');
  
  // Effects for timers (no changes here from your original code)
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

  // Click Handlers (no changes here from your original code)
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
          <HolographicButton onClick={() => { 
            setNetworkTapTime(3600); 
            setNetworkTapRate(10 + (playerStats.level * 2)); 
            addMessage({type:'system', text:'Network Tap Activated! Generating ELINT.'}); 
            if(openTODWindow) openTODWindow("", <></>, {showCloseButton:true}); 
            setTimeout(() => openTODWindow("", <></>, {showCloseButton:true}),0) 
          }}>Activate Now</HolographicButton>
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
            variant="ghost" size="sm" className="absolute top-2 right-2 !p-1"
            onClick={() => openTODWindow("Intel: Check-In Protocol", <p className="font-rajdhani">Regular agent check-ins are rewarded with ELINT and potential operational bonuses. Maintain consistent contact with HQ.</p>)}
          ><Info className="w-4 h-4" /></HolographicButton>
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
            if(openTODWindow) openTODWindow("", <></>, {showCloseButton:true}); 
            setTimeout(() => openTODWindow("", <></>, {showCloseButton:true}),0)
          }}>Complete Check-In</HolographicButton>
           <HolographicButton 
            variant="ghost" size="sm" className="absolute top-2 right-2 !p-1"
            onClick={() => openTODWindow("Intel: Check-In Protocol", <p className="font-rajdhani">Regular agent check-ins are rewarded with ELINT and potential operational bonuses. Maintain consistent contact with HQ.</p>)}
          ><Info className="w-4 h-4" /></HolographicButton>
        </div>
      );
    }
  };

  const handleTransferWindowClick = () => {
    if (isVaultRaidedError && isTransferWindowOpen) {
        openTODWindow("Transfer System Alert", 
        <div className="font-rajdhani text-center space-y-3">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto animate-pulse" />
            <p className="text-lg font-semibold text-destructive">VAULT BREACH DETECTED!</p>
            <p>ELINT transfer systems are currently compromised due to hostile activity.</p>
            <p className="text-muted-foreground">Secure your vault before attempting ELINT transfers.</p>
        </div>);
        return;
    }
    if (isTransferWindowOpen) {
      openTODWindow("Transfer ELINT to HQ (Host)", <p className="font-rajdhani text-center">Placeholder for ELINT Transfer Minigame interface. Securely move your ELINT reserves to the faction vault.</p>);
    } else {
      openTODWindow("Transfer Window Closed", 
        <div className="font-rajdhani text-center">
          <p>Next Transfer Window Opens In:</p>
          <p className="font-digital7 text-2xl my-2">{new Date(transferWindowTime * 1000).toISOString().substr(11, 8)}</p>
          <HolographicButton 
            variant="ghost" size="sm" className="absolute top-2 right-2 !p-1"
            onClick={() => openTODWindow("Intel: Transferring ELINT", <p className="font-rajdhani">During active Transfer Windows, agents can securely move their acquired ELINT to their faction's central vault, contributing to the war effort and earning faction loyalty.</p>)}
          ><Info className="w-4 h-4" /></HolographicButton>
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
            variant="ghost" size="sm" className="absolute top-2 right-2 !p-1"
            onClick={() => openTODWindow("Intel: Weekly Cycle", <p className="font-rajdhani">Elint Heist operates in weekly cycles. At the end of each cycle, faction scores are tallied, and rewards are distributed based on performance and contributions.</p>)}
          ><Info className="w-4 h-4" /></HolographicButton>
      </div>
    );
  };

  const handleCodeCopy = () => { // No changes
    if (typeof window !== "undefined" && navigator.clipboard) {
        const codeToCopy = dailyTeamCode[faction] || dailyTeamCode['Observer'];
        navigator.clipboard.writeText(codeToCopy)
        .then(() => toast({ title: "Success", description: "Daily Team Code copied to clipboard!" }))
        .catch(err => {
            toast({ variant: "destructive", title: "Error", description: "Failed to copy code." });
            console.error('Failed to copy: ', err);
        });
    } else {
        toast({ variant: "destructive", title: "Error", description: "Clipboard not available."});
    }
  };

  const displayedFactionCode = dailyTeamCode[faction] || dailyTeamCode['Observer'];

  // --- NEW: Timer Configuration and Weight Calculation ---
  const timersConfig = useMemo(() => {
    // Define warning thresholds (seconds remaining)
    const networkTapWarningStrong = 300; // 5 mins
    const networkTapWarningMild = 600;   // 10 mins
  
    const checkInWarningStrong = 300;    // 5 mins (before cooldown ends, if we were to show it that way)
                                       // Or, for a "soon to be ready" warning on the ready state.
                                       // For check-in, warnings usually apply to the COOLDOWN.
                                       // The "ready" state is green.
    const checkInWarningMild = 600;
  
    // Transfer window thresholds apply differently if open (time until close) or closed (time until open)
    // These are examples for when it's OPEN and counting down to close
    const transferOpenWarningStrong = 5 * 60; // 5 mins before closing
    const transferOpenWarningMild = 10 * 60;  // 10 mins before closing
  
    // These are examples for when it's CLOSED and counting down to open
    // const transferClosedWarningStrong = 10 * 60; // 10 mins before opening
    // const transferClosedWarningMild = 20 * 60;   // 20 mins before opening
    // For simplicity, we might not show warnings for "time until open" for the closed lock,
    // keeping it neutral grey. If warnings are desired, these constants would be used.
  
    const weeklyCycleWarningStrong = 6 * 3600;  // 6 hours
    const weeklyCycleWarningMild = 12 * 3600; // 12 hours
  
    return [
      // 1. NETWORK TAP
      {
        id: "network-tap",
        title: "Network Tap",
        duration: 3600, // 1 hour
        currentTime: networkTapTime,
        onClick: handleNetworkTapClick,
        icon: <Zap />,
        rate: `${networkTapRate} E/hr`,
        statusText: networkTapTime <= 0 ? "INACTIVE" : undefined,
        
        isPulsing: true, // Per requirement: "network tap icon must always pulsate"
        errorState: false, // Network tap doesn't have a specific error state in this setup
  
        // Icon color override logic:
        // - Red if inactive (networkTapTime <= 0)
        // - Green if active AND time remaining > mild warning threshold
        // - Null (use default warning color) if active AND in warning
        iconColorOverride: networkTapTime <= 0 
          ? "text-destructive" 
          : (networkTapTime > networkTapWarningMild ? "text-green-400" : null),
  
        // Border/Progress ring colors:
        isReady: networkTapTime <= 0, // "Inactive" state treated as "ready" for coloring purposes
        readyTextColor: "text-destructive", // Makes border/progress red when inactive
        readyBorderColor: "border-destructive",
        warningThresholds: { mild: networkTapWarningMild, strong: networkTapWarningStrong },
        // If active and not warning, border/progress will be 'primary' (blue)
      },
  
      // 2. AGENT CHECK-IN
      {
        id: "check-in",
        title: "Agent Check-In",
        duration: 6 * 3600, // 6 hours cooldown
        currentTime: checkInTime,
        onClick: handleCheckInClick,
        icon: <Fingerprint />,
        statusText: checkInTime <= 0 ? "CHECK IN" : undefined,
  
        // Per requirement: "check-in pulsates when inactive and no pulsating when active"
        // "Inactive" means ready to check-in (checkInTime <= 0)
        isPulsing: checkInTime <= 0, 
        errorState: false,
  
        isReady: checkInTime <= 0, // True when ready to check-in
        readyTextColor: "text-green-400", // Green when ready
        readyBorderColor: "border-green-400",
        iconColorOverride: null, // Let readyTextColor handle the green icon
  
        // Warnings apply to the cooldown period (checkInTime > 0)
        warningThresholds: checkInTime > 0 ? { mild: checkInWarningMild, strong: checkInWarningStrong } : undefined,
        // If in cooldown and not warning, border/progress is primary. Icon not pulsing.
      },
  
      // 3. TRANSFER WINDOW
      {
        id: "transfer-window",
        title: isTransferWindowOpen ? "Transfer OPEN" : "Transfer Window",
        duration: isTransferWindowOpen ? (1 * 60 * 60) : (3 * 60 * 60), // 1hr open, 3hr cooldown
        currentTime: transferWindowTime,
        onClick: handleTransferWindowClick,
        icon: isTransferWindowOpen ? <LockOpen /> : <Lock />, // Dynamic icon
  
        // Per requirement: Pulsates when open. Not when closed.
        isPulsing: isTransferWindowOpen,
        errorState: isVaultRaidedError && isTransferWindowOpen,
  
        // Color logic depends on whether it's open or closed
        isReady: isTransferWindowOpen 
          ? !errorState && transferWindowTime > transferOpenWarningMild // Open, no error, not in warning = green
          : true, // For closed state, use isReady to apply neutral colors
  
        readyTextColor: isTransferWindowOpen ? "text-green-400" : "text-neutral-400", // Green if open&ready, neutral for progress if closed
        readyBorderColor: isTransferWindowOpen ? "border-green-400" : "border-neutral-400",
  
        iconColorOverride: isTransferWindowOpen 
          ? null // When open, let error/ready/warning logic color the icon
          : "text-neutral-500", // When closed, force icon to grey
  
        // Warnings apply only if open and counting down to close
        warningThresholds: isTransferWindowOpen 
          ? { mild: transferOpenWarningMild, strong: transferOpenWarningStrong } 
          : undefined, // No warnings shown for the closed lock's countdown to open (keeps it grey)
      },
  
      // 4. WEEKLY CYCLE
      {
        id: "weekly-cycle",
        title: "Weekly Cycle",
        duration: 7 * 24 * 3600, // 7 days
        currentTime: weeklyCycleTime,
        onClick: handleWeeklyCycleClick,
        icon: <Trophy />, // New Trophy icon
  
        // Per requirement: "When the weekly cycle timer is green then the icon doesn't pulsate 
        // and when the time is yellow or red the icon should pulsate."
        // "Green" here means not in a warning state.
        isPulsing: weeklyCycleTime <= weeklyCycleWarningMild && weeklyCycleTime > 0,
        errorState: false,
        
        // If time remaining is > mild warning, it's considered "ready" (not in warning)
        // We want it to be green in this state.
        isReady: weeklyCycleTime > weeklyCycleWarningMild,
        readyTextColor: "text-green-400", // Icon/Progress green when "ready" (not in warning)
        readyBorderColor: "border-green-400",
        iconColorOverride: null, // Let ready/warning logic color the icon
  
        warningThresholds: { mild: weeklyCycleWarningMild, strong: weeklyCycleWarningStrong },
      },
    ];
  }, [
    networkTapTime, networkTapRate, checkInTime, transferWindowTime,
    isTransferWindowOpen, isVaultRaidedError, weeklyCycleTime,
    // Make sure to include any handlers if they are not stable (e.g., defined inside component)
    // or if their logic influences these configurations directly.
    handleNetworkTapClick, handleCheckInClick, handleTransferWindowClick, handleWeeklyCycleClick
  ]);

  const timerWeights = useMemo(() => {
    const baseWeight = 1; // Minimum weight for any timer
    const urgencyScaleFactor = 2; // How much "larger" an expired timer is compared to a full one (e.g., 1 + 2*1 = 3x weight)
    const errorBoostFactor = 4; // Extra weight multiplier for timers in an error state

    return timersConfig.map(timer => {
      if (timer.duration <= 0) return baseWeight; // Avoid division by zero

      // Urgency: 0 (full time) to 1 (time up)
      const urgency = Math.max(0, Math.min(1, (timer.duration - timer.currentTime) / timer.duration));
      
      let weight = baseWeight + urgencyScaleFactor * urgency;

      if (timer.errorState) {
        weight += errorBoostFactor; // Significantly boost weight for error states
      }
      return weight;
    });
  }, [timersConfig]);

  const totalWeight = useMemo(() => timerWeights.reduce((sum, weight) => sum + weight, 0), [timerWeights]);
  // --- END NEW: Timer Configuration and Weight Calculation ---

  return (
    <div className="flex flex-col p-3 md:p-4 h-full overflow-hidden space-y-3 md:space-y-4">
          <div className="flex-none flex items-center justify-center p-0"> {/* Or adjust padding/margin as needed */}
        <h2 className="text-2xl font-orbitron holographic-text" // Your desired styling
          // Optional: style={{ transform: `translateX(${parallaxOffset * 0.05}px)` }}
        >Control Center</h2>
      </div>
      {/* Timer Area - REWORKED */}
      <div className="flex-shrink-0">
        {/* This is the new flex container for timers. It will distribute width. */}
        <div className="flex w-full space-x-1 md:space-x-2 py-1 items-stretch"> {/* items-stretch allows children to use h-full */}
          {timersConfig.map((timerProps, index) => {
            const weight = timerWeights[index];
            // Calculate flex-basis: percentage of width this timer should occupy
            // Default to 25% if totalWeight is somehow 0 (e.g., all timers have 0 duration and 0 weight)
            const flexBasisPercent = totalWeight > 0 ? (weight / totalWeight) * 100 : 25;

            return (
              // This div wrapper gets the proportional width
              <div 
                key={timerProps.id} 
                style={{ flexBasis: `${flexBasisPercent}%` }}
                // className="border border-dashed border-neutral-500" // Optional: for debugging visibility of containers
              >
                <CircularTimer {...timerProps} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Comms Area (remains the same as your original code) */}
      <div className="flex-grow flex flex-col min-h-0 bg-black/70 backdrop-blur-sm border border-primary/30 rounded-lg">
        <div className="flex-none flex items-center p-1.5 md:p-2 border-b border-primary/20 space-x-1">
          <div className="px-2 py-1 text-sm font-semibold text-primary mr-1">Comms</div>
          {SELECTABLE_COMMS_TABS.map((tab) => (
            <HolographicButton 
              key={tab}
              size="sm"
              className={cn(
                "!text-xs !font-rajdhani !py-1 !px-1.5 md:!px-2",
                activeCommsTab === tab ? "active-pad-button" : "hover:bg-primary/10 !bg-transparent"
              )}
              onClick={() => setActiveCommsTab(tab)}
            >
              {tab}
            </HolographicButton>
          ))}
        </div>
        
        <div 
            className="group p-1.5 md:p-2 border-b border-primary/20 bg-primary/10 cursor-pointer hover:bg-primary/20 flex items-center justify-center gap-2"
            onClick={handleCodeCopy}
            title="Click to copy Daily Team Code"
          >
            <p className="text-xs md:text-sm font-rajdhani text-center">
              <span className="font-semibold text-primary">DTC ({faction.substring(0,3)}): </span> 
              <span className="text-accent font-digital7 tracking-wider">{displayedFactionCode}</span>
            </p>
            <Copy className="w-3 h-3 text-muted-foreground group-hover:text-accent icon-glow"/>
        </div>

        <div className="flex-grow min-h-0">
          <MessageFeed filter={activeCommsTab !== 'All' ? activeCommsTab.toLowerCase() as 'hq' | 'alerts' | 'system' : undefined} />
        </div>
      </div>
    </div>
  );
}