"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface CircularTimerProps {
  id: string;
  duration: number;
  currentTime: number;
  onClick?: () => void;
  icon?: React.ReactNode; // The actual icon element (e.g., <LockOpenIcon />)
  warningThresholds?: { mild: number; strong: number };
  isPulsing?: boolean;      // Directly controls icon pulsing
  errorState?: boolean;     // For critical error appearance (border pulse, specific color)

  isReady?: boolean;        // For specific "ready" or "positive" states (e.g., green)
  readyTextColor?: string;  // e.g., "text-green-400" for progress ring & icon by default
  readyBorderColor?: string;// e.g., "border-green-400"

  // New prop for overriding icon color if standard logic isn't suitable
  // (e.g., for a grey inactive icon when border/progress might be primary)
  iconColorOverride?: string; // e.g., "text-neutral-500"

  // Props not rendered by this component but potentially used by parent for modal content
  title?: string;
  rate?: string;
  statusText?: string;
}

const CircularTimer: React.FC<CircularTimerProps> = ({
  id,
  duration,
  currentTime,
  onClick,
  icon, // The actual icon element is passed
  warningThresholds,
  isPulsing,
  errorState,
  isReady,
  readyTextColor,
  readyBorderColor,
  iconColorOverride,
  // title, rate, statusText are not used for rendering by this component
}) => {
  const progress = duration > 0 ? ((duration - currentTime) / duration) * 100 : 0;

  // Determine base colors for border and progress ring
  let currentBorderColorClass = 'border-primary';
  let currentProgressColorClass = 'text-primary';

  if (errorState) {
    currentBorderColorClass = 'border-destructive animate-pulse'; // Border pulses on error
    currentProgressColorClass = 'text-destructive';
  } else if (isReady && readyTextColor) {
    // "Ready" state (e.g., green, or could be neutral for closed lock)
    currentProgressColorClass = readyTextColor;
    currentBorderColorClass = readyBorderColor || readyTextColor.replace(/^text-(.*)$/, 'border-$1');
  } else if (warningThresholds) {
    // Warning states (red, yellow) - these take precedence over default 'primary'
    // but not over 'isReady' or 'errorState' if those are also true and handled above.
    if (currentTime <= warningThresholds.strong) {
      currentBorderColorClass = 'border-destructive';
      currentProgressColorClass = 'text-destructive';
    } else if (currentTime <= warningThresholds.mild) {
      currentBorderColorClass = 'border-yellow-400';
      currentProgressColorClass = 'text-yellow-400';
    }
    // If not in strong/mild warning, and not error/ready, it will remain primary (default)
  }
  // If none of the above specific states apply, it defaults to primary.

  // Determine final icon color: use override if provided, otherwise use the progress color.
  const finalIconColorToUse = iconColorOverride || currentProgressColorClass;

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-0.5 md:p-1">
      <div
        className={cn(
          "relative flex flex-col items-center justify-center rounded-full border-2 cursor-pointer transition-all duration-300 ease-out",
          currentBorderColorClass, // Apply the calculated border color
          "bg-background/70 hover:bg-background/100", // Main background of the circle
          "w-full aspect-square",
          "shadow-[0_0_15px_5px_rgba(0,0,0,0.7)]"
        )}
        onClick={onClick}
      >
        {/* SVG for progress rings - should be visually behind the icon */}
        <svg className="absolute inset-0 w-full h-full z-0" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
          <circle // Track ring for the progress
            className="text-transparent" // Base track is transparent, color comes from stroke
            strokeWidth="2"
            stroke="currentColor" // Inherits color from parent div (affected by currentBorderColorClass)
            fill="transparent"
            r="15.9155" cx="18" cy="18"
            opacity="0.3" // Opacity of the track ring stroke itself
          />
          <circle // Actual progress ring
            className={cn("transition-all duration-500", currentProgressColorClass)}
            strokeWidth="2"
            strokeDasharray={`${progress}, 100`}
            strokeLinecap="round"
            stroke="currentColor" // Uses currentProgressColorClass
            fill="transparent"
            r="15.9155" cx="18" cy="18"
          />
        </svg>

        {/* Icon Container - should be on top of the SVG rings, fully opaque */}
        {icon && (
          <div className={cn(
            "absolute inset-0 flex items-center justify-center z-10", // Positive z-index, no opacity class here
            isPulsing && "animate-pulse" // Icon pulses based on isPulsing prop from parent
          )}>
            {React.cloneElement(icon as React.ReactElement, {
              // Icon takes the final calculated/overridden color, fully opaque
              className: cn("w-1/2 h-1/2", finalIconColorToUse)
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CircularTimer;