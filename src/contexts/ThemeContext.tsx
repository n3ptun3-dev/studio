
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
// These are the SOURCE values. JS will set them on :root.
const themeHSLValues: Record<Theme, Record<string, string>> = {
  'terminal-green': {
    '--background-hsl': '130 20% 5%',
    '--foreground-hsl': '130 80% 70%',
    '--primary-hsl': '130 70% 45%',
    '--primary-foreground-hsl': '130 80% 80%', // Brighter for terminal green
    '--secondary-hsl': '130 30% 20%',
    '--secondary-foreground-hsl': '130 70% 60%',
    '--accent-hsl': '130 90% 55%',
    '--accent-foreground-hsl': '130 20% 5%',
    '--card-hsl': '130 25% 8%',
    '--card-foreground-hsl': '130 80% 75%',
    '--popover-hsl': '130 25% 12%',
    '--popover-foreground-hsl': '130 80% 75%',
    '--border-hsl': '130 60% 35%',
    '--input-hsl': '130 30% 25%',
    '--ring-hsl': '130 70% 50%',
    '--destructive-hsl': '0 70% 50%',
    '--destructive-foreground-hsl': '0 0% 100%',
    '--hologram-glow-color-hsl': '130 90% 55%', // Bright green accent for glow
  },
  'cyphers': {
    '--background-hsl': '210 60% 8%',
    '--foreground-hsl': '200 100% 90%',
    '--primary-hsl': '204 100% 50%',
    '--primary-foreground-hsl': '0 0% 100%',
    '--secondary-hsl': '180 100% 50%',
    '--secondary-foreground-hsl': '200 100% 90%',
    '--accent-hsl': '0 0% 100%',
    '--accent-foreground-hsl': '210 60% 8%',
    '--card-hsl': '210 50% 12%',
    '--card-foreground-hsl': '200 100% 90%',
    '--popover-hsl': '210 50% 15%',
    '--popover-foreground-hsl': '200 100% 90%',
    '--border-hsl': '204 100% 60%',
    '--input-hsl': '210 40% 15%',
    '--ring-hsl': '204 100% 55%',
    '--destructive-hsl': '0 70% 50%',
    '--destructive-foreground-hsl': '0 0% 100%',
    '--hologram-glow-color-hsl': '204 100% 50%', // Electric Blue for glow
  },
  'shadows': {
    '--background-hsl': '0 60% 8%',
    '--foreground-hsl': '0 0% 90%',
    '--primary-hsl': '0 100% 40%',
    '--primary-foreground-hsl': '0 0% 100%',
    '--secondary-hsl': '16 100% 71%',
    '--secondary-foreground-hsl': '0 0% 90%',
    '--accent-hsl': '0 0% 100%',
    '--accent-foreground-hsl': '0 60% 8%',
    '--card-hsl': '0 50% 12%',
    '--card-foreground-hsl': '0 0% 90%',
    '--popover-hsl': '0 50% 15%',
    '--popover-foreground-hsl': '0 0% 90%',
    '--border-hsl': '0 100% 50%',
    '--input-hsl': '0 40% 15%',
    '--ring-hsl': '0 100% 55%',
    '--destructive-hsl': '0 70% 50%',
    '--destructive-foreground-hsl': '0 0% 100%',
    '--hologram-glow-color-hsl': '0 100% 40%', // Intense Red for glow
  },
  'neutral': { // Fallback neutral
    '--background-hsl': '220 10% 10%',
    '--foreground-hsl': '220 10% 70%',
    '--primary-hsl': '220 60% 50%',
    '--primary-foreground-hsl': '220 10% 95%',
    '--secondary-hsl': '220 20% 20%',
    '--secondary-foreground-hsl': '220 10% 60%',
    '--accent-hsl': '220 70% 60%',
    '--accent-foreground-hsl': '220 10% 10%',
    '--card-hsl': '220 15% 12%',
    '--card-foreground-hsl': '220 10% 75%',
    '--popover-hsl': '220 15% 15%',
    '--popover-foreground-hsl': '220 10% 75%',
    '--border-hsl': '220 20% 30%',
    '--input-hsl': '220 20% 25%',
    '--ring-hsl': '220 60% 55%',
    '--destructive-hsl': '0 70% 50%',
    '--destructive-foreground-hsl': '0 0% 100%',
    '--hologram-glow-color-hsl': '220 70% 60%', // Muted blue glow for neutral
  },
  // Other themes would need their HSLs defined here...
};

export function ThemeProvider({ children, defaultTheme = "terminal-green", attribute = "class", enableSystem = false, disableTransitionOnChange = false }: {
    children: ReactNode,
    defaultTheme?: Theme,
    attribute?: string,
    enableSystem?: boolean,
    disableTransitionOnChange?: boolean,
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

      // Remove all potential theme classes
      availableThemesList.forEach(tName => {
        if (tName) htmlEl.classList.remove(`theme-${tName}`);
      });
      // Add the current theme class
      if (currentThemeInternal && availableThemesList.includes(currentThemeInternal)) {
        htmlEl.classList.add(`theme-${currentThemeInternal}`);
        console.log(`[ThemeContext] Applied theme class to HTML: theme-${currentThemeInternal}`);
      }

      // Directly set CSS HSL variables on :root
      const themeValuesToSet = themeHSLValues[currentThemeInternal] || themeHSLValues['terminal-green']; // Fallback
      console.log(`[ThemeContext] Applying HSL vars to :root for theme ${currentThemeInternal}:`, themeValuesToSet);
      
      for (const [variable, value] of Object.entries(themeValuesToSet)) {
        // variable will be like '--background-hsl' or '--hologram-glow-color-hsl'
        // value will be its HSL string e.g. '130 20% 5%'
        if (variable.endsWith('-hsl')) { // Ensure we only set HSL variables this way
            htmlEl.style.setProperty(variable, value);
        }
      }
      // Also directly set the composite --hologram-glow-color
      const glowColorHsl = themeValuesToSet['--hologram-glow-color-hsl'] || themeHSLValues['terminal-green']['--hologram-glow-color-hsl'];
      htmlEl.style.setProperty('--hologram-glow-color', `hsl(${glowColorHsl})`);
      
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
