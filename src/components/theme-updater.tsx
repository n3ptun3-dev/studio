"use client";

import { useEffect } from 'react';
import { useAppContext, type Faction } from '@/contexts/AppContext';
import { useTheme, type Theme } from '@/contexts/ThemeContext';

export function ThemeUpdater() {
  const { faction: appContextFaction } = useAppContext();
  // It's important that currentThemeInstance is read inside useEffect if its change
  // should not by itself re-trigger the effect that might change it.
  const { theme: currentThemeInstance, setTheme } = useTheme();

  useEffect(() => {
    let targetThemeKey: Theme;

    if (appContextFaction === 'Cyphers') {
      targetThemeKey = 'cyphers';
    } else if (appContextFaction === 'Shadows') {
      targetThemeKey = 'shadows';
    } else {
      targetThemeKey = 'terminal-green'; // Default for 'Observer' or undefined initial state
    }

    // Read currentThemeInstance inside the effect to get the latest value at the time of execution
    const currentThemeReadInEffect = currentThemeInstance;

    if (targetThemeKey !== currentThemeReadInEffect) {
      setTheme(targetThemeKey);
    }
  // This effect should run when appContextFaction changes, or when setTheme function reference changes (which it shouldn't).
  // It reads currentThemeInstance internally to make its decision but doesn't depend on it to re-run if setTheme caused it to change.
  }, [appContextFaction, setTheme, currentThemeInstance]); // Added currentThemeInstance back as per logs from good state. Guard condition `targetThemeKey !== currentThemeInstance` should prevent loop.


  return null;
}