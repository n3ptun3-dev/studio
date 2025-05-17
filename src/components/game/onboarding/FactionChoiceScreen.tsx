
"use client";
import React, { useState, useEffect } from 'react';
import { HolographicButton, HolographicPanel } from '@/components/game/shared/HolographicPanel';
import { useAppContext, type Faction } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Code, Eye, ShieldQuestion } from 'lucide-react';
import { CodenameInput } from './CodenameInput';
// Removed: import { useTheme } from '@/contexts/ThemeContext';

interface FactionChoiceScreenProps {}

const factionDetails = {
  Cyphers: {
    icon: <Code className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mb-2 text-blue-400 icon-glow" />,
    borderColorClass: "border-blue-500", // For the tile's own border when selected
    selectedBgClass: "bg-blue-600/40", // Translucent blue overlay
    selectedRingClass: "ring-sky-400",
    defaultTagline: "Information is Power. Decode the Network.",
    alignTagline: "Align with The Cyphers",
    themeName: 'cyphers' as const,
  },
  Shadows: {
    icon: <ShieldQuestion className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mb-2 text-red-400 icon-glow" />,
    borderColorClass: "border-red-500", // For the tile's own border when selected
    selectedBgClass: "bg-red-600/40",   // Translucent red overlay
    selectedRingClass: "ring-rose-400",
    defaultTagline: "Control the Flow. Infiltrate and Disrupt.",
    alignTagline: "Align with The Shadows",
    themeName: 'shadows' as const,
  }
};

export function FactionChoiceScreen({}: FactionChoiceScreenProps) {
  const {
    setFaction: setAppContextFaction,
    openTODWindow,
    isTODWindowOpen: contextIsTODWindowOpen, // For logging
    faction: globalAppContextFaction, // For logging
    setOnboardingStep,
  } = useAppContext();
  
  const [selectedFaction, setSelectedFaction] = useState<Faction | null>(null);
  // const { theme: currentTheme, setTheme } = useTheme(); // Removed, FactionChoiceScreen no longer sets global theme for preview

  console.log('FactionChoiceScreen rendering. Selected Faction:', selectedFaction, "isTODWindowOpen (from context):", contextIsTODWindowOpen, "Global App Faction:", globalAppContextFaction);
  
  const handleFactionSelect = (factionName: Faction) => {
    if (factionName === 'Observer') return; 
    console.log('FactionChoiceScreen: handleFactionSelect. New selectedFaction will be:', factionName);
    setSelectedFaction(prev => prev === factionName ? null : factionName);
    // No global theme change on tile selection for preview
  };

  const handleConfirmFaction = (factionToConfirm: Faction | null) => {
    if (!factionToConfirm || factionToConfirm === 'Observer') {
      console.error("Attempted to confirm with no faction or as Observer directly.");
      return;
    }
    console.log('Confirm button for', factionToConfirm, 'CLICKED');
    setAppContextFaction(factionToConfirm); 
    console.log(`Faction ${factionToConfirm} confirmed. Opening Codename Input...`);
    openTODWindow("Agent Codename", <CodenameInput />);
    // setOnboardingStep will be handled by CodenameInput or subsequent steps
  };

  const handleProceedAsObserver = () => {
    console.log("Proceeding as Observer");
    setAppContextFaction('Observer'); 
    setOnboardingStep('tod'); 
  };
  
  return (
    // Main screen panel, uses HolographicPanel for overall themed border (should be terminal-green initially)
    <HolographicPanel className="w-full max-w-2xl p-4 md:p-6 flex flex-col flex-grow h-0 overflow-hidden">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-orbitron py-2 mb-2 sm:mb-4 text-center holographic-text flex-shrink-0">
        Select Your Allegiance
      </h1>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 flex-grow min-h-0 items-start mb-4 sm:mb-6">
        {(['Cyphers', 'Shadows'] as const).map((factionName) => {
          const details = factionDetails[factionName];
          const isSelected = selectedFaction === factionName;
          
          // The tile itself uses holographic-panel for its base styling (themed by terminal-green initially)
          // When selected, it gets an additional background overlay and ring effect.
          console.log(`Rendering tile for ${factionName} isSelected: ${isSelected} Applied BG Class should be: ${isSelected ? details.selectedBgClass : 'holographic-panel (default)' }`);
          
          const tileClasses = cn(
            "holographic-panel", // Base panel styling
            "p-3 sm:p-4", // Internal padding for the tile content
            "transition-all duration-300 cursor-pointer flex flex-col h-full", // Layout and interaction
            isSelected && details.selectedBgClass, // Apply translucent faction color overlay when selected
            isSelected && `ring-4 ring-offset-2 ring-offset-background ${details.selectedRingClass} shadow-[0_0_25px_var(--ring)]`,
            isSelected ? details.borderColorClass : "border-transparent" // Faction colored border if selected, else transparent to rely on holographic-panel's border
          );

          return (
            <div
              key={factionName}
              className={tileClasses}
              onClick={() => handleFactionSelect(factionName)}
            >
              {React.cloneElement(details.icon, { className: cn(details.icon.props.className, isSelected ? 'text-white' : (factionName === 'Cyphers' ? 'text-blue-400' : 'text-red-400'))})}
              <h2 className={cn(
                  "text-lg sm:text-xl md:text-2xl font-orbitron mb-1",
                  isSelected ? 'text-white' : (factionName === 'Cyphers' ? 'text-blue-400' : 'text-red-400')
              )}>
                The {factionName}
              </h2>
              <p className={cn(
                  "text-xs sm:text-sm md:text-base leading-tight flex-grow", 
                  isSelected ? 'text-gray-200' : 'text-muted-foreground'
              )}>
                {details.defaultTagline}
              </p>
              {isSelected && (
                <>
                  <p className={cn("text-sm text-center my-2 font-semibold", isSelected ? 'text-white' : (factionName === 'Cyphers' ? 'text-blue-300' : 'text-red-300') )}>
                    {details.alignTagline}
                  </p>
                  <HolographicButton
                    className={cn(
                      "mt-auto w-full py-2 text-sm sm:text-base",
                      // Button should pick up theme from its parent tile if needed, or we pass explicitTheme
                    )}
                    onClick={(e) => {
                      e.stopPropagation(); 
                      console.log('Confirm button for', factionName, 'CLICKED');
                      handleConfirmFaction(factionName);
                    }}
                  >
                    Confirm
                  </HolographicButton>
                </>
              )}
            </div>
          );
        })}
      </div>

      <Button
        variant="ghost"
        className="w-full md:w-3/4 mx-auto text-muted-foreground hover:text-foreground flex items-center justify-center gap-2 py-2 sm:py-3 mt-auto flex-shrink-0"
        onClick={handleProceedAsObserver}
      >
        <Eye className="w-4 h-4 sm:w-5 sm:h-5" /> Proceed as Observer
      </Button>
    </HolographicPanel>
  );
}
