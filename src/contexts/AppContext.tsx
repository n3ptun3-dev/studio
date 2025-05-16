
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
  playerPiName: string | null;
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
  const [isPiBrowser, _setIsPiBrowser] = useState(false); // Renamed setter for consistency
  const [playerStats, _setPlayerStats] = useState<PlayerStats>({
    xp: 0, level: 0, elintReserves: 0, elintTransferred: 0,
    successfulVaultInfiltrations: 0, successfulLockInfiltrations: 0,
    elintObtainedTotal: 0, elintObtainedCycle: 0, elintLostTotal: 0, elintLostCycle: 0,
    elintGeneratedTotal: 0, elintGeneratedCycle: 0, elintTransferredToHQCyle: 0,
    successfulInterferences: 0, elintSpentSpyShop: 0,
  });
  const [dailyTeamCode, _setDailyTeamCode] = useState<Record<Faction, string>>({
    Cyphers: '', Shadows: '', Observer: ''
  });
  const [isLoading, _setIsLoading] = useState(true);
  const [messages, _setMessages] = useState<GameMessage[]>([]);

  const [isTODWindowOpen, _setIsTODWindowOpen] = useState(false);
  const [todWindowTitle, _setTODWindowTitle] = useState('');
  const [todWindowContent, _setTODWindowContent] = useState<ReactNode | null>(null);

  useEffect(() => {
    const inPiBrowser = navigator.userAgent.includes("PiBrowser");
    _setIsPiBrowser(inPiBrowser);

    const today = new Date();
    _setDailyTeamCode({
      Cyphers: generateFactionTeamCode(today, 'Cyphers'),
      Shadows: generateFactionTeamCode(today, 'Shadows'),
      Observer: generateFactionTeamCode(today, 'Observer'),
    });
    _setIsLoading(false);
  }, [_setIsPiBrowser, _setDailyTeamCode, _setIsLoading]); // Added _setIsPiBrowser to deps

  const setFaction = useCallback((newFaction: Faction) => _setFaction(newFaction), [_setFaction]);
  const setIsAuthenticated = useCallback((auth: boolean) => _setIsAuthenticated(auth), [_setIsAuthenticated]);
  const setPlayerSpyName = useCallback((name: string | null) => _setPlayerSpyName(name), [_setPlayerSpyName]);
  const setPlayerPiName = useCallback((name: string | null) => _setPlayerPiName(name), [_setPlayerPiName]);
  const setOnboardingStep = useCallback((step: OnboardingStep) => _setOnboardingStep(step), [_setOnboardingStep]);
  const setIsLoading = useCallback((loading: boolean) => _setIsLoading(loading), [_setIsLoading]);

  const addMessage = useCallback((message: Omit<GameMessage, 'id' | 'timestamp'>) => {
    const newMessage: GameMessage = {
      ...message,
      id: Date.now().toString() + Math.random().toString(),
      timestamp: new Date(),
    };
    _setMessages(prev => {
      const newMessagesList = [newMessage, ...prev.filter(m => !m.isPinned)];
      const pinnedMessages = prev.filter(m => m.isPinned);
      return [...pinnedMessages, ...newMessagesList.slice(0, 50 - pinnedMessages.length)];
    });
  }, [_setMessages]);

  const updatePlayerStats = useCallback((newStats: Partial<PlayerStats>) => {
    _setPlayerStats(prevStats => ({ ...prevStats, ...newStats }));
  }, [_setPlayerStats]);

  const addXp = useCallback((amount: number) => {
    // Use _setPlayerStats directly or ensure updatePlayerStats is correctly used
    _setPlayerStats(prevStats => ({ ...prevStats, xp: prevStats.xp + amount }));
    addMessage({ text: `+${amount} XP`, type: 'notification'});
  }, [_setPlayerStats, addMessage]);

  const openTODWindow = useCallback((title: string, content: ReactNode) => {
    console.log('[AppContext] openTODWindow called. Title:', title, "Content:", content);
    _setTODWindowTitle(title);
    _setTODWindowContent(content);
    console.log('[AppContext] Setting isTODWindowOpen to true.');
    _setIsTODWindowOpen(true);
  }, [_setTODWindowTitle, _setTODWindowContent, _setIsTODWindowOpen]);

  const closeTODWindow = useCallback(() => {
    _setIsTODWindowOpen(false);
    _setTODWindowContent(null);
  }, [_setIsTODWindowOpen, _setTODWindowContent]);

  useEffect(() => {
    console.log('[AppContext] isTODWindowOpen changed to:', isTODWindowOpen);
  }, [isTODWindowOpen]);


  return (
    <AppContext.Provider value={{
      faction, setFaction,
      isAuthenticated, setIsAuthenticated,
      playerSpyName, setPlayerSpyName,
      playerPiName, setPlayerPiName,
      onboardingStep, setOnboardingStep,
      isPiBrowser, // isPiBrowser state is used, not its setter
      playerStats,
      updatePlayerStats, // Now defined
      addXp,
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
