
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type Theme =
  | 'terminal-green'
  | 'neutral' // Kept for potential future use
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
  themeVersion: number;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const availableThemesList: Theme[] = [
  'terminal-green', 'neutral', 'cyphers', 'shadows', 'level-1-grey', 'level-2-green', 'level-3-yellow',
  'level-4-orange', 'level-5-purple', 'level-6-red', 'level-7-cyan',
  'level-8-magenta', 'deep-ocean-dive', 'electric-surge', 'shadowed-amethyst',
  'molten-core', 'emerald-glitch', 'celestial-silver', 'dusk-mauve', 'solar-flare'
];

// HSL value definitions for each theme's core CSS variables
const themeHSLValues: Record<Theme, Record<string, string>> = {
  'terminal-green': {
    '--background-hsl': '130 20% 5%',
    '--foreground-hsl': '130 80% 70%',
    '--primary-hsl': '130 70% 45%',
    '--primary-foreground-hsl': '130 20% 10%',
    '--secondary-hsl': '130 30% 20%',
    '--secondary-foreground-hsl': '130 70% 60%',
    '--accent-hsl': '130 90% 55%',
    '--accent-foreground-hsl': '130 20% 5%',
    '--card-hsl': '130 25% 8%',
    '--card-foreground-hsl': '130 80% 75%',
    '--border-hsl': '130 60% 35%',
    '--input-hsl': '130 30% 25%',
    '--ring-hsl': '130 70% 50%',
    '--destructive-hsl': '0 70% 50%',
    '--destructive-foreground-hsl': '0 0% 100%',
  },
  'cyphers': {
    '--background-hsl': '210 60% 8%',
    '--foreground-hsl': '200 100% 90%',
    '--primary-hsl': '204 100% 50%', // Electric Blue
    '--primary-foreground-hsl': '0 0% 100%',
    '--secondary-hsl': '180 100% 50%', // Pale Turquoise
    '--secondary-foreground-hsl': '200 100% 90%', // Matching foreground for now
    '--accent-hsl': '0 0% 100%', // White
    '--accent-foreground-hsl': '210 60% 8%', // Matching background
    '--card-hsl': '210 50% 12%',
    '--card-foreground-hsl': '200 100% 90%',
    '--border-hsl': '204 100% 60%',
    '--input-hsl': '210 40% 15%',
    '--ring-hsl': '204 100% 55%',
    '--destructive-hsl': '0 70% 50%',
    '--destructive-foreground-hsl': '0 0% 100%',
  },
  'shadows': {
    '--background-hsl': '0 60% 8%',
    '--foreground-hsl': '0 0% 90%',
    '--primary-hsl': '0 100% 40%', // Intense Red
    '--primary-foreground-hsl': '0 0% 100%',
    '--secondary-hsl': '16 100% 71%', // Light Salmon
    '--secondary-foreground-hsl': '0 0% 90%', // Matching foreground
    '--accent-hsl': '0 0% 100%',  // White
    '--accent-foreground-hsl': '0 60% 8%', // Matching background
    '--card-hsl': '0 50% 12%',
    '--card-foreground-hsl': '0 0% 90%',
    '--border-hsl': '0 100% 50%',
    '--input-hsl': '0 40% 15%',
    '--ring-hsl': '0 100% 55%',
    '--destructive-hsl': '0 70% 50%',
    '--destructive-foreground-hsl': '0 0% 100%',
  },
  // Add other themes here if they have distinct HSL primitives
  'neutral': { // Fallback neutral, similar to terminal-green but less vibrant
    '--background-hsl': '220 10% 10%',
    '--foreground-hsl': '220 10% 70%',
    '--primary-hsl': '220 60% 50%',
    '--primary-foreground-hsl': '220 10% 95%',
    '--secondary-hsl': '220 20% 20%',
    '--secondary-foreground-hsl': '220 10% 60%',
    '--accent-hsl': '220 70% 60%',
    '--accent-foreground-hsl': '220 10% 10%',
    '--card-hsl': '220 15% 15%',
    '--card-foreground-hsl': '220 10% 75%',
    '--border-hsl': '220 20% 30%',
    '--input-hsl': '220 20% 25%',
    '--ring-hsl': '220 60% 55%',
    '--destructive-hsl': '0 70% 50%',
    '--destructive-foreground-hsl': '0 0% 100%',
  },
  // Placeholder for other item level/aesthetic themes - they would need their HSLs defined
  // For now, they might fall back to terminal-green or neutral if not fully defined here
};


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

      // Apply theme class to HTML element
      availableThemesList.forEach(tName => {
        htmlEl.classList.remove(`theme-${tName}`);
      });
      if (currentThemeInternal) {
        htmlEl.classList.add(`theme-${currentThemeInternal}`);
        console.log(`[ThemeContext] Applied theme class to HTML: theme-${currentThemeInternal}`);
      }

      // Directly set CSS HSL variables on :root
      const themeValuesToApply = themeHSLValues[currentThemeInternal] || themeHSLValues['terminal-green']; // Fallback
      console.log(`[ThemeContext] Applying HSL vars to :root for theme ${currentThemeInternal}:`, themeValuesToApply);
      for (const [variable, value] of Object.entries(themeValuesToApply)) {
        htmlEl.style.setProperty(variable, value);
      }
      
      setThemeVersion(v => v + 1);
    }
  }, [currentThemeInternal]);

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
  }, [setThemeInternal]); // setThemeInternal is stable

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

    