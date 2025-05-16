
"use client";

import { useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';

export function ThemeUpdater() {
  const { faction } = useAppContext();
  const { theme: currentThemeInstance, setTheme } = useTheme(); // Renamed to avoid conflict

  console.log('[ThemeUpdater] Rendering. Faction from context:', faction, "Current theme instance:", currentThemeInstance);

  useEffect(() => {
    console.log('[ThemeUpdater] useEffect triggered. Faction:', faction);
    let targetThemeKey: 'cyphers' | 'shadows' | 'neutral' = 'neutral';

    if (faction === 'Cyphers') {
      targetThemeKey = 'cyphers';
    } else if (faction === 'Shadows') {
      targetThemeKey = 'shadows';
    }
    
    console.log('[ThemeUpdater] Target theme key:', targetThemeKey, "Current theme instance from hook:", currentThemeInstance);
    if (targetThemeKey !== currentThemeInstance) {
      console.log('[ThemeUpdater] Applying theme for faction:', faction, ' Target theme:', targetThemeKey);
      setTheme(targetThemeKey);
    } else {
      console.log('[ThemeUpdater] Theme already set or faction is Observer/neutral. Current theme:', currentThemeInstance, "Target:", targetThemeKey);
    }
  }, [faction, setTheme, currentThemeInstance]);

  return null;
}
