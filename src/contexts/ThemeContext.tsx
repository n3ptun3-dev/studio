
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

// HSL string values (e.g., "H S% L%")
// These are the SOURCE HSL values. Opacity is applied when setting the final --effective-color variables.
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
    // Holographic HSLs
    '--hologram-glow-color-hsl': '130 90% 55%', 
    '--hologram-button-text-hsl': 'hsl(var(--primary-foreground-hsl))',
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
    // Holographic HSLs
    '--hologram-glow-color-hsl': '204 100% 50%', 
    '--hologram-button-text-hsl': 'hsl(var(--primary-foreground-hsl))',
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
    // PAD specific HSL sources
    '--pad-bg-hsl': '0 50% 18%', 
    '--pad-border-hsl': '0 100% 60%',
    '--pad-button-panel-separator-hsl': '0 100% 25%',
    // Holographic HSLs
    '--hologram-glow-color-hsl': '0 100% 40%', 
    '--hologram-button-text-hsl': 'hsl(var(--primary-foreground-hsl))',
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
    // Holographic HSLs
    '--hologram-glow-color-hsl': '180 70% 60%', 
    '--hologram-button-text-hsl': 'hsl(var(--primary-foreground-hsl))',
    '--neutral-debug-color': 'gray',
  },
};

const HSL_VARIABLES_TO_SET_ON_ROOT = [
  '--background-hsl', '--foreground-hsl', '--card-hsl', '--card-foreground-hsl',
  '--popover-hsl', '--popover-foreground-hsl', '--primary-hsl', '--primary-foreground-hsl',
  '--secondary-hsl', '--secondary-foreground-hsl', '--muted-hsl', '--muted-foreground-hsl',
  '--accent-hsl', '--accent-foreground-hsl', '--destructive-hsl', '--destructive-foreground-hsl',
  '--border-hsl', '--input-hsl', '--ring-hsl',
  '--hologram-glow-color-hsl', // This is an HSL fragment
  // PAD specific HSL sources
  '--pad-bg-hsl', '--pad-border-hsl', '--pad-button-panel-separator-hsl',
];

// These are direct color values, not HSL fragments for further composition
const CONCRETE_VARIABLES_TO_SET_ON_ROOT = [
    '--hologram-button-text', // This is already `hsl(var(--primary-foreground-hsl))`
    // Debug colors are direct values
    '--terminal-green-debug-color', 
    '--cyphers-debug-color', 
    '--shadows-debug-color', 
    '--neutral-debug-color',
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
    setThemeInternal(currentInternalTheme => {
      if (availableThemesList.includes(newTheme)) {
        console.log(`[ThemeContext] setTheme callback invoked with newTheme: ${newTheme}`);
        if (currentInternalTheme !== newTheme) {
          console.log(`[ThemeContext] Actually changing theme from ${currentInternalTheme} to ${newTheme}`);
          return newTheme;
        }
        console.log(`[ThemeContext] Theme already set to ${newTheme}, no change.`);
        return currentInternalTheme; 
      }
      console.warn(`[ThemeContext] Attempted to set invalid theme: ${newTheme}`);
      return currentInternalTheme; 
    });
  }, []); 

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
      
      const themeColorsToSet = themeHSLValues[effectiveTheme];
      
      if (themeColorsToSet) {
        console.log(`[ThemeContext] Applying HSL & Concrete variables for theme: ${effectiveTheme}`, themeColorsToSet);
        
        HSL_VARIABLES_TO_SET_ON_ROOT.forEach(variableName => {
          if (themeColorsToSet[variableName]) {
            style.setProperty(variableName, themeColorsToSet[variableName]);
          } else {
             style.removeProperty(variableName);
          }
        });

        CONCRETE_VARIABLES_TO_SET_ON_ROOT.forEach(variableName => {
          if (themeColorsToSet[variableName]) {
            style.setProperty(variableName, themeColorsToSet[variableName]);
          } else {
             style.removeProperty(variableName);
          }
        });
        
        // Set specific pre-computed --pad-effective-- color variables on :root
        const padEffectiveBg = `hsla(${themeColorsToSet['--pad-bg-hsl']}, 0.85)`;
        style.setProperty('--pad-effective-background-color', padEffectiveBg);

        const padEffectiveBorder = `hsl(${themeColorsToSet['--pad-border-hsl']})`;
        style.setProperty('--pad-effective-border-color', padEffectiveBorder);
        
        const padEffectiveSeparator = `hsla(${themeColorsToSet['--pad-button-panel-separator-hsl']}, 0.5)`;
        style.setProperty('--pad-effective-button-panel-separator-color', padEffectiveSeparator);
        
      } else {
        console.error(`[ThemeContext] No HSL values found for theme ${effectiveTheme}!`);
      }

      setThemeVersion(v => v + 1);
      console.log(`[ThemeContext] Applied theme to HTML: theme-${effectiveTheme} and updated :root styles. New themeVersion: ${themeVersion +1}.`);
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

    