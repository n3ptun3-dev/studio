// src/contexts/AppContext.tsx

"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Theme } from './ThemeContext';
import { useTheme } from './ThemeContext';
import {
  initializePlayerData,
  getPlayer,
  createPlayer,
  updatePlayer,
  type Player,
} from '@/lib/player-data';
import { getItemById, type ItemCategory, type GameItemBase, type PlayerInventoryItem, type VaultSlot } from '@/lib/game-items';
import { CodenameInput } from '@/components/game/onboarding/CodenameInput'; // Import CodenameInput

export type Faction = 'Cyphers' | 'Shadows' | 'Observer';
export type OnboardingStep = 'welcome' | 'factionChoice' | 'authPrompt' | 'codenameInput' | 'fingerprint' | 'tod';

export interface PlayerStats {
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
  hasPlacedFirstLock: boolean;
}

export interface TODWindowOptions {
  showCloseButton?: boolean;
  explicitTheme?: Theme;
  themeVersion?: number;
}

export type PlayerInventory = Record<string, PlayerInventoryItem>;

export interface GameMessage {
  id: string;
  text: string;
  type: 'system' | 'hq' | 'notification' | 'error' | 'lore' | 'alert';
  timestamp: Date;
  isPinned?: boolean;
  sender?: string;
}

const DEFAULT_PLAYER_STATS_FOR_NEW_PLAYER: PlayerStats = {
  xp: 0, level: 1, elintReserves: 500, elintTransferred: 0,
  successfulVaultInfiltrations: 0, successfulLockInfiltrations: 0,
  elintObtainedTotal: 0, elintObtainedCycle: 0, elintLostTotal: 0, elintLostCycle: 0,
  elintGeneratedTotal: 0, elintGeneratedCycle: 0, elintTransferredToHQCyle: 0,
  successfulInterferences: 0, elintSpentSpyShop: 0,
  hasPlacedFirstLock: false,
};

interface AppContextType {
  currentPlayer: Player | null;
  isLoading: boolean;
  isPiBrowser: boolean;
  onboardingStep: OnboardingStep;
  messages: GameMessage[];
  dailyTeamCode: Record<Faction, string>;
  faction: Faction;
  isAuthenticated: boolean;
  playerSpyName: string | null;
  playerPiName: string | null;
  playerStats: PlayerStats;
  playerInventory: PlayerInventory;
  playerVault: VaultSlot[];
  setFaction: (faction: Faction) => Promise<void>;
  setPlayerSpyName: (name: string) => Promise<void>;
  setOnboardingStep: (step: OnboardingStep) => void;
  setIsLoading: (loading: boolean) => void;
  addMessage: (message: Omit<GameMessage, 'id' | 'timestamp'>) => void;
  updatePlayerStats: (newStats: Partial<PlayerStats>) => Promise<void>;
  addXp: (amount: number) => Promise<void>;
  handleAuthentication: (piId: string, chosenFaction: Faction) => Promise<void>;
  logout: () => void;
  isTODWindowOpen: boolean;
  todWindowTitle: string;
  todWindowContent: ReactNode | null;
  todWindowOptions: TODWindowOptions;
  openTODWindow: (title: string, content: ReactNode, options?: TODWindowOptions) => void;
  closeTODWindow: () => void;
  updatePlayerInventoryItemStrength: (itemId: string, newStrength: number) => Promise<void>;
  spendElint: (amount: number) => Promise<boolean>;
  purchaseItem: (itemId: string) => Promise<boolean>;
  addItemToInventory: (itemId: string, quantity?: number, itemDetails?: Partial<Omit<PlayerInventoryItem, 'id' | 'quantity'>>) => Promise<void>;
  removeItemFromInventory: (itemId: string, quantity?: number) => Promise<void>;
  deployItemToVault: (slotId: string, itemId: string | null) => Promise<void>;
  isSpyShopActive: boolean;
  setIsSpyShopActive: (isActive: boolean) => void;
  isSpyShopOpen: boolean;
  openSpyShop: () => void;
  closeSpyShop: () => void;
  shopSearchTerm: string;
  setShopSearchTerm: (term: string) => void;
  isShopAuthenticated: boolean;
  setIsShopAuthenticated: (isAuthenticated: boolean) => void;
  todInventoryContext: {
    category: ItemCategory;
    title: string;
    purpose?: 'equip_lock' | 'equip_nexus' | 'infiltrate_lock';
    onItemSelect?: (item: GameItemBase) => void;
  } | null;
  openInventoryTOD: (context: AppContextType['todInventoryContext']) => void;
  closeInventoryTOD: () => void;
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
  const [_currentPlayer, _setCurrentPlayer] = useState<Player | null>(null);
  const [_isLoading, _setIsLoading] = useState(true);
  const [_isPiBrowser, _setIsPiBrowser] = useState(false);
  const [_onboardingStep, _setOnboardingStep] = useState<OnboardingStep>('welcome');
  const [_messages, _setMessages] = useState<GameMessage[]>([]);
  const [_dailyTeamCode, _setDailyTeamCode] = useState<Record<Faction, string>>({ Cyphers: '', Shadows: '', Observer: '' });
  const [_isTODWindowOpen, _setIsTODWindowOpen] = useState(false);
  const [_todWindowTitle, _setTODWindowTitle] = useState('');
  const [_todWindowContent, _setTODWindowContent] = useState<ReactNode | null>(null);
  const [_todWindowOptions, _setTODWindowOptions] = useState<TODWindowOptions>({ showCloseButton: true });
  const [_isSpyShopActive, _setIsSpyShopActive] = useState(false);
  const [_isSpyShopOpen, _setIsSpyShopOpen] = useState(false);
  const [_shopSearchTerm, _setShopSearchTerm] = useState('');
  const [_isShopAuthenticated, _setIsShopAuthenticated] = useState(false);
  const [_todInventoryContext, _setTodInventoryContext] = useState<AppContextType['todInventoryContext']>(null);

  const { theme: currentGlobalTheme } = useTheme(); // For passing to TODWindow explicitly if needed

  useEffect(() => {
    console.log('[AppContext] Initializing...');
    initializePlayerData();
    const inPiBrowser = navigator.userAgent.includes("PiBrowser");
    _setIsPiBrowser(inPiBrowser);
    const today = new Date();
    _setDailyTeamCode({
      Cyphers: generateFactionTeamCode(today, 'Cyphers'),
      Shadows: generateFactionTeamCode(today, 'Shadows'),
      Observer: generateFactionTeamCode(today, 'Observer'),
    });

    const loadLastPlayer = async () => {
      _setIsLoading(true);
      const lastPlayerId = localStorage.getItem('lastPlayerId');
      if (lastPlayerId) {
        const player = await getPlayer(lastPlayerId);
        if (player) {
          _setCurrentPlayer(player);
          _setOnboardingStep(player.spyName ? 'fingerprint' : 'codenameInput');
        } else {
          localStorage.removeItem('lastPlayerId');
          _setOnboardingStep('welcome');
        }
      } else {
        _setOnboardingStep('welcome');
      }
      _setIsLoading(false);
    };
    loadLastPlayer();
  }, []);

  useEffect(() => { console.log('[AppContext] INTERNAL _currentPlayer state changed:', _currentPlayer); }, [_currentPlayer]);
  useEffect(() => { console.log('[AppContext] INTERNAL _onboardingStep changed to:', _onboardingStep); }, [_onboardingStep]);
  useEffect(() => { console.log('[AppContext] INTERNAL _isLoading changed to:', _isLoading); }, [_isLoading]);
  useEffect(() => { console.log('[AppContext] INTERNAL _isTODWindowOpen changed to:', _isTODWindowOpen);}, [_isTODWindowOpen]);


  const openTODWindow = useCallback((title: string, content: ReactNode, options: TODWindowOptions = {}) => {
    console.log('[AppContext] openTODWindow called. Title:', title, "Current _isTODWindowOpen:", _isTODWindowOpen);
    _setTODWindowTitle(title);
    _setTODWindowContent(content);
    const defaultShowCloseButton = options.showCloseButton === undefined ? true : options.showCloseButton;
    _setTODWindowOptions(prevOptions => ({ ...prevOptions, ...options, showCloseButton: defaultShowCloseButton }));
    console.log('[AppContext] Setting _isTODWindowOpen to true.');
    _setIsTODWindowOpen(true);
  }, [_setIsTODWindowOpen, _setTODWindowTitle, _setTODWindowContent, _setTODWindowOptions]); // Added _isTODWindowOpen to deps for the log

  const closeTODWindow = useCallback(() => {
    console.log('[AppContext] closeTODWindow called.');
    _setIsTODWindowOpen(false);
    _setTODWindowContent(null);
  }, [_setIsTODWindowOpen, _setTODWindowContent]);

  const setFaction = useCallback(async (newFaction: Faction) => {
    console.log('[AppContext] setFaction called with:', newFaction);
    if (_currentPlayer) {
      const updatedPlayer = { ..._currentPlayer, faction: newFaction };
      const result = await updatePlayer(updatedPlayer);
      if (result) _setCurrentPlayer(result);
    }
  }, [_currentPlayer]);

  const setPlayerSpyName = useCallback(async (name: string) => {
    if (_currentPlayer) {
      const updatedPlayer = { ..._currentPlayer, spyName: name };
      const result = await updatePlayer(updatedPlayer);
      if (result) _setCurrentPlayer(result);
    }
  }, [_currentPlayer]);

  const updatePlayerStats = useCallback(async (newStats: Partial<PlayerStats>) => {
    if (_currentPlayer) {
      const updatedPlayer = {
        ..._currentPlayer,
        stats: { ..._currentPlayer.stats, ...newStats },
      };
      const result = await updatePlayer(updatedPlayer);
      if (result) _setCurrentPlayer(result);
    }
  }, [_currentPlayer]);

  const handleAuthentication = useCallback(async (piId: string, chosenFaction: Faction) => {
    _setIsLoading(true);
    localStorage.setItem('lastPlayerId', piId);
    let player = await getPlayer(piId);
    let nextOnboardingStep: OnboardingStep = 'welcome';
    let playerToOpenWindowWith: Player | null = null;

    if (player) {
      console.log('[AppContext] Existing player found:', player.id, "Chosen faction:", chosenFaction);
      if (player.faction !== chosenFaction && chosenFaction !== 'Observer') {
        player = { ...player, faction: chosenFaction };
        const updated = await updatePlayer(player);
        if (updated) player = updated;
      }
      _setCurrentPlayer(player);
      playerToOpenWindowWith = player;
      nextOnboardingStep = player.spyName ? 'fingerprint' : 'codenameInput';
    } else {
      console.log('[AppContext] New player. ID:', piId, "Chosen faction:", chosenFaction);
      const newPlayer = await createPlayer(piId, chosenFaction, DEFAULT_PLAYER_STATS_FOR_NEW_PLAYER, null);
      _setCurrentPlayer(newPlayer);
      playerToOpenWindowWith = newPlayer;
      nextOnboardingStep = 'codenameInput';
    }

    if (chosenFaction === 'Observer') {
      nextOnboardingStep = 'tod';
    }
    
    _setIsLoading(false);
    _setOnboardingStep(nextOnboardingStep); // Set onboarding step first

    // If the next step is codenameInput, AppContext directly opens the window
    if (nextOnboardingStep === 'codenameInput' && playerToOpenWindowWith) {
      const factionTheme = playerToOpenWindowWith.faction === 'Cyphers' ? 'cyphers' : playerToOpenWindowWith.faction === 'Shadows' ? 'shadows' : 'terminal-green';
      console.log(`[AppContext] Player faction is ${playerToOpenWindowWith.faction}, opening CodenameInput with theme: ${factionTheme}`);
      openTODWindow(
        "Agent Codename",
        <CodenameInput explicitTheme={factionTheme} />,
        { showCloseButton: false }
      );
    }
  }, [openTODWindow]); // Added openTODWindow to dependencies

  const logout = useCallback(() => {
    _setCurrentPlayer(null);
    localStorage.removeItem('lastPlayerId');
    _setOnboardingStep('welcome');
  }, []);

  const addMessage = useCallback((message: Omit<GameMessage, 'id' | 'timestamp'>) => {
    const newMessage: GameMessage = {
      ...message,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      timestamp: new Date(),
    };
    _setMessages(prev => {
      const newMessagesList = [newMessage, ...prev.filter(m => !m.isPinned)];
      const pinnedMessages = prev.filter(m => m.isPinned);
      return [...pinnedMessages, ...newMessagesList.slice(0, 50 - pinnedMessages.length)];
    });
  }, []);

  const updatePlayerInventoryItemStrength = useCallback(async (itemId: string, newStrength: number) => {
    if (_currentPlayer) {
      const newInventory = { ..._currentPlayer.inventory };
      if (newInventory[itemId]) {
        newInventory[itemId] = { ...newInventory[itemId], currentStrength: newStrength };
        const updatedPlayer = { ..._currentPlayer, inventory: newInventory };
        const result = await updatePlayer(updatedPlayer);
        if (result) _setCurrentPlayer(result);
      }
    }
  }, [_currentPlayer]);

  const spendElint = useCallback(async (amount: number): Promise<boolean> => {
    if (_currentPlayer && _currentPlayer.stats.elintReserves >= amount) {
      await updatePlayerStats({
        elintReserves: _currentPlayer.stats.elintReserves - amount,
        elintSpentSpyShop: _currentPlayer.stats.elintSpentSpyShop + amount, // Track spending
      });
      return true;
    }
    return false;
  }, [_currentPlayer, updatePlayerStats]);

  const addItemToInventory = useCallback(async (
    itemId: string,
    quantity: number = 1,
    itemDetails?: Partial<Omit<PlayerInventoryItem, 'id' | 'quantity'>>
  ) => {
    if (_currentPlayer) {
      const newInventory = { ..._currentPlayer.inventory };
      const baseItem = getItemById(itemId); // Get base item to determine maxStrength if not provided
      const strengthToAdd = itemDetails?.currentStrength ?? baseItem?.maxStrength ?? undefined;

      if (newInventory[itemId]) {
        newInventory[itemId].quantity += quantity;
        if (strengthToAdd !== undefined) { // Only update strength if provided or available
          newInventory[itemId].currentStrength = strengthToAdd;
        }
      } else {
        newInventory[itemId] = { id: itemId, quantity, currentStrength: strengthToAdd, ...itemDetails };
      }
      const updatedPlayer = { ..._currentPlayer, inventory: newInventory };
      const result = await updatePlayer(updatedPlayer);
      if (result) _setCurrentPlayer(result);
    }
  }, [_currentPlayer]);

  const removeItemFromInventory = useCallback(async (itemId: string, quantity: number = 1) => {
    if (_currentPlayer) {
      const newInventory = { ..._currentPlayer.inventory };
      if (newInventory[itemId]) {
        newInventory[itemId].quantity -= quantity;
        if (newInventory[itemId].quantity <= 0) {
          delete newInventory[itemId];
        }
        const updatedPlayer = { ..._currentPlayer, inventory: newInventory };
        const result = await updatePlayer(updatedPlayer);
        if (result) _setCurrentPlayer(result);
      }
    }
  }, [_currentPlayer]);

  const purchaseItem = useCallback(async (itemId: string): Promise<boolean> => {
    const itemData = getItemById(itemId);
    if (!itemData || !_currentPlayer) {
      addMessage({ text: `Error: Item ${itemId} not found or player data missing.`, type: 'error' });
      return false;
    }
    if (await spendElint(itemData.cost)) {
      await addItemToInventory(itemId, 1, { currentStrength: itemData.maxStrength });
      addMessage({ text: `Purchased ${itemData.name}`, type: 'notification' });
      return true;
    }
    addMessage({ text: `Insufficient ELINT to purchase ${itemData.name}.`, type: 'error' });
    return false;
  }, [_currentPlayer, spendElint, addItemToInventory, addMessage]);

  const deployItemToVault = useCallback(async (slotId: string, itemIdToDeploy: string | null) => {
    if (!_currentPlayer) return;

    let itemBeingDeployed: GameItemBase | undefined = undefined;
    let itemBeingRemovedFromSlot: PlayerInventoryItem | null = null;
    const newInventory = { ..._currentPlayer.inventory };
    const newVault = [..._currentPlayer.vault];
    const slotIndex = newVault.findIndex(slot => slot.id === slotId);

    if (slotIndex === -1) {
      console.error(`Vault slot ${slotId} not found.`);
      return;
    }

    itemBeingRemovedFromSlot = newVault[slotIndex].item;

    if (itemIdToDeploy) {
      itemBeingDeployed = getItemById(itemIdToDeploy);
      if (!itemBeingDeployed) {
        console.error(`Item ${itemIdToDeploy} not found for deployment.`);
        return;
      }
      if (!newInventory[itemIdToDeploy] || newInventory[itemIdToDeploy].quantity <= 0) {
        addMessage({ text: `Cannot deploy ${itemBeingDeployed.name}: Not in inventory.`, type: 'error' });
        return;
      }
      const deployedItemInstance: PlayerInventoryItem = {
        id: itemBeingDeployed.id,
        quantity: 1, // Always deploy one instance
        currentStrength: itemBeingDeployed.maxStrength, // Deploy with max strength
      };
      newVault[slotIndex].item = deployedItemInstance;
      newInventory[itemIdToDeploy].quantity -= 1;
      if (newInventory[itemIdToDeploy].quantity <= 0) {
        delete newInventory[itemIdToDeploy];
      }
    } else {
      newVault[slotIndex].item = null;
    }

    if (itemBeingRemovedFromSlot) {
      if (newInventory[itemBeingRemovedFromSlot.id]) {
        newInventory[itemBeingRemovedFromSlot.id].quantity += itemBeingRemovedFromSlot.quantity; // Add back exact quantity
      } else {
        newInventory[itemBeingRemovedFromSlot.id] = itemBeingRemovedFromSlot;
      }
    }

    let newStats = { ..._currentPlayer.stats };
    if (itemBeingDeployed && itemBeingDeployed.category === 'Vault Hardware' && !newStats.hasPlacedFirstLock) {
      newStats = {
        ...newStats,
        elintReserves: newStats.elintReserves + 10000,
        hasPlacedFirstLock: true,
      };
      addMessage({ type: 'notification', text: 'First lock deployed! ELINT Reserves boosted by 10,000!' });
    }

    const updatedPlayer: Player = {
      ..._currentPlayer,
      stats: newStats,
      inventory: newInventory,
      vault: newVault,
    };

    const result = await updatePlayer(updatedPlayer);
    if (result) {
      _setCurrentPlayer(result);
      addMessage({ text: itemIdToDeploy && itemBeingDeployed ? `Deployed ${itemBeingDeployed.name} to vault.` : `Cleared vault slot.`, type: 'system' });
    }
  }, [_currentPlayer, addMessage]);

  const addXp = useCallback(async (amount: number) => {
    if (_currentPlayer) {
      await updatePlayerStats({ xp: _currentPlayer.stats.xp + amount });
      // Level up logic could be added here or in updatePlayerStats
      addMessage({ text: `+${amount} XP`, type: 'notification' });
    }
  }, [_currentPlayer, updatePlayerStats, addMessage]);


  const openInventoryTOD = useCallback((context: AppContextType['todInventoryContext']) => {
    _setTodInventoryContext(context);
    const currentTheme = _todWindowOptions.explicitTheme || currentGlobalTheme || 'terminal-green';
    const currentVersion = _todWindowOptions.themeVersion || 0;
    openTODWindow(
      context?.title || "Inventory",
      <div>Inventory Browser for {context?.category} - {context?.title}</div>, // Placeholder, page.tsx will render actual component
      {
        explicitTheme: currentTheme,
        themeVersion: currentVersion, // Pass version to ensure re-render if theme changes
        showCloseButton: true,
      }
    );
  }, [_setTodInventoryContext, openTODWindow, _todWindowOptions.explicitTheme, _todWindowOptions.themeVersion, currentGlobalTheme]);

  const closeInventoryTOD = useCallback(() => {
    _setTodInventoryContext(null);
    closeTODWindow();
  }, [_setTodInventoryContext, closeTODWindow]);

  const contextValue = useMemo(() => ({
    currentPlayer: _currentPlayer,
    isLoading: _isLoading,
    isPiBrowser: _isPiBrowser,
    onboardingStep: _onboardingStep,
    messages: _messages,
    dailyTeamCode: _dailyTeamCode,
    faction: _currentPlayer?.faction || 'Observer',
    isAuthenticated: !!_currentPlayer,
    playerSpyName: _currentPlayer?.spyName || null,
    playerPiName: _currentPlayer?.id || null,
    playerStats: _currentPlayer?.stats || DEFAULT_PLAYER_STATS_FOR_NEW_PLAYER,
    playerInventory: _currentPlayer?.inventory || {},
    playerVault: _currentPlayer?.vault || [],
    setFaction,
    setPlayerSpyName,
    setOnboardingStep: _setOnboardingStep,
    setIsLoading: _setIsLoading,
    addMessage,
    updatePlayerStats,
    addXp,
    handleAuthentication,
    logout,
    isTODWindowOpen: _isTODWindowOpen,
    todWindowTitle: _todWindowTitle,
    todWindowContent: _todWindowContent,
    todWindowOptions: _todWindowOptions,
    openTODWindow,
    closeTODWindow,
    updatePlayerInventoryItemStrength,
    spendElint,
    purchaseItem,
    addItemToInventory,
    removeItemFromInventory,
    deployItemToVault,
    isSpyShopActive: _isSpyShopActive,
    setIsSpyShopActive: _setIsSpyShopActive,
    isSpyShopOpen: _isSpyShopOpen,
    openSpyShop: () => _setIsSpyShopOpen(true),
    closeSpyShop: () => _setIsSpyShopOpen(false),
    shopSearchTerm: _shopSearchTerm,
    setShopSearchTerm: _setShopSearchTerm,
    isShopAuthenticated: _isShopAuthenticated,
    setIsShopAuthenticated: _setIsShopAuthenticated,
    todInventoryContext: _todInventoryContext,
    openInventoryTOD,
    closeInventoryTOD,
  }), [
    _currentPlayer, _isLoading, _isPiBrowser, _onboardingStep, _messages, _dailyTeamCode,
    setFaction, setPlayerSpyName, _setOnboardingStep, _setIsLoading, addMessage, updatePlayerStats, addXp, handleAuthentication, logout,
    _isTODWindowOpen, _todWindowTitle, _todWindowContent, _todWindowOptions, openTODWindow, closeTODWindow,
    updatePlayerInventoryItemStrength, spendElint, purchaseItem, addItemToInventory, removeItemFromInventory, deployItemToVault,
    _isSpyShopActive, _setIsSpyShopActive, _isSpyShopOpen, _setIsSpyShopOpen, _shopSearchTerm, _setShopSearchTerm, _isShopAuthenticated, _setIsShopAuthenticated,
    _todInventoryContext, openInventoryTOD, closeInventoryTOD
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

    