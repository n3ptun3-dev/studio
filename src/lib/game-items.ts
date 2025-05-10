
import type { ITEM_LEVEL_COLORS_CSS_VARS } from './constants';

export type ItemLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface GameItemBase {
  id: string;
  name: string;
  description: string;
  level: ItemLevel;
  cost: number; // ELINT cost
  scarcity: 'Common' | 'Uncommon' | 'Rare' | 'Very Rare' | 'Super Rare';
  category: ItemCategory;
  imageSrc?: string; // URL for item image
  colorVar: keyof typeof ITEM_LEVEL_COLORS_CSS_VARS; // To link to CSS variable for color
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


// Example specific item types (extend GameItemBase)
export interface VaultHardwareItem extends GameItemBase {
  category: 'Vault Hardware';
  strength: number;
  resistance: number;
  minigameEffect?: string; // Description of its effect
}

export interface LockFortifierItem extends GameItemBase {
  category: 'Lock Fortifiers';
  strength: number; // Fixed or base strength of the fortifier itself
  resistance?: number;
  type: 'One-Time Use' | 'Rechargeable';
  perUseCost?: number; // ELINT for rechargeable
  functionDescription: string;
  minigameInfluence?: string;
}

export interface EntryToolItem extends GameItemBase {
  category: 'Entry Tools';
  attackFactor: number;
  type?: 'Rechargeable' | 'Consumable' | 'Not Applicable'; // L1 Pick is Not Applicable
  perUseCost?: number;
  minigameEffect: string;
  levelScalingNote: string;
  lockTypeEffectiveness: {
    idealCounterAgainst: string[];
    poorMatchPenaltyAgainst?: string[];
    idealMatchBonus?: string; // e.g. "Damage dealt to these targets is multiplied by 1.5."
  };
}

export interface AestheticSchemeItem extends GameItemBase {
  category: 'Aesthetic Schemes';
  themeKey: string; // e.g., 'deep-ocean-dive', maps to ThemeContext Theme type and CSS class
}

// Example Items (very simplified list for now)

export const VAULT_HARDWARE_ITEMS: VaultHardwareItem[] = [
  { 
    id: 'std_cypher_lock_l1', name: 'Standard Cypher Lock', description: 'Basic digital barrier.', level: 1, cost: 100, scarcity: 'Common', category: 'Vault Hardware',
    strength: 100, resistance: 10, colorVar: 1, imageSrc: 'https://picsum.photos/seed/lock1/100/100', dataAiHint: "security lock"
  },
  { 
    id: 'std_cypher_lock_l2', name: 'Standard Cypher Lock', description: 'Basic digital barrier.', level: 2, cost: 200, scarcity: 'Common', category: 'Vault Hardware',
    strength: 200, resistance: 10, colorVar: 2, imageSrc: 'https://picsum.photos/seed/lock2/100/100', dataAiHint: "security lock"
  },
  // ... Add more levels and types as per prompt
];

export const LOCK_FORTIFIER_ITEMS: LockFortifierItem[] = [
  {
    id: 'dummy_node_l1', name: 'Dummy Node', level: 1, cost: 400, scarcity: 'Scarce', category: 'Lock Fortifiers',
    strength: 100, type: 'One-Time Use', functionDescription: "Negates successful entries.", colorVar: 1,
    minigameInfluence: "Increases 'Correct Entries Required' by its level.", imageSrc: 'https://picsum.photos/seed/fortifier1/100/100', dataAiHint: "circuit node"
  },
  // ... More fortifiers
];

export const ENTRY_TOOL_ITEMS: EntryToolItem[] = [
  { 
    id: 'basic_pick_l1', name: 'Basic Pick', description: 'Standard tool.', level: 1, cost: 0, scarcity: 'Common', category: 'Entry Tools',
    attackFactor: 12.5, type: 'Not Applicable', colorVar: 1, imageSrc: 'https://picsum.photos/seed/pick1/100/100', dataAiHint: "lock pick",
    minigameEffect: "Reduces 'Correct Entries Required'.", levelScalingNote: "Reduces required entries by 1 per level.",
    lockTypeEffectiveness: { idealCounterAgainst: ["Standard Cypher Lock"] }
  },
  // ... More tools
];

export const AESTHETIC_SCHEME_ITEMS: AestheticSchemeItem[] = [
  { id: 'theme_cyphers', name: 'Team Blue', description: 'Default Cyphers operative theme.', level: 1, cost: 0, scarcity: 'Common', category: 'Aesthetic Schemes', themeKey: 'cyphers', colorVar: 5, imageSrc: 'https://picsum.photos/seed/themecyphers/100/100', dataAiHint: "blue abstract" },
  { id: 'theme_shadows', name: 'Team Red', description: 'Standard Shadows operative theme.', level: 1, cost: 0, scarcity: 'Common', category: 'Aesthetic Schemes', themeKey: 'shadows', colorVar: 1, imageSrc: 'https://picsum.photos/seed/themered/100/100', dataAiHint: "red abstract" },
  { id: 'theme_l2_green', name: 'Level 2 (Green)', description: 'A bright, energetic green theme.', level: 2, cost: 500, scarcity: 'Uncommon', category: 'Aesthetic Schemes', themeKey: 'level-2-green', colorVar: 4, imageSrc: 'https://picsum.photos/seed/themegreen/100/100', dataAiHint: "green abstract" },
  // ... Add all schemes from prompt
];


export const ALL_ITEMS_BY_CATEGORY: Record<ItemCategory, GameItemBase[]> = {
  'Vault Hardware': VAULT_HARDWARE_ITEMS,
  'Lock Fortifiers': LOCK_FORTIFIER_ITEMS,
  'Entry Tools': ENTRY_TOOL_ITEMS,
  'Infiltration Gear': [], // Populate these
  'Nexus Upgrades': [],
  'Assault Tech': [],
  'Aesthetic Schemes': AESTHETIC_SCHEME_ITEMS,
};

// Function to get item by ID (example)
export function getItemById(id: string): GameItemBase | undefined {
  for (const category in ALL_ITEMS_BY_CATEGORY) {
    const item = ALL_ITEMS_BY_CATEGORY[category as ItemCategory].find(i => i.id === id);
    if (item) return item;
  }
  return undefined;
}

// Note: Image URLs are placeholders. In a real app, these would point to actual assets.
// The dataAiHint attribute is added to images for AI to potentially replace placeholders.

    