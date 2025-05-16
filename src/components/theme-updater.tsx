
"use client";

import { useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useTheme, type Theme } from '@/contexts/ThemeContext'; 

export function ThemeUpdater() {
  const { faction: appContextFaction } = useAppContext(); // Renamed to avoid conflict
  const { theme: currentThemeInstance, setTheme } = useTheme();

  console.log('[ThemeUpdater] Rendering. AppContext Faction:', appContextFaction, "Current ThemeContext Theme:", currentThemeInstance);

  useEffect(() => {
    console.log(
      `[ThemeUpdater] useEffect running. AppContext Faction: ${appContextFaction}, Current ThemeContext Theme: ${currentThemeInstance}`
    );
    let targetThemeKey: Theme;

    switch (appContextFaction) {
      case 'Cyphers':
        targetThemeKey = 'cyphers';
        break;
      case 'Shadows':
        targetThemeKey = 'shadows';
        break;
      case 'Observer':
      default:
        targetThemeKey = 'terminal-green'; // Default for Observer or undefined faction
        break;
    }

    if (targetThemeKey !== currentThemeInstance) {
      console.log(
        `[ThemeUpdater] Applying theme. From: ${currentThemeInstance}, To: ${targetThemeKey}, Based on AppContext Faction: ${appContextFaction}`
      );
      setTheme(targetThemeKey);
    } else {
      console.log(
        `[ThemeUpdater] No theme change needed. Target: ${targetThemeKey} already matches Current: ${currentThemeInstance}. AppContext Faction: ${appContextFaction}`
      );
    }
  // This effect should ONLY react to changes in the global faction or the setTheme function (which is stable).
  // currentThemeInstance is read inside to determine if a change is needed, but it's not a dependency that re-triggers this effect.
  }, [appContextFaction, setTheme]); 

  return null;
}
