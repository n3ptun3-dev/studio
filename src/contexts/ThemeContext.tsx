
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
    '--accent-hsl': '130 90% 55%', // Bright green for accents, glows
    '--accent-foreground-hsl': '130 20% 5%',
    '--destructive-hsl': '0 70% 50%',
    '--destructive-foreground-hsl': '0 0% 100%',
    '--border-hsl': '130 60% 35%',
    '--input-hsl': '130 30% 25%',
    '--ring-hsl': '130 70% 50%',
    '--hologram-glow-color-hsl': '130 90% 55%', // Direct HSL for terminal green glow

    // PAD specific HSL sources
    '--pad-bg-hsl': '130 25% 15%', // Darker green for PAD bg - Made this lighter than main bg
    '--pad-border-hsl': '130 60% 45%', // Brighter green for PAD border
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
    '--hologram-glow-color-hsl': '204 100% 50%', // Direct HSL for Cyphers glow

    // PAD specific HSL sources
    '--pad-bg-hsl': '210 50% 20%', // Made this lighter than main bg
    '--pad-border-hsl': '204 100% 70%',
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
    '--primary-hsl': '0 100% 40%', // Intense Red
    '--primary-foreground-hsl': '0 0% 100%',
    '--secondary-hsl': '16 100% 30%', // Darker Salmon
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
    '--hologram-glow-color-hsl': '0 100% 40%', // Direct HSL for Shadows glow

    // PAD specific HSL sources
    '--pad-bg-hsl': '0 50% 20%', // Made this lighter than main bg
    '--pad-border-hsl': '0 100% 60%',
    '--pad-button-panel-separator-hsl': '0 100% 25%',
    '--shadows-debug-color': 'red',
  },
  'neutral': { // Ensure neutral also has all variables
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
    '--hologram-glow-color-hsl': '180 70% 60%', // Uses accent-hsl

    // PAD specific HSL sources
    '--pad-bg-hsl': '220 15% 25%', // Made this lighter than main bg
    '--pad-border-hsl': '220 20% 40%',
    '--pad-button-panel-separator-hsl': '220 20% 20%',
    '--neutral-debug-color': 'gray',
  },
};

// CSS HSL source variables that ThemeProvider will set directly on :root's inline style
const CORE_HSL_VARIABLES_TO_SET_ON_ROOT = [
  '--background-hsl', '--foreground-hsl', '--card-hsl', '--card-foreground-hsl',
  '--popover-hsl', '--popover-foreground-hsl', '--primary-hsl', '--primary-foreground-hsl',
  '--secondary-hsl', '--secondary-foreground-hsl', '--muted-hsl', '--muted-foreground-hsl',
  '--accent-hsl', '--accent-foreground-hsl', '--destructive-hsl', '--destructive-foreground-hsl',
  '--border-hsl', '--input-hsl', '--ring-hsl',
];

const PAD_HSL_VARIABLES_TO_SET_ON_ROOT = [
  '--pad-bg-hsl', '--pad-border-hsl', '--pad-button-panel-separator-hsl'
];

const HOLOGRAM_HSL_VARIABLES_TO_SET_ON_ROOT = [
  '--hologram-glow-color-hsl' // This might not be strictly needed on :root if classes define it
];


export function ThemeProvider({ children, defaultTheme = "terminal-green", attribute, enableSystem, disableTransitionOnChange }: {
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
  }, [setThemeInternal]); // setThemeInternal is stable

  useEffect(() => {
    console.log(`[ThemeContext] Effect running. Current internal theme to apply: ${currentThemeInternal}`);
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
      
      if (themeColorsToSet) {
        // Set CORE HSL source variables
        CORE_HSL_VARIABLES_TO_SET_ON_ROOT.forEach(variableName => {
          if (themeColorsToSet[variableName]) {
            style.setProperty(variableName, themeColorsToSet[variableName]);
          } else {
             console.warn(`[ThemeContext] CORE HSL variable ${variableName} not found for theme ${effectiveTheme}`);
          }
        });

        // Set PAD HSL source variables
        PAD_HSL_VARIABLES_TO_SET_ON_ROOT.forEach(variableName => {
          if (themeColorsToSet[variableName]) {
            style.setProperty(variableName, themeColorsToSet[variableName]);
          } else {
             console.warn(`[ThemeContext] PAD HSL variable ${variableName} not found for theme ${effectiveTheme}`);
          }
        });
        
        // Set HOLOGRAM HSL source variables
        HOLOGRAM_HSL_VARIABLES_TO_SET_ON_ROOT.forEach(variableName => {
            if (themeColorsToSet[variableName]) {
              style.setProperty(variableName, themeColorsToSet[variableName]);
            } else {
               console.warn(`[ThemeContext] HOLOGRAM HSL variable ${variableName} not found for theme ${effectiveTheme}`);
            }
          });

        // Set final computed PAD colors with opacity (if needed, otherwise AgentSection will construct hsla)
        // For now, AgentSection will construct hsla using the --pad-bg-hsl variables.
        // We can re-introduce pre-computed effective colors here if direct hsl(var(--pad-bg-hsl)) doesn't work with opacity.
        
        // Example: If we wanted ThemeContext to set the final --pad-effective-background-color
        // if (themeColorsToSet['--pad-bg-hsl']) {
        //   const padEffectiveBg = `hsla(${themeColorsToSet['--pad-bg-hsl']}, 0.85)`;
        //   style.setProperty('--pad-effective-background-color', padEffectiveBg);
        // }
        // And similar for border and separator if they need opacity.

      } else {
        console.error(`[ThemeContext] No HSL values found for theme ${effectiveTheme}!`);
      }

      setThemeVersion(v => v + 1);
      // The log below will show the themeVersion *before* this increment, which is expected.
      // console.log(`[ThemeContext] Updated :root styles and themeVersion for theme ${effectiveTheme}`);
    }
  }, [currentThemeInternal]);


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
