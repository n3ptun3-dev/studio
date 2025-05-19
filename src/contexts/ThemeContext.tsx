
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type Theme =
  | 'terminal-green'
  | 'neutral'
  | 'cyphers'
  | 'shadows';
  // Add other specific item level/aesthetic themes here if they are distinct global themes
  // | 'level-1-grey' ... etc.

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  availableThemes: Theme[];
  themeVersion: number;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const availableThemesList: Theme[] = [
  'terminal-green', 'neutral', 'cyphers', 'shadows',
];

// HSL value definitions for each theme's core CSS variables
// Ensure PAD-specific HSL variables are defined for each theme.
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
    '--muted-hsl': '130 25% 15%',
    '--muted-foreground-hsl': '130 40% 50%',
    '--accent-hsl': '130 90% 55%', // Bright green for terminal
    '--accent-foreground-hsl': '130 20% 5%',
    '--destructive-hsl': '0 70% 50%',
    '--destructive-foreground-hsl': '0 0% 100%',
    '--border-hsl': '130 60% 35%',
    '--input-hsl': '130 30% 25%',
    '--ring-hsl': '130 70% 50%',
    '--hologram-glow-color-hsl': '130 90% 55%', // Using accent for terminal green glow
    '--pad-bg-hsl': '130 25% 8%', // Derived from card-hsl
    '--pad-border-hsl': '130 60% 35%', // Derived from border-hsl
    '--pad-button-panel-separator-hsl': '130 60% 35%',// Derived from border-hsl
  },
  'cyphers': {
    '--background-hsl': '210 60% 8%',
    '--foreground-hsl': '200 100% 90%',
    '--card-hsl': '210 50% 12%',
    '--card-foreground-hsl': '200 100% 90%',
    '--popover-hsl': '210 50% 15%',
    '--popover-foreground-hsl': '200 100% 90%',
    '--primary-hsl': '204 100% 50%', // Electric Blue
    '--primary-foreground-hsl': '0 0% 100%',
    '--secondary-hsl': '180 100% 50%', // Pale Turquoise
    '--secondary-foreground-hsl': '200 100% 90%',
    '--muted-hsl': '210 50% 18%',
    '--muted-foreground-hsl': '200 80% 70%',
    '--accent-hsl': '0 0% 100%', // White
    '--accent-foreground-hsl': '210 60% 8%',
    '--destructive-hsl': '0 70% 50%',
    '--destructive-foreground-hsl': '0 0% 100%',
    '--border-hsl': '204 100% 60%',
    '--input-hsl': '210 40% 15%',
    '--ring-hsl': '204 100% 55%',
    '--hologram-glow-color-hsl': '204 100% 50%', // Cyphers primary for glow
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
    '--primary-hsl': '0 100% 40%', // Intense Red
    '--primary-foreground-hsl': '0 0% 100%',
    '--secondary-hsl': '16 100% 71%', // Light Salmon
    '--secondary-foreground-hsl': '0 0% 90%',
    '--muted-hsl': '0 50% 18%',
    '--muted-foreground-hsl': '0 0% 70%',
    '--accent-hsl': '0 0% 100%', // White
    '--accent-foreground-hsl': '0 60% 8%',
    '--destructive-hsl': '0 70% 50%',
    '--destructive-foreground-hsl': '0 0% 100%',
    '--border-hsl': '0 100% 50%',
    '--input-hsl': '0 40% 15%',
    '--ring-hsl': '0 100% 55%',
    '--hologram-glow-color-hsl': '0 100% 40%', // Shadows primary for glow
    '--pad-bg-hsl': '0 50% 12%',
    '--pad-border-hsl': '0 100% 50%',
    '--pad-button-panel-separator-hsl': '0 100% 50%',
  },
  'neutral': { // Used for pre-selection FactionChoiceScreen
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
    '--accent-hsl': '220 70% 60%', // Muted blue for neutral accent
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
};

export function ThemeProvider({ children, defaultTheme = "terminal-green" }: {
    children: ReactNode,
    defaultTheme?: Theme,
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
      const style = htmlEl.style;

      // Remove all theme classes first
      availableThemesList.forEach(tName => {
        if (tName) htmlEl.classList.remove(`theme-${tName}`);
      });
      
      const effectiveThemeName = (availableThemesList as string[]).includes(currentThemeInternal) ? currentThemeInternal : 'terminal-green';
      htmlEl.classList.add(`theme-${effectiveThemeName}`);
      console.log(`[ThemeContext] Applied theme class to HTML: theme-${effectiveThemeName}`);

      const themeColorsToSet = themeHSLValues[effectiveThemeName];
      
      // Define all HSL variables that will be set on :root
      // Ensure all themes have these defined in themeHSLValues
      const hslVariablesToSet = [
        '--background-hsl', '--foreground-hsl', '--card-hsl', '--card-foreground-hsl',
        '--popover-hsl', '--popover-foreground-hsl', '--primary-hsl', '--primary-foreground-hsl',
        '--secondary-hsl', '--secondary-foreground-hsl', '--muted-hsl', '--muted-foreground-hsl',
        '--accent-hsl', '--accent-foreground-hsl', '--destructive-hsl', '--destructive-foreground-hsl',
        '--border-hsl', '--input-hsl', '--ring-hsl', 
        '--hologram-glow-color-hsl',
        '--pad-bg-hsl', '--pad-border-hsl', '--pad-button-panel-separator-hsl'
      ];

      hslVariablesToSet.forEach(variable => {
        if (themeColorsToSet[variable]) {
          style.setProperty(variable, themeColorsToSet[variable]);
        } else {
          // Fallback to terminal-green if a specific HSL variable is missing for the current theme
          // This prevents errors if a theme is incomplete in themeHSLValues
          style.setProperty(variable, themeHSLValues['terminal-green'][variable] || '');
        }
      });
      
      // Set composite color variables that depend on the -hsl ones now set on :root
      style.setProperty('--background', `hsl(${themeColorsToSet['--background-hsl']})`);
      style.setProperty('--foreground', `hsl(${themeColorsToSet['--foreground-hsl']})`);
      style.setProperty('--card', `hsl(${themeColorsToSet['--card-hsl']})`);
      style.setProperty('--card-foreground', `hsl(${themeColorsToSet['--card-foreground-hsl']})`);
      style.setProperty('--popover', `hsl(${themeColorsToSet['--popover-hsl']})`);
      style.setProperty('--popover-foreground', `hsl(${themeColorsToSet['--popover-foreground-hsl']})`);
      style.setProperty('--primary', `hsl(${themeColorsToSet['--primary-hsl']})`);
      style.setProperty('--primary-foreground', `hsl(${themeColorsToSet['--primary-foreground-hsl']})`);
      style.setProperty('--secondary', `hsl(${themeColorsToSet['--secondary-hsl']})`);
      style.setProperty('--secondary-foreground', `hsl(${themeColorsToSet['--secondary-foreground-hsl']})`);
      style.setProperty('--muted', `hsl(${themeColorsToSet['--muted-hsl']})`);
      style.setProperty('--muted-foreground', `hsl(${themeColorsToSet['--muted-foreground-hsl']})`);
      style.setProperty('--accent', `hsl(${themeColorsToSet['--accent-hsl']})`);
      style.setProperty('--accent-foreground', `hsl(${themeColorsToSet['--accent-foreground-hsl']})`);
      style.setProperty('--destructive', `hsl(${themeColorsToSet['--destructive-hsl']})`);
      style.setProperty('--destructive-foreground', `hsl(${themeColorsToSet['--destructive-foreground-hsl']})`);
      style.setProperty('--border', `hsl(${themeColorsToSet['--border-hsl']})`);
      style.setProperty('--input', `hsl(${themeColorsToSet['--input-hsl']})`);
      style.setProperty('--ring', `hsl(${themeColorsToSet['--ring-hsl']})`);
      
      // Holographic composite variables
      style.setProperty('--hologram-glow-color', `hsl(${themeColorsToSet['--hologram-glow-color-hsl']})`);
      style.setProperty('--hologram-panel-bg', `hsla(${themeColorsToSet['--card-hsl']}, 0.6)`);
      style.setProperty('--hologram-panel-border', `hsl(${themeColorsToSet['--border-hsl']})`); // Changed from primary-hsl
      style.setProperty('--hologram-base-text-color', `hsl(${themeColorsToSet['--foreground-hsl']})`);
      style.setProperty('--hologram-button-bg', `hsl(${themeColorsToSet['--primary-hsl']})`);
      style.setProperty('--hologram-button-text', `hsl(${themeColorsToSet['--primary-foreground-hsl']})`);

      // PAD specific composite variables, now using variables set above
      style.setProperty('--pad-background-color', `hsla(${themeColorsToSet['--pad-bg-hsl']}, 0.85)`); // Increased opacity
      style.setProperty('--pad-border-color', `hsl(${themeColorsToSet['--pad-border-hsl']})`);
      style.setProperty('--pad-button-panel-separator-color', `hsla(${themeColorsToSet['--pad-button-panel-separator-hsl']}, 0.5)`);
      
      setThemeVersion(v => v + 1);
      console.log(`[ThemeContext] Updated :root styles and themeVersion to ${themeVersion + 1} for theme ${effectiveThemeName}`);
    }
  }, [currentThemeInternal]); // Only re-run if the internal theme selection changes

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeInternal(prevTheme => {
      if (availableThemesList.includes(newTheme)) {
        if (prevTheme !== newTheme) {
          console.log(`[ThemeContext] setTheme callback: Actually changing theme from ${prevTheme} to ${newTheme}`);
          return newTheme;
        }
        // console.log(`[ThemeContext] setTheme callback: Theme is already ${newTheme}, no change.`);
        return prevTheme;
      }
      console.warn(`[ThemeContext] setTheme callback: Attempted to set invalid theme: ${newTheme}`);
      return prevTheme; // Return previous theme if new one is invalid
    });
  }, [setThemeInternal]); // setThemeInternal from useState is stable

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
