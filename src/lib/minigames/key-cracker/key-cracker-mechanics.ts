// src/lib/minigames/key-cracker/key-cracker-mechanics.ts
// This file defines the core mathematical and logical mechanics of the Key Cracker minigame,
// determining difficulty parameters based on locks, tools, and fortifiers.

import type { HardwareItem, InfiltrationGearItem, LockFortifierItem, ItemLevel } from '@/lib/game-items';

// Internal state used for mechanics calculations, not the full game state.
// This is to avoid circular dependencies and keep concerns separate.
export interface KeyCrackerState {
  lock: HardwareItem;
  fortifiers: LockFortifierItem[];
  attackingTool: InfiltrationGearItem;
  assaultTechActive: any[]; // Placeholder for now
  successfulEntriesCount: number; // How many successful entries so far in the minigame instance
  failedEntriesCount: number;
  timeElapsedInRound: number;
  currentRound: number;
  attackerLevel: ItemLevel;
  defenderLevel?: ItemLevel;
}

// --- CORE MECHANICS FUNCTIONS ---

/**
 * Calculates the total number of successful entries required to bypass the lock.
 * This is the primary difficulty metric.
 */
export function calculateRequiredEntries(state: KeyCrackerState): number {
  let baseEntries: number;

  // Base difficulty based on lock type and level
  switch (state.lock.name) {
    case 'Cypher Lock':
      baseEntries = state.lock.level * 10; // L1: 10, L8: 80
      break;
    case 'Reinforced Deadbolt':
      // From docs: "Picks remove 50% less strength per use compared to picks of the same level." -> 2x entries
      // "Drills remove 75% less strength poin..." -> 4x entries
      if (state.attackingTool.category === 'Pick') {
        baseEntries = (state.lock.level * 10) * 2;
      } else if (state.attackingTool.category === 'Drill') { // Assuming Drill is the category for Hydraulic Drill
        baseEntries = (state.lock.level * 10) * 4;
      } else {
        baseEntries = state.lock.level * 10; // Default for other tools
      }
      break;
    case 'Biometric Seal':
      baseEntries = state.lock.level * 10 * 1.5; // Example: higher base for Biometric Seal
      break;
    case 'Neural Network Lock':
        baseEntries = state.lock.level * 10 * 1.2; // Neural Network also high strength, slight increase
        break;
    default:
      baseEntries = state.lock.level * 10;
      break;
  }

  // --- Apply Tool Effects (reducing required entries) ---

  // Master Key: "Sets required successful entries to 1, regardless of lock strength."
  if (state.attackingTool.name === 'Master Key') {
    return 1; // Overrides all other calculations
  }

  // Bio-Scanner Override: "Reduces the 'Correct Entries Required' by 2 per level of the override."
  if (state.lock.name === 'Biometric Seal' && state.attackingTool.name === 'Bio-Scanner Override') {
    baseEntries = Math.max(1, baseEntries - (state.attackingTool.level * 2));
  }
  
  // --- Apply Fortifier Effects (increasing required entries) ---

  // Universal Key's effect on Fortifiers: "Disables lock fortifier effects."
  const universalKeyActive = state.fortifiers.some(f => f.id.startsWith('universal_key') && state.attackingTool.level >= f.level);

  for (const fortifier of state.fortifiers) {
    if (universalKeyActive) {
      // If Universal Key is active and its level is sufficient, skip fortifier effect
      continue;
    }

    switch (fortifier.name) {
      case 'Dummy Node':
        // "Negates a number of successful entries equal to its level."
        // This means it adds entries that need to be "negated" by successful entries.
        baseEntries += fortifier.level;
        break;
      case 'Adaptive Shield':
        // "Increases the lock's resistance by an amount equal to its level times 10."
        // Interpreted as a multiplier on base entries.
        baseEntries *= (1 + (fortifier.level * 0.1)); // L1: 10% more, L8: 80% more
        break;
      // Add other fortifiers that affect required entries here if they arise
    }
  }

  return Math.max(1, Math.round(baseEntries)); // Ensure a minimum of 1 entry
}

/**
 * Calculates the number of symbols that should be displayed in a sequence.
 */
export function calculateSymbolsDisplayed(state: KeyCrackerState): number {
  let symbols: number;

  // Base symbols based on lock type and level
  // Neural Network Lock: "The base number of symbols increases with the lock's level (L1 starts with 6, L2 with 7, up to L8 starting with 13)."
  if (state.lock.name === 'Neural Network Lock') {
    symbols = 5 + state.lock.level; // L1: 6, L8: 13
  } else {
    // Default base symbols for other locks
    symbols = 6; // Base for L1 Cypher in docs
  }

  // Apply Tool Effects (reducing symbols)
  // Code Injector: "Reduces the number of 'Symbols Displayed' by 1 per level of the injector."
  if (state.attackingTool.name === 'Code Injector') {
    symbols = Math.max(1, symbols - state.attackingTool.level);
  }
  // Quantum Dephaser: "Reduces the 'Symbols Displayed' by 0.5 per level (round down)."
  if (state.attackingTool.name === 'Quantum Dephaser') {
    symbols = Math.max(1, symbols - Math.floor(state.attackingTool.level * 0.5));
  }

  return Math.max(1, Math.round(symbols)); // Ensure minimum 1 symbol
}

/**
 * Calculates the time allowed per sequence.
 */
export function calculateTimeAllowedPerSequence(state: KeyCrackerState): number {
  let time: number = 20; // Default baseline is 20 seconds as requested

  // Adjust base time if a specific lock dictates it
  // Sonic Pulse Lock: "The base time allowed per sequence is 20 seconds for an L1 lock, decreasing by 1 second per level, down to 13 seconds for an L8 lock."
  if (state.lock.name === 'Sonic Pulse Lock') {
    time = 20 - (state.lock.level - 1); // L1: 20s, L8: 13s
  } 
  // No other locks explicitly define their *base* time, so they use the 20s default.

  // Apply Tool Effects (these *add* to or modify the calculated time)
  // Hydraulic Drill: "Increases the 'Time Allowed Per Sequence' by 1 second per level of the drill."
  if (state.attackingTool.name === 'Hydraulic Drill') {
    time += state.attackingTool.level;
  }
  // Sonic Pulser: "Slightly increases the 'Time Allowed Per Sequence' by 0.5 seconds per level of the pulser."
  if (state.attackingTool.name === 'Sonic Pulser') {
    time += state.attackingTool.level * 0.5;
  }
  // Temporal Dephaser: "Increases the 'Time Allowed Per Sequence' by 0.75 seconds per level."
  if (state.attackingTool.name === 'Temporal Dephaser') {
    time += state.attackingTool.level * 0.75;
  }

  return Math.max(5, Math.round(time)); // Ensure a minimum time limit
}

/**
 * Calculates the strength reduction per successful entry.
 * NOTE: With the "X correct entries" model, this primarily defines the *implied* strength reduced per entry,
 * which sums up to the total lock strength if the minigame is completed successfully.
 * For now, this is simpler, just indicating a baseline. The 'onGameComplete' in AppContext
 * will apply total lock strength reduction on success.
 */
export function calculateStrengthReductionPerEntry(state: KeyCrackerState): number {
  let reduction = state.attackingTool.strength?.perUse || 1; // Default to tool's perUse

  // Apply "Poor Match Penalty" if specified in the docs.
  // Example: Basic Pick against Reinforced Deadbolt
  if (state.attackingTool.name === 'Basic Pick' && state.lock.name === 'Reinforced Deadbolt') {
    // "Picks remove 50% less strength per use"
    reduction *= 0.5;
  }

  // Example: Code Injector against Biometric Seal, Reactive Armor, Feedback Loop.
  // "Poor Match Penalty Against: Biometric Seal, Reactive Armor, Feedback Loop."
  // This might reduce the *effectiveness* of the strength reduction.
  if (state.attackingTool.name === 'Code Injector' &&
     (state.lock.name === 'Biometric Seal' || state.lock.name === 'Reactive Armor' || state.fortifiers.some(f => f.name === 'Feedback Loop'))) {
    reduction *= 0.5; // Example: 50% less effective
  }

  // Add more specific tool-lock interactions here.

  return Math.max(1, Math.round(reduction)); // Ensure at least 1 strength reduction per entry
}


/**
 * Determines and aggregates special effects based on active locks, tools, and fortifiers.
 */
export function getSpecialEffects(state: KeyCrackerState) {
  let specialEffects = {
    // Biometric Seal: symbols flash
    flashSymbols: { active: false, frequency: 0, duration: 0 },
    // Neural Feedback Spore: keypad randomize
    randomizeKeypad: { active: false, frequency: 0 },
    // Temporal Anchor: reverses sequence
    reverseSequence: { active: false, frequency: 0 },
    // Plasma Conduit Lock: time reduction on successful entries (handled in logic.ts)
    plasmaConduitTimeReduction: { active: false, amount: 0 },
  };

  // --- Lock Special Effects ---
  switch (state.lock.name) {
    case 'Biometric Seal':
      specialEffects.flashSymbols.active = true;
      // "L1 and L2 disappear every 4 seconds, L3 and L4 every 3 seconds, L5 and L6 every 2 seconds, and L7 and L8 every 1 second."
      if (state.lock.level <= 2) specialEffects.flashSymbols.frequency = 4;
      else if (state.lock.level <= 4) specialEffects.flashSymbols.frequency = 3;
      else if (state.lock.level <= 6) specialEffects.flashSymbols.frequency = 2;
      else specialEffects.flashSymbols.frequency = 1;

      // "The duration for which the symbols disappear also increases with the lock's level: L1 disappears for 0.1 seconds, L2 for 0.2 seconds, and so on, up to L8, which disappears for 0.8 seconds."
      specialEffects.flashSymbols.duration = state.lock.level * 0.1;
      break;
    case 'Plasma Conduit Lock':
        specialEffects.plasmaConduitTimeReduction.active = true;
        specialEffects.plasmaConduitTimeReduction.amount = state.lock.level; // L1: 1s, L8: 8s
        break;
    // Quantum Entanglement Lock's extra symbol handled in generateNewSequence in logic.ts
    // Temporal Flux Lock's strength increase handled in handleTick in logic.ts
  }

  // --- Fortifier Special Effects ---
  // Universal Key's effect on Fortifiers: "Disables lock fortifier effects."
  const universalKeyActive = state.fortifiers.some(f => f.id.startsWith('universal_key') && state.attackingTool.level >= f.level);

  for (const fortifier of state.fortifiers) {
    if (universalKeyActive) {
      continue; // Skip fortifier effect if Universal Key is active
    }

    switch (fortifier.name) {
      case 'Neural Feedback Spore':
        specialEffects.randomizeKeypad.active = true;
        // "An L8 lock randomizes the keypad every 3rd round, L7 every 4th round, L6 every 5th round, L5 every 6th round, L4 every 7th round, L3 every 8th round, L2 every 9th round, and L1 every 10th round."
        specialEffects.randomizeKeypad.frequency = 11 - fortifier.level; // L8: 3, L1: 10
        break;
      case 'Temporal Anchor':
        specialEffects.reverseSequence.active = true;
        // "An L8 lock reverses the sequence every 3rd round, L7 every 4th round, L6 every 5th round, L5 every 6th round, L4 every 7th round, L3 every 8th round, L2 every 9th round, and L1 every 10th round."
        specialEffects.reverseSequence.frequency = 11 - fortifier.level; // L8: 3, L1: 10
        break;
      // Entanglement Field Inhibitor's random emojis & reset on incorrect handled in logic.ts
    }
  }

  // --- Tool Special Effects (if any) ---
  // Temporal Dephaser: "The probability of reversing the sequence increases by 10% per level."
  // This is a PROBABILITY, so it needs to be rolled in `logic.ts` when a new sequence is generated.
  // Quantum Dephaser: "The probability of disabling special effects increases by 12.5% per level."
  // This is a PROBABILITY. The effect disablement needs to happen in logic.ts, potentially overriding `specialEffects.flashSymbols.active` or `specialEffects.randomizeKeypad.active`

  return specialEffects;
}
