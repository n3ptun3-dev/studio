
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
  'terminal-green', 'neutral', 'cyphers', 'shadows', // Core themes
  // Add other aesthetic themes if they have full HSL definitions
];

// HSL value definitions for each theme's core CSS variables
// These are the SOURCE values. JS will set them on :root.
const themeHSLValues: Record<Theme, Record<string, string>> = {
  'terminal-green': {
    '--background-hsl': '130 20% 5%',
    '--foreground-hsl': '130 80% 70%',
    '--card-hsl': '130 25% 8%',
    '--card-foreground-hsl': '130 80% 75%',
    '--popover-hsl': '130 25% 12%',
    '--popover-foreground-hsl': '130 80% 75%',
    '--primary-hsl': '130 70% 45%',
    '--primary-foreground-hsl': '130 80% 80%',
    '--secondary-hsl': '130 30% 20%',
    '--secondary-foreground-hsl': '130 70% 60%',
    '--muted-hsl': '130 25% 15%', // Adjusted for terminal
    '--muted-foreground-hsl': '130 40% 50%', // Adjusted for terminal
    '--accent-hsl': '130 90% 55%',
    '--accent-foreground-hsl': '130 20% 5%',
    '--destructive-hsl': '0 70% 50%',
    '--destructive-foreground-hsl': '0 0% 100%',
    '--border-hsl': '130 60% 35%',
    '--input-hsl': '130 30% 25%',
    '--ring-hsl': '130 70% 50%',
    '--hologram-glow-color-hsl': '130 90% 55%', // Specific HSL for glow
    '--pad-bg-hsl': '130 25% 8%', // e.g., same as card
    '--pad-border-hsl': '130 60% 35%', // e.g., same as border
    '--pad-button-panel-separator-hsl': '130 60% 35%', // e.g., same as border
  },
  'cyphers': {
    '--background-hsl': '210 60% 8%',
    '--foreground-hsl': '200 100% 90%',
    '--card-hsl': '210 50% 12%',
    '--card-foreground-hsl': '200 100% 90%',
    '--popover-hsl': '210 50% 15%',
    '--popover-foreground-hsl': '200 100% 90%',
    '--primary-hsl': '204 100% 50%',
    '--primary-foreground-hsl': '0 0% 100%',
    '--secondary-hsl': '180 100% 50%',
    '--secondary-foreground-hsl': '200 100% 90%',
    '--muted-hsl': '210 50% 18%',
    '--muted-foreground-hsl': '200 80% 70%',
    '--accent-hsl': '0 0% 100%',
    '--accent-foreground-hsl': '210 60% 8%',
    '--destructive-hsl': '0 70% 50%',
    '--destructive-foreground-hsl': '0 0% 100%',
    '--border-hsl': '204 100% 60%',
    '--input-hsl': '210 40% 15%',
    '--ring-hsl': '204 100% 55%',
    '--hologram-glow-color-hsl': '204 100% 50%',
    '--pad-bg-hsl': '210 50% 12%',
    '--pad-border-hsl': '204 100% 60%',
    '--pad-button-panel-separator-hsl': '204 100% 60%',
  },
  'shadows': {
    '--background-hsl': '0 60% 8%',
    '--foreground-hsl': '0 0% 90%',
    '--card-hsl': '0 50% 12%',
    '--card-foreground-hsl': '0 0% 90%',
    '--popover-hsl': '0 50% 15%',
    '--popover-foreground-hsl': '0 0% 90%',
    '--primary-hsl': '0 100% 40%',
    '--primary-foreground-hsl': '0 0% 100%',
    '--secondary-hsl': '16 100% 71%',
    '--secondary-foreground-hsl': '0 0% 90%',
    '--muted-hsl': '0 50% 18%',
    '--muted-foreground-hsl': '0 0% 70%',
    '--accent-hsl': '0 0% 100%',
    '--accent-foreground-hsl': '0 60% 8%',
    '--destructive-hsl': '0 70% 50%',
    '--destructive-foreground-hsl': '0 0% 100%',
    '--border-hsl': '0 100% 50%',
    '--input-hsl': '0 40% 15%',
    '--ring-hsl': '0 100% 55%',
    '--hologram-glow-color-hsl': '0 100% 40%',
    '--pad-bg-hsl': '0 50% 12%',
    '--pad-border-hsl': '0 100% 50%',
    '--pad-button-panel-separator-hsl': '0 100% 50%',
  },
  'neutral': { // Fallback neutral, typically for pre-selection screens
    '--background-hsl': '220 10% 10%',
    '--foreground-hsl': '220 10% 70%',
    '--card-hsl': '220 15% 12%',
    '--card-foreground-hsl': '220 10% 75%',
    '--popover-hsl': '220 15% 15%',
    '--popover-foreground-hsl': '220 10% 75%',
    '--primary-hsl': '220 60% 50%',
    '--primary-foreground-hsl': '220 10% 95%',
    '--secondary-hsl': '220 20% 20%',
    '--secondary-foreground-hsl': '220 10% 60%',
    '--muted-hsl': '220 15% 25%',
    '--muted-foreground-hsl': '220 10% 55%',
    '--accent-hsl': '220 70% 60%',
    '--accent-foreground-hsl': '220 10% 10%',
    '--destructive-hsl': '0 70% 50%',
    '--destructive-foreground-hsl': '0 0% 100%',
    '--border-hsl': '220 20% 30%',
    '--input-hsl': '220 20% 25%',
    '--ring-hsl': '220 60% 55%',
    '--hologram-glow-color-hsl': '220 70% 60%',
    '--pad-bg-hsl': '220 15% 12%',
    '--pad-border-hsl': '220 20% 30%',
    '--pad-button-panel-separator-hsl': '220 20% 30%',
  },
  // Other themes would need their HSLs defined here...
};

export function ThemeProvider({ children, defaultTheme = "terminal-green" }: {
    children: ReactNode,
    defaultTheme?: Theme,
    // Props like attribute, enableSystem, disableTransitionOnChange are simplified out for this app
}) {
  const [currentThemeInternal, setThemeInternal] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('tod-theme') as Theme | null;
      if (storedTheme && (availableThemesList as string[]).includes(storedTheme)) {
        return storedTheme;
      }
    }
    return (availableThemesList as string[]).includes(defaultTheme) ? defaultTheme : 'terminal-green';
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
      if (currentThemeInternal && (availableThemesList as string[]).includes(currentThemeInternal)) {
        htmlEl.classList.add(`theme-${currentThemeInternal}`);
        console.log(`[ThemeContext] Applied theme class to HTML: theme-${currentThemeInternal}`);
      }

      // Directly set CSS HSL variables on :root's inline style
      const themeColorsToSet = themeHSLValues[currentThemeInternal] || themeHSLValues['terminal-green']; // Fallback
      
      // Define which variables to set on :root dynamically
      const rootVariables = [
        '--background-hsl', '--foreground-hsl', '--card-hsl', '--card-foreground-hsl',
        '--popover-hsl', '--popover-foreground-hsl', '--primary-hsl', '--primary-foreground-hsl',
        '--secondary-hsl', '--secondary-foreground-hsl', '--muted-hsl', '--muted-foreground-hsl',
        '--accent-hsl', '--accent-foreground-hsl', '--destructive-hsl', '--destructive-foreground-hsl',
        '--border-hsl', '--input-hsl', '--ring-hsl', '--hologram-glow-color-hsl',
        // PAD specific HSL variables
        '--pad-bg-hsl', '--pad-border-hsl', '--pad-button-panel-separator-hsl'
      ];

      for (const variable of rootVariables) {
        if (themeColorsToSet[variable]) {
          htmlEl.style.setProperty(variable, themeColorsToSet[variable]);
        }
      }

      // Set composite variables that depend on the -hsl ones, also directly on :root
      // This ensures highest specificity for these core colors.
      htmlEl.style.setProperty('--background', `hsl(${themeColorsToSet['--background-hsl']})`);
      htmlEl.style.setProperty('--foreground', `hsl(${themeColorsToSet['--foreground-hsl']})`);
      htmlEl.style.setProperty('--card', `hsl(${themeColorsToSet['--card-hsl']})`);
      htmlEl.style.setProperty('--card-foreground', `hsl(${themeColorsToSet['--card-foreground-hsl']})`);
      htmlEl.style.setProperty('--popover', `hsl(${themeColorsToSet['--popover-hsl']})`);
      htmlEl.style.setProperty('--popover-foreground', `hsl(${themeColorsToSet['--popover-foreground-hsl']})`);
      htmlEl.style.setProperty('--primary', `hsl(${themeColorsToSet['--primary-hsl']})`);
      htmlEl.style.setProperty('--primary-foreground', `hsl(${themeColorsToSet['--primary-foreground-hsl']})`);
      htmlEl.style.setProperty('--secondary', `hsl(${themeColorsToSet['--secondary-hsl']})`);
      htmlEl.style.setProperty('--secondary-foreground', `hsl(${themeColorsToSet['--secondary-foreground-hsl']})`);
      htmlEl.style.setProperty('--muted', `hsl(${themeColorsToSet['--muted-hsl']})`);
      htmlEl.style.setProperty('--muted-foreground', `hsl(${themeColorsToSet['--muted-foreground-hsl']})`);
      htmlEl.style.setProperty('--accent', `hsl(${themeColorsToSet['--accent-hsl']})`);
      htmlEl.style.setProperty('--accent-foreground', `hsl(${themeColorsToSet['--accent-foreground-hsl']})`);
      htmlEl.style.setProperty('--destructive', `hsl(${themeColorsToSet['--destructive-hsl']})`);
      htmlEl.style.setProperty('--destructive-foreground', `hsl(${themeColorsToSet['--destructive-foreground-hsl']})`);
      htmlEl.style.setProperty('--border', `hsl(${themeColorsToSet['--border-hsl']})`);
      htmlEl.style.setProperty('--input', `hsl(${themeColorsToSet['--input-hsl']})`);
      htmlEl.style.setProperty('--ring', `hsl(${themeColorsToSet['--ring-hsl']})`);
      htmlEl.style.setProperty('--hologram-glow-color', `hsl(${themeColorsToSet['--hologram-glow-color-hsl']})`);

      // PAD specific composite variables
      htmlEl.style.setProperty('--pad-background-color', `hsla(${themeColorsToSet['--pad-bg-hsl']}, 0.75)`); // Example 0.75 opacity
      htmlEl.style.setProperty('--pad-border-color', `hsl(${themeColorsToSet['--pad-border-hsl']})`);
      htmlEl.style.setProperty('--pad-button-panel-separator-color', `hsla(${themeColorsToSet['--pad-button-panel-separator-hsl']}, 0.5)`); // Example 0.5 opacity
      
      setThemeVersion(v => v + 1);
      console.log(`[ThemeContext] Updated :root styles and themeVersion to ${themeVersion + 1} for theme ${currentThemeInternal}`);
    }
  }, [currentThemeInternal]); // Only re-run when the internal theme choice changes

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeInternal(prevTheme => {
      if ((availableThemesList as string[]).includes(newTheme)) {
        if (prevTheme !== newTheme) {
          console.log(`[ThemeContext] setTheme: Actually changing theme from ${prevTheme} to ${newTheme}`);
          return newTheme;
        }
        console.log(`[ThemeContext] setTheme: Theme is already ${newTheme}, no change.`);
        return prevTheme;
      }
      console.warn(`[ThemeContext] setTheme: Attempted to set invalid theme: ${newTheme}`);
      return prevTheme;
    });
  }, [setThemeInternal]); // setThemeInternal is stable

  const contextValue = React.useMemo(() => ({
    theme: currentThemeInternal,
    setTheme,
    availableThemes: availableThemesList,
    themeVersion,
  }), [currentThemeInternal, setTheme, themeVersion, availableThemesList]);

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

    