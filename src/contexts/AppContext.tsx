
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Theme } from './ThemeContext'; // Import Theme type

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

interface TODWindowOptions {
  showCloseButton?: boolean;
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
  todWindowOptions: TODWindowOptions;
  openTODWindow: (title: string, content: ReactNode, options?: TODWindowOptions) => void;
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
  const [_faction, _setFaction] = useState<Faction>('Observer');
  const [_isAuthenticated, _setIsAuthenticated] = useState(false);
  const [_playerSpyName, _setPlayerSpyName] = useState<string | null>(null);
  const [_playerPiName, _setPlayerPiName] = useState<string | null>(null);
  const [_onboardingStep, _setOnboardingStep] = useState<OnboardingStep>('welcome');
  const [_isPiBrowser, _setIsPiBrowser] = useState(false);
  const [_playerStats, _setPlayerStats] = useState<PlayerStats>({
    xp: 0, level: 0, elintReserves: 0, elintTransferred: 0,
    successfulVaultInfiltrations: 0, successfulLockInfiltrations: 0,
    elintObtainedTotal: 0, elintObtainedCycle: 0, elintLostTotal: 0, elintLostCycle: 0,
    elintGeneratedTotal: 0, elintGeneratedCycle: 0, elintTransferredToHQCyle: 0,
    successfulInterferences: 0, elintSpentSpyShop: 0,
  });
  const [_dailyTeamCode, _setDailyTeamCode] = useState<Record<Faction, string>>({
    Cyphers: '', Shadows: '', Observer: ''
  });
  const [_isLoading, _setIsLoading] = useState(true); // Start true for initial loading
  const [_messages, _setMessages] = useState<GameMessage[]>([]);

  const [_isTODWindowOpen, _setIsTODWindowOpen] = useState(false);
  const [_todWindowTitle, _setTODWindowTitle] = useState('');
  const [_todWindowContent, _setTODWindowContent] = useState<ReactNode | null>(null);
  const [_todWindowOptions, _setTODWindowOptions] = useState<TODWindowOptions>({ showCloseButton: true });


  useEffect(() => {
    const inPiBrowser = navigator.userAgent.includes("PiBrowser");
    _setIsPiBrowser(inPiBrowser);

    const today = new Date();
    _setDailyTeamCode({
      Cyphers: generateFactionTeamCode(today, 'Cyphers'),
      Shadows: generateFactionTeamCode(today, 'Shadows'),
      Observer: generateFactionTeamCode(today, 'Observer'),
    });
    _setIsLoading(false); // Initial setup done
  }, []);

  const setFaction = useCallback((newFaction: Faction) => {
    console.log('[AppContext] setFaction called with:', newFaction);
    _setFaction(newFaction);
  }, [_setFaction]); // _setFaction is stable

  useEffect(() => {
    console.log('[AppContext] INTERNAL faction state changed to:', _faction);
  }, [_faction]);

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
  }, []); // _setMessages is stable

  const updatePlayerStats = useCallback((newStats: Partial<PlayerStats>) => {
    _setPlayerStats(prevStats => ({ ...prevStats, ...newStats }));
  }, [_setPlayerStats]);

  const addXp = useCallback((amount: number) => {
    _setPlayerStats(prevStats => ({ ...prevStats, xp: prevStats.xp + amount }));
    addMessage({ text: `+${amount} XP`, type: 'notification'});
  }, [_setPlayerStats, addMessage]);

  const openTODWindow = useCallback((title: string, content: ReactNode, options: TODWindowOptions = { showCloseButton: true }) => {
    console.log('[AppContext] openTODWindow called. Title:', title, "Options:", options);
    _setTODWindowTitle(title);
    _setTODWindowContent(content);
    _setTODWindowOptions(options);
    console.log('[AppContext] Setting isTODWindowOpen to true.');
    _setIsTODWindowOpen(true);
  }, [_setTODWindowTitle, _setTODWindowContent, _setTODWindowOptions, _setIsTODWindowOpen]);

  const closeTODWindow = useCallback(() => {
    console.log('[AppContext] closeTODWindow called.');
    _setIsTODWindowOpen(false);
    _setTODWindowContent(null);
    _setTODWindowOptions({ showCloseButton: true }); // Reset options
  }, [_setIsTODWindowOpen, _setTODWindowContent, _setTODWindowOptions]);

  useEffect(() => {
    console.log('[AppContext] isTODWindowOpen state changed to:', _isTODWindowOpen);
  }, [_isTODWindowOpen]);

  const contextValue = useMemo(() => ({
    faction: _faction, setFaction,
    isAuthenticated: _isAuthenticated, setIsAuthenticated,
    playerSpyName: _playerSpyName, setPlayerSpyName,
    playerPiName: _playerPiName, setPlayerPiName,
    onboardingStep: _onboardingStep, setOnboardingStep,
    isPiBrowser: _isPiBrowser,
    playerStats: _playerStats, updatePlayerStats, addXp,
    dailyTeamCode: _dailyTeamCode,
    isLoading: _isLoading, setIsLoading,
    messages: _messages, addMessage,
    isTODWindowOpen: _isTODWindowOpen,
    todWindowTitle: _todWindowTitle,
    todWindowContent: _todWindowContent,
    todWindowOptions: _todWindowOptions,
    openTODWindow, closeTODWindow,
  }), [
    _faction, setFaction,
    _isAuthenticated, setIsAuthenticated,
    _playerSpyName, setPlayerSpyName,
    _playerPiName, setPlayerPiName,
    _onboardingStep, setOnboardingStep,
    _isPiBrowser,
    _playerStats, updatePlayerStats, addXp,
    _dailyTeamCode,
    _isLoading, setIsLoading,
    _messages, addMessage,
    _isTODWindowOpen, _todWindowTitle, _todWindowContent, _todWindowOptions,
    openTODWindow, closeTODWindow,
  ]);

  return (
    <AppContext.Provider value={contextValue}>
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
