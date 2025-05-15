
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type Theme = 
  | 'neutral' // Added neutral theme
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
  'neutral', 'cyphers', 'shadows', 'level-1-grey', 'level-2-green', 'level-3-yellow', 
  'level-4-orange', 'level-5-purple', 'level-6-red', 'level-7-cyan', 
  'level-8-magenta', 'deep-ocean-dive', 'electric-surge', 'shadowed-amethyst', 
  'molten-core', 'emerald-glitch', 'celestial-silver', 'dusk-mauve', 'solar-flare'
];


export function ThemeProvider({ children, attribute = "class", defaultTheme = "neutral", enableSystem = false, disableTransitionOnChange = false }: { 
    children: ReactNode, 
    attribute?: string, // Keep ShadCN compatibility
    defaultTheme?: Theme, 
    enableSystem?: boolean, 
    disableTransitionOnChange?: boolean 
}) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('tod-theme') as Theme | null;
      if (storedTheme && availableThemesList.includes(storedTheme)) {
        return storedTheme;
      }
    }
    return defaultTheme;
  });

  useEffect(() => {
    const storedTheme = localStorage.getItem('tod-theme') as Theme | null;
    if (storedTheme && availableThemesList.includes(storedTheme)) {
      setThemeState(storedTheme);
    } else {
      setThemeState(defaultTheme); // Ensure default if nothing valid in storage
    }
  }, [defaultTheme]);

  const setTheme = useCallback((newTheme: Theme) => {
    if (availableThemesList.includes(newTheme)) {
      setThemeState(newTheme);
      if (typeof window !== 'undefined') {
        localStorage.setItem('tod-theme', newTheme);
      }
      
      document.documentElement.classList.remove(...availableThemesList.map(t => `theme-${t}`));
      if (newTheme !== 'neutral' || (newTheme === 'neutral' && defaultTheme !== 'neutral')) { // Apply theme-neutral if it's not the implicit root default
         document.documentElement.classList.add(`theme-${newTheme}`);
      }
      // Ensure root doesn't have other theme classes if neutral is selected and neutral IS the :root default
      // This logic might need refinement based on how :root vs .theme-neutral is handled in globals.css
      // For now, explicit class addition/removal is safer.
    }
  }, [defaultTheme]);

  useEffect(() => {
    // Initial theme application and on theme state change
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

    

    