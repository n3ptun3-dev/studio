
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

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
// Using space-separated HSL values (e.g., "H S% L%")
const themeHSLValues: Record<Theme, Record<string, string>> = {
  'terminal-green': {
    '--background-hsl': '130 20% 5%',
    '--foreground-hsl': '130 80% 70%',
    '--card-hsl': '130 25% 8%',
    '--card-foreground-hsl': '130 80% 75%',
    '--popover-hsl': '130 25% 12%',
    '--popover-foreground-hsl': '130 80% 75%',
    '--primary-hsl': '130 70% 45%',
    '--primary-foreground-hsl': '130 80% 90%',
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
    // PAD specific HSL sources for terminal-green
    '--pad-bg-hsl': '130 25% 15%', // Darker green for PAD bg
    '--pad-border-hsl': '130 60% 45%', // Brighter green for PAD border
    '--pad-button-panel-separator-hsl': '130 50% 25%',
    '--hologram-glow-color-hsl': '130 90% 55%', // Matches accent-hsl
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
    '--secondary-hsl': '180 100% 35%',
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
    // PAD specific HSL sources for cyphers
    '--pad-bg-hsl': '210 50% 18%', 
    '--pad-border-hsl': '204 100% 70%', 
    '--pad-button-panel-separator-hsl': '204 100% 40%',
    '--hologram-glow-color-hsl': '204 100% 50%', // Matches primary-hsl
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
    '--secondary-hsl': '16 100% 30%',
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
    // PAD specific HSL sources for shadows
    '--pad-bg-hsl': '0 50% 18%', 
    '--pad-border-hsl': '0 100% 60%', 
    '--pad-button-panel-separator-hsl': '0 100% 25%',
    '--hologram-glow-color-hsl': '0 100% 40%', // Matches primary-hsl
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
    // PAD specific HSL sources for neutral
    '--pad-bg-hsl': '220 15% 20%', 
    '--pad-border-hsl': '220 20% 40%', 
    '--pad-button-panel-separator-hsl': '220 20% 20%',
    '--hologram-glow-color-hsl': '180 70% 60%', // Uses accent-hsl
  },
};

// CSS HSL variables that ThemeProvider will set directly on :root's inline style
const CORE_HSL_VARIABLES_TO_SET_ON_ROOT = [
  '--background-hsl', '--foreground-hsl', '--card-hsl', '--card-foreground-hsl',
  '--popover-hsl', '--popover-foreground-hsl', '--primary-hsl', '--primary-foreground-hsl',
  '--secondary-hsl', '--secondary-foreground-hsl', '--muted-hsl', '--muted-foreground-hsl',
  '--accent-hsl', '--accent-foreground-hsl', '--destructive-hsl', '--destructive-foreground-hsl',
  '--border-hsl', '--input-hsl', '--ring-hsl', '--hologram-glow-color-hsl'
];

// PAD-specific HSL source variables (will be set on :root by JS)
const PAD_HSL_VARIABLES_TO_SET_ON_ROOT = [
  '--pad-bg-hsl', '--pad-border-hsl', '--pad-button-panel-separator-hsl'
];


export function ThemeProvider({ children, defaultTheme = "terminal-green" }: {
    children: ReactNode,
    defaultTheme?: Theme,
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

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeInternal(prevTheme => {
      if (availableThemesList.includes(newTheme)) {
        console.log(`[ThemeContext] setTheme callback invoked with newTheme: ${newTheme}`);
        if (prevTheme !== newTheme) {
          console.log(`[ThemeContext] Actually changing theme from ${prevTheme} to ${newTheme}`);
          return newTheme;
        }
        return prevTheme; 
      }
      console.warn(`[ThemeContext] Attempted to set invalid theme: ${newTheme}`);
      return prevTheme;
    });
  }, [setThemeInternal]); 

  useEffect(() => {
    console.log(`[ThemeContext] Effect running for currentThemeInternal: ${currentThemeInternal}`);
    if (typeof window !== 'undefined') {
      localStorage.setItem('tod-theme', currentThemeInternal);
      const htmlEl = document.documentElement;
      const style = htmlEl.style;

      availableThemesList.forEach(tName => {
        if (tName) htmlEl.classList.remove(`theme-${tName}`);
      });
      
      const effectiveTheme = (availableThemesList as string[]).includes(currentThemeInternal) 
        ? currentThemeInternal 
        : 'terminal-green';
      
      htmlEl.classList.add(`theme-${effectiveTheme}`);
      console.log(`[ThemeContext] Applied theme class to HTML: theme-${effectiveTheme}`);

      const themeColorsToSet = themeHSLValues[effectiveTheme];
      console.log(`[ThemeContext] Using HSL values from themeHSLValues for ${effectiveTheme}:`, themeColorsToSet);

      if (themeColorsToSet) {
        // Set core HSL variables
        CORE_HSL_VARIABLES_TO_SET_ON_ROOT.forEach(variableName => {
          if (themeColorsToSet[variableName]) {
            style.setProperty(variableName, themeColorsToSet[variableName]);
          } else {
             console.warn(`[ThemeContext] Core HSL variable ${variableName} not found for theme ${effectiveTheme}`);
          }
        });

        // Set PAD specific HSL source variables
        PAD_HSL_VARIABLES_TO_SET_ON_ROOT.forEach(variableName => {
          if (themeColorsToSet[variableName]) {
            style.setProperty(variableName, themeColorsToSet[variableName]);
          } else {
            console.warn(`[ThemeContext] PAD HSL variable ${variableName} not found for theme ${effectiveTheme}`);
          }
        });
        
        // Set final computed PAD colors directly
        if (themeColorsToSet['--pad-bg-hsl']) {
            const padBgColorString = `hsla(${themeColorsToSet['--pad-bg-hsl']}, 0.85)`;
            style.setProperty('--pad-effective-background-color', padBgColorString);
        } else {
            console.warn(`[ThemeContext] --pad-bg-hsl not found for theme ${effectiveTheme} when trying to set --pad-effective-background-color`);
        }

        if (themeColorsToSet['--pad-border-hsl']) {
            style.setProperty('--pad-effective-border-color', `hsl(${themeColorsToSet['--pad-border-hsl']})`);
        } else {
            console.warn(`[ThemeContext] --pad-border-hsl not found for theme ${effectiveTheme} when trying to set --pad-effective-border-color`);
        }

        if (themeColorsToSet['--pad-button-panel-separator-hsl']) {
            const padSeparatorColorString = `hsla(${themeColorsToSet['--pad-button-panel-separator-hsl']}, 0.5)`;
            style.setProperty('--pad-effective-button-panel-separator-color', padSeparatorColorString);
        } else {
            console.warn(`[ThemeContext] --pad-button-panel-separator-hsl not found for theme ${effectiveTheme} when trying to set --pad-effective-button-panel-separator-color`);
        }

      } else {
        console.error(`[ThemeContext] No HSL values found for theme ${effectiveTheme}!`);
      }

      setThemeVersion(v => v + 1);
      // The log below will show the themeVersion *before* this increment, which is expected.
      console.log(`[ThemeContext] Updated :root styles. Theme version will be ${themeVersion + 1}. Applied for theme ${effectiveTheme}`);
    }
  }, [currentThemeInternal]); // Only currentThemeInternal. themeVersion is removed to prevent loop.


  const contextValue = useMemo(() => ({
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
