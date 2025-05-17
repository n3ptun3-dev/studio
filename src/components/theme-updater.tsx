
"use client";

import { useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useTheme, type Theme } from '@/contexts/ThemeContext';

export function ThemeUpdater() {
  const { faction: appContextFaction } = useAppContext();
  const { theme: currentThemeInstance, setTheme } = useTheme(); // currentThemeInstance is from ThemeContext

  // Debug logs
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
  // Important: Only run this effect if appContextFaction (the source of truth for the global theme) changes,
  // or if setTheme function reference changes (which it shouldn't often).
  // currentThemeInstance should NOT be a dependency here, as this effect *causes* currentThemeInstance to change.
  }, [appContextFaction, setTheme, currentThemeInstance]); // currentThemeInstance is added back to ensure it reacts if the theme was changed by another source

  return null;
}
