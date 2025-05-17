
"use client";

import React from 'react';
import { HolographicPanel, HolographicButton } from '@/components/game/shared/HolographicPanel';
import { useAppContext } from '@/contexts/AppContext';
import { useTheme, type Theme } from '@/contexts/ThemeContext';
import { Palette } from 'lucide-react'; // Using Palette icon for theme switching

interface SectionProps {
  parallaxOffset: number;
}

export function EquipmentLockerSection({ parallaxOffset }: SectionProps) {
  const { openTODWindow, closeTODWindow } = useAppContext();
  const { setTheme, theme: currentGlobalTheme } = useTheme();

  const ThemeSwitcher = () => {
    const themes: { name: string; themeKey: Theme; bgColor: string; textColor: string; borderColor: string; }[] = [
      { name: "Terminal Green", themeKey: "terminal-green", bgColor: "bg-green-700/80 hover:bg-green-600/90", textColor: "text-green-200", borderColor: "border-green-500" },
      { name: "Cyphers Blue", themeKey: "cyphers", bgColor: "bg-blue-700/80 hover:bg-blue-600/90", textColor: "text-blue-200", borderColor: "border-blue-500" },
      { name: "Shadows Red", themeKey: "shadows", bgColor: "bg-red-700/80 hover:bg-red-600/90", textColor: "text-red-200", borderColor: "border-red-500" },
    ];

    return (
      <div className="p-4 flex flex-col space-y-3 font-rajdhani">
        <p className="text-muted-foreground text-sm text-center holographic-text">Select a theme to apply globally for testing:</p>
        {themes.map((item) => (
          <button
            key={item.themeKey}
            className={`p-3 rounded-md text-center font-semibold transition-all border-2 ${item.borderColor} ${item.bgColor} ${item.textColor}`}
            onClick={() => {
              setTheme(item.themeKey);
              // Optionally close the window, or let the user close it manually
              // closeTODWindow(); 
            }}
          >
            {item.name}
          </button>
        ))}
      </div>
    );
  };

  const handleOpenThemeSwitcher = () => {
    openTODWindow(
      "TOD Theme Override",
      <ThemeSwitcher />,
      { showCloseButton: true } // Allow closing this utility window
    );
  };

  return (
    <div className="flex items-center justify-center p-4 md:p-6 h-full">
      <HolographicPanel className="w-full h-full max-w-4xl flex flex-col items-center justify-center relative">
        <div className="absolute top-4 right-4 z-10"> {/* Ensure button is above other content */}
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
    