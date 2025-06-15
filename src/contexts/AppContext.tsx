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
import { getItemById, type ItemCategory, type GameItemBase, type PlayerInventoryItem, type VaultSlot, type ItemLevel } from '@/lib/game-items';
import { CodenameInput } from '@/components/game/onboarding/CodenameInput';

export type Faction = 'Cyphers' | 'Shadows' | 'Observer';
export type OnboardingStep = 'welcome' | 'factionChoice' | 'authPrompt' | 'codenameInput' | 'fingerprint' | 'tod';

export interface PlayerStats {
  xp: number;
  level: ItemLevel;
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
  xp: 0, level: 1, elintReserves: 0, elintTransferred: 0,
  successfulVaultInfiltrations: 0, successfulLockInfiltrations: 0,
  elintObtainedTotal: 0, elintObtainedCycle: 0, elintLostTotal: 0, elintLostCycle: 0,
  elintGeneratedTotal: 0, elintGeneratedCycle: 0, elintTransferredToHQCyle: 0,
  successfulInterferences: 0, elintSpentSpyShop: 0,
  hasPlacedFirstLock: false,
};

const FIXED_DEV_PI_ID = "mock_pi_id_12345"; // Exposed for WelcomeScreen to use

interface AppContextType {
  currentPlayer: Player | null;
  isLoading: boolean;
  isPiBrowser: boolean;
  onboardingStep: OnboardingStep;
  messages: GameMessage[];
  dailyTeamCode: Record<Faction | 'Observer', string>;
  faction: Faction;
  isAuthenticated: boolean;
  playerSpyName: string | null;
  playerPiName: string | null;
  playerStats: PlayerStats;
  playerInventory: PlayerInventory;
  playerVault: VaultSlot[];
  pendingPiId: string | null;
  setFaction: (faction: Faction) => Promise<void>;
  setPlayerSpyName: (name: string) => Promise<void>;
  setOnboardingStep: (step: OnboardingStep) => void;
  setIsLoading: (loading: boolean) => void;
  addMessage: (message: Omit<GameMessage, 'id' | 'timestamp'>) => void;
  updatePlayerStats: (newStats: Partial<PlayerStats>) => Promise<void>;
  addXp: (amount: number) => Promise<void>;
  handleAuthentication: (piId: string, chosenFaction: Faction) => Promise<void>;
  attemptLoginWithPiId: (piId: string) => Promise<void>;
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
  playerInfo: Player | null;
  isScrollLockActive: boolean; // New state for TOD scroll lock
  setIsScrollLockActive: (locked: boolean) => void; // New setter
  getItemById: (id: string) => GameItemBase | undefined; // Added getItemById
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function generateFactionTeamCode(seedDate: Date, faction: Faction | 'Observer'): string {
  const start = new Date(seedDate.getFullYear(), 0, 0);
  const diff = seedDate.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  let factionSeedOffset = 3000;
  if (faction === 'Cyphers') factionSeedOffset = 1000;
  else if (faction === 'Shadows') factionSeedOffset = 2000;
  const NATO_ALPHABET = ["Alpha", "Bravo", "Charlie", "Delta", "Echo", "Foxtrot", "Golf", "Hotel", "India", "Juliett", "Kilo", "Lima", "Mike", "November", "Oscar", "Papa", "Quebec", "Romeo", "Sierra", "Tango", "Uniform", "Victor", "Whiskey", "X-ray", "Yankee", "Zulu"];
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
  const [_dailyTeamCode, _setDailyTeamCode] = useState<Record<Faction | 'Observer', string>>({ Cyphers: '', Shadows: '', Observer: '' });
  const [_isTODWindowOpen, _setIsTODWindowOpen] = useState(false);
  const [_todWindowTitle, _setTODWindowTitle] = useState('');
  const [_todWindowContent, _setTODWindowContent] = useState<ReactNode | null>(null);
  const [_todWindowOptions, _setTODWindowOptions] = useState<TODWindowOptions>({ showCloseButton: true });
  const [_isSpyShopActive, _setIsSpyShopActive] = useState(false);
  const [_isSpyShopOpen, _setIsSpyShopOpen] = useState(false);
  const [_shopSearchTerm, _setShopSearchTerm] = useState('');
  const [_isShopAuthenticated, _setIsShopAuthenticated] = useState(false);
  const [_todInventoryContext, _setTodInventoryContext] = useState<AppContextType['todInventoryContext']>(null);
  const [_pendingPiId, _setPendingPiId] = useState<string | null>(null);
  const [_isScrollLockActive, _setIsScrollLockActive] = useState(false); // New state for scroll lock

  const { theme: currentGlobalTheme, themeVersion } = useTheme();

  const addMessage = useCallback((message: Omit<GameMessage, 'id' | 'timestamp'>) => {
    _setMessages(prev => {
      const newMessage: GameMessage = {
        ...message,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        timestamp: new Date(),
      };
      const newMessagesList = [newMessage, ...prev.filter(m => !m.isPinned)];
      const pinnedMessages = prev.filter(m => m.isPinned);
      const combinedMessages = [...pinnedMessages, ...newMessagesList];
      return combinedMessages.slice(0, 50);
    });
  }, []);

  const closeTODWindow = useCallback(() => {
    _setIsTODWindowOpen(false);
    _setTODWindowContent(null);
  }, []);

  const openTODWindow = useCallback((title: string, content: ReactNode, options: TODWindowOptions = {}) => {
    _setTODWindowTitle(title);
    _setTODWindowContent(content);
    const defaultShowCloseButton = options.showCloseButton === undefined ? true : options.showCloseButton;
    const themeToUseForWindow = options.explicitTheme || currentGlobalTheme || 'terminal-green';
    const versionToUseForWindow = options.explicitTheme ? (options.themeVersion === undefined ? themeVersion : options.themeVersion) : themeVersion;
    _setTODWindowOptions({
        showCloseButton: defaultShowCloseButton,
        explicitTheme: themeToUseForWindow,
        themeVersion: versionToUseForWindow
    });
    _setIsTODWindowOpen(true);
  }, [currentGlobalTheme, themeVersion]);

  const attemptLoginWithPiId = useCallback(async (piId: string) => {
    _setIsLoading(true);
    const player = await getPlayer(piId);
    if (player) {
      _setCurrentPlayer(player);
      if (typeof window !== "undefined") localStorage.setItem('lastPlayerId', piId);
      if (player.faction === 'Observer') {
        _setOnboardingStep('tod');
      } else if (player.spyName) {
        _setOnboardingStep('fingerprint');
      } else {
        _setOnboardingStep('codenameInput');
        const factionThemeForCodename = player.faction === 'Cyphers' ? 'cyphers' : player.faction === 'Shadows' ? 'shadows' : currentGlobalTheme;
        openTODWindow(
          "Agent Codename",
          <CodenameInput explicitTheme={factionThemeForCodename} />,
          { showCloseButton: false, explicitTheme: factionThemeForCodename, themeVersion }
        );
      }
      addMessage({type: 'system', text: `Welcome back, Agent ${player.spyName || piId.substring(0,8)}.`});
    } else {
      _setPendingPiId(piId);
      _setOnboardingStep('factionChoice');
      addMessage({type: 'system', text: 'New operative detected. Proceed to faction alignment.'});
    }
    _setIsLoading(false);
  }, [openTODWindow, addMessage, currentGlobalTheme, themeVersion]);

  const handleAuthentication = useCallback(async (piIdToAuth: string, chosenFaction: Faction) => {
    _setIsLoading(true);
    if (typeof window !== "undefined") localStorage.setItem('lastPlayerId', piIdToAuth);
    let player = await getPlayer(piIdToAuth);
    let nextOnboardingStep: OnboardingStep = 'welcome';
    if (player) {
      if (player.faction !== chosenFaction && chosenFaction !== 'Observer') {
        player = { ...player, faction: chosenFaction };
        await updatePlayer(player);
      }
       _setCurrentPlayer(player);
       nextOnboardingStep = player.spyName ? 'fingerprint' : 'codenameInput';
       if (chosenFaction === 'Observer') nextOnboardingStep = 'tod';
    } else {
      player = await createPlayer(piIdToAuth, chosenFaction, { ...DEFAULT_PLAYER_STATS_FOR_NEW_PLAYER }, null);
      _setCurrentPlayer(player);
      nextOnboardingStep = chosenFaction === 'Observer' ? 'tod' : 'codenameInput';
    }
    _setPendingPiId(null);
    if (nextOnboardingStep === 'codenameInput' && player && player.faction !== 'Observer') {
      const factionThemeForCodename = player.faction === 'Cyphers' ? 'cyphers' : player.faction === 'Shadows' ? 'shadows' : currentGlobalTheme;
      openTODWindow(
        "Agent Codename",
        <CodenameInput explicitTheme={factionThemeForCodename} />,
        { showCloseButton: false, explicitTheme: factionThemeForCodename, themeVersion: themeVersion }
      );
    }
     _setOnboardingStep(nextOnboardingStep);
    _setIsLoading(false);
  }, [openTODWindow, currentGlobalTheme, themeVersion]);
  
  useEffect(() => {
    initializePlayerData();
    const inPiBrowser = typeof window !== "undefined" && navigator.userAgent.includes("PiBrowser");
    _setIsPiBrowser(inPiBrowser);
    const today = new Date();
    _setDailyTeamCode({
      Cyphers: generateFactionTeamCode(today, 'Cyphers'),
      Shadows: generateFactionTeamCode(today, 'Shadows'),
      Observer: generateFactionTeamCode(today, 'Observer'),
    });

    const loadLastPlayer = async () => {
      _setIsLoading(true);
      const lastPlayerId = typeof window !== "undefined" ? localStorage.getItem('lastPlayerId') : null;
      if (lastPlayerId) {
        const player = await getPlayer(lastPlayerId);
        if (player) {
          _setCurrentPlayer(player);
          if (player.faction === 'Observer') {
            _setOnboardingStep('tod');
          } else if (player.spyName) {
            _setOnboardingStep('fingerprint');
          } else {
             _setOnboardingStep('codenameInput');
             const factionThemeForCodename = player.faction === 'Cyphers' ? 'cyphers' : player.faction === 'Shadows' ? 'shadows' : currentGlobalTheme;
             openTODWindow(
              "Agent Codename",
              <CodenameInput explicitTheme={factionThemeForCodename} />,
              { showCloseButton: false, explicitTheme: factionThemeForCodename, themeVersion }
            );
          }
        } else {
          if (typeof window !== "undefined") localStorage.removeItem('lastPlayerId');
          _setOnboardingStep('welcome');
        }
      } else {
        _setOnboardingStep('welcome');
      }
      _setIsLoading(false);
    };
    loadLastPlayer();
  }, [openTODWindow, currentGlobalTheme, themeVersion]);


  const setFactionAppContext = useCallback(async (newFaction: Faction) => {
    if (_currentPlayer) {
      const updatedPlayer = { ..._currentPlayer, faction: newFaction };
      const result = await updatePlayer(updatedPlayer);
      if (result) _setCurrentPlayer(result);
    }
  }, [_currentPlayer]);

  const setPlayerSpyNameAppContext = useCallback(async (name: string) => {
    if (_currentPlayer) {
      const updatedPlayer = { ..._currentPlayer, spyName: name };
      const result = await updatePlayer(updatedPlayer);
       if (result) _setCurrentPlayer(result);
    }
  }, [_currentPlayer]);

  const updatePlayerStatsAppContext = useCallback(async (newStats: Partial<PlayerStats>) => {
    if (_currentPlayer) {
      const updatedPlayer = {
        ..._currentPlayer,
        stats: { ..._currentPlayer.stats, ...newStats },
      };
      const result = await updatePlayer(updatedPlayer);
      if (result) _setCurrentPlayer(result);
    }
  }, [_currentPlayer]);

  const logout = useCallback(() => {
    _setCurrentPlayer(null);
    if (typeof window !== "undefined") localStorage.removeItem('lastPlayerId');
    _setOnboardingStep('welcome');
    _setIsLoading(false);
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
      await updatePlayerStatsAppContext({
        elintReserves: _currentPlayer.stats.elintReserves - amount,
        elintSpentSpyShop: (_currentPlayer.stats.elintSpentSpyShop || 0) + amount,
      });
      return true;
    }
    return false;
  }, [_currentPlayer, updatePlayerStatsAppContext]);

  const addItemToInventory = useCallback(async (
    itemId: string,
    quantity: number = 1,
    itemDetails?: Partial<Omit<PlayerInventoryItem, 'id' | 'quantity'>>
  ) => {
    if (_currentPlayer) {
      const newInventory = { ..._currentPlayer.inventory };
      const baseItem = getItemById(itemId);
      const strengthToAdd = itemDetails?.currentStrength ?? baseItem?.maxStrength ?? undefined;
      if (newInventory[itemId]) {
        newInventory[itemId].quantity += quantity;
        if (strengthToAdd !== undefined && newInventory[itemId].currentStrength === undefined) {
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
      addMessage({ text: `Purchased ${itemData.name} L${itemData.level}`, type: 'notification' });
      return true;
    }
    addMessage({ text: `Insufficient ELINT to purchase ${itemData.name} L${itemData.level}.`, type: 'error' });
    return false;
  }, [_currentPlayer, spendElint, addItemToInventory, addMessage]);

  const deployItemToVault = useCallback(async (slotId: string, itemIdToDeploy: string | null) => {
    if (!_currentPlayer) return;
    let itemBeingDeployed: GameItemBase | undefined = undefined;
    let itemBeingRemovedFromSlot: PlayerInventoryItem | null = null;
    const newInventory = JSON.parse(JSON.stringify(_currentPlayer.inventory));
    const newVault = JSON.parse(JSON.stringify(_currentPlayer.vault));
    const slotIndex = newVault.findIndex((slot: VaultSlot) => slot.id === slotId);

    if (slotIndex === -1) {
      addMessage({ text: `Vault slot ${slotId} not found.`, type: 'error' }); return;
    }
    itemBeingRemovedFromSlot = newVault[slotIndex].item;
    if (itemIdToDeploy) {
      itemBeingDeployed = getItemById(itemIdToDeploy);
      if (!itemBeingDeployed) { addMessage({ text: `Item ${itemIdToDeploy} not found.`, type: 'error' }); return; }
      if (!newInventory[itemIdToDeploy] || newInventory[itemIdToDeploy].quantity <= 0) {
        addMessage({ text: `Cannot deploy ${itemBeingDeployed.name}: Not in inventory.`, type: 'error' }); return;
      }
      const deployedItemInstance: PlayerInventoryItem = {
        id: itemBeingDeployed.id, quantity: 1, currentStrength: itemBeingDeployed.maxStrength,
      };
      newVault[slotIndex].item = deployedItemInstance;
      newInventory[itemIdToDeploy].quantity -= 1;
      if (newInventory[itemIdToDeploy].quantity <= 0) delete newInventory[itemIdToDeploy];
    } else {
      newVault[slotIndex].item = null;
    }
    if (itemBeingRemovedFromSlot) {
      if (newInventory[itemBeingRemovedFromSlot.id]) {
        newInventory[itemBeingRemovedFromSlot.id].quantity += itemBeingRemovedFromSlot.quantity;
      } else {
        newInventory[itemBeingRemovedFromSlot.id] = itemBeingRemovedFromSlot;
      }
    }
    let newStats = { ..._currentPlayer.stats };
    if (itemBeingDeployed && itemBeingDeployed.category === 'Hardware' && !newStats.hasPlacedFirstLock) {
      newStats = { ...newStats, elintReserves: newStats.elintReserves + 10000, hasPlacedFirstLock: true };
      addMessage({ type: 'notification', text: 'First lock deployed! ELINT Reserves boosted by 10,000!' });
    }
    const updatedPlayer: Player = { ..._currentPlayer, stats: newStats, inventory: newInventory, vault: newVault };
    const result = await updatePlayer(updatedPlayer);
    if (result) {
      _setCurrentPlayer(result);
      addMessage({ text: itemIdToDeploy && itemBeingDeployed ? `Deployed ${itemBeingDeployed.name} L${itemBeingDeployed.level} to vault.` : `Cleared vault slot.`, type: 'system' });
    }
  }, [_currentPlayer, addMessage]);

  const addXp = useCallback(async (amount: number) => {
    if (_currentPlayer) {
      await updatePlayerStatsAppContext({ xp: _currentPlayer.stats.xp + amount });
      addMessage({ text: `+${amount} XP`, type: 'notification' });
    }
  }, [_currentPlayer, updatePlayerStatsAppContext, addMessage]);

  const openInventoryTOD = useCallback((context: AppContextType['todInventoryContext']) => {
    _setTodInventoryContext(context);
    const playerForTheme = _currentPlayer;
    const resolvedTheme = playerForTheme?.faction === 'Cyphers' ? 'cyphers'
                        : playerForTheme?.faction === 'Shadows' ? 'shadows'
                        : currentGlobalTheme || 'terminal-green';
    openTODWindow(
      context?.title || "Inventory",
      <div>Inventory Browser for {context?.category} - {context?.title}</div>, // Placeholder, will be replaced by InventoryBrowserInTOD
      { explicitTheme: resolvedTheme, themeVersion: themeVersion, showCloseButton: true }
    );
  }, [_currentPlayer, currentGlobalTheme, themeVersion, openTODWindow]);

  const closeInventoryTOD = useCallback(() => {
    _setTodInventoryContext(null);
    closeTODWindow();
  }, [closeTODWindow]);

  const playerInfoForShop = useMemo(() => {
    if (!_currentPlayer) return null;
    return {
      id: _currentPlayer.id,
      spyName: _currentPlayer.spyName,
      faction: _currentPlayer.faction,
      stats: { level: _currentPlayer.stats.level, elintReserves: _currentPlayer.stats.elintReserves },
    } as Player; // Cast needed if Player type expects more stats for shop specifically
  }, [_currentPlayer]);

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
    pendingPiId: _pendingPiId,
    setFaction: setFactionAppContext,
    setPlayerSpyName: setPlayerSpyNameAppContext,
    setOnboardingStep: _setOnboardingStep,
    setIsLoading: _setIsLoading,
    addMessage,
    updatePlayerStats: updatePlayerStatsAppContext,
    addXp,
    handleAuthentication,
    attemptLoginWithPiId,
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
    playerInfo: playerInfoForShop,
    isScrollLockActive: _isScrollLockActive,
    setIsScrollLockActive: _setIsScrollLockActive,
    getItemById: getItemById, // Explicitly include getItemById
  }), [
    _currentPlayer, _isLoading, _isPiBrowser, _onboardingStep, _messages, _dailyTeamCode, _pendingPiId,
    _isTODWindowOpen, _todWindowTitle, _todWindowContent, _todWindowOptions,
    _isSpyShopActive, _isSpyShopOpen, _shopSearchTerm, _isShopAuthenticated, _todInventoryContext,
    playerInfoForShop, addMessage, openTODWindow, closeTODWindow, attemptLoginWithPiId, handleAuthentication,
    setFactionAppContext, setPlayerSpyNameAppContext, updatePlayerStatsAppContext, addXp, logout,
    updatePlayerInventoryItemStrength, spendElint, purchaseItem, addItemToInventory, removeItemFromInventory,
    deployItemToVault, openInventoryTOD, closeInventoryTOD, _setOnboardingStep, _setIsLoading,
    _setIsSpyShopActive, _setShopSearchTerm, _setIsShopAuthenticated,
    _isScrollLockActive, _setIsScrollLockActive // Add new scroll lock states
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
  return {
    ...context, // Spread existing context values
    getItemById: getItemById, // Explicitly include getItemById
  };
}

export { FIXED_DEV_PI_ID };