
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

// HSL string values (e.g., "H S% L%"), no commas.
// These are the SOURCE HSL values.
// For panel backgrounds, ensure Lightness is high enough to be visible with opacity (e.g., 15-20%).
const themeHSLValues: Record<Theme, Record<string, string>> = {
  'terminal-green': {
    '--background-hsl': '130 20% 5%',
    '--foreground-hsl': '130 80% 70%',
    '--card-hsl': '130 25% 8%', // Base for panels
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
    '--pad-bg-hsl': '130 25% 15%', // PAD specific, slightly lighter than main bg
    '--pad-border-hsl': '130 60% 45%',
    '--pad-button-panel-separator-hsl': '130 50% 25%',
    '--hologram-panel-bg-hsl': '130 30% 15%', // Base HSL for general holographic panels
    '--hologram-glow-color': 'hsl(130 90% 55%)', // Direct HSL value
    '--hologram-button-text': 'hsl(130 85% 75%)', // Direct HSL value
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
    '--pad-bg-hsl': '210 50% 18%', 
    '--pad-border-hsl': '204 100% 70%',
    '--pad-button-panel-separator-hsl': '204 100% 40%',
    '--hologram-panel-bg-hsl': '210 50% 15%', 
    '--hologram-glow-color': 'hsl(204 100% 50%)', 
    '--hologram-button-text': 'hsl(0 0% 100%)',
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
    '--pad-bg-hsl': '0 50% 18%', 
    '--pad-border-hsl': '0 100% 60%',
    '--pad-button-panel-separator-hsl': '0 100% 25%',
    '--hologram-panel-bg-hsl': '0 50% 15%', 
    '--hologram-glow-color': 'hsl(0 100% 40%)',
    '--hologram-button-text': 'hsl(0 0% 100%)',
    '--shadows-debug-color': 'red',
  },
  'neutral': { // Ensure neutral theme also has all necessary HSL vars
    '--background-hsl': '220 10% 10%',
    '--foreground-hsl': '220 10% 70%',
    '--card-hsl': '220 15% 12%', 
    '--card-foreground-hsl': '220 10% 75%',
    '--popover-hsl': '220 15% 15%',
    '--popover-foreground-hsl': '220 10% 75%',
    '--primary-hsl': '180 70% 50%', 
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
    '--ring-hsl': '180 70% 55%',
    '--pad-bg-hsl': '220 15% 18%',
    '--pad-border-hsl': '220 20% 35%',
    '--pad-button-panel-separator-hsl': '220 20% 25%',
    '--hologram-panel-bg-hsl': '220 15% 18%', 
    '--hologram-glow-color': 'hsl(180 70% 60%)', 
    '--hologram-button-text': 'hsl(220 10% 95%)',
    '--neutral-debug-color': 'gray',
  },
};

// Variables that ThemeProvider will set directly on :root's inline style
const HSL_VARIABLES_TO_SET_ON_ROOT = [
  '--background-hsl', '--foreground-hsl', '--card-hsl', '--card-foreground-hsl',
  '--popover-hsl', '--popover-foreground-hsl', '--primary-hsl', '--primary-foreground-hsl',
  '--secondary-hsl', '--secondary-foreground-hsl', '--muted-hsl', '--muted-foreground-hsl',
  '--accent-hsl', '--accent-foreground-hsl', '--destructive-hsl', '--destructive-foreground-hsl',
  '--border-hsl', '--input-hsl', '--ring-hsl',
  // PAD specific HSL sources
  '--pad-bg-hsl', '--pad-border-hsl', '--pad-button-panel-separator-hsl',
  // Hologram specific HSL sources
  '--hologram-panel-bg-hsl',
  // Theme-specific debug colors (will only be set if defined for the theme)
  '--terminal-green-debug-color', '--cyphers-debug-color', '--shadows-debug-color', '--neutral-debug-color',
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

  useEffect(() => {
    console.log('[ThemeContext] Effect running. Current internal theme to apply:', currentThemeInternal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('tod-theme', currentThemeInternal);
      const htmlEl = document.documentElement;
      const style = htmlEl.style;

      // Clear previous theme classes
      availableThemesList.forEach(tName => {
        if (tName) htmlEl.classList.remove(`theme-${tName}`);
      });
      
      const effectiveTheme = (availableThemesList).includes(currentThemeInternal)
        ? currentThemeInternal
        : 'terminal-green'; 
      
      htmlEl.classList.add(`theme-${effectiveTheme}`);
      console.log(`[ThemeContext] Applied theme class to HTML: theme-${effectiveTheme}`);
      
      const themeColorsToSet = themeHSLValues[effectiveTheme];
      
      if (themeColorsToSet) {
        console.log(`[ThemeContext] Applying HSL variables for theme: ${effectiveTheme}`, themeColorsToSet);
        HSL_VARIABLES_TO_SET_ON_ROOT.forEach(variableName => {
          if (themeColorsToSet[variableName]) {
            style.setProperty(variableName, themeColorsToSet[variableName]);
          } else {
             // Clean up debug colors if not in current theme
             if (variableName.endsWith('-debug-color')) {
                style.removeProperty(variableName);
             }
          }
        });

        // Set "effective" color variables that include opacity or are direct hsl() for specific components
        
        // For PAD (AgentSection)
        const padEffectiveBg = `hsla(${themeColorsToSet['--pad-bg-hsl']}, 0.85)`;
        style.setProperty('--pad-effective-background-color', padEffectiveBg);
        console.log(`[ThemeContext] Set --pad-effective-background-color to: ${padEffectiveBg}`);


        const padEffectiveBorder = `hsl(${themeColorsToSet['--pad-border-hsl']})`;
        style.setProperty('--pad-effective-border-color', padEffectiveBorder);
        
        const padEffectiveSeparator = `hsla(${themeColorsToSet['--pad-button-panel-separator-hsl']}, 0.5)`;
        style.setProperty('--pad-effective-button-panel-separator-color', padEffectiveSeparator);

        // For HolographicPanel (general use, like in ScannerSection)
        // This is the CRITICAL PART: set --hologram-panel-bg with opacity
        const hologramPanelEffectiveBg = `hsla(${themeColorsToSet['--hologram-panel-bg-hsl']}, 0.7)`; // Using 0.7 opacity
        style.setProperty('--hologram-panel-bg', hologramPanelEffectiveBg); // This variable is used by .holographic-panel in CSS
        console.log(`[ThemeContext] Set --hologram-panel-bg to: ${hologramPanelEffectiveBg}`);


        // Direct hologram glow and button text (these are already direct HSL strings in themeHSLValues)
        if (themeColorsToSet['--hologram-glow-color']) {
            style.setProperty('--hologram-glow-color', themeColorsToSet['--hologram-glow-color']);
        }
        if (themeColorsToSet['--hologram-button-text']) {
            style.setProperty('--hologram-button-text', themeColorsToSet['--hologram-button-text']);
        }

      } else {
        console.error(`[ThemeContext] No HSL values found for theme ${effectiveTheme}!`);
      }

      setThemeVersion(v => v + 1);
      // console.log(`[ThemeContext] Updated :root styles and themeVersion to ${themeVersion + 1} for theme ${effectiveTheme}`);
    }
  }, [currentThemeInternal]); // Only re-run when currentThemeInternal changes


  const setTheme = useCallback((newTheme: Theme) => {
    setThemeInternal(currentInternalTheme => {
      if (availableThemesList.includes(newTheme)) {
        // console.log(`[ThemeContext] setTheme callback invoked with newTheme: ${newTheme}`);
        if (currentInternalTheme !== newTheme) {
          // console.log(`[ThemeContext] Actually changing theme from ${currentInternalTheme} to ${newTheme}`);
          return newTheme;
        }
        // console.log(`[ThemeContext] Theme already ${newTheme}. No change.`);
        return currentInternalTheme;
      }
      console.warn(`[ThemeContext] Attempted to set invalid theme: ${newTheme}`);
      return currentInternalTheme; // Return current theme if new one is invalid
    });
  }, [setThemeInternal]); // setThemeInternal is stable

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

    