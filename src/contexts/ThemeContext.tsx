
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type Theme = 
  | 'terminal-green'
  | 'neutral'
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
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const availableThemesList: Theme[] = [
  'terminal-green', 'neutral', 'cyphers', 'shadows', 'level-1-grey', 'level-2-green', 'level-3-yellow', 
  'level-4-orange', 'level-5-purple', 'level-6-red', 'level-7-cyan', 
  'level-8-magenta', 'deep-ocean-dive', 'electric-surge', 'shadowed-amethyst', 
  'molten-core', 'emerald-glitch', 'celestial-silver', 'dusk-mauve', 'solar-flare'
];


export function ThemeProvider({ children, defaultTheme = "terminal-green", attribute = "class" }: { 
    children: ReactNode, 
    defaultTheme?: Theme, 
    attribute?: string, 
}) {
  const [theme, setThemeInternal] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('tod-theme') as Theme | null;
      if (storedTheme && availableThemesList.includes(storedTheme)) {
        return storedTheme;
      }
    }
    return availableThemesList.includes(defaultTheme) ? defaultTheme : 'terminal-green';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tod-theme', theme);
      const htmlEl = document.documentElement;
      availableThemesList.forEach(tName => {
        htmlEl.classList.remove(`theme-${tName}`);
      });
      if (theme) { 
        htmlEl.classList.add(`theme-${theme}`);
        console.log(`[ThemeContext] Applied theme to HTML: theme-${theme}`);
      }
    }
  }, [theme]);

  const setTheme = useCallback((newTheme: Theme) => {
    if (availableThemesList.includes(newTheme)) {
      console.log(`[ThemeContext] setTheme callback invoked with newTheme: ${newTheme}`);
      setThemeInternal(currentInternalTheme => {
        if (currentInternalTheme !== newTheme) {
          console.log(`[ThemeContext] Actually changing theme from ${currentInternalTheme} to ${newTheme}`);
          return newTheme;
        }
        return currentInternalTheme;
      }); 
    } else {
      console.warn(`[ThemeContext] Attempted to set invalid theme: ${newTheme}`);
    }
  }, [setThemeInternal]); // setThemeInternal from useState is stable. availableThemesList is constant.

  return (
    <ThemeContext.Provider value={{ theme, setTheme, availableThemes: availableThemesList }}>
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

