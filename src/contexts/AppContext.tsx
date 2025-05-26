// src/contexts/AppContext.tsx

"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Theme } from './ThemeContext';
import { TODWindow } from '@/components/game/shared/TODWindow';

// TODO: Define these interfaces and functions based on your game's items
// For now, these are basic placeholders to allow compilation
export interface GameItemBase {
  id: string;
  name: string;
  description: string;
  category: ItemCategory;
  maxStrength?: number; // Max strength for rechargeable items
  cost: number;
  icon?: string;
}
type ItemCategory = string; // Placeholder. Define your specific categories, e.g., 'weapon' | 'armor' | 'consumable' | 'theme' | 'misc';

const getItemById = (itemId: string): GameItemBase | undefined => {
  // This would typically fetch item details from a game data array/object
  // Placeholder implementation:
  const dummyItems: Record<string, GameItemBase> = {
    'basic_pick_l1': { id: 'basic_pick_l1', name: 'Basic Pick L1', description: 'A basic lock pick.', category: 'tool', cost: 100 },
    'std_cypher_lock_l1': { id: 'std_cypher_lock_l1', name: 'Standard Cypher Lock L1', description: 'A standard cypher lock.', category: 'lock', maxStrength: 100, cost: 200 },
    'security_camera_l1': { id: 'security_camera_l1', name: 'Security Camera L1', description: 'Detects intruders.', category: 'sensor', maxStrength: 1, cost: 50 },
    'theme_cyphers': { id: 'theme_cyphers', name: 'Cyphers Theme', description: 'Changes UI theme.', category: 'theme', cost: 0 },
  };
  return dummyItems[itemId];
};

const getItemMaxStrength = (item: GameItemBase): number | undefined => {
  return item.maxStrength;
};

// TODO: Import your actual InventoryBrowserInTOD component
// For example: import { InventoryBrowserInTOD } from '@/components/game/inventory/InventoryBrowserInTOD';
const InventoryBrowserInTOD = () => <div className="p-4 text-center">Inventory Browser Content Placeholder</div>;


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

export interface TODWindowOptions {
  showCloseButton?: boolean;
  explicitTheme?: Theme;
  themeVersion?: number;
}

// New interfaces for Inventory
export interface PlayerInventoryItem {
  id: string; // GameItemBase['id']
  quantity: number;
  currentStrength?: number; // For rechargeable/strength-based items
}
export type PlayerInventory = Record<string, PlayerInventoryItem>; // itemId as key

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

  // New Inventory and Spy Shop States/Functions
  playerInventory: PlayerInventory;
  setPlayerInventory: React.Dispatch<React.SetStateAction<PlayerInventory>>;
  updatePlayerInventoryItemStrength: (itemId: string, newStrength: number) => void;
  spendElint: (amount: number) => boolean;
  purchaseItem: (itemId: string, cost: number) => boolean;
  shopSearchTerm: string;
  setShopSearchTerm: (term: string) => void;
  isShopAuthenticated: boolean;
  setIsShopAuthenticated: (isAuthenticated: boolean) => void;

  isSpyShopActive: boolean;
  setIsSpyShopActive: (isActive: boolean) => void;
  isSpyShopOpen: boolean;
  openSpyShop: () => void;
  closeSpyShop: () => void;

  todInventoryContext: {
    category: ItemCategory;
    title: string;
    purpose?: 'equip_lock' | 'equip_nexus' | 'infiltrate_lock';
    onItemSelect?: (item: GameItemBase) => void;
  } | null;
  openInventoryTOD: (context: AppContextType['todInventoryContext']) => void;
  closeInventoryTOD: () => void;
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
    const positiveIndex = (combinedSeed % NATO_ALPHABET.length + NATO_ALPHABET.length) % NATO_ALPHABET.length;
    return NATO_ALPHABET[positiveIndex];
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
  const [_isLoading, _setIsLoading] = useState(true);
  const [_messages, _setMessages] = useState<GameMessage[]>([]);

  const [_isTODWindowOpen, _setIsTODWindowOpen] = useState(false);
  const [_todWindowTitle, _setTODWindowTitle] = useState('');
  const [_todWindowContent, _setTODWindowContent] = useState<ReactNode | null>(null);
  const [_todWindowOptions, _setTODWindowOptions] = useState<TODWindowOptions>({ showCloseButton: true, explicitTheme: 'terminal-green', themeVersion: 0 });

  // New state initializations
  const [_playerInventory, _setPlayerInventory] = useState<PlayerInventory>({
    'basic_pick_l1': { id: 'basic_pick_l1', quantity: 1 },
    'std_cypher_lock_l1': { id: 'std_cypher_lock_l1', quantity: 2, currentStrength: 50 },
    'security_camera_l1': { id: 'security_camera_l1', quantity: 1, currentStrength: 1 },
    'theme_cyphers': { id: 'theme_cyphers', quantity: 1 },
  });
  const [_isSpyShopActive, _setIsSpyShopActive] = useState(false);
  const [_todInventoryContext, _setTodInventoryContext] = useState<AppContextType['todInventoryContext']>(null);
  const [_isSpyShopOpen, _setIsSpyShopOpen] = useState(false); // <--- ADDED / CONFIRMED
  const [_shopSearchTerm, _setShopSearchTerm] = useState(''); // <--- ADDED / CONFIRMED
  const [_isShopAuthenticated, _setIsShopAuthenticated] = useState(false); // <--- ADDED / CONFIRMED


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
  }, []);

  const setFaction = useCallback((newFaction: Faction) => {
    console.log('[AppContext] setFaction called with:', newFaction);
    _setFaction(newFaction);
  }, [_setFaction]);

  useEffect(() => {
    console.log('[AppContext] INTERNAL faction state changed to:', _faction);
  }, [_faction]);

  const setIsAuthenticated = useCallback((auth: boolean) => _setIsAuthenticated(auth), [_setIsAuthenticated]);
  const setPlayerSpyName = useCallback((name: string | null) => _setPlayerSpyName(name), [_setPlayerSpyName]);
  const setPlayerPiName = useCallback((name: string | null) => _setPlayerPiName(name), [_setPlayerPiName]);
  const setOnboardingStep = useCallback((step: OnboardingStep) => _setOnboardingStep(step), [_setOnboardingStep]);
  const setIsLoading = useCallback((loading: boolean) => _setIsLoading(loading), [_setIsLoading]);
  const setPlayerInventory = useCallback((action: React.SetStateAction<PlayerInventory>) => _setPlayerInventory(action), [_setPlayerInventory]);
  const setIsSpyShopActive = useCallback((isActive: boolean) => _setIsSpyShopActive(isActive), [_setIsSpyShopActive]);
  const setIsSpyShopOpen = useCallback((isOpen: boolean) => _setIsSpyShopOpen(isOpen), [_setIsSpyShopOpen]); // <--- ADDED / CONFIRMED
  const setShopSearchTerm = useCallback((term: string) => _setShopSearchTerm(term), [_setShopSearchTerm]); // <--- ADDED / CONFIRMED
  const setIsShopAuthenticated = useCallback((isAuthenticated: boolean) => _setIsShopAuthenticated(isAuthenticated), [_setIsShopAuthenticated]); // <--- ADDED / CONFIRMED


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
    _setPlayerStats(prevStats => ({ ...prevStats, xp: prevStats.xp + amount }));
    addMessage({ text: `+${amount} XP`, type: 'notification'});
  }, [_setPlayerStats, addMessage]);


  // New Inventory and ELINT functions
  const updatePlayerInventoryItemStrength = useCallback((itemId: string, newStrength: number) => {
    _setPlayerInventory(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], currentStrength: newStrength },
    }));
  }, [_setPlayerInventory]);

  const spendElint = useCallback((amount: number): boolean => {
    if (_playerStats.elintReserves >= amount) {
      _setPlayerStats(prev => ({ ...prev, elintReserves: prev.elintReserves - amount }));
      return true;
    }
    return false;
  }, [_playerStats, _setPlayerStats]);

  const purchaseItem = useCallback((itemId: string, cost: number): boolean => {
    if (spendElint(cost)) {
      const itemDetails = getItemById(itemId);
      if (!itemDetails) return false;

      _setPlayerInventory(prev => {
        const existing = prev[itemId];
        const maxStrength = getItemMaxStrength(itemDetails); // Get max strength from itemDetails
        return {
          ...prev,
          [itemId]: {
            id: itemId,
            quantity: (existing?.quantity || 0) + 1,
            // If the item already exists, keep its current strength unless undefined.
            // If new, set to maxStrength if available, otherwise undefined.
            currentStrength: existing?.currentStrength !== undefined ? existing.currentStrength : maxStrength,
          },
        };
      });
      addMessage({ text: `Purchased ${itemDetails.name}`, type: 'notification' });
      return true;
    }
    addMessage({ text: `Insufficient ELINT to purchase ${itemId}.`, type: 'error' });
    return false;
  }, [spendElint, _setPlayerInventory, addMessage]);


  const openTODWindow = useCallback((title: string, content: ReactNode, options: TODWindowOptions = { showCloseButton: true }) => {
    console.log('[AppContext] openTODWindow called. Title:', title, "Options:", options, "Current isTODWindowOpen:", _isTODWindowOpen);
    _setTODWindowTitle(title);
    _setTODWindowContent(content);
    _setTODWindowOptions(options);
    console.log('[AppContext] Attempting to set _isTODWindowOpen to true.');
    _setIsTODWindowOpen(true);
    console.log('[AppContext] After _setIsTODWindowOpen(true) call.');
  }, [_setTODWindowTitle, _setTODWindowContent, _setTODWindowOptions, _setIsTODWindowOpen, _isTODWindowOpen]);

  const closeTODWindow = useCallback(() => {
    console.log('[AppContext] closeTODWindow called.');
    _setIsTODWindowOpen(false);
    // TODWindow component now handles clearing content after its animation
  }, [_setIsTODWindowOpen]);

  // Spy Shop specific functions
  const openSpyShop = useCallback(() => {
    _setIsSpyShopOpen(true);
    // IMPORTANT: No openTODWindow call here, as the Spy Shop is a separate overlay.
  }, [_setIsSpyShopOpen]);

  const closeSpyShop = useCallback(() => {
    _setIsSpyShopOpen(false);
    // IMPORTANT: No closeTODWindow call here.
  }, [_setIsSpyShopOpen]);


  // New Inventory TOD window functions
  const openInventoryTOD = useCallback((context: AppContextType['todInventoryContext']) => {
    _setTodInventoryContext(context);
    // Open the main TOD window, its content will be the InventoryBrowserInTOD component
    // The actual content rendering happens within TODWindow based on _todWindowContent
    openTODWindow(context?.title || "Inventory Access", <InventoryBrowserInTOD />, {
      explicitTheme: _todWindowOptions.explicitTheme,
      themeVersion: _todWindowOptions.themeVersion,
      showCloseButton: true, // Typically show close button for inventory
    });
  }, [_setTodInventoryContext, openTODWindow, _todWindowOptions.explicitTheme, _todWindowOptions.themeVersion]);

  const closeInventoryTOD = useCallback(() => {
    _setTodInventoryContext(null);
    closeTODWindow(); // Your existing closeTODWindow function
  }, [_setTodInventoryContext, closeTODWindow]);


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

    // New Context Values
    playerInventory: _playerInventory, setPlayerInventory,
    updatePlayerInventoryItemStrength,
    spendElint,
    purchaseItem,
    isSpyShopActive: _isSpyShopActive, setIsSpyShopActive,
    isSpyShopOpen: _isSpyShopOpen, // <--- ADDED to contextValue
    openSpyShop, // <--- ADDED to contextValue
    closeSpyShop, // <--- ADDED to contextValue
    shopSearchTerm: _shopSearchTerm, // <--- ADDED to contextValue
    setShopSearchTerm, // <--- ADDED to contextValue
    isShopAuthenticated: _isShopAuthenticated, // <--- ADDED to contextValue
    setIsShopAuthenticated, // <--- ADDED to contextValue
    todInventoryContext: _todInventoryContext,
    openInventoryTOD,
    closeInventoryTOD,
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
    // New dependencies for useMemo - ENSURE ALL NEW STATES/SETTERS ARE HERE
    _playerInventory, setPlayerInventory, updatePlayerInventoryItemStrength,
    spendElint, purchaseItem,
    _isSpyShopActive, setIsSpyShopActive,
    _isSpyShopOpen, openSpyShop, closeSpyShop, // <--- ADDED to dependencies
    _shopSearchTerm, setShopSearchTerm, // <--- ADDED to dependencies
    _isShopAuthenticated, setIsShopAuthenticated, // <--- ADDED to dependencies
    _todInventoryContext, openInventoryTOD, closeInventoryTOD,
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
      {/* RENDER TODWindow UNCONDITIONALLY HERE - NO _todWindowContent && CHECK */}
      {/* This ensures TODWindow is always mounted, allowing its internal state to manage animations correctly. */}
      <TODWindow
        isOpen={_isTODWindowOpen}
        onClose={closeTODWindow}
        title={_todWindowTitle}
        explicitTheme={_todWindowOptions.explicitTheme}
        themeVersion={_todWindowOptions.themeVersion}
        showCloseButton={_todWindowOptions.showCloseButton}
      >
        {_todWindowContent} {/* Content is still passed, can be null */}
      </TODWindow>
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