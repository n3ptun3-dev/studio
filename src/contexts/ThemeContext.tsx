
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

// HSL value definitions (space-separated, no commas, no "hsl()")
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
    // PAD specific HSL sources
    '--pad-bg-hsl': '130 25% 15%', 
    '--pad-border-hsl': '130 60% 45%',
    '--pad-button-panel-separator-hsl': '130 50% 25%',
    // Holographic
    '--hologram-glow-color-hsl': 'hsl(130 90% 55%)', 
    '--hologram-button-text-hsl': 'hsl(130 85% 75%)',
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
    '--secondary-hsl': '180 100% 35%',
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
    // PAD specific HSL sources
    '--pad-bg-hsl': '210 50% 18%', 
    '--pad-border-hsl': '204 100% 70%',
    '--pad-button-panel-separator-hsl': '204 100% 40%',
    // Holographic
    '--hologram-glow-color-hsl': 'hsl(204 100% 50%)',
    '--hologram-button-text-hsl': 'hsl(0 0% 100%)',
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
    '--secondary-hsl': '16 100% 30%',
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
    // PAD specific HSL sources
    '--pad-bg-hsl': '0 50% 18%', 
    '--pad-border-hsl': '0 100% 60%',
    '--pad-button-panel-separator-hsl': '0 100% 25%',
    // Holographic
    '--hologram-glow-color-hsl': 'hsl(0 100% 40%)',
    '--hologram-button-text-hsl': 'hsl(0 0% 100%)',
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
    // PAD specific HSL sources
    '--pad-bg-hsl': '220 15% 18%',
    '--pad-border-hsl': '220 20% 35%',
    '--pad-button-panel-separator-hsl': '220 20% 25%',
    // Holographic
    '--hologram-glow-color-hsl': 'hsl(180 70% 60%)',
    '--hologram-button-text-hsl': 'hsl(220 10% 95%)',
    '--neutral-debug-color': 'gray',
  },
};

// Variables that ThemeContext will set directly on :root's inline style
const HSL_VARIABLES_TO_SET_ON_ROOT = [
  '--background-hsl', '--foreground-hsl', '--card-hsl', '--card-foreground-hsl',
  '--popover-hsl', '--popover-foreground-hsl', '--primary-hsl', '--primary-foreground-hsl',
  '--secondary-hsl', '--secondary-foreground-hsl', '--muted-hsl', '--muted-foreground-hsl',
  '--accent-hsl', '--accent-foreground-hsl', '--destructive-hsl', '--destructive-foreground-hsl',
  '--border-hsl', '--input-hsl', '--ring-hsl',
  // PAD specific HSL sources
  '--pad-bg-hsl', '--pad-border-hsl', '--pad-button-panel-separator-hsl',
  // Holographic - direct HSL values, not HSL variable sources
  '--hologram-glow-color-hsl', '--hologram-button-text-hsl', 
];

export function ThemeProvider({ children, defaultTheme = "terminal-green" }: {
    children: ReactNode,
    defaultTheme?: Theme,
    attribute?: string, // Kept for potential future use with next-themes if direct JS manipulation fails
    enableSystem?: boolean, // Kept for potential future use
    disableTransitionOnChange?: boolean, // Kept for potential future use
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
    setThemeInternal(currentInternalTheme => {
      if (availableThemesList.includes(newTheme)) {
        // console.log(`[ThemeContext] setTheme callback invoked with newTheme: ${newTheme}`);
        if (currentInternalTheme !== newTheme) {
          // console.log(`[ThemeContext] Actually changing theme from ${currentInternalTheme} to ${newTheme}`);
          return newTheme;
        }
        // console.log(`[ThemeContext] Theme already set to ${newTheme}, no change.`);
        return currentInternalTheme;
      }
      // console.warn(`[ThemeContext] Attempted to set invalid theme: ${newTheme}`);
      return currentInternalTheme;
    });
  }, [setThemeInternal]); // setThemeInternal from useState is stable

  useEffect(() => {
    // console.log(`[ThemeContext] Effect running. Current internal theme to apply: ${currentThemeInternal}`);
    if (typeof window !== 'undefined') {
      localStorage.setItem('tod-theme', currentThemeInternal);
      const htmlEl = document.documentElement;
      const style = htmlEl.style;

      // Remove all theme classes first
      availableThemesList.forEach(tName => {
        if (tName) htmlEl.classList.remove(`theme-${tName}`);
      });
      
      const effectiveTheme = (availableThemesList as string[]).includes(currentThemeInternal) 
        ? currentThemeInternal 
        : 'terminal-green';
      
      htmlEl.classList.add(`theme-${effectiveTheme}`);
      // console.log(`[ThemeContext] Applied theme class to HTML: theme-${effectiveTheme}`);

      const themeColorsToSet = themeHSLValues[effectiveTheme];
      
      if (themeColorsToSet) {
        // Set all HSL source variables from the theme map directly on :root
        HSL_VARIABLES_TO_SET_ON_ROOT.forEach(variableName => {
          if (themeColorsToSet[variableName]) {
            style.setProperty(variableName, themeColorsToSet[variableName]);
          } else {
             // console.warn(`[ThemeContext] HSL variable ${variableName} not found for theme ${effectiveTheme}`);
          }
        });
        
        // Set pre-computed "effective" colors for PAD, including opacity, directly on :root
        if (themeColorsToSet['--pad-bg-hsl']) {
          const padEffectiveBg = `hsla(${themeColorsToSet['--pad-bg-hsl']}, 0.85)`;
          style.setProperty('--pad-effective-background-color', padEffectiveBg);
        } else {
           // console.warn(`[ThemeContext] --pad-bg-hsl not found for theme ${effectiveTheme} to compute --pad-effective-background-color`);
        }

        if (themeColorsToSet['--pad-border-hsl']) {
          const padEffectiveBorder = `hsl(${themeColorsToSet['--pad-border-hsl']})`;
          style.setProperty('--pad-effective-border-color', padEffectiveBorder);
        } else {
           // console.warn(`[ThemeContext] --pad-border-hsl not found for theme ${effectiveTheme} to compute --pad-effective-border-color`);
        }

        if (themeColorsToSet['--pad-button-panel-separator-hsl']) {
          const padEffectiveSeparator = `hsla(${themeColorsToSet['--pad-button-panel-separator-hsl']}, 0.5)`;
          style.setProperty('--pad-effective-button-panel-separator-color', padEffectiveSeparator);
        } else {
          // console.warn(`[ThemeContext] --pad-button-panel-separator-hsl not found for theme ${effectiveTheme} to compute --pad-effective-button-panel-separator-color`);
        }

        // Set theme debug colors
        const debugColorVar = `--${effectiveTheme}-debug-color`;
        if (themeColorsToSet[debugColorVar]) {
             style.setProperty(debugColorVar, themeColorsToSet[debugColorVar]);
        }


      } else {
        // console.error(`[ThemeContext] No HSL values found for theme ${effectiveTheme}!`);
      }

      setThemeVersion(v => v + 1);
      // console.log(`[ThemeContext] Updated :root styles and themeVersion to ${themeVersion + 1} for theme ${effectiveTheme}`);
    }
  }, [currentThemeInternal]); // Only re-run when the internal theme string changes


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
