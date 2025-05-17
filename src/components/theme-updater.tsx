
"use client";

import { useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useTheme, type Theme } from '@/contexts/ThemeContext'; 

export function ThemeUpdater() {
  const { faction: appContextFaction } = useAppContext();
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
        targetThemeKey = 'terminal-green'; 
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
  }, [appContextFaction, currentThemeInstance, setTheme]); 

  return null;
}
