
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type Theme = 
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
  'neutral', 'cyphers', 'shadows', 'level-1-grey', 'level-2-green', 'level-3-yellow', 
  'level-4-orange', 'level-5-purple', 'level-6-red', 'level-7-cyan', 
  'level-8-magenta', 'deep-ocean-dive', 'electric-surge', 'shadowed-amethyst', 
  'molten-core', 'emerald-glitch', 'celestial-silver', 'dusk-mauve', 'solar-flare'
];


export function ThemeProvider({ children, defaultTheme = "neutral" }: { 
    children: ReactNode, 
    defaultTheme?: Theme, 
}) {
  const [theme, setThemeInternal] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('tod-theme') as Theme | null;
      if (storedTheme && availableThemesList.includes(storedTheme)) {
        return storedTheme;
      }
    }
    return defaultTheme;
  });

  // Effect to apply the theme to the documentElement and localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tod-theme', theme);

      // Remove all potentially existing theme classes
      availableThemesList.forEach(tName => {
        document.documentElement.classList.remove(`theme-${tName}`);
      });
      
      // Add the current theme class
      // The :root selector in CSS handles the 'neutral' case by default,
      // so we only add 'theme-neutral' if it's explicitly set and not the implicit default,
      // or if we want to ensure its variables take precedence.
      // For simplicity and robustness, always add the class for the current theme.
      document.documentElement.classList.add(`theme-${theme}`);
    }
  }, [theme]); // This effect runs whenever the 'theme' state changes.

  // Callback for components to change the theme. It's stable.
  const setTheme = useCallback((newTheme: Theme) => {
    if (availableThemesList.includes(newTheme)) {
      setThemeInternal(newTheme); // Update the React state, which triggers the useEffect above
    }
  }, []); // Empty dependency array ensures this callback is stable.

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
