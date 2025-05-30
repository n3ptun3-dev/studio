// This file defines the data structures and item lists for the Spi vs Spi game.
// It includes interfaces for various item categories and populated arrays of example items.

// Placeholder for ITEM_LEVEL_COLORS_CSS_VARS, as it's imported but not defined here.
// In a real application, this would come from a 'constants' file.
const ITEM_LEVEL_COLORS_CSS_VARS = {
  1: 'var(--color-level-1)',
  2: 'var(--color-level-2)',
  3: 'var(--color-level-3)',
  4: 'var(--color-level-4)',
  5: 'var(--color-level-5)',
  6: 'var(--color-level-6)',
  7: 'var(--color-level-7)',
  8: 'var(--color-level-8)',
};

export type ItemLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

// Define and export ITEM_LEVELS array for easier iteration and use in other components
export const ITEM_LEVELS: ItemLevel[] = [1, 2, 3, 4, 5, 6, 7, 8];

export interface GameItemBase {
  id: string; // Unique per level, e.g. "std_cypher_lock_l1"
  name: string; // Base name, e.g., "Standard Cypher Lock" - level will be appended in display
  title?: string; // Fully formatted title for display, e.g., "Standard Cypher Lock L1"
  description: string;
  level: ItemLevel;
  cost: number; // ELINT cost
  scarcity: 'Common' | 'Uncommon' | 'Rare' | 'Very Rare' | 'Super Rare' | 'Scarce';
  category: ItemCategory;
  imageSrc?: string; // URL for item image (for detail view)
  tileImageSrc?: string; // URL for item tile in grid view (can be same as imageSrc or different)
  colorVar: keyof typeof ITEM_LEVEL_COLORS_CSS_VARS; // To link to CSS variable for color
  dataAiHint?: string; // Hint for AI to replace placeholder images

  // Detailed properties - some are optional and category-specific
  strength?: { current: number, max: number }; // For Vault Hardware, Lock Fortifiers
  resistance?: { current: number, max: number }; // For Vault Hardware, Lock Fortifiers
  minigameEffect?: string; // For Vault Hardware
  attackFactor?: number; // For Entry Tools
  type?: 'One-Time Use' | 'Rechargeable' | 'Consumable' | 'Not Applicable'; // For Lock Fortifiers, Entry Tools
  perUseCost?: number; // For rechargeable items
  functionDescription?: string; // For Lock Fortifiers, Nexus Upgrades, Assault Tech
  minigameInfluence?: string; // For Lock Fortifiers, Nexus Upgrades, Assault Tech
  levelScalingNote?: string; // For Entry Tools
  lockTypeEffectiveness?: { // For Entry Tools
    idealCounterAgainst: string[];
    poorMatchPenaltyAgainst?: string[];
    idealMatchBonus?: string; 
  };
  strengthPerEntryClarification?: string; // For Entry Tools
  lockFortifierEffectsDefinition?: string; // For Entry Tools
  specialEffectsDefinition?: string; // For Entry Tools
  rechargeCost?: number; // For Nexus Upgrades
  rechargeCapacity?: string; // For Nexus Upgrades
  destructionDescription?: string; // For Nexus Upgrades
  cooldown?: string; // For Nexus Upgrades
  placement?: string; // For Nexus Upgrades, Assault Tech
  durability?: string; // For Nexus Upgrades, Assault Tech
  repurchaseCost?: number; // For Assault Tech, some Nexus Upgrades
  idealMatch?: string; // For Assault Tech
  poorMatch?: string; // For Assault Tech
  themeKey?: string; // For Aesthetic Schemes
  itemTypeDetail?: string; // General type detail if not covered by category
  functionText?: string; // Alternative to functionDescription
  keyCrackerInfluence?: string; // Alternative to minigameInfluence
  maxStrength?: number; // Used in AppContext for PlayerInventoryItem
  maxCharges?: number; // For Entry Tools that are consumable by charge
  processingPowerBoost?: number; // Example for Nexus Upgrades
}


// Categories from the prompt
export type ItemCategory = 
  | 'Vault Hardware' 
  | 'Lock Fortifiers' 
  | 'Entry Tools' 
  | 'Infiltration Gear' 
  | 'Nexus Upgrades' 
  | 'Assault Tech' 
  | 'Aesthetic Schemes';


// Helper function to calculate scaled values based on level
function calculateScaledValue(
  level: ItemLevel, 
  baseValue: number, 
  maxValue: number, 
  minLevel: ItemLevel = 1, 
  maxLevel: ItemLevel = 8
): number {
  if (level < minLevel || level > maxLevel) {
    // console.error(`Level ${level} is out of range for scaling from ${minLevel} to ${maxLevel}.`);
    return Math.round(baseValue); 
  }
  if (minLevel === maxLevel) return Math.round(baseValue); 
  
  const increment = (maxValue - baseValue) / (maxLevel - minLevel);
  return Math.round(baseValue + (level - minLevel) * increment);
}

// Specific item types (extend GameItemBase)
export interface VaultHardwareItem extends GameItemBase {
  category: 'Vault Hardware';
  strength: { current: number, max: number };
  resistance: { current: number, max: number };
  minigameEffect?: string; 
}

export interface LockFortifierItem extends GameItemBase {
  category: 'Lock Fortifiers';
  strength: { current: number, max: number }; 
  resistance?: { current: number, max: number };
  type: 'One-Time Use' | 'Rechargeable';
  perUseCost?: number; 
  functionDescription: string;
  minigameInfluence?: string;
}

export interface EntryToolItem extends GameItemBase {
  category: 'Entry Tools';
  attackFactor: number;
  type?: 'Rechargeable' | 'Consumable' | 'Not Applicable';
  perUseCost?: number;
  minigameEffect: string;
  levelScalingNote: string;
  lockTypeEffectiveness: {
    idealCounterAgainst: string[];
    poorMatchPenaltyAgainst?: string[];
    idealMatchBonus?: string; 
  };
  strengthPerEntryClarification: string;
  lockFortifierEffectsDefinition: string;
  specialEffectsDefinition?: string; 
}

export interface NexusUpgradeItem extends GameItemBase {
  category: 'Nexus Upgrades';
  rechargeCost?: number;
  rechargeCapacity?: string; 
  destructionDescription?: string;
  cooldown?: string;
  triggering?: string;
  placement: string; 
  durability: string; 
  repurchaseCost?: number; 
  functionDescription: string;
  minigameInfluence: string;
}

export interface AssaultTechItem extends GameItemBase {
  category: 'Assault Tech';
  repurchaseCost?: number;
  placement: string; 
  durability: string; 
  functionDescription: string;
  minigameInfluence: string;
  idealMatch?: string; 
  poorMatch?: string; 
}

export interface AestheticSchemeItem extends GameItemBase {
  category: 'Aesthetic Schemes';
  themeKey: string; 
}

// --- Types for Shop Categories and Item Display ---

export interface ItemTile {
  id: string; // Unique ID for the tile, e.g., 'std_cypher_lock_tile' (base item, not specific level)
  name: string; // Base name of the item, e.g., 'Standard Cypher Lock'
  tileImageSrc?: string; // Image for the grid tile
  category: ItemCategory; 
  // A function to get the specific item data for a given level
  getItemLevelData: (level: ItemLevel) => GameItemBase | undefined;
}

export interface ItemSubCategory {
  name: string; 
  items: ItemTile[]; 
}

export interface ProductCategory {
  id: string; 
  name: string; 
  iconImageSrc: string; 
  itemSubCategories: ItemSubCategory[];
}

export type SpecificItemData = GameItemBase;


// --- Item Data ---
// Helper to generate all levels for a base item configuration
function generateItemLevels<T extends Omit<GameItemBase, 'level' | 'id' | 'cost' | 'title'>>(
  baseIdPrefix: string,
  baseName: string,
  baseConfig: T,
  levelConfigs: Array<Partial<Omit<T, 'name' | 'category' | 'scarcity' | 'colorVar' | 'tileImageSrc' | 'dataAiHint'>> & { cost: number, scarcity?: GameItemBase['scarcity'], titleSuffix?: string }>
): Array<T & GameItemBase> {
  return ITEM_LEVELS.map(level => {
    const levelIndex = level - 1;
    const configForLevel = levelConfigs[levelIndex] || levelConfigs[0]; // Fallback to L1 config if not all defined
    const itemTitle = `${baseName} ${configForLevel.titleSuffix || `L${level}`}`;
    
    let specificStrength, specificResistance, specificAttackFactor;
    if ('strength' in baseConfig && typeof baseConfig.strength === 'number') { // Assuming baseConfig might have flat numbers
      specificStrength = { current: calculateScaledValue(level, baseConfig.strength as number, (baseConfig.strength as number) * 2), max: calculateScaledValue(level, baseConfig.strength as number, (baseConfig.strength as number) * 2) };
    }
    if ('resistance' in baseConfig && typeof baseConfig.resistance === 'number') {
      specificResistance = { current: calculateScaledValue(level, baseConfig.resistance as number, (baseConfig.resistance as number) * 2), max: calculateScaledValue(level, baseConfig.resistance as number, (baseConfig.resistance as number) * 2) };
    }
     if ('attackFactor' in baseConfig && typeof baseConfig.attackFactor === 'number') {
      specificAttackFactor = calculateScaledValue(level, baseConfig.attackFactor, baseConfig.attackFactor * 8);
    }


    return {
      ...baseConfig,
      id: `${baseIdPrefix}_l${level}`,
      name: baseName, // Base name remains, level is separate
      title: itemTitle,
      level: level,
      cost: configForLevel.cost,
      scarcity: configForLevel.scarcity || baseConfig.scarcity,
      imageSrc: baseConfig.imageSrc || `https://placehold.co/100x100/1a202c/718096&text=${baseName.substring(0,3)}${level}`,
      tileImageSrc: baseConfig.tileImageSrc || baseConfig.imageSrc || `https://placehold.co/80x80/2d3748/e2e8f0&text=${baseName.substring(0,3)}${level}`,
      colorVar: level as keyof typeof ITEM_LEVEL_COLORS_CSS_VARS, // Link level to colorVar directly
      ...(specificStrength && { strength: specificStrength }),
      ...(specificResistance && { resistance: specificResistance }),
      ...(specificAttackFactor && { attackFactor: specificAttackFactor }),
      ...configForLevel, // Spread level-specific overrides
    } as T & GameItemBase;
  });
}


export const VAULT_HARDWARE_ITEMS: VaultHardwareItem[] = [
  ...generateItemLevels<'VaultHardware'>(
    'std_cypher_lock', 'Standard Cypher Lock',
    { category: 'Vault Hardware', description: 'Basic digital barrier.', resistance: { current: 10, max: 10 }, minigameEffect: "Requires X entries.", dataAiHint: "security lock", tileImageSrc: "/spyshop/tiles/StdCypherLock.png", imageSrc: "/spyshop/items/StdCypherLock_L1.png" },
    ITEM_LEVELS.map(l => ({ cost: calculateScaledValue(l, 100, 800), strength: {current: calculateScaledValue(l, 50, 400), max: calculateScaledValue(l, 50, 400)}, scarcity: l < 4 ? 'Common' : 'Uncommon' }))
  ),
  // ... Add other Vault Hardware items using generateItemLevels
  ...generateItemLevels<'VaultHardware'>(
    'reinforced_deadbolt', 'Reinforced Deadbolt',
    { category: 'Vault Hardware', description: 'Physical barrier with added resilience.', resistance: { current: 20, max: 20 }, minigameEffect: "Harder to drill.", dataAiHint: "strong lock", tileImageSrc: "/spyshop/tiles/ReinforcedDeadbolt.png", imageSrc: "/spyshop/items/ReinforcedDeadbolt_L1.png" },
    ITEM_LEVELS.map(l => ({ cost: calculateScaledValue(l, 150, 1200), strength: {current: calculateScaledValue(l, 75, 600), max: calculateScaledValue(l, 75, 600)}, scarcity: l < 3 ? 'Common' : l < 6 ? 'Uncommon' : 'Rare' }))
  ),
   ...generateItemLevels<'VaultHardware'>(
    'quantum_entanglement_lock', 'Quantum Entanglement Lock',
    { category: 'Vault Hardware', description: 'Non-physical tricky tech.', resistance: {current: 30, max:30}, minigameEffect: "Adds extra symbols.", dataAiHint: "quantum lock", tileImageSrc: "/spyshop/tiles/QuantumLock.png", imageSrc: "/spyshop/items/QuantumLock_L1.png"},
    ITEM_LEVELS.map(l => ({ cost: calculateScaledValue(l, 300, 2400), strength: {current: calculateScaledValue(l, 100, 800), max: calculateScaledValue(l, 100, 800)}, scarcity: l < 5 ? 'Uncommon' : 'Rare' }))
  ),
  // ... more vault hardware
];

export const LOCK_FORTIFIER_ITEMS: LockFortifierItem[] = [
  ...generateItemLevels<'LockFortifier'>(
    'dummy_node', 'Dummy Node',
    { category: 'Lock Fortifiers', description: 'Negates successful entries.', strength: {current: 1, max:1}, resistance: {current:0, max:0}, type: 'One-Time Use', functionDescription: 'Negates entries equal to its level.', dataAiHint: "circuit node", tileImageSrc: "/spyshop/tiles/DummyNode.png", imageSrc: "/spyshop/items/DummyNode_L1.png"},
    ITEM_LEVELS.map(l => ({ cost: calculateScaledValue(l, 200, 1600), scarcity: l < 6 ? 'Uncommon' : 'Rare' }))
  ),
  // ... Add other Lock Fortifier items
];

export const ENTRY_TOOL_ITEMS: EntryToolItem[] = [
  ...generateItemLevels<'EntryTool'>(
    'basic_pick', 'Basic Pick',
    { category: 'Entry Tools', description: 'Standard lock pick.', attackFactor: 10, type: 'Not Applicable', minigameEffect: "Reduces required entries.", levelScalingNote: "Efficiency up by Lvl*1", lockTypeEffectiveness: { idealCounterAgainst: ["Standard Cypher Lock"], poorMatchPenaltyAgainst: ["Reinforced Deadbolt"]}, strengthPerEntryClarification: "Base effectiveness", lockFortifierEffectsDefinition: "None", dataAiHint: "lock pick", tileImageSrc: "/spyshop/tiles/BasicPick.png", imageSrc: "/spyshop/items/BasicPick_L1.png"},
    ITEM_LEVELS.map(l => ({ cost: calculateScaledValue(l, 50, 400), attackFactor: calculateScaledValue(l, 10, 80), scarcity: l < 5 ? 'Common' : 'Uncommon' }))
  ),
  // ... Add other Entry Tool items
];

export const NEXUS_UPGRADE_ITEMS: NexusUpgradeItem[] = [
    ...generateItemLevels<'NexusUpgrade'>(
    'security_camera', 'Security Camera',
    { category: 'Nexus Upgrades', description: 'Alerts on infiltration attempts.', functionDescription: "Alerts on attack, provides intel.", placement: "Vault-Wide Upgrade slot", durability: "Rechargeable", cooldown: "5 mins", dataAiHint: "security camera", tileImageSrc: "/spyshop/tiles/SecurityCamera.png", imageSrc: "/spyshop/items/SecurityCamera_L1.png"},
    ITEM_LEVELS.map(l => ({ cost: calculateScaledValue(l, 250, 2000), rechargeCost: calculateScaledValue(l, 10, 80, 1, 8), rechargeCapacity: `${l} alerts`, scarcity: 'Uncommon' }))
  ),
  // ... Add other Nexus Upgrade items
];

export const ASSAULT_TECH_ITEMS: AssaultTechItem[] = [
  ...generateItemLevels<'AssaultTech'>(
    'system_hack', 'System Hack',
    { category: 'Assault Tech', description: 'Reduces lock difficulty.', functionDescription: "Reduces required entries for a lock.", placement: "Inventory (Consumable)", durability: "Single-use", dataAiHint: "system hack", tileImageSrc: "/spyshop/tiles/SystemHack.png", imageSrc: "/spyshop/items/SystemHack_L1.png"},
    ITEM_LEVELS.map(l => ({ cost: calculateScaledValue(l, 300, 2400), repurchaseCost: calculateScaledValue(l,200,1800), scarcity: 'Rare' }))
  ),
  // ... Add other Assault Tech items
];


export const AESTHETIC_SCHEME_ITEMS: AestheticSchemeItem[] = [
  { id: 'aesthetic_scheme_a', name: 'Team Blue', title: 'Team Blue', description: 'Default Cyphers operative theme.', level: 1, cost: 0, scarcity: 'Common', category: 'Aesthetic Schemes', themeKey: 'cyphers', colorVar: 5, imageSrc: '/spyshop/items/Theme_Cyphers.png', tileImageSrc: '/spyshop/tiles/Theme_Cyphers.png', dataAiHint: "blue abstract" },
  { id: 'aesthetic_scheme_b', name: 'Team Red', title: 'Team Red', description: 'Standard Shadows operative theme.', level: 1, cost: 0, scarcity: 'Common', category: 'Aesthetic Schemes', themeKey: 'shadows', colorVar: 1, imageSrc: '/spyshop/items/Theme_Shadows.png', tileImageSrc: '/spyshop/tiles/Theme_Shadows.png', dataAiHint: "red abstract" },
  { id: 'aesthetic_scheme_c', name: 'Terminal Green', title: 'Terminal Green', description: 'Classic green terminal theme.', level: 1, cost: 100, scarcity: 'Common', category: 'Aesthetic Schemes', themeKey: 'terminal-green', colorVar: 4, imageSrc: '/spyshop/items/Theme_TerminalGreen.png', tileImageSrc: '/spyshop/tiles/Theme_TerminalGreen.png', dataAiHint: "green abstract" },
];

// Helper function to create an ItemTile from a base item name and its category
function createItemTile(category: ItemCategory, baseItemName: string): ItemTile | null {
  // Find the L1 version of this item to get its tileImageSrc and other base details
  const l1Item = ALL_ITEMS_BY_CATEGORY[category]?.find(item => item.name === baseItemName && item.level === 1);
  if (!l1Item) {
    console.warn(`L1 item not found for ${baseItemName} in category ${category} for ItemTile creation.`);
    return null;
  }

  return {
    id: `${baseItemName.toLowerCase().replace(/\s+/g, '_').replace(/[()]/g, '')}_tile`, // Unique ID for the base item tile
    name: baseItemName,
    tileImageSrc: l1Item.tileImageSrc || l1Item.imageSrc, // Use specific tile image or fallback to main L1 image
    category: category,
    getItemLevelData: (level: ItemLevel) => {
      const itemsInThisCategory = ALL_ITEMS_BY_CATEGORY[category];
      return itemsInThisCategory.find(item => item.name === baseItemName && item.level === level);
    }
  };
}


// SHOP_CATEGORIES definition using createItemTile
export const SHOP_CATEGORIES: ProductCategory[] = [
  {
    id: 'vaultHardware',
    name: 'Vault Hardware',
    iconImageSrc: '/spyshop/icons/cat_vault_hardware.png',
    itemSubCategories: [
      {
        name: 'All Vault Hardware',
        items: [
          createItemTile('Vault Hardware', 'Standard Cypher Lock'),
          createItemTile('Vault Hardware', 'Reinforced Deadbolt'),
          createItemTile('Vault Hardware', 'Quantum Entanglement Lock'),
          // ... other vault hardware base names
        ].filter(Boolean) as ItemTile[] // Filter out nulls if L1 item not found
      }
    ]
  },
  {
    id: 'lockFortifiers',
    name: 'Lock Fortifiers',
    iconImageSrc: '/spyshop/icons/cat_lock_fortifiers.png',
    itemSubCategories: [
      {
        name: 'All Lock Fortifiers',
        items: [
          createItemTile('Lock Fortifiers', 'Dummy Node'),
          // ... other lock fortifier base names
        ].filter(Boolean) as ItemTile[]
      }
    ]
  },
  {
    id: 'entryTools',
    name: 'Entry Tools',
    iconImageSrc: '/spyshop/icons/cat_entry_tools.png',
    itemSubCategories: [
      {
        name: 'All Entry Tools',
        items: [
          createItemTile('Entry Tools', 'Basic Pick'),
          // ... other entry tool base names
        ].filter(Boolean) as ItemTile[]
      }
    ]
  },
    {
    id: 'nexusUpgrades',
    name: 'Nexus Upgrades',
    iconImageSrc: '/spyshop/icons/cat_nexus_upgrades.png',
    itemSubCategories: [
      {
        name: 'All Nexus Upgrades',
        items: [
          createItemTile('Nexus Upgrades', 'Security Camera'),
          createItemTile('Nexus Upgrades', 'Reinforced Foundation'),
          createItemTile('Nexus Upgrades', 'Emergency Repair System (ERS)'),
          createItemTile('Nexus Upgrades', 'Emergency Power Cell (EPC)'),
        ].filter(Boolean) as ItemTile[]
      }
    ]
  },
  {
    id: 'assaultTech',
    name: 'Assault Tech',
    iconImageSrc: '/spyshop/icons/cat_assault_tech.png',
    itemSubCategories: [
      {
        name: 'All Assault Tech',
        items: [
          createItemTile('Assault Tech', 'System Hack'),
          createItemTile('Assault Tech', 'Stealth Program'),
          createItemTile('Assault Tech', 'Code Scrambler'),
        ].filter(Boolean) as ItemTile[]
      }
    ]
  },
  {
    id: 'aestheticSchemes',
    name: 'Aesthetic Schemes',
    iconImageSrc: '/spyshop/icons/cat_aesthetic_schemes.png',
    itemSubCategories: [
      {
        name: 'All Aesthetic Schemes',
        items: AESTHETIC_SCHEME_ITEMS.map(item => ({
          id: `${item.id}_tile`,
          name: item.name,
          tileImageSrc: item.tileImageSrc || item.imageSrc,
          category: 'Aesthetic Schemes',
          getItemLevelData: (level: ItemLevel) => level === item.level ? item : undefined // Schemes are usually single-level
        }))
      }
    ]
  },
  // Infiltration Gear remains empty for now as per prompt
  {
    id: 'infiltrationGear',
    name: 'Infiltration Gear',
    iconImageSrc: '/spyshop/icons/cat_infiltration_gear.png',
    itemSubCategories: [{ name: 'All Infiltration Gear', items: [] }]
  },
];


export const ALL_ITEMS_BY_CATEGORY: Record<ItemCategory, GameItemBase[]> = {
  'Vault Hardware': VAULT_HARDWARE_ITEMS,
  'Lock Fortifiers': LOCK_FORTIFIER_ITEMS,
  'Entry Tools': ENTRY_TOOL_ITEMS,
  'Infiltration Gear': [], 
  'Nexus Upgrades': NEXUS_UPGRADE_ITEMS,
  'Assault Tech': ASSAULT_TECH_ITEMS,
  'Aesthetic Schemes': AESTHETIC_SCHEME_ITEMS,
};

// Function to get item by ID (example)
// This function needs to search across all item arrays for all levels.
export function getItemById(id: string): GameItemBase | undefined {
  for (const categoryKey in ALL_ITEMS_BY_CATEGORY) {
    const itemsInCategory = ALL_ITEMS_BY_CATEGORY[categoryKey as ItemCategory];
    const item = itemsInCategory.find(i => i.id === id);
    if (item) return item;
  }
  // console.warn(`[game-items] Item with id "${id}" not found.`);
  return undefined;
}


// Helper function to get the L1 version of an item by its base name and category
export function getL1ItemByBaseName(category: ItemCategory, baseName: string): GameItemBase | undefined {
  const itemsInCategory = ALL_ITEMS_BY_CATEGORY[category];
  if (!itemsInCategory) return undefined;
  return itemsInCategory.find(item => item.name === baseName && item.level === 1);
}
