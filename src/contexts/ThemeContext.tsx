
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type Theme =
  | 'terminal-green'
  | 'neutral'
  | 'cyphers'
  | 'shadows';

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
const themeHSLValues: Record<Theme, Record<string, string>> = {
  'terminal-green': {
    '--background-hsl': '130 20% 5%',
    '--foreground-hsl': '130 80% 70%',
    '--card-hsl': '130 25% 8%',
    '--card-foreground-hsl': '130 80% 75%',
    '--popover-hsl': '130 25% 12%',
    '--popover-foreground-hsl': '130 80% 75%',
    '--primary-hsl': '130 70% 45%',
    '--primary-foreground-hsl': '130 80% 90%', // Brighter for text on primary
    '--secondary-hsl': '130 30% 20%',
    '--secondary-foreground-hsl': '130 70% 60%',
    '--muted-hsl': '130 25% 15%',
    '--muted-foreground-hsl': '130 40% 50%',
    '--accent-hsl': '130 90% 55%',
    '--accent-foreground-hsl': '130 20% 5%',
    '--destructive-hsl': '0 70% 50%',
    '--destructive-foreground-hsl': '0 0% 100%',
    '--border-hsl': '130 60% 35%',
    '--input-hsl': '130 30% 25%',
    '--ring-hsl': '130 70% 50%',
    '--hologram-panel-bg-hsl': '130 25% 8%', // from card-hsl
    '--hologram-panel-border-hsl': '130 60% 35%', // from border-hsl
    '--hologram-glow-color-hsl': '130 90% 55%', // from accent-hsl
    '--hologram-base-text-color-hsl': '130 80% 70%', // from foreground-hsl
    '--hologram-button-bg-hsl': '130 70% 45%', // from primary-hsl
    '--hologram-button-text-hsl': '130 85% 85%', // Brighter green for button text
    '--pad-bg-hsl': '130 20% 7%', 
    '--pad-border-hsl': '130 50% 30%',
    '--pad-button-panel-separator-hsl': '130 50% 25%',
    '--terminal-green-debug-color': 'lime',
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
    '--hologram-panel-bg-hsl': '210 50% 12%',
    '--hologram-panel-border-hsl': '204 100% 60%',
    '--hologram-glow-color-hsl': '204 100% 50%',
    '--hologram-base-text-color-hsl': '200 100% 90%',
    '--hologram-button-bg-hsl': '204 100% 50%',
    '--hologram-button-text-hsl': '0 0% 100%',
    '--pad-bg-hsl': '210 50% 10%', 
    '--pad-border-hsl': '204 100% 50%',
    '--pad-button-panel-separator-hsl': '204 100% 40%',
    '--cyphers-debug-color': 'blue',
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
    '--hologram-panel-bg-hsl': '0 50% 12%',
    '--hologram-panel-border-hsl': '0 100% 40%', // Adjusted from 50% to 40%
    '--hologram-glow-color-hsl': '0 100% 40%',
    '--hologram-base-text-color-hsl': '0 0% 90%',
    '--hologram-button-bg-hsl': '0 100% 40%',
    '--hologram-button-text-hsl': '0 0% 100%',
    '--pad-bg-hsl': '0 50% 10%', 
    '--pad-border-hsl': '0 100% 30%',
    '--pad-button-panel-separator-hsl': '0 100% 25%',
    '--shadows-debug-color': 'red',
  },
  'neutral': {
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
    '--accent-hsl': '180 70% 60%',
    '--accent-foreground-hsl': '220 10% 10%',
    '--destructive-hsl': '0 70% 50%',
    '--destructive-foreground-hsl': '0 0% 100%',
    '--border-hsl': '220 20% 30%',
    '--input-hsl': '220 20% 25%',
    '--ring-hsl': '220 60% 55%',
    '--hologram-panel-bg-hsl': '220 15% 12%',
    '--hologram-panel-border-hsl': '220 20% 30%',
    '--hologram-glow-color-hsl': '180 70% 60%',
    '--hologram-base-text-color-hsl': '220 10% 70%',
    '--hologram-button-bg-hsl': '220 60% 50%',
    '--hologram-button-text-hsl': '220 10% 95%',
    '--pad-bg-hsl': '220 15% 10%', 
    '--pad-border-hsl': '220 20% 25%',
    '--pad-button-panel-separator-hsl': '220 20% 20%',
    '--neutral-debug-color': 'gray',
  },
};

export function ThemeProvider({ children, defaultTheme = "terminal-green" }: {
    children: ReactNode,
    defaultTheme?: Theme,
    // Props below are from next-themes, not used here as we manually manage
    attribute?: string, 
    enableSystem?: boolean,
    disableTransitionOnChange?: boolean,
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

      availableThemesList.forEach(tName => {
        if (tName) htmlEl.classList.remove(`theme-${tName}`);
      });
      
      const effectiveThemeName = (availableThemesList as string[]).includes(currentThemeInternal) 
        ? currentThemeInternal 
        : 'terminal-green';
      htmlEl.classList.add(`theme-${effectiveThemeName}`);
      console.log(`[ThemeContext] Applied theme class to HTML: theme-${effectiveThemeName}`);

      const themeColorsToSet = themeHSLValues[effectiveThemeName];
      
      // Define all HSL variables that will be set on :root's inline style
      const hslVariableKeys = Object.keys(themeColorsToSet).filter(key => key.endsWith('-hsl'));

      hslVariableKeys.forEach(variable => {
        style.setProperty(variable, themeColorsToSet[variable]);
      });
      
      // Set composite color variables (like --primary, --background) on :root
      // These use the -hsl variables that were just set on :root.
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
      style.setProperty('--hologram-panel-bg', `hsla(${themeColorsToSet['--hologram-panel-bg-hsl']}, 0.6)`);
      style.setProperty('--hologram-panel-border', `hsl(${themeColorsToSet['--hologram-panel-border-hsl']})`);
      style.setProperty('--hologram-glow-color', `hsl(${themeColorsToSet['--hologram-glow-color-hsl']})`);
      style.setProperty('--hologram-base-text-color', `hsl(${themeColorsToSet['--hologram-base-text-color-hsl']})`);
      style.setProperty('--hologram-button-bg', `hsl(${themeColorsToSet['--hologram-button-bg-hsl']})`);
      style.setProperty('--hologram-button-text', `hsl(${themeColorsToSet['--hologram-button-text-hsl']})`);

      // PAD specific composite variables, using the --pad-*-hsl vars set on :root
      style.setProperty('--pad-background-color', `hsla(${themeColorsToSet['--pad-bg-hsl']}, 0.85)`);
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
        return prevTheme;
      }
      console.warn(`[ThemeContext] setTheme callback: Attempted to set invalid theme: ${newTheme}`);
      return prevTheme;
    });
  }, [setThemeInternal]);

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
