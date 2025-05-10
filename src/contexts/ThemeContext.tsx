
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type Theme = 
  | 'cyphers' 
  | 'shadows' 
  | 'level-1-grey'
  | 'level-2-green'
  | 'level-3-yellow'
  | 'level-4-orange'
  | 'level-5-purple'
  | 'level-6-red' // Note: "Team Red" is for faction, this is L6 item color
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
  'cyphers', 'shadows', 'level-1-grey', 'level-2-green', 'level-3-yellow', 
  'level-4-orange', 'level-5-purple', 'level-6-red', 'level-7-cyan', 
  'level-8-magenta', 'deep-ocean-dive', 'electric-surge', 'shadowed-amethyst', 
  'molten-core', 'emerald-glitch', 'celestial-silver', 'dusk-mauve', 'solar-flare'
];


export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('cyphers'); // Default to Cyphers

  useEffect(() => {
    const storedTheme = localStorage.getItem('tod-theme') as Theme | null;
    if (storedTheme && availableThemesList.includes(storedTheme)) {
      setThemeState(storedTheme);
    }
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    if (availableThemesList.includes(newTheme)) {
      setThemeState(newTheme);
      localStorage.setItem('tod-theme', newTheme);
      
      // Remove all theme-prefixed classes
      availableThemesList.forEach(t => {
        if (t !== newTheme) document.documentElement.classList.remove(`theme-${t}`);
      });
      // Add the new theme class
      document.documentElement.classList.add(`theme-${newTheme}`);
       // Special handling for default 'cyphers' theme as it might not have a prefix if it's the :root default
      if (newTheme === 'cyphers') {
         availableThemesList.forEach(t => {
          if (t !== 'cyphers') document.documentElement.classList.remove(`theme-${t}`);
        });
      } else {
        document.documentElement.classList.remove('theme-cyphers'); // ensure default is removed
        document.documentElement.classList.add(`theme-${newTheme}`);
      }

    }
  }, []);

  useEffect(() => {
    // Initial theme application
    setTheme(theme);
  }, [theme, setTheme]);


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

    