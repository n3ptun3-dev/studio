
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Theme } from './ThemeContext';
import { useTheme } from './ThemeContext';

export type Faction = 'Cyphers' | 'Shadows' | 'Observer';
export type OnboardingStep = 'welcome' | 'factionChoice' | 'authPrompt' | 'fingerprint' | 'tod';

interface PlayerStats {
  xp: number;
  level: number;
  elintReserves: number;
  elintTransferred: number;
  // Add other stats as needed
}

interface AppContextType {
  faction: Faction;
  setFaction: (faction: Faction) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  playerSpyName: string | null;
  setPlayerSpyName: (name: string | null) => void;
  playerPiName: string | null; // Pi Network username
  setPlayerPiName: (name: string | null) => void;
  onboardingStep: OnboardingStep;
  setOnboardingStep: (step: OnboardingStep) => void;
  isPiBrowser: boolean;
  playerStats: PlayerStats;
  updatePlayerStats: (newStats: Partial<PlayerStats>) => void;
  addXp: (amount: number) => void;
  dailyTeamCode: string;
  isLoading: boolean; // For async operations like AI message
  setIsLoading: (loading: boolean) => void;
  messages: GameMessage[];
  addMessage: (message: Omit<GameMessage, 'id' | 'timestamp'>) => void;
}

export interface GameMessage {
  id: string;
  text: string;
  type: 'system' | 'hq' | 'notification' | 'error' | 'lore';
  timestamp: Date;
  isPinned?: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const NATO_ALPHABET = [
  "Alpha", "Bravo", "Charlie", "Delta", "Echo", "Foxtrot", "Golf", "Hotel", 
  "India", "Juliett", "Kilo", "Lima", "Mike", "November", "Oscar", "Papa", 
  "Quebec", "Romeo", "Sierra", "Tango", "Uniform", "Victor", "Whiskey", 
  "X-ray", "Yankee", "Zulu"
];

function generateDailyTeamCode(): string {
  const today = new Date();
  // Simple seed based on day of year to ensure it changes daily
  const start = new Date(today.getFullYear(), 0, 0);
  const diff = today.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);

  const getRandomWord = (seed: number, index: number) => {
    // Simple pseudo-random selection based on dayOfYear and index
    const combinedSeed = dayOfYear + index * 100; // Make it different for each word
    return NATO_ALPHABET[combinedSeed % NATO_ALPHABET.length];
  };
  
  return `${getRandomWord(dayOfYear, 1)}-${getRandomWord(dayOfYear, 2)}-${getRandomWord(dayOfYear, 3)}`;
}


export function AppProvider({ children }: { children: ReactNode }) {
  const [faction, setFactionState] = useState<Faction>('Observer');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [playerSpyName, setPlayerSpyName] = useState<string | null>(null);
  const [playerPiName, setPlayerPiName] = useState<string | null>(null);
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>('welcome');
  const [isPiBrowser, setIsPiBrowser] = useState(false);
  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    xp: 0,
    level: 0,
    elintReserves: 0,
    elintTransferred: 0,
  });
  const [dailyTeamCode, setDailyTeamCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState<GameMessage[]>([]);

  const { setTheme: applyTheme } = useTheme();

  useEffect(() => {
    // Simulate Pi Browser detection
    // In a real app, this would involve checking window.Pi or similar
    const inPiBrowser = navigator.userAgent.includes("PiBrowser"); // Basic check
    setIsPiBrowser(inPiBrowser);
    
    setDailyTeamCode(generateDailyTeamCode());
    setIsLoading(false); 
  }, []);

  const setFaction = (newFaction: Faction) => {
    setFactionState(newFaction);
    if (newFaction === 'Cyphers') {
      applyTheme('cyphers');
    } else if (newFaction === 'Shadows') {
      applyTheme('shadows');
    }
    // Observer keeps current/default theme
  };

  const updatePlayerStats = (newStats: Partial<PlayerStats>) => {
    setPlayerStats(prevStats => ({ ...prevStats, ...newStats }));
  };

  const addXp = (amount: number) => {
    // TODO: Implement level up logic based on XP thresholds
    // For now, just add XP
    const newXp = playerStats.xp + amount;
    updatePlayerStats({ xp: newXp });
    // Add XP float animation trigger here if needed
    addMessage({ text: `+${amount} XP`, type: 'notification'});
  };

  const addMessage = (message: Omit<GameMessage, 'id' | 'timestamp'>) => {
    const newMessage: GameMessage = {
      ...message,
      id: Date.now().toString() + Math.random().toString(), // simple unique id
      timestamp: new Date(),
    };
    setMessages(prev => {
      const newMessages = [newMessage, ...prev.filter(m => !m.isPinned)];
      const pinnedMessages = prev.filter(m => m.isPinned);
      return [...pinnedMessages, ...newMessages.slice(0, 50 - pinnedMessages.length)]; // Keep max 50 messages
    });
  };


  return (
    <AppContext.Provider value={{ 
      faction, setFaction, 
      isAuthenticated, setIsAuthenticated,
      playerSpyName, setPlayerSpyName,
      playerPiName, setPlayerPiName,
      onboardingStep, setOnboardingStep,
      isPiBrowser,
      playerStats, updatePlayerStats, addXp,
      dailyTeamCode,
      isLoading, setIsLoading,
      messages, addMessage
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

    