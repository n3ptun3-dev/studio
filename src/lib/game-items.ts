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

export interface GameItemBase {
  id: string;
  name: string;
  description: string;
  level: ItemLevel;
  cost: number; // ELINT cost
  scarcity: 'Common' | 'Uncommon' | 'Rare' | 'Very Rare' | 'Super Rare' | 'Scarce';
  category: ItemCategory;
  imageSrc?: string; // URL for item image
  colorVar: keyof typeof ITEM_LEVEL_COLORS_CSS_VARS; // To link to CSS variable for color
  dataAiHint?: string; // Hint for AI to replace placeholder images
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
  minLevel: number = 1, 
  maxLevel: number = 8
): number {
  if (level < minLevel || level > maxLevel) {
    console.error(`Level ${level} is out of range for scaling from ${minLevel} to ${maxLevel}.`);
    return baseValue; // Return base value or handle error appropriately
  }
  if (minLevel === maxLevel) return baseValue; // Avoid division by zero if only one level
  
  const increment = (maxValue - baseValue) / (maxLevel - minLevel);
  return baseValue + (level - minLevel) * increment;
}

// Specific item types (extend GameItemBase)
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
  type?: 'Rechargeable' | 'Consumable' | 'Not Applicable';
  perUseCost?: number;
  minigameEffect: string;
  levelScalingNote: string;
  lockTypeEffectiveness: {
    idealCounterAgainst: string[];
    poorMatchPenaltyAgainst?: string[];
    idealMatchBonus?: string; // e.g. "Damage dealt to these targets is multiplied by 1.5."
  };
  strengthPerEntryClarification: string;
  lockFortifierEffectsDefinition: string;
  specialEffectsDefinition?: string; // For Temporal Dephaser, Quantum Dephaser
}

export interface NexusUpgradeItem extends GameItemBase {
  category: 'Nexus Upgrades';
  rechargeCost?: number;
  rechargeCapacity?: string; // e.g., "100 strength", "3 times its initial strength capacity"
  destructionDescription?: string;
  cooldown?: string;
  triggering?: string;
  placement: string; // e.g., 'Vault-Wide Upgrade slot'
  durability: string; // e.g., 'Permanent', 'Single-use', 'Consumed when strength reaches zero'
  repurchaseCost?: number; // For items that can be repurchased
  functionDescription: string;
  minigameInfluence: string;
}

export interface AssaultTechItem extends GameItemBase {
  category: 'Assault Tech';
  repurchaseCost?: number;
  placement: string; // e.g., 'Used from the player's Inventory'
  durability: string; // e.g., 'Single-use, consumable upon activation'
  functionDescription: string;
  minigameInfluence: string;
  idealMatch?: string; // For Stealth Program
  poorMatch?: string; // For Stealth Program
}

export interface AestheticSchemeItem extends GameItemBase {
  category: 'Aesthetic Schemes';
  themeKey: string; // e.g., 'deep-ocean-dive', maps to ThemeContext Theme type and CSS class
}

// --- Item Data ---

export const VAULT_HARDWARE_ITEMS: VaultHardwareItem[] = [];
for (let i = 1; i <= 8; i++) {
  const level = i as ItemLevel;
  VAULT_HARDWARE_ITEMS.push(
    { 
      id: `std_cypher_lock_l${level}`, 
      name: 'Standard Cypher Lock', 
      description: 'Your basic digital barrier.', 
      level: level, 
      cost: calculateScaledValue(level, 100, 800), 
      scarcity: 'Common', 
      category: 'Vault Hardware',
      strength: calculateScaledValue(level, 100, 800), 
      resistance: 10, 
      colorVar: 1, 
      imageSrc: `https://picsum.photos/seed/lock_cypher_${level}/100/100`, 
      dataAiHint: "security lock",
      minigameEffect: "Requires successful code entries equal to its remaining strength divided by the attacker's tool's strength per entry."
    },
    { 
      id: `reinforced_deadbolt_l${level}`, 
      name: 'Reinforced Deadbolt', 
      description: 'A physical barrier with added resilience.', 
      level: level, 
      cost: calculateScaledValue(level, 200, 1600), 
      scarcity: 'Common', 
      category: 'Vault Hardware',
      strength: calculateScaledValue(level, 100, 800), 
      resistance: 20, 
      colorVar: 2, 
      imageSrc: `https://picsum.photos/seed/lock_deadbolt_${level}/100/100`, 
      dataAiHint: "reinforced lock",
      minigameEffect: "Higher strength. Drills remove fewer strength points per use compared to picks of the same level. Picks remove 50% less strength per use against Reinforced Deadbolts. Drills remove 75% less strength points per use compared to picks of the same level. Drills and Picks have different Strength per entry values against this lock, affecting how much each correct entry reduces the lock's strength and progresses the attacker towards bypassing the lock."
    },
    { 
      id: `quantum_entanglement_lock_l${level}`, 
      name: 'Quantum Entanglement Lock', 
      description: 'Non-physical tricky tech that shrugs off some standard hits.', 
      level: level, 
      cost: calculateScaledValue(level, 300, 2400), 
      scarcity: level >= 6 ? 'Scarce' : 'Common', 
      category: 'Vault Hardware',
      strength: calculateScaledValue(level, 100, 800), 
      resistance: 30, 
      colorVar: 3, 
      imageSrc: `https://picsum.photos/seed/lock_quantum_${level}/100/100`, 
      dataAiHint: "quantum lock",
      minigameEffect: `Adds an extra symbol to the displayed sequence. An L8 lock injects this extra symbol every 3rd round, L7 every 4th round, L6 every 5th round, L5 every 6th round, L4 every 7th round, L3 every 8th round, L2 every 9th round, and L1 every 10th round. Code Injectors have reduced effectiveness. Sonic Pulsers have reduced effectiveness (Time Allowed Per Sequence increased by 25% less).`
    },
    { 
      id: `sonic_pulse_lock_l${level}`, 
      name: 'Sonic Pulse Lock', 
      description: 'Needs specific frequencies, standard hits less effective.', 
      level: level, 
      cost: calculateScaledValue(level, 400, 3200), 
      scarcity: 'Uncommon', 
      category: 'Vault Hardware',
      strength: calculateScaledValue(level, 100, 800), 
      resistance: 40, 
      colorVar: 4, 
      imageSrc: `https://picsum.photos/seed/lock_sonic_${level}/100/100`, 
      dataAiHint: "sonic lock",
      minigameEffect: `The time allowed for each entry is significantly reduced, scaling with the lock's level. The base time allowed per sequence is 20 seconds minus the lock level. For example, L1 equals 19 seconds, L8 equals 12 seconds.`
    },
    { 
      id: `plasma_conduit_lock_l${level}`, 
      name: 'Plasma Conduit Lock', 
      description: 'Energy flow defense, cuts standard damage in half.', 
      level: level, 
      cost: calculateScaledValue(level, 500, 4000), 
      scarcity: 'Uncommon', 
      category: 'Vault Hardware',
      strength: calculateScaledValue(level, 100, 800), 
      resistance: 50, 
      colorVar: 5, 
      imageSrc: `https://picsum.photos/seed/lock_plasma_${level}/100/100`, 
      dataAiHint: "plasma lock",
      minigameEffect: `Successful entries slightly decrease the time allowed for subsequent entries. The time reduction for subsequent entries is equal to the lock's level in seconds (L1: 1s, L2: 2s, ..., L8: 8s). Code Injectors have reduced effectiveness against this lock (see Code Injector description for details), and the tool's Strength per entry is halved.`
    },
    { 
      id: `biometric_seal_l${level}`, 
      name: 'Biometric Seal', 
      description: 'Biological key required, very resistant to non-specific attacks.', 
      level: level, 
      cost: calculateScaledValue(level, 600, 4800), 
      scarcity: 'Rare', 
      category: 'Vault Hardware',
      strength: calculateScaledValue(level, 100, 800), 
      resistance: 60, 
      colorVar: 6, 
      imageSrc: `https://picsum.photos/seed/lock_biometric_${level}/100/100`, 
      dataAiHint: "biometric lock",
      minigameEffect: `Very high strength. Introduces occasional micro-stutters or pauses in the symbol display. The symbols flash and hide while being displayed. The frequency at which the symbols disappear increases with the lock's level: L1 and L2 disappear every 4 seconds, L3 and L4 every 3 seconds, L5 and L6 every 2 seconds, and L7 and L8 every 1 second. The duration for which the symbols disappear also increases with the lock's level: L1 disappears for 0.1 seconds, L2 for 0.2 seconds, and so on, up to L8, which disappears for 0.8 seconds. Picks are less effective; they remove half the normal strength per use (rounded down). Code Injectors have reduced effectiveness (50% less reduction of 'Symbols Displayed').`
    },
    { 
      id: `neural_network_lock_l${level}`, 
      name: 'Neural Network Lock', 
      description: 'Non-physical lock that adapts and evolves, learning to resist intrusions.', 
      level: level, 
      cost: calculateScaledValue(level, 700, 5600), 
      scarcity: 'Rare', 
      category: 'Vault Hardware',
      strength: calculateScaledValue(level, 100, 800), 
      resistance: 70, 
      colorVar: 7, 
      imageSrc: `https://picsum.photos/seed/lock_neural_${level}/100/100`, 
      dataAiHint: "neural lock",
      minigameEffect: `Very high strength. The number of symbols displayed in each sequence gradually increases. The base number of symbols increases with the lock's level (L1 starts with 6, L2 with 7, up to L8 starting with 13). For every two successful entries, the number of displayed symbols increases by one. Drills are ineffective; they do not reduce the lock's strength.`
    },
    { 
      id: `temporal_flux_lock_l${level}`, 
      name: 'Temporal Flux Lock', 
      description: 'Non-physical lock that warps time around the secured data.', 
      level: level, 
      cost: calculateScaledValue(level, 800, 6400), 
      scarcity: 'Very Rare', 
      category: 'Vault Hardware',
      strength: calculateScaledValue(level, 100, 800), 
      resistance: 80, 
      colorVar: 8, 
      imageSrc: `https://picsum.photos/seed/lock_temporal_${level}/100/100`, 
      dataAiHint: "temporal lock",
      minigameEffect: `Its strength, and therefore the number of 'Required Successful Entries', increases over time, scaling with its level (e.g., L1 increases by 5 strength per second, up to L8 increasing by 40 strength per second). This increasing strength directly raises the number of Required Successful Entries needed to bypass the lock as the minigame progresses. Code Injectors are ineffective against this lock; they do not reduce the number of 'Symbols Displayed'." Sonic Pulsers have reduced effectiveness (Time Allowed Per Sequence increased by 25% less).`
    }
  );
}

export const LOCK_FORTIFIER_ITEMS: LockFortifierItem[] = [];
for (let i = 1; i <= 8; i++) {
  const level = i as ItemLevel;
  LOCK_FORTIFIER_ITEMS.push(
    {
      id: `dummy_node_l${level}`, 
      name: 'Dummy Node', 
      level: level, 
      cost: calculateScaledValue(level, 400, 1100), 
      scarcity: 'Scarce', 
      category: 'Lock Fortifiers',
      strength: 100, 
      resistance: 10,
      type: 'One-Time Use', 
      functionDescription: `Negates a number of successful entries equal to its level.`, 
      colorVar: 1,
      minigameInfluence: `Increases the number of 'Correct Entries Required' by an amount equal to the Dummy Node's level. This is an additive increase, separate from the lock's strength. For example, an L3 Dummy Node increases the required entries by 3.`, 
      imageSrc: `https://picsum.photos/seed/fortifier_dummy_${level}/100/100`, 
      dataAiHint: "circuit node"
    },
    {
      id: `adaptive_shield_l${level}`, 
      name: 'Adaptive Shield', 
      level: level, 
      cost: calculateScaledValue(level, 400, 1100), 
      scarcity: 'Scarce', 
      category: 'Lock Fortifiers',
      strength: 100, 
      resistance: 50,
      type: 'Rechargeable', 
      perUseCost: 20 + (level - 1) * 10,
      functionDescription: `Increases the lock's resistance by an amount equal to its level times 10.`, 
      colorVar: 2,
      minigameInfluence: `Increases the lock's resistance by an amount equal to its level times 10. This increased resistance raises the number of 'Correct Entries Required' to bypass the lock, as more entries are needed to reduce the lock's strength. The formula is: Required Entries = Lock Strength / (Attacker's Tool Strength / (1 + (Lock Resistance / 100))`, 
      imageSrc: `https://picsum.photos/seed/fortifier_adaptive_${level}/100/100`, 
      dataAiHint: "adaptive shield"
    },
    {
      id: `feedback_loop_l${level}`, 
      name: 'Feedback Loop', 
      level: level, 
      cost: calculateScaledValue(level, 400, 1100), 
      scarcity: 'Scarce', 
      category: 'Lock Fortifiers',
      strength: 100, 
      resistance: 30,
      type: 'Rechargeable', 
      perUseCost: 30 + (level - 1) * 15,
      functionDescription: `Damages the attacker's tool upon a failed entry. The damage dealt is equal to the level of the Feedback Loop.`, 
      colorVar: 3,
      minigameInfluence: `Does not directly affect the minigame, but penalizes the player for incorrect entries. Code Injectors have reduced effectiveness (50% less reduction of 'Symbols Displayed').`, 
      imageSrc: `https://picsum.photos/seed/fortifier_feedback_${level}/100/100`, 
      dataAiHint: "feedback loop"
    },
    {
      id: `sonic_dampener_l${level}`, 
      name: 'Sonic Dampener', 
      level: level, 
      cost: calculateScaledValue(level, 400, 1100), 
      scarcity: 'Scarce', 
      category: 'Lock Fortifiers',
      strength: 100, 
      resistance: 40,
      type: 'Rechargeable', 
      perUseCost: 30 + (level - 1) * 15,
      functionDescription: `Makes Drills completely ineffective.`, 
      colorVar: 4,
      minigameInfluence: `Prevents the use of Hydraulic Drills (they do 0 damage). Sonic Pulser's time bonus is halved.`, 
      imageSrc: `https://picsum.photos/seed/fortifier_sonic_${level}/100/100`, 
      dataAiHint: "sonic dampener"
    },
    {
      id: `temporal_anchor_l${level}`, 
      name: 'Temporal Anchor', 
      level: level, 
      cost: calculateScaledValue(level, 600, 1300), 
      scarcity: 'Rare', 
      category: 'Lock Fortifiers',
      strength: 100, 
      resistance: 60,
      type: 'Rechargeable', 
      perUseCost: 50 + (level - 1) * 20,
      functionDescription: `Periodically reverses a portion of the correctly entered sequence. An L8 lock reverses the sequence every 3rd round, L7 every 4th round, L6 every 5th round, L5 every 6th round, L4 every 7th round, L3 every 8th round, L2 every 9th round, and L1 every 10th round. The Key Cracker display should indicate that the code should be entered in reverse order.`, 
      colorVar: 5,
      minigameInfluence: `Periodically reverses a portion of the currently displayed input sequence. The frequency of this reversal scales with the Temporal Anchor's level (e.g., L1 reverses every 5 seconds, up to L8 reversing every 1 second). This means that only the symbols the player is currently entering will be reversed, not the entire sequence required to unlock the lock.`, 
      imageSrc: `https://picsum.photos/seed/fortifier_temporal_${level}/100/100`, 
      dataAiHint: "temporal anchor"
    },
    {
      id: `reactive_armor_l${level}`, 
      name: 'Reactive Armor', 
      level: level, 
      cost: calculateScaledValue(level, 600, 1300), 
      scarcity: 'Rare', 
      category: 'Lock Fortifiers',
      strength: 100, 
      resistance: 80,
      type: 'One-Time Use', 
      functionDescription: `Explodes outwards when its strength reaches zero, potentially damaging nearby attacking gadgets.`, 
      colorVar: 6,
      minigameInfluence: `Does not directly affect the minigame. Code Injectors have reduced effectiveness (50% less reduction of 'Symbols Displayed').`, 
      imageSrc: `https://picsum.photos/seed/fortifier_reactive_${level}/100/100`, 
      dataAiHint: "reactive armor"
    },
    {
      id: `neural_feedback_spore_l${level}`, 
      name: 'Neural Feedback Spore', 
      level: level, 
      cost: calculateScaledValue(level, 800, 1500), 
      scarcity: 'Super Rare', 
      category: 'Lock Fortifiers',
      strength: 100, 
      resistance: 20,
      type: 'Rechargeable', 
      perUseCost: 80 + (level - 1) * 25,
      functionDescription: `Randomizes the symbol keypad. An L8 lock randomizes the keypad every 3rd round, L7 every 4th round, L6 every 5th round, L5 every 6th round, L4 every 7th round, L3 every 8th round, L2 every 9th round, and L1 every 10th round.`, 
      colorVar: 7,
      minigameInfluence: `Randomizes the order of the symbols the player has to select. The randomization follows a circular shift pattern, where each symbol shifts a fixed number of positions. The shift amount changes with each randomization to create a new, unpredictable layout.`, 
      imageSrc: `https://picsum.photos/seed/fortifier_neural_${level}/100/100`, 
      dataAiHint: "neural spore"
    },
    {
      id: `entanglement_field_inhibitor_l${level}`, 
      name: 'Entanglement Field Inhibitor', 
      level: level, 
      cost: calculateScaledValue(level, 800, 1500), 
      scarcity: 'Super Rare', 
      category: 'Lock Fortifiers',
      strength: 100, 
      resistance: 70,
      type: 'Rechargeable', 
      perUseCost: 80 + (level - 1) * 25,
      functionDescription: `Inserts random emojis into the displayed code, with the amount equal to the inhibitor's level (L1 adds 1 emoji, L2 adds 2, etc.). Additionally, when an incorrect sequence is entered, the lock failure resets the game. The reset amount is equal to the level number (L1 resets once, L2 resets twice, etc.).`, 
      colorVar: 8,
      minigameInfluence: `Adds visual clutter and increases the penalty for failure. When an incorrect sequence is entered, the lock failure resets the current lock attempt. The number of retries is reduced by an amount equal to the inhibitor's level (L1 reduces by 1, L2 reduces by 2, etc.).`, 
      imageSrc: `https://picsum.photos/seed/fortifier_entanglement_${level}/100/100`, 
      dataAiHint: "entanglement inhibitor"
    }
  );
}

export const ENTRY_TOOL_ITEMS: EntryToolItem[] = [];
for (let i = 1; i <= 8; i++) {
  const level = i as ItemLevel;
  ENTRY_TOOL_ITEMS.push(
    { 
      id: `basic_pick_l${level}`, 
      name: 'Basic Pick', 
      description: 'Your standard tool. Effective against basic locks, struggles against advanced defenses.', 
      level: level, 
      cost: level === 1 ? 0 : calculateScaledValue(level, 200, 800, 2), // L1 is free
      scarcity: 'Common', 
      category: 'Entry Tools',
      attackFactor: calculateScaledValue(level, 12.5, 100), 
      type: 'Not Applicable', 
      colorVar: 1, 
      imageSrc: `https://picsum.photos/seed/pick_basic_${level}/100/100`, 
      dataAiHint: "lock pick",
      minigameEffect: "Reduces the 'Correct Entries Required'.", 
      levelScalingNote: "Reduces the number of 'Correct Entries Required' by 1 per level.",
      lockTypeEffectiveness: { 
        idealCounterAgainst: ["Standard Cypher Lock"],
        idealMatchBonus: "The tool's Attack Factor is used as its 'strength per entry' when reducing the lock's strength.",
        poorMatchPenaltyAgainst: ["Reinforced Deadbolt"]
      },
      strengthPerEntryClarification: "The Basic Pick's Attack Factor functions as its 'strength per entry.' Each level of the pick has a corresponding Attack Factor, scaling from 12.5 at Level 1 to 100 at Level 8 (scales linearly with Level). This Attack Factor is used in the formula to determine how much the lock's strength is reduced per successful entry.",
      lockFortifierEffectsDefinition: "Not applicable to this tool."
    },
    { 
      id: `hydraulic_drill_l${level}`, 
      name: 'Hydraulic Drill', 
      description: 'A heavy-duty tool. Slow but effective against resilient barriers.', 
      level: level, 
      cost: calculateScaledValue(level, 200, 900), 
      scarcity: 'Common', 
      category: 'Entry Tools',
      attackFactor: calculateScaledValue(level, 12.5, 100), 
      type: 'Rechargeable', 
      perUseCost: 15 + (level - 1) * 10,
      colorVar: 2, 
      imageSrc: `https://picsum.photos/seed/drill_hydraulic_${level}/100/100`, 
      dataAiHint: "hydraulic drill",
      minigameEffect: "Slightly increases the 'Time Allowed Per Sequence'.", 
      levelScalingNote: "Increases the 'Time Allowed Per Sequence' by 1 second per level of the drill.",
      lockTypeEffectiveness: { 
        idealCounterAgainst: ["Reinforced Deadbolt"],
        poorMatchPenaltyAgainst: ["Quantum Entanglement Lock", "Neural Network Lock", "Temporal Flux Lock"]
      },
      strengthPerEntryClarification: "The Hydraulic Drill's Attack Factor functions as its 'strength per entry.' However, drills remove fewer strength points per use compared to picks of the same level.",
      lockFortifierEffectsDefinition: "Not applicable to this tool."
    },
    { 
      id: `code_injector_l${level}`, 
      name: 'Code Injector', 
      description: 'A precision tool. Best against logic-based defenses, weak against others. Injects code to reduce symbols.', 
      level: level, 
      cost: calculateScaledValue(level, 400, 1100), 
      scarcity: 'Scarce', 
      category: 'Entry Tools',
      attackFactor: calculateScaledValue(level, 12.5, 100), 
      type: 'Rechargeable', 
      perUseCost: 20 + (level - 1) * 10,
      colorVar: 3, 
      imageSrc: `https://picsum.photos/seed/injector_code_${level}/100/100`, 
      dataAiHint: "code injector",
      minigameEffect: "Reduces the number of 'Symbols Displayed' by 1 per level of the injector. This reduction is halved (rounded down) when used against Quantum Entanglement Locks and Plasma Conduit Locks. The tool's Strength per entry is halved against Plasma Conduit Locks.", 
      levelScalingNote: "Reduces the number of 'Symbols Displayed' by 1 per level of the injector (halved against Quantum Entanglement Locks).",
      lockTypeEffectiveness: { 
        idealCounterAgainst: ["Standard Cypher Lock", "Neural Network Lock"],
        idealMatchBonus: "Damage dealt to these targets is multiplied by 1.5.",
        poorMatchPenaltyAgainst: ["Biometric Seal", "Reactive Armor", "Feedback Loop"]
      },
      strengthPerEntryClarification: "The Code Injector's Attack Factor functions as its 'strength per entry.'",
      lockFortifierEffectsDefinition: "Not applicable to this tool."
    },
    { 
      id: `sonic_pulser_l${level}`, 
      name: 'Sonic Pulser', 
      description: 'A frequency-based tool. Effective against sound-based defenses.', 
      level: level, 
      cost: calculateScaledValue(level, 400, 1100), 
      scarcity: 'Scarce', 
      category: 'Entry Tools',
      attackFactor: calculateScaledValue(level, 12.5, 100), 
      type: 'Rechargeable', 
      perUseCost: 20 + (level - 1) * 10,
      colorVar: 4, 
      imageSrc: `https://picsum.photos/seed/pulser_sonic_${level}/100/100`, 
      dataAiHint: "sonic pulser",
      minigameEffect: "Slightly increases the 'Time Allowed Per Sequence'.", 
      levelScalingNote: "Increases the 'Time Allowed Per Sequence' by 0.5 seconds per level of the pulser.",
      lockTypeEffectiveness: { 
        idealCounterAgainst: ["Sonic Pulse Lock"],
        poorMatchPenaltyAgainst: ["Temporal Flux Lock", "Quantum Entanglement Lock"]
      },
      strengthPerEntryClarification: "The Sonic Pulser's Attack Factor functions as its 'strength per entry.'",
      lockFortifierEffectsDefinition: "Not applicable to this tool."
    },
    { 
      id: `bio_scanner_override_l${level}`, 
      name: 'Bio-Scanner Override', 
      description: 'Bypasses biological security measures.', 
      level: level, 
      cost: calculateScaledValue(level, 600, 1300), 
      scarcity: 'Rare', 
      category: 'Entry Tools',
      attackFactor: calculateScaledValue(level, 12.5, 100), 
      type: 'Consumable', 
      colorVar: 5, 
      imageSrc: `https://picsum.photos/seed/scanner_bio_${level}/100/100`, 
      dataAiHint: "bio scanner",
      minigameEffect: "Reduces the number of 'Correct Entries Required' against Biometric Seals.", 
      levelScalingNote: "Reduces the 'Correct Entries Required' by 2 per level of the override.",
      lockTypeEffectiveness: { 
        idealCounterAgainst: ["Biometric Seal"],
        poorMatchPenaltyAgainst: ["Other lock types"]
      },
      strengthPerEntryClarification: "The Bio-Scanner Override's Attack Factor functions as its 'strength per entry.'",
      lockFortifierEffectsDefinition: "Not applicable to this tool."
    },
    { 
      id: `temporal_dephaser_l${level}`, 
      name: 'Temporal Dephaser', 
      description: 'Manipulates time flow. Effective against time-based defenses.', 
      level: level, 
      cost: calculateScaledValue(level, 800, 1500), 
      scarcity: 'Super Rare', 
      category: 'Entry Tools',
      attackFactor: calculateScaledValue(level, 12.5, 100), 
      type: 'Rechargeable', 
      perUseCost: 40 + (level - 1) * 20,
      colorVar: 6, 
      imageSrc: `https://picsum.photos/seed/dephaser_temporal_${level}/100/100`, 
      dataAiHint: "temporal dephaser",
      minigameEffect: "Increases the 'Time Allowed Per Sequence' and may reverse the sequence.", 
      levelScalingNote: `Increases the 'Time Allowed Per Sequence' by 0.75 seconds per level. The probability of reversing the sequence increases by 10% per level.`,
      lockTypeEffectiveness: { 
        idealCounterAgainst: ["Temporal Flux Lock", "Temporal Anchor"],
        poorMatchPenaltyAgainst: ["Other lock types"]
      },
      strengthPerEntryClarification: "The Temporal Dephaser's Attack Factor functions as its 'strength per entry.'",
      specialEffectsDefinition: "The 'reverse the sequence' effect is a special effect that Temporal Locks have. The Temporal Dephaser is effective against this.",
      lockFortifierEffectsDefinition: "Not applicable to this tool."
    },
    { 
      id: `quantum_dephaser_l${level}`, 
      name: 'Quantum Dephaser', 
      description: 'Disrupts quantum fields. Best against quantum-based defenses.', 
      level: level, 
      cost: calculateScaledValue(level, 800, 1500), 
      scarcity: 'Super Rare', 
      category: 'Entry Tools',
      attackFactor: calculateScaledValue(level, 12.5, 100), 
      type: 'Rechargeable', 
      perUseCost: 40 + (level - 1) * 20,
      colorVar: 7, 
      imageSrc: `https://picsum.photos/seed/dephaser_quantum_${level}/100/100`, 
      dataAiHint: "quantum dephaser",
      minigameEffect: "Reduces the 'Symbols Displayed' and may disable special effects.", 
      levelScalingNote: `Reduces the 'Symbols Displayed' by 0.5 per level (round down). The probability of disabling special effects increases by 12.5% per level.`,
      lockTypeEffectiveness: { 
        idealCounterAgainst: ["Quantum Entanglement Lock", "Entanglement Field Inhibitor"],
        idealMatchBonus: "Damage dealt to these targets is multiplied by 1.5 OR may temporarily disable their special effects.",
        poorMatchPenaltyAgainst: ["Physical locks", "Electronic locks (non-quantum)", "Reactive Armor"]
      },
      strengthPerEntryClarification: "The Quantum Dephaser's Attack Factor functions as its 'strength per entry.'",
      specialEffectsDefinition: "Special effects include the extra symbol added by the Quantum Entanglement Lock and the random emojis added by the Entanglement Field Inhibitor.",
      lockFortifierEffectsDefinition: "Not applicable to this tool."
    },
    { 
      id: `universal_key_l${level}`, 
      name: 'Universal Key', 
      description: 'The master bypass tool. Ignores defensive gadgets.', 
      level: level, 
      cost: calculateScaledValue(level, 800, 1500), 
      scarcity: 'Super Rare', 
      category: 'Entry Tools',
      attackFactor: calculateScaledValue(level, 12.5, 100), 
      type: 'Rechargeable', 
      perUseCost: 50 + (level - 1) * 25,
      colorVar: 8, 
      imageSrc: `https://picsum.photos/seed/key_universal_${level}/100/100`, 
      dataAiHint: "universal key",
      minigameEffect: "Disables fortifier effects on the target lock if the Universal Key's level is equal to or greater than the fortifier's level. If disabled, the fortifier's bonuses to the lock are ignored for the duration of the infiltration attempt.", 
      levelScalingNote: "The level of the Universal Key determines the level of fortifier effects it can disable. A level X Universal Key can disable fortifier effects up to level X.",
      lockTypeEffectiveness: { 
        idealCounterAgainst: ["Any lock with Lock Fortifiers"],
        poorMatchPenaltyAgainst: ["Locks without Lock Fortifiers"]
      },
      strengthPerEntryClarification: "The Universal Key's Attack Factor functions as its 'strength per entry.'",
      lockFortifierEffectsDefinition: "Lock Fortifier effects are the special defensive gadgets that can be attached to locks, such as Dummy Node, Adaptive Shield, Feedback Loop, Sonic Dampener, Temporal Anchor, Reactive Armor, Neural Feedback Spore, and Entanglement Field Inhibitor. Mechanically, the 'Required Successful Entries' and other minigame parameters should not be affected by the disabled fortifier."
    }
  );
}

export const NEXUS_UPGRADE_ITEMS: NexusUpgradeItem[] = [];
for (let i = 1; i <= 8; i++) {
  const level = i as ItemLevel;
  NEXUS_UPGRADE_ITEMS.push(
    {
      id: `security_camera_l${level}`,
      name: 'Security Camera',
      description: 'The Security Camera is a defensive gadget that Alerts you when any of your locks are under attack, allowing you to defend it by recharging your lock’s strength.',
      level: level,
      cost: calculateScaledValue(level, 800, 6400),
      scarcity: 'Scarce',
      category: 'Nexus Upgrades',
      colorVar: 1,
      imageSrc: `https://picsum.photos/seed/nexus_camera_${level}/100/100`,
      dataAiHint: "security camera",
      rechargeCost: 50, // Fixed per alert
      functionDescription: `Automatically detects an infiltration attempt on the Vault. Upon detection, it alerts with an audible sound, a notification and a Comms message, and provides you with an overview of the attacker: Agent Name, Level, and gadget used. The level of the Security Camera determines the amount of attacks that will create an alert before needing to be recharged. Example: A level 3 camera will alert you three separate infiltrations before it needs recharging.`,
      placement: 'Occupies a Vault-Wide Upgrade slot.',
      triggering: 'Triggers automatically when someone tries to infiltrate your vault',
      cooldown: 'After successfully triggering and providing intel, the Security Camera will enter a cooldown period of five minutes before it can provide intel again for a subsequent infiltration attempt. This prevents spamming intel on repeated quick attempts.',
      destructionDescription: `The Security Camera can be recharged for an amount equals to the Camera level times 10. A Level 1 Camera can be recharged 10 times, a Level 2 camera 20 times, and so on. When the recharge ability has been depleted, the camera will be destroyed when it creates its last alert. Upon reaching the end of its total recharge capacity (initial + 10 recharges) and that capacity being fully depleted, the Security Camera gadget is destroyed and automatically removed from the Vault slot it occupied. Players will receive an in-game notification when a Security Camera is destroyed this way.`,
      durability: 'Consumed when its recharge capacity is depleted.',
      minigameInfluence: 'No direct minigame influence, but provides crucial intel to the defender.'
    },
    {
      id: `reinforced_foundation_l${level}`,
      name: 'Reinforced Foundation',
      description: 'The Reinforced Foundation is a permanent Vault upgrade that increases the inherent structural integrity and difficulty of infiltrating the Vault it is installed on. It makes the entire Vault harder to crack.',
      level: level,
      cost: calculateScaledValue(level, 600, 4800),
      scarcity: 'Common',
      category: 'Nexus Upgrades',
      colorVar: 2,
      imageSrc: `https://picsum.photos/seed/nexus_foundation_${level}/100/100`,
      dataAiHint: "reinforced foundation",
      functionDescription: `Provides a passive, permanent increase to the base difficulty of infiltrating this Vault. This effect applies to all Locks installed on the Vault while the Reinforced Foundation is in place. The magnitude of the difficulty scales with the Foundation's level.`,
      placement: 'Occupies a Vault-Wide Upgrade slot.',
      durability: 'Permanent once installed. It does not lose strength, have a recharge limit, or get destroyed by infiltration attempts.',
      minigameInfluence: `Key Cracker: While the Reinforced Foundation is installed, it adds a permanent penalty to the required number of successful code entries needed to bypass any Lock on this Vault. This penalty contributes to the "Vault Gadget Penalty" in the calculation for required successful attempts. The amount added scales with the Reinforced Foundation's level.`
    },
    {
      id: `emergency_repair_system_l${level}`,
      name: 'Emergency Repair System (ERS)',
      description: 'The Emergency Repair System (ERS) is a crucial defensive gadget that enhances the durability of your Vault\'s Locks during an infiltration attempt. It acts as a reserve pool of strength that your Locks can draw upon before their own structural integrity is compromised.',
      level: level,
      cost: calculateScaledValue(level, 1000, 8000),
      scarcity: 'Rare',
      category: 'Nexus Upgrades',
      colorVar: 3,
      imageSrc: `https://picsum.photos/seed/nexus_ers_${level}/100/100`,
      dataAiHint: "emergency repair system",
      rechargeCost: 0.75, // ELINT per strength point
      rechargeCapacity: 'An ERS gadget can be recharged a maximum of 3 times its initial strength capacity throughout its lifespan.',
      functionDescription: `Provides a reserve of strength exclusively for Locks installed on the Vault. This reserve is depleted before the Lock's own strength is affected when taking damage. It takes effect automatically and immediately upon a Lock receiving damage. The ERS does not affect Lock Fortifiers or other items. ERS gadgets range from Level 1 (100 strength) through to Level 8 (800 strength). Effect on Locks: When an ERS is active, its effective strength is made available to the Locks on the vault. For instance, a single L1 Lock protected by an L8 ERS effectively has the strength of a L8 Lock plus its own L1 base strength, as the ERS reserve is used first.`,
      placement: 'Occupies a Vault-Wide Upgrade slot.',
      durability: 'Consumed when its total recharge capacity (initial + 3 recharges) has been depleted.',
      destructionDescription: 'Upon reaching the end of its total recharge capacity (initial + 3 recharges) and that capacity being fully depleted, the ERS gadget is destroyed and automatically removed from its Vault slot it occupied. Players will receive an in-game notification when an ERS is destroyed this way.',
      minigameInfluence: `Reduces the target's Lock Strength by an amount equal to its level. This reduction in Lock Strength then decreases the number of 'Required Successful Entries' needed to bypass the target.`
    },
    {
      id: `emergency_power_cell_l${level}`,
      name: 'Emergency Power Cell (EPC)',
      description: 'The Emergency Power Cell is a single-use defensive gadget designed to provide an immediate boost to your Vault\'s defenses when under infiltration. It\'s a quick shot of energy to help weather an unexpected assault.',
      level: level,
      cost: calculateScaledValue(level, 1200, 9600),
      scarcity: 'Super Rare',
      category: 'Nexus Upgrades',
      colorVar: 4,
      imageSrc: `https://picsum.photos/seed/nexus_epc_${level}/100/100`,
      dataAiHint: "emergency power cell",
      functionDescription: `The Emergency Power Cell provides a defensive effect when an attacker is engaged in an infiltration. It increases the difficulty of the lock’s minigame. The Power Cell has a 'strength' equal to its level (an L1 EPC has 1 strength, an L8 EPC has 8 strength).`,
      placement: 'Occupies a Vault-Wide Upgrade slot.',
      durability: 'Consumed when its strength reaches zero.',
      destructionDescription: 'Once the EPC\'s strength is depleted to 0, the Emergency Power Cell is destroyed and automatically removed from its Vault slot. Players will receive an in-game notification when an EPC is destroyed this way.',
      minigameInfluence: `Key Cracker: When the EPC is active, it increases the difficulty of the Key Cracker minigame by adding 3 extra digits to the code sequence the attacker must remember. Each time the attacker successfully enters a code sequence while the EPC is active, the EPC's strength is reduced by 1.`
    }
  );
}

export const ASSAULT_TECH_ITEMS: AssaultTechItem[] = [];
for (let i = 1; i <= 8; i++) {
  const level = i as ItemLevel;
  ASSAULT_TECH_ITEMS.push(
    {
      id: `system_hack_l${level}`,
      name: 'System Hack',
      description: 'The System Hack is a single-use offensive program designed to reduce the difficulty of bypassing a target Vault\'s Locks during an infiltration attempt.',
      level: level,
      cost: calculateScaledValue(level, 800, 6400),
      repurchaseCost: calculateScaledValue(level, 640, 5120),
      scarcity: 'Scarce',
      category: 'Assault Tech',
      colorVar: 1,
      imageSrc: `https://picsum.photos/seed/assault_hack_${level}/100/100`,
      dataAiHint: "system hack",
      functionDescription: `When used against a target Lock during an infiltration, the System Hack reduces the difficulty of bypassing that specific Lock. The magnitude of the difficulty reduction scales with the System Hack's level.`,
      placement: 'Used from the player\'s Inventory against a selected Lock during an active infiltration attempt. It does not occupy a Vault slot.',
      durability: 'Single-use, consumable upon activation against a Lock.',
      minigameInfluence: `Key Cracker: When the System Hack is used on a target Lock, it reduces the required number of successful code entries needed to bypass that Lock. This reduction contributes to the "Attacking Gadget Multiplier" effect in the calculation for required successful attempts, effectively making the Lock easier to crack. The amount of reduction scales with the System Hack's level.`
    },
    {
      id: `stealth_program_l${level}`,
      name: 'Stealth Program',
      description: 'The Stealth Program is a single-use offensive program designed to help an attacker avoid detection and defensive countermeasures during an infiltration attempt.',
      level: level,
      cost: calculateScaledValue(level, 600, 4800),
      repurchaseCost: calculateScaledValue(level, 480, 3840),
      scarcity: 'Common',
      category: 'Assault Tech',
      colorVar: 2,
      imageSrc: `https://picsum.photos/seed/assault_stealth_${level}/100/100`,
      dataAiHint: "stealth program",
      functionDescription: `When activated during an infiltration, the Stealth Program makes the attacker harder to detect by defensive systems like Security Cameras or makes it more difficult for the defender to manually activate certain countermeasures like the Emergency Power Cell for a limited duration. The effectiveness and duration of the stealth effect scale with the Stealth Program's level.`,
      placement: 'Used from the player\'s Inventory during an active infiltration attempt. It does not occupy a Vault slot.',
      durability: 'Single-use, consumable upon activation.',
      minigameInfluence: `Key Cracker: While the Stealth Program is active, it reduces the number of digits in the code sequence the attacker must remember. The reduction in digits scales with the Stealth Program's level (e.g., reduces digits by Level * 1), making the code easier to memorize.`,
      idealMatch: 'Security Camera',
      poorMatch: 'Emergency Power Cell, Reinforced Foundation (Gadgets that directly affect code difficulty or required attempts/ are not directly countered by stealth).'
    },
    {
      id: `code_scrambler_l${level}`,
      name: 'Code Scrambler',
      description: 'The Code Scrambler is a single-use offensive program designed to disrupt the defender\'s ability to react effectively during an infiltration by interfering with their visual interface.',
      level: level,
      cost: calculateScaledValue(level, 1000, 8000),
      repurchaseCost: calculateScaledValue(level, 800, 6400),
      scarcity: 'Rare',
      category: 'Assault Tech',
      colorVar: 3,
      imageSrc: `https://picsum.photos/seed/assault_scrambler_${level}/100/100`,
      dataAiHint: "code scrambler",
      functionDescription: `When activated during an infiltration, the Code Scrambler interferes with the defender's view of the mini-game interface, making it harder for them to accurately perceive or input information for a limited duration. The intensity and duration of the scrambling effect scale with the Code.`, // Description was cut off, added a placeholder end.
      placement: 'Used from the player\'s Inventory during an active infiltration attempt. It does not occupy a Vault slot.',
      durability: 'Single-use, consumable upon activation.',
      minigameInfluence: 'Affects the defender\'s visual interface during the minigame, making it harder to accurately perceive or input information.' // Placeholder for now
    }
  );
}


export const AESTHETIC_SCHEME_ITEMS: AestheticSchemeItem[] = [
  { id: 'theme_cyphers', name: 'Team Blue', description: 'Default Cyphers operative theme.', level: 1, cost: 0, scarcity: 'Common', category: 'Aesthetic Schemes', themeKey: 'cyphers', colorVar: 5, imageSrc: 'https://picsum.photos/seed/themecyphers/100/100', dataAiHint: "blue abstract" },
  { id: 'theme_shadows', name: 'Team Red', description: 'Standard Shadows operative theme.', level: 1, cost: 0, scarcity: 'Common', category: 'Aesthetic Schemes', themeKey: 'shadows', colorVar: 1, imageSrc: 'https://picsum.photos/seed/themered/100/100', dataAiHint: "red abstract" },
  { id: 'theme_l2_green', name: 'Level 2 (Green)', description: 'A bright, energetic green theme.', level: 2, cost: 500, scarcity: 'Uncommon', category: 'Aesthetic Schemes', themeKey: 'level-2-green', colorVar: 4, imageSrc: 'https://picsum.photos/seed/themegreen/100/100', dataAiHint: "green abstract" },
  // ... Add all schemes from prompt (keeping existing for now)
];


export const ALL_ITEMS_BY_CATEGORY: Record<ItemCategory, GameItemBase[]> = {
  'Vault Hardware': VAULT_HARDWARE_ITEMS,
  'Lock Fortifiers': LOCK_FORTIFIER_ITEMS,
  'Entry Tools': ENTRY_TOOL_ITEMS,
  'Infiltration Gear': [], // Still empty, as no items were provided for this category
  'Nexus Upgrades': NEXUS_UPGRADE_ITEMS,
  'Assault Tech': ASSAULT_TECH_ITEMS,
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
