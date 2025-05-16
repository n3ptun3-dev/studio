
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

export type Faction = 'Cyphers' | 'Shadows' | 'Observer';
export type OnboardingStep = 'welcome' | 'factionChoice' | 'authPrompt' | 'fingerprint' | 'tod';

interface PlayerStats {
  xp: number;
  level: number;
  elintReserves: number;
  elintTransferred: number;
  // Add other stats as needed from Agent Dossier
  successfulVaultInfiltrations: number;
  successfulLockInfiltrations: number;
  elintObtainedTotal: number;
  elintObtainedCycle: number;
  elintLostTotal: number;
  elintLostCycle: number;
  elintGeneratedTotal: number;
  elintGeneratedCycle: number;
  elintTransferredToHQCyle: number;
  successfulInterferences: number;
  elintSpentSpyShop: number;
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
  dailyTeamCode: Record<Faction, string>;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  messages: GameMessage[];
  addMessage: (message: Omit<GameMessage, 'id' | 'timestamp'>) => void;

  // TOD Window State
  isTODWindowOpen: boolean;
  todWindowTitle: string;
  todWindowContent: ReactNode | null;
  openTODWindow: (title: string, content: ReactNode) => void;
  closeTODWindow: () => void;
}

export interface GameMessage {
  id: string;
  text: string;
  type: 'system' | 'hq' | 'notification' | 'error' | 'lore' | 'alert';
  timestamp: Date;
  isPinned?: boolean;
  sender?: string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const NATO_ALPHABET = [
  "Alpha", "Bravo", "Charlie", "Delta", "Echo", "Foxtrot", "Golf", "Hotel",
  "India", "Juliett", "Kilo", "Lima", "Mike", "November", "Oscar", "Papa",
  "Quebec", "Romeo", "Sierra", "Tango", "Uniform", "Victor", "Whiskey",
  "X-ray", "Yankee", "Zulu"
];

function generateFactionTeamCode(seedDate: Date, faction: Faction): string {
  const start = new Date(seedDate.getFullYear(), 0, 0);
  const diff = seedDate.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);

  const factionSeedOffset = faction === 'Cyphers' ? 1000 : faction === 'Shadows' ? 2000 : 3000;

  const getRandomWord = (baseSeed: number, index: number) => {
    const combinedSeed = baseSeed + index * 100 + factionSeedOffset;
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
    xp: 0, level: 0, elintReserves: 0, elintTransferred: 0,
    successfulVaultInfiltrations: 0, successfulLockInfiltrations: 0,
    elintObtainedTotal: 0, elintObtainedCycle: 0, elintLostTotal: 0, elintLostCycle: 0,
    elintGeneratedTotal: 0, elintGeneratedCycle: 0, elintTransferredToHQCyle: 0,
    successfulInterferences: 0, elintSpentSpyShop: 0,
  });
  const [dailyTeamCode, setDailyTeamCode] = useState<Record<Faction, string>>({
    Cyphers: '', Shadows: '', Observer: ''
  });
  const [isLoading, _setIsLoading] = useState(true);
  const [messages, setMessages] = useState<GameMessage[]>([]);

  const [isTODWindowOpen, setIsTODWindowOpen] = useState(false);
  const [todWindowTitle, setTODWindowTitle] = useState('');
  const [todWindowContent, setTODWindowContent] = useState<ReactNode | null>(null);

  useEffect(() => {
    const inPiBrowser = navigator.userAgent.includes("PiBrowser");
    setIsPiBrowser(inPiBrowser);

    const today = new Date();
    setDailyTeamCode({
      Cyphers: generateFactionTeamCode(today, 'Cyphers'),
      Shadows: generateFactionTeamCode(today, 'Shadows'),
      Observer: generateFactionTeamCode(today, 'Observer'),
    });
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
      const newMessagesList = [newMessage, ...prev.filter(m => !m.isPinned)];
      const pinnedMessages = prev.filter(m => m.isPinned);
      return [...pinnedMessages, ...newMessagesList.slice(0, 50 - pinnedMessages.length)];
    });
  }, []);

  const addXp = useCallback((amount: number) => {
    setPlayerStats(prevStats => ({ ...prevStats, xp: prevStats.xp + amount }));
    addMessage({ text: `+${amount} XP`, type: 'notification'});
  }, [addMessage]);

  const openTODWindow = useCallback((title: string, content: ReactNode) => {
    console.log('[AppContext] openTODWindow called. Current isTODWindowOpen:', isTODWindowOpen); // Added to check current state
    setTODWindowTitle(title);
    setTODWindowContent(content);
    console.log('[AppContext] Attempting to set isTODWindowOpen to true.');
    setIsTODWindowOpen(true);
    // Log *after* to see if the state change is queued (React state updates can be async)
    // We'll check in HomePage render if this was effective.
    console.log('[AppContext] After setIsTODWindowOpen(true) call.');
  }, [setTODWindowTitle, setTODWindowContent, setIsTODWindowOpen, isTODWindowOpen]); // Added isTODWindowOpen to dep array

  const closeTODWindow = useCallback(() => {
    setIsTODWindowOpen(false);
    setTODWindowContent(null);
  }, [setIsTODWindowOpen, setTODWindowContent]);


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
      messages, addMessage,
      isTODWindowOpen, todWindowTitle, todWindowContent, openTODWindow, closeTODWindow
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
