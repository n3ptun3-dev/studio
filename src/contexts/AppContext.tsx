// src/contexts/AppContext.tsx

"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Theme } from './ThemeContext';
import { useTheme } from './ThemeContext'; // Import useTheme
// import { TODWindow } from '@/components/game/shared/TODWindow'; // TODWindow is rendered in page.tsx

// Import from player-data
import {
  initializePlayerData,
  getPlayer,
  createPlayer,
  updatePlayer,
  type Player,
  // PlayerStats is defined below, ensure consistency
  // PlayerInventoryItem is defined below
  // VaultSlot is defined below
} from '@/lib/player-data';

import { getItemById, type ItemCategory, type GameItemBase } from '@/lib/game-items'; // Ensure GameItemBase and ItemCategory are imported

// Re-define types here if they are not exported from player-data.ts or to ensure AppContext is self-contained for its types.
// For now, assuming Player from player-data.ts is sufficient.

export type Faction = 'Cyphers' | 'Shadows' | 'Observer';
export type OnboardingStep = 'welcome' | 'factionChoice' | 'codenameInput' | 'authPrompt' | 'fingerprint' | 'tod';

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
  hasPlacedFirstLock: boolean; // New field
}

export interface TODWindowOptions {
  showCloseButton?: boolean;
  explicitTheme?: Theme;
  themeVersion?: number;
}

export interface PlayerInventoryItem {
  id: string; // GameItemBase['id']
  quantity: number;
  currentStrength?: number;
}
export type PlayerInventory = Record<string, PlayerInventoryItem>;

export interface VaultSlot {
  id: string; // e.g., "lock_slot_0", "upgrade_slot_0"
  type: 'lock' | 'upgrade';
  item: PlayerInventoryItem | null; // The equipped item
}


export interface GameMessage {
  id: string;
  text: string;
  type: 'system' | 'hq' | 'notification' | 'error' | 'lore' | 'alert';
  timestamp: Date;
  isPinned?: boolean;
  sender?: string;
}

const DEFAULT_PLAYER_STATS: PlayerStats = {
  xp: 0, level: 0, elintReserves: 0, elintTransferred: 0,
  successfulVaultInfiltrations: 0, successfulLockInfiltrations: 0,
  elintObtainedTotal: 0, elintObtainedCycle: 0, elintLostTotal: 0, elintLostCycle: 0,
  elintGeneratedTotal: 0, elintGeneratedCycle: 0, elintTransferredToHQCyle: 0,
  successfulInterferences: 0, elintSpentSpyShop: 0,
  hasPlacedFirstLock: false, // Default to false
};

interface AppContextType {
  // States
  currentPlayer: Player | null;
  isLoading: boolean;
  isPiBrowser: boolean;
  onboardingStep: OnboardingStep;
  messages: GameMessage[];
  dailyTeamCode: Record<Faction, string>;

  // Derived states (getters)
  faction: Faction;
  isAuthenticated: boolean;
  playerSpyName: string | null;
  playerPiName: string | null; // Usually the ID from Pi Network
  playerStats: PlayerStats;
  playerInventory: PlayerInventory;
  playerVault: VaultSlot[];

  // Mutators & Actions
  setFaction: (faction: Faction) => Promise<void>;
  setPlayerSpyName: (name: string) => Promise<void>;
  setOnboardingStep: (step: OnboardingStep) => void;
  setIsLoading: (loading: boolean) => void; // Kept for manual loading control if needed
  addMessage: (message: Omit<GameMessage, 'id' | 'timestamp'>) => void;
  updatePlayerStats: (newStats: Partial<PlayerStats>) => Promise<void>;
  addXp: (amount: number) => Promise<void>;
  handleAuthentication: (piId: string, chosenFaction: Faction) => Promise<void>;
  logout: () => void;

  // TOD Window
  isTODWindowOpen: boolean;
  todWindowTitle: string;
  todWindowContent: ReactNode | null;
  todWindowOptions: TODWindowOptions;
  openTODWindow: (title: string, content: ReactNode, options?: TODWindowOptions) => void;
  closeTODWindow: () => void;

  // Inventory & Spy Shop
  updatePlayerInventoryItemStrength: (itemId: string, newStrength: number) => Promise<void>;
  spendElint: (amount: number) => Promise<boolean>; // Returns true if successful
  purchaseItem: (itemId: string) => Promise<boolean>; // Pass itemId, cost is fetched
  addItemToInventory: (itemId: string, quantity?: number, itemDetails?: Partial<Omit<PlayerInventoryItem, 'id'|'quantity'>>) => Promise<void>;
  removeItemFromInventory: (itemId: string, quantity?: number) => Promise<void>;
  deployItemToVault: (slotId: string, itemId: string | null) => Promise<void>;


  isSpyShopActive: boolean; // For the global fade overlay
  setIsSpyShopActive: (isActive: boolean) => void; // Manages the fade overlay
  isSpyShopOpen: boolean; // For the actual shop modal/view
  openSpyShop: () => void;
  closeSpyShop: () => void;
  shopSearchTerm: string;
  setShopSearchTerm: (term: string) => void;
  isShopAuthenticated: boolean; // Example, if shop needs separate auth
  setIsShopAuthenticated: (isAuthenticated: boolean) => void;

  todInventoryContext: {
    category: ItemCategory; // Use the imported ItemCategory
    title: string;
    purpose?: 'equip_lock' | 'equip_nexus' | 'infiltrate_lock'; // Keep as is, or make more generic if needed
    onItemSelect?: (item: GameItemBase) => void; // Use GameItemBase
  } | null;
  openInventoryTOD: (context: AppContextType['todInventoryContext']) => void;
  closeInventoryTOD: () => void;

  themeVersion: number; // From ThemeContext, passed through for convenience if needed by consumers of AppContext
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
  const [currentPlayer, _setCurrentPlayer] = useState<Player | null>(null);
  const [isLoading, _setIsLoading] = useState(true);
  const [isPiBrowser, _setIsPiBrowser] = useState(false);
  const [onboardingStep, _setOnboardingStep] = useState<OnboardingStep>('welcome');
  const [messages, _setMessages] = useState<GameMessage[]>([]);
  const [dailyTeamCode, _setDailyTeamCode] = useState<Record<Faction, string>>({ Cyphers: '', Shadows: '', Observer: '' });

  const [isTODWindowOpen, _setIsTODWindowOpen] = useState(false);
  const [todWindowTitle, _setTODWindowTitle] = useState('');
  const [todWindowContent, _setTODWindowContent] = useState<ReactNode | null>(null);
  const [todWindowOptions, _setTODWindowOptions] = useState<TODWindowOptions>({ showCloseButton: true });

  const [isSpyShopActive, _setIsSpyShopActive] = useState(false);
  const [isSpyShopOpen, _setIsSpyShopOpen] = useState(false);
  const [shopSearchTerm, _setShopSearchTerm] = useState('');
  const [isShopAuthenticated, _setIsShopAuthenticated] = useState(false);
  const [todInventoryContext, _setTodInventoryContext] = useState<AppContextType['todInventoryContext']>(null);
  
  const { themeVersion: currentThemeVersionFromContext } = useTheme(); // Get themeVersion from ThemeContext

  useEffect(() => {
    console.log('[AppContext] Initializing...');
    initializePlayerData(); // Initialize in-memory store from db.json
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
        console.log('[AppContext] Found lastPlayerId in localStorage:', lastPlayerId);
        const player = await getPlayer(lastPlayerId);
        if (player) {
          console.log('[AppContext] Player loaded from storage:', player);
          _setCurrentPlayer(player);
          _setOnboardingStep('fingerprint'); // Or 'tod' if fingerprint is skippable for returning users
        } else {
          console.log('[AppContext] PlayerId found, but no player data. Clearing localStorage.');
          localStorage.removeItem('lastPlayerId');
          _setOnboardingStep('welcome');
        }
      } else {
        console.log('[AppContext] No lastPlayerId in localStorage. New user flow.');
        _setOnboardingStep('welcome');
      }
      _setIsLoading(false);
    };
    loadLastPlayer();
  }, []);

  // Loggers for state changes
  useEffect(() => { console.log('[AppContext] INTERNAL currentPlayer state changed:', currentPlayer); }, [currentPlayer]);
  useEffect(() => { console.log('[AppContext] INTERNAL onboardingStep changed to:', onboardingStep); }, [onboardingStep]);
  useEffect(() => { console.log('[AppContext] INTERNAL isLoading changed to:', isLoading); }, [isLoading]);
  useEffect(() => { console.log('[AppContext] isTODWindowOpen changed to:', isTODWindowOpen);}, [isTODWindowOpen]);


  const setFaction = useCallback(async (newFaction: Faction) => {
    console.log('[AppContext] setFaction called with:', newFaction);
    if (currentPlayer) {
      const updatedPlayer = { ...currentPlayer, faction: newFaction };
      const result = await updatePlayer(updatedPlayer);
      if (result) _setCurrentPlayer(result);
    }
  }, [currentPlayer]);

  const setPlayerSpyName = useCallback(async (name: string) => {
    if (currentPlayer) {
      const updatedPlayer = { ...currentPlayer, spyName: name };
      const result = await updatePlayer(updatedPlayer);
      if (result) _setCurrentPlayer(result);
    }
  }, [currentPlayer]);
  
  const updatePlayerStats = useCallback(async (newStats: Partial<PlayerStats>) => {
    if (currentPlayer) {
      const updatedPlayer = {
        ...currentPlayer,
        stats: { ...currentPlayer.stats, ...newStats },
      };
      const result = await updatePlayer(updatedPlayer);
      if (result) _setCurrentPlayer(result);
    }
  }, [currentPlayer]);

  const addXp = useCallback(async (amount: number) => {
    if (currentPlayer) {
      await updatePlayerStats({ xp: currentPlayer.stats.xp + amount });
      addMessage({ text: `+${amount} XP`, type: 'notification' });
    }
  }, [currentPlayer, updatePlayerStats]);

  const handleAuthentication = useCallback(async (piId: string, chosenFaction: Faction) => {
    _setIsLoading(true);
    localStorage.setItem('lastPlayerId', piId);
    let player = await getPlayer(piId);
    if (player) {
      // If player exists but faction is different (e.g. observer rejoining as faction)
      if (player.faction !== chosenFaction && chosenFaction !== 'Observer') {
         player = { ...player, faction: chosenFaction };
         const updated = await updatePlayer(player);
         if (updated) player = updated;
      }
      _setCurrentPlayer(player);
      _setOnboardingStep(player.spyName ? 'fingerprint' : 'codenameInput'); // If spyName exists, go to fingerprint
    } else {
      const newPlayer = await createPlayer(piId, chosenFaction, DEFAULT_PLAYER_STATS); // Pass default stats
      _setCurrentPlayer(newPlayer);
      if (chosenFaction === 'Observer') {
        _setOnboardingStep('tod'); // Observers skip codename/fingerprint
      } else {
        _setOnboardingStep('codenameInput');
      }
    }
    _setIsLoading(false);
  }, []);

  const logout = useCallback(() => {
    _setCurrentPlayer(null);
    localStorage.removeItem('lastPlayerId');
    _setOnboardingStep('welcome');
    // Potentially reset theme to default if logout should do that
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

  const openTODWindow = useCallback((title: string, content: ReactNode, options: TODWindowOptions = {}) => {
    console.log('[AppContext] openTODWindow called. Title:', title);
    _setTODWindowTitle(title);
    _setTODWindowContent(content);
    _setTODWindowOptions(prevOptions => ({ ...prevOptions, ...options, showCloseButton: options.showCloseButton !== undefined ? options.showCloseButton : true }));
    console.log('[AppContext] Setting isTODWindowOpen to true.');
    _setIsTODWindowOpen(true);
  }, [_setIsTODWindowOpen, _setTODWindowTitle, _setTODWindowContent, _setTODWindowOptions]);

  const closeTODWindow = useCallback(() => {
    console.log('[AppContext] closeTODWindow called.');
    _setIsTODWindowOpen(false);
    _setTODWindowContent(null); // Clear content when closing
  }, [_setIsTODWindowOpen, _setTODWindowContent]);


  const updatePlayerInventoryItemStrength = useCallback(async (itemId: string, newStrength: number) => {
    if (currentPlayer) {
      const newInventory = { ...currentPlayer.inventory };
      if (newInventory[itemId]) {
        newInventory[itemId] = { ...newInventory[itemId], currentStrength: newStrength };
        const updatedPlayer = { ...currentPlayer, inventory: newInventory };
        const result = await updatePlayer(updatedPlayer);
        if (result) _setCurrentPlayer(result);
      }
    }
  }, [currentPlayer]);

  const spendElint = useCallback(async (amount: number): Promise<boolean> => {
    if (currentPlayer && currentPlayer.stats.elintReserves >= amount) {
      const newStats = { ...currentPlayer.stats, elintReserves: currentPlayer.stats.elintReserves - amount };
      const updatedPlayer = { ...currentPlayer, stats: newStats };
      const result = await updatePlayer(updatedPlayer);
      if (result) {
        _setCurrentPlayer(result);
        return true;
      }
    }
    return false;
  }, [currentPlayer]);

  const addItemToInventory = useCallback(async (
    itemId: string, 
    quantity: number = 1, 
    itemDetails?: Partial<Omit<PlayerInventoryItem, 'id'|'quantity'>>
  ) => {
    if (currentPlayer) {
      const newInventory = { ...currentPlayer.inventory };
      if (newInventory[itemId]) {
        newInventory[itemId].quantity += quantity;
        if(itemDetails?.currentStrength !== undefined) {
          newInventory[itemId].currentStrength = itemDetails.currentStrength;
        }
      } else {
        newInventory[itemId] = { id: itemId, quantity, ...itemDetails };
      }
      const updatedPlayer = { ...currentPlayer, inventory: newInventory };
      const result = await updatePlayer(updatedPlayer);
      if (result) _setCurrentPlayer(result);
    }
  }, [currentPlayer]);

  const removeItemFromInventory = useCallback(async (itemId: string, quantity: number = 1) => {
    if (currentPlayer) {
      const newInventory = { ...currentPlayer.inventory };
      if (newInventory[itemId]) {
        newInventory[itemId].quantity -= quantity;
        if (newInventory[itemId].quantity <= 0) {
          delete newInventory[itemId];
        }
        const updatedPlayer = { ...currentPlayer, inventory: newInventory };
        const result = await updatePlayer(updatedPlayer);
        if (result) _setCurrentPlayer(result);
      }
    }
  }, [currentPlayer]);

  const purchaseItem = useCallback(async (itemId: string): Promise<boolean> => {
    const itemData = getItemById(itemId);
    if (!itemData || !currentPlayer) {
      addMessage({ text: `Error: Item ${itemId} not found or player data missing.`, type: 'error' });
      return false;
    }
    if (await spendElint(itemData.cost)) {
      await addItemToInventory(itemId, 1, { currentStrength: itemData.maxStrength }); // Add with max strength if applicable
      await updatePlayerStats({ elintSpentSpyShop: currentPlayer.stats.elintSpentSpyShop + itemData.cost });
      addMessage({ text: `Purchased ${itemData.name}`, type: 'notification' });
      return true;
    }
    addMessage({ text: `Insufficient ELINT to purchase ${itemData.name}.`, type: 'error' });
    return false;
  }, [currentPlayer, spendElint, addItemToInventory, updatePlayerStats, addMessage]);

  const deployItemToVault = useCallback(async (slotId: string, itemIdToDeploy: string | null) => {
    if (!currentPlayer) return;

    let itemBeingDeployed: GameItemBase | undefined = undefined;
    let itemBeingRemovedFromSlot: PlayerInventoryItem | null = null;

    const newVault = [...currentPlayer.vault];
    const slotIndex = newVault.findIndex(slot => slot.id === slotId);

    if (slotIndex === -1) {
        console.error(`Vault slot ${slotId} not found.`);
        return;
    }

    // Store item currently in slot to return to inventory
    itemBeingRemovedFromSlot = newVault[slotIndex].item;

    if (itemIdToDeploy) { // Deploying a new item
        itemBeingDeployed = getItemById(itemIdToDeploy);
        if (!itemBeingDeployed) {
            console.error(`Item ${itemIdToDeploy} not found for deployment.`);
            return;
        }
        if (!currentPlayer.inventory[itemIdToDeploy] || currentPlayer.inventory[itemIdToDeploy].quantity <= 0) {
            console.error(`Item ${itemIdToDeploy} not in inventory or quantity is zero.`);
            addMessage({ text: `Cannot deploy ${itemBeingDeployed.name}: Not in inventory.`, type: 'error'});
            return;
        }
        
        newVault[slotIndex].item = { ...currentPlayer.inventory[itemIdToDeploy], quantity: 1 }; // Deploy one instance
        
        // Update inventory: decrease quantity of deployed item
        const newInventory = { ...currentPlayer.inventory };
        newInventory[itemIdToDeploy].quantity -= 1;
        if (newInventory[itemIdToDeploy].quantity <= 0) {
            delete newInventory[itemIdToDeploy];
        }
        currentPlayer.inventory = newInventory; // Directly mutate for now, will be saved via updatePlayer
    } else { // Clearing a slot
        newVault[slotIndex].item = null;
    }

    // If an item was previously in the slot, add it back to inventory
    if (itemBeingRemovedFromSlot) {
        const existingInventoryItem = currentPlayer.inventory[itemBeingRemovedFromSlot.id];
        if (existingInventoryItem) {
            currentPlayer.inventory[itemBeingRemovedFromSlot.id].quantity += 1;
        } else {
            currentPlayer.inventory[itemBeingRemovedFromSlot.id] = { ...itemBeingRemovedFromSlot, quantity: 1 };
        }
    }
    
    const updatedPlayer: Player = {
      ...currentPlayer,
      vault: newVault,
      // inventory is already updated on currentPlayer
    };

    // First lock placed reward logic
    let statsUpdatedForReward = false;
    if (itemBeingDeployed && itemBeingDeployed.category === 'Vault Hardware' && !updatedPlayer.stats.hasPlacedFirstLock) {
        updatedPlayer.stats = {
            ...updatedPlayer.stats,
            elintReserves: updatedPlayer.stats.elintReserves + 10000,
            hasPlacedFirstLock: true,
        };
        statsUpdatedForReward = true;
        addMessage({ type: 'notification', text: 'First lock deployed! ELINT Reserves boosted by 10,000!' });
    }

    const result = await updatePlayer(updatedPlayer);
    if (result) {
        _setCurrentPlayer(result);
        addMessage({ text: itemIdToDeploy && itemBeingDeployed ? `Deployed ${itemBeingDeployed.name} to vault.` : `Cleared vault slot.`, type: 'system' });
    }

  }, [currentPlayer, addMessage]);


  const openInventoryTOD = useCallback((context: AppContextType['todInventoryContext']) => {
    _setTodInventoryContext(context);
    const currentTheme = todWindowOptions.explicitTheme || 'terminal-green';
    const currentVersion = todWindowOptions.themeVersion || 0;
    openTODWindow(
      context?.title || "Inventory",
      // Placeholder, actual InventoryBrowserInTOD will be rendered by page.tsx based on context
      // For now, let's ensure it CAN receive the context
      <div>Inventory Browser for {context?.category} - {context?.title}</div>,
      {
        explicitTheme: currentTheme,
        themeVersion: currentVersion,
        showCloseButton: true,
      }
    );
  }, [_setTodInventoryContext, openTODWindow, todWindowOptions.explicitTheme, todWindowOptions.themeVersion]);

  const closeInventoryTOD = useCallback(() => {
    _setTodInventoryContext(null);
    closeTODWindow();
  }, [_setTodInventoryContext, closeTODWindow]);


  const contextValue = useMemo(() => ({
    currentPlayer,
    isLoading,
    isPiBrowser,
    onboardingStep,
    messages,
    dailyTeamCode,

    faction: currentPlayer?.faction || 'Observer',
    isAuthenticated: !!currentPlayer,
    playerSpyName: currentPlayer?.spyName || null,
    playerPiName: currentPlayer?.id || null,
    playerStats: currentPlayer?.stats || DEFAULT_PLAYER_STATS,
    playerInventory: currentPlayer?.inventory || {},
    playerVault: currentPlayer?.vault || [],

    setFaction,
    setPlayerSpyName,
    setOnboardingStep: _setOnboardingStep,
    setIsLoading: _setIsLoading,
    addMessage,
    updatePlayerStats,
    addXp,
    handleAuthentication,
    logout,

    isTODWindowOpen,
    todWindowTitle,
    todWindowContent,
    todWindowOptions,
    openTODWindow,
    closeTODWindow,

    updatePlayerInventoryItemStrength,
    spendElint,
    purchaseItem,
    addItemToInventory,
    removeItemFromInventory,
    deployItemToVault,

    isSpyShopActive,
    setIsSpyShopActive: _setIsSpyShopActive,
    isSpyShopOpen,
    openSpyShop: () => _setIsSpyShopOpen(true),
    closeSpyShop: () => _setIsSpyShopOpen(false),
    shopSearchTerm,
    setShopSearchTerm: _setShopSearchTerm,
    isShopAuthenticated,
    setIsShopAuthenticated: _setIsShopAuthenticated,

    todInventoryContext,
    openInventoryTOD,
    closeInventoryTOD,
    themeVersion: currentThemeVersionFromContext,
  }), [
    currentPlayer, isLoading, isPiBrowser, onboardingStep, messages, dailyTeamCode,
    setFaction, setPlayerSpyName, _setOnboardingStep, _setIsLoading, addMessage, updatePlayerStats, addXp, handleAuthentication, logout,
    isTODWindowOpen, todWindowTitle, todWindowContent, todWindowOptions, openTODWindow, closeTODWindow,
    updatePlayerInventoryItemStrength, spendElint, purchaseItem, addItemToInventory, removeItemFromInventory, deployItemToVault,
    isSpyShopActive, _setIsSpyShopActive, isSpyShopOpen, _setIsSpyShopOpen, shopSearchTerm, _setShopSearchTerm, isShopAuthenticated, _setIsShopAuthenticated,
    todInventoryContext, openInventoryTOD, closeInventoryTOD, currentThemeVersionFromContext
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
      {/* TODWindow is rendered globally by page.tsx, not here, to ensure it's part of HomePage's direct tree for context updates */}
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
