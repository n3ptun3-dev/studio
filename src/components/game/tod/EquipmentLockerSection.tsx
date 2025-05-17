
"use client";

import React from 'react';
import { HolographicButton, HolographicPanel } from '@/components/game/shared/HolographicPanel';
import { useAppContext } from '@/contexts/AppContext';
import { useTheme, type Theme } from '@/contexts/ThemeContext';
import { Palette } from 'lucide-react'; 

interface SectionProps {
  parallaxOffset: number;
}

export function EquipmentLockerSection({ parallaxOffset }: SectionProps) {
  const { openTODWindow } = useAppContext(); 
  const { setTheme, theme: currentGlobalTheme, themeVersion } = useTheme(); // Get themeVersion

  const ThemeSwitcher = () => {
    const themes: { name: string; themeKey: Theme; }[] = [
      { name: "Terminal Green", themeKey: "terminal-green" },
      { name: "Cyphers Blue", themeKey: "cyphers" },
      { name: "Shadows Red", themeKey: "shadows" },
    ];

    return (
      <div className="p-4 flex flex-col space-y-3 font-rajdhani">
        <p className="text-muted-foreground text-sm text-center holographic-text">Select a theme to apply globally:</p>
        {themes.map((item) => (
          <HolographicButton
            key={item.themeKey}
            className="p-3 text-center font-semibold transition-all w-full"
            onClick={() => {
              setTheme(item.themeKey);
            }}
            // The button itself should be themed according to the window it's in
            // The window (TODWindow > HolographicPanel) is keyed by currentGlobalTheme + themeVersion
            // So, the button should also reflect this.
            explicitTheme={currentGlobalTheme} 
          >
            {item.name}
          </HolographicButton>
        ))}
      </div>
    );
  };

  const handleOpenThemeSwitcher = () => {
    // The theme override window itself should also be themed according to the current global theme
    openTODWindow(
      "TOD Theme Override",
      <ThemeSwitcher />, // The content for the window
      { showCloseButton: true } 
    );
  };

  return (
    <div className="flex items-center justify-center p-4 md:p-6 h-full">
      <HolographicPanel 
        className="w-full h-full max-w-4xl flex flex-col items-center justify-center relative"
        explicitTheme={currentGlobalTheme} 
      >
        <div className="absolute top-4 right-4 z-10">
          <HolographicButton
            onClick={handleOpenThemeSwitcher}
            className="!p-2" 
            aria-label="Open Theme Switcher"
            explicitTheme={currentGlobalTheme} 
          >
            <Palette className="w-5 h-5" /> 
          </HolographicButton>
        </div>
        <h2 className="text-4xl font-orbitron mb-8 holographic-text">Equipment Locker</h2>
        <p className="text-muted-foreground">Under Development</p>
        <p className="text-center mt-4 text-sm">
          Purchase Vault Hardware, Lock Fortifiers, Entry Tools, Infiltration Gear, Nexus Upgrades, Assault Tech, and customize your TOD with Aesthetic Schemes.
        </p>
      </HolographicPanel>
    </div>
  );
}

    