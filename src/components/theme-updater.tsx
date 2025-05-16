
"use client";

import { useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useTheme, type Theme } from '@/contexts/ThemeContext'; // Ensure Theme type is imported

export function ThemeUpdater() {
  const { faction } = useAppContext();
  const { theme: currentThemeInstance, setTheme } = useTheme();

  console.log('[ThemeUpdater] Rendering. Faction from context:', faction, "Current theme instance (from ThemeContext):", currentThemeInstance);

  useEffect(() => {
    console.log('[ThemeUpdater] useEffect triggered. Faction:', faction, "Current theme instance:", currentThemeInstance);
    let targetThemeKey: Theme;

    switch (faction) {
      case 'Cyphers':
        targetThemeKey = 'cyphers';
        break;
      case 'Shadows':
        targetThemeKey = 'shadows';
        break;
      case 'Observer':
      default:
        targetThemeKey = 'terminal-green'; // Default to terminal-green for Observer or undefined faction
        break;
    }
    
    console.log('[ThemeUpdater] Target theme key determined:', targetThemeKey);
    if (targetThemeKey !== currentThemeInstance) {
      console.log('[ThemeUpdater] Applying theme. Current:', currentThemeInstance, 'Target:', targetThemeKey);
      setTheme(targetThemeKey);
    } else {
      console.log('[ThemeUpdater] Theme already set to target or faction dictates current. Current theme:', currentThemeInstance, "Target:", targetThemeKey);
    }
  }, [faction, currentThemeInstance, setTheme]); // currentThemeInstance and setTheme are dependencies

  return null;
}

