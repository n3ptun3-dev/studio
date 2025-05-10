"use client";

import { useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';

export function ThemeUpdater() {
  const { faction } = useAppContext();
  const { setTheme } = useTheme();

  useEffect(() => {
    if (faction === 'Cyphers') {
      setTheme('cyphers');
    } else if (faction === 'Shadows') {
      setTheme('shadows');
    } else if (faction === 'Observer') {
      // Optionally reset to default/observer theme if needed
      // setTheme('default'); 
    }
  }, [faction, setTheme]);

  return null; // This component doesn't render anything
}