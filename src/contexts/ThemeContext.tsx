
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
// These are the SOURCE HSL strings. ThemeProvider will set these on :root.
// Composite colors (like --primary) will use these HSL variables.
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
    // PAD specific HSL sources
    '--pad-bg-hsl': '130 25% 15%', // Darker than terminal-green card for PAD bg
    '--pad-border-hsl': '130 60% 45%', // Brighter than terminal-green border for PAD
    '--pad-button-panel-separator-hsl': '130 50% 25%',
    // Hologram glow (raw HSL string, not var())
    '--hologram-glow-color-hsl': '130 90% 55%', // Matches accent-hsl for this theme
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
    '--secondary-hsl': '180 100% 35%', // Darker Turquoise for secondary elements/borders
    '--secondary-foreground-hsl': '200 100% 90%',
    '--muted-hsl': '210 50% 18%',
    '--muted-foreground-hsl': '200 80% 70%',
    '--accent-hsl': '0 0% 100%', // White
    '--accent-foreground-hsl': '210 60% 8%',
    '--destructive-hsl': '0 70% 50%',
    '--destructive-foreground-hsl': '0 0% 100%',
    '--border-hsl': '204 100% 60%', // Prominent blue for borders
    '--input-hsl': '210 40% 15%',
    '--ring-hsl': '204 100% 55%',
    // PAD specific HSL sources
    '--pad-bg-hsl': '210 50% 18%', // Slightly lighter than card for PAD
    '--pad-border-hsl': '204 100% 70%', // Brighter than main border for PAD
    '--pad-button-panel-separator-hsl': '204 100% 40%',
    // Hologram glow (raw HSL string)
    '--hologram-glow-color-hsl': '204 100% 50%', // Matches primary-hsl for this theme
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
    '--secondary-hsl': '16 100% 30%', // Darker Salmon for secondary elements/borders
    '--secondary-foreground-hsl': '0 0% 90%',
    '--muted-hsl': '0 50% 18%',
    '--muted-foreground-hsl': '0 0% 70%',
    '--accent-hsl': '0 0% 100%', // White
    '--accent-foreground-hsl': '0 60% 8%',
    '--destructive-hsl': '0 70% 50%',
    '--destructive-foreground-hsl': '0 0% 100%',
    '--border-hsl': '0 100% 50%', // Prominent red for borders
    '--input-hsl': '0 40% 15%',
    '--ring-hsl': '0 100% 55%',
     // PAD specific HSL sources
    '--pad-bg-hsl': '0 50% 18%', // Slightly lighter than card
    '--pad-border-hsl': '0 100% 60%', // Brighter than main border
    '--pad-button-panel-separator-hsl': '0 100% 25%',
    // Hologram glow (raw HSL string)
    '--hologram-glow-color-hsl': '0 100% 40%', // Matches primary-hsl for this theme
  },
  'neutral': { // Fallback/default neutral theme
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
    '--pad-bg-hsl': '220 15% 20%',
    '--pad-border-hsl': '220 20% 40%',
    '--pad-button-panel-separator-hsl': '220 20% 20%',
    // Hologram glow (raw HSL string)
    '--hologram-glow-color-hsl': '180 70% 60%', // Uses accent-hsl for neutral glow
  },
};

// CSS HSL variables that ThemeProvider will set directly on :root's inline style
const HSL_VARIABLES_TO_SET_ON_ROOT = [
  '--background-hsl', '--foreground-hsl', '--card-hsl', '--card-foreground-hsl',
  '--popover-hsl', '--popover-foreground-hsl', '--primary-hsl', '--primary-foreground-hsl',
  '--secondary-hsl', '--secondary-foreground-hsl', '--muted-hsl', '--muted-foreground-hsl',
  '--accent-hsl', '--accent-foreground-hsl', '--destructive-hsl', '--destructive-foreground-hsl',
  '--border-hsl', '--input-hsl', '--ring-hsl',
  // PAD specific HSL source variables
  '--pad-bg-hsl', '--pad-border-hsl', '--pad-button-panel-separator-hsl',
  // Hologram specific - source HSL for JS setting the final color
  '--hologram-glow-color-hsl',
];


export function ThemeProvider({ children, defaultTheme = "terminal-green" }: {
    children: ReactNode,
    defaultTheme?: Theme,
    attribute?: string, // Kept for potential shadcn compatibility, not used directly by our logic
    enableSystem?: boolean, // Kept for potential shadcn compatibility
    disableTransitionOnChange?: boolean, // Kept for potential shadcn compatibility
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
        // If theme is already the newTheme, don't cause a state update.
        return currentInternalTheme; 
      }
      // If newTheme is invalid, return current theme to avoid issues.
      console.warn(`[ThemeContext] Attempted to set invalid theme: ${newTheme}`);
      return currentInternalTheme;
    });
  }, [setThemeInternal]); // setThemeInternal is stable

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
      
      // Determine the effective theme to apply
      const effectiveTheme = (availableThemesList as string[]).includes(currentThemeInternal) 
        ? currentThemeInternal 
        : 'terminal-green'; // Fallback if currentThemeInternal is invalid
      
      htmlEl.classList.add(`theme-${effectiveTheme}`);
      console.log(`[ThemeContext] Applied theme class to HTML: theme-${effectiveTheme}`);

      // Get the HSL color definitions for the current theme
      const themeColorsToSet = themeHSLValues[effectiveTheme];
      
      // Dynamically set the core HSL variables on :root's inline style
      HSL_VARIABLES_TO_SET_ON_ROOT.forEach(variableName => {
        if (themeColorsToSet[variableName]) {
          style.setProperty(variableName, themeColorsToSet[variableName]);
        } else {
          // Optional: Clear the property if not defined for the current theme to ensure fallback to CSS
          // style.removeProperty(variableName); 
           console.warn(`[ThemeContext] Variable ${variableName} not found for theme ${effectiveTheme}`);
        }
      });

      // Also set the specific --pad-effective-background-color etc. directly on :root
      // These are the final color strings, including opacity.
      if (themeColorsToSet['--pad-bg-hsl']) {
        const padBgColorString = `hsla(${themeColorsToSet['--pad-bg-hsl']}, 0.85)`;
        style.setProperty('--pad-effective-background-color', padBgColorString);
      }
      if (themeColorsToSet['--pad-border-hsl']) {
        style.setProperty('--pad-effective-border-color', `hsl(${themeColorsToSet['--pad-border-hsl']})`);
      }
      if (themeColorsToSet['--pad-button-panel-separator-hsl']) {
        const padSeparatorColorString = `hsla(${themeColorsToSet['--pad-button-panel-separator-hsl']}, 0.5)`;
        style.setProperty('--pad-effective-button-panel-separator-color', padSeparatorColorString);
      }
      // For the glow color, directly set the --hologram-glow-color on :root
      // The CSS definition for .holographic-panel uses var(--hologram-glow-color)
      if (themeColorsToSet['--hologram-glow-color-hsl']) {
          style.setProperty('--hologram-glow-color', `hsl(${themeColorsToSet['--hologram-glow-color-hsl']})`);
      }


      setThemeVersion(v => v + 1);
      // Log the NEW themeVersion that will be available in the next render cycle.
      // The console.log here might show the old themeVersion if it logs before the state update is fully processed for this log.
      // For more accurate logging of the new version, log themeVersion in a separate useEffect that depends on themeVersion.
      console.log(`[ThemeContext] Updated :root styles and themeVersion will be updated for theme ${effectiveTheme}`);
    }
  }, [currentThemeInternal]); // Only re-run when currentThemeInternal changes.

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

