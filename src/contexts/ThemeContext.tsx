
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type Theme = 
  | 'terminal-green' // New default
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


export function ThemeProvider({ children, defaultTheme = "terminal-green" }: { 
    children: ReactNode, 
    defaultTheme?: Theme, 
}) {
  const [theme, setThemeInternal] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('tod-theme') as Theme | null;
      // Ensure storedTheme is valid and one of the available themes
      if (storedTheme && availableThemesList.includes(storedTheme)) {
        return storedTheme;
      }
    }
    // Ensure defaultTheme is valid if provided, otherwise use 'terminal-green'
    return availableThemesList.includes(defaultTheme) ? defaultTheme : 'terminal-green';
  });

  // Effect to apply the theme to the documentElement and localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tod-theme', theme);
      // Remove all potentially existing theme classes from the html element
      availableThemesList.forEach(tName => {
        document.documentElement.classList.remove(`theme-${tName}`);
      });
      // Add the current theme class
      document.documentElement.classList.add(`theme-${theme}`);
      console.log(`[ThemeContext] Applied theme to HTML: theme-${theme}`);
    }
  }, [theme]);

  const setTheme = useCallback((newTheme: Theme) => {
    if (availableThemesList.includes(newTheme)) {
      console.log(`[ThemeContext] setTheme called. Current: ${theme}, New: ${newTheme}`);
      setThemeInternal(newTheme); 
    } else {
      console.warn(`[ThemeContext] Attempted to set invalid theme: ${newTheme}`);
    }
  }, [theme]); // Include theme in dependency array if logic inside uses it, though for setThemeInternal it's not strictly needed

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

