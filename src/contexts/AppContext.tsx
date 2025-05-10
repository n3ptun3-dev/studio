
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Theme } from './ThemeContext'; // Ensure Theme type is available if needed, though direct theme setting is removed here.

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
  const [faction, _setFaction] = useState<Faction>('Observer');
  const [isAuthenticated, _setIsAuthenticated] = useState(false);
  const [playerSpyName, _setPlayerSpyName] = useState<string | null>(null);
  const [playerPiName, _setPlayerPiName] = useState<string | null>(null);
  const [onboardingStep, _setOnboardingStep] = useState<OnboardingStep>('welcome');
  const [isPiBrowser, setIsPiBrowser] = useState(false);
  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    xp: 0,
    level: 0,
    elintReserves: 0,
    elintTransferred: 0,
  });
  const [dailyTeamCode, setDailyTeamCode] = useState('');
  const [isLoading, _setIsLoading] = useState(true);
  const [messages, setMessages] = useState<GameMessage[]>([]);

  useEffect(() => {
    // Simulate Pi Browser detection
    const inPiBrowser = navigator.userAgent.includes("PiBrowser"); 
    setIsPiBrowser(inPiBrowser);
    
    setDailyTeamCode(generateDailyTeamCode());
    _setIsLoading(false); 
  }, []);

  const setFaction = useCallback((newFaction: Faction) => {
    _setFaction(newFaction);
  }, []);

  const setIsAuthenticated = useCallback((auth: boolean) => {
    _setIsAuthenticated(auth);
  }, []);

  const setPlayerSpyName = useCallback((name: string | null) => {
    _setPlayerSpyName(name);
  }, []);

  const setPlayerPiName = useCallback((name: string | null) => {
    _setPlayerPiName(name);
  }, []);

  const setOnboardingStep = useCallback((step: OnboardingStep) => {
    _setOnboardingStep(step);
  }, []);

  const setIsLoading = useCallback((loading: boolean) => {
    _setIsLoading(loading);
  }, []);

  const updatePlayerStats = useCallback((newStats: Partial<PlayerStats>) => {
    setPlayerStats(prevStats => ({ ...prevStats, ...newStats }));
  }, []);

  const addMessage = useCallback((message: Omit<GameMessage, 'id' | 'timestamp'>) => {
    const newMessage: GameMessage = {
      ...message,
      id: Date.now().toString() + Math.random().toString(), 
      timestamp: new Date(),
    };
    setMessages(prev => {
      const newMessages = [newMessage, ...prev.filter(m => !m.isPinned)];
      const pinnedMessages = prev.filter(m => m.isPinned);
      return [...pinnedMessages, ...newMessages.slice(0, 50 - pinnedMessages.length)]; 
    });
  }, []);

  const addXp = useCallback((amount: number) => {
    setPlayerStats(prevStats => ({ ...prevStats, xp: prevStats.xp + amount }));
    addMessage({ text: `+${amount} XP`, type: 'notification'});
  }, [addMessage]);


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

    