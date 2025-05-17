
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type Theme =
  | 'terminal-green'
  | 'neutral' // Kept for potential future use, but terminal-green is default
  | 'cyphers'
  | 'shadows'
  | 'level-1-grey'
  | 'level-2-green'
  | 'level-3-yellow'
  | 'level-4-orange'
  | 'level-5-purple'
  | 'level-6-red'
  | 'level-7-cyan'
  | 'level-8-magenta'
  | 'deep-ocean-dive'
  | 'electric-surge'
  | 'shadowed-amethyst'
  | 'molten-core'
  | 'emerald-glitch'
  | 'celestial-silver'
  | 'dusk-mauve'
  | 'solar-flare';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  availableThemes: Theme[];
  themeVersion: number; // To help trigger re-renders
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const availableThemesList: Theme[] = [
  'terminal-green', 'neutral', 'cyphers', 'shadows', 'level-1-grey', 'level-2-green', 'level-3-yellow',
  'level-4-orange', 'level-5-purple', 'level-6-red', 'level-7-cyan',
  'level-8-magenta', 'deep-ocean-dive', 'electric-surge', 'shadowed-amethyst',
  'molten-core', 'emerald-glitch', 'celestial-silver', 'dusk-mauve', 'solar-flare'
];

export function ThemeProvider({ children, defaultTheme = "terminal-green" }: {
    children: ReactNode,
    defaultTheme?: Theme,
}) {
  const [currentThemeInternal, setThemeInternal] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('tod-theme') as Theme | null;
      if (storedTheme && availableThemesList.includes(storedTheme)) {
        return storedTheme;
      }
    }
    return availableThemesList.includes(defaultTheme) ? defaultTheme : 'terminal-green';
  });
  const [themeVersion, setThemeVersion] = useState(0);

  useEffect(() => {
    console.log(`[ThemeContext] Effect running. Current internal theme to apply: ${currentThemeInternal}`);
    if (typeof window !== 'undefined') {
      localStorage.setItem('tod-theme', currentThemeInternal);
      const htmlEl = document.documentElement;

      // Remove all known theme classes
      availableThemesList.forEach(tName => {
        htmlEl.classList.remove(`theme-${tName}`);
      });

      // Add the current theme class
      if (currentThemeInternal) {
        htmlEl.classList.add(`theme-${currentThemeInternal}`);
        console.log(`[ThemeContext] Applied theme to HTML: theme-${currentThemeInternal}`);
        setThemeVersion(v => v + 1); // Increment version after applying
      }
    }
  }, [currentThemeInternal]); // Only depends on currentThemeInternal

  const setTheme = useCallback((newTheme: Theme) => {
    if (availableThemesList.includes(newTheme)) {
      console.log(`[ThemeContext] setTheme callback invoked with newTheme: ${newTheme}`);
      setThemeInternal(currentInternal => {
        if (currentInternal !== newTheme) {
          console.log(`[ThemeContext] Actually changing theme from ${currentInternal} to ${newTheme}`);
          return newTheme;
        }
        return currentInternal; // No change needed
      });
    } else {
      console.warn(`[ThemeContext] Attempted to set invalid theme: ${newTheme}`);
    }
  }, [setThemeInternal]); // Depends only on the stable setter and constant list

  const contextValue = React.useMemo(() => ({
    theme: currentThemeInternal,
    setTheme,
    availableThemes: availableThemesList,
    themeVersion,
  }), [currentThemeInternal, setTheme, themeVersion]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
