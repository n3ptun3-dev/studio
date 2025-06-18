// src/lib/key-cracker-mechanics.ts
// This file defines the mathematical rules and probabilities for the Key Cracker minigame.
// It will contain functions to calculate difficulty, apply item effects, and manage minigame state.

import { type GameItemBase, type ItemLevel, HardwareItem, InfiltrationGearItem, LockFortifierItem } from './game-items';

/**
 * Interface to define the current state of a Key Cracker attempt for a specific lock.
 * This will be passed to functions that calculate effects.
 */
export interface KeyCrackerState {
  lock: HardwareItem; // The lock being attacked
  fortifiers: LockFortifierItem[]; // Any fortifiers attached to the lock
  attackingTool: InfiltrationGearItem; // The tool being used by the attacker
  assaultTechActive: GameItemBase[]; // Any active assault tech programs (e.g., System Hack, Stealth Program)
  successfulEntriesCount: number; // How many successful entries so far
  failedEntriesCount: number; // How many failed entries so far
  timeElapsedInRound: number; // Time elapsed in the current sequence entry round
  currentRound: number; // The current round of the Key Cracker minigame
  // Add other dynamic state variables as needed for minigame calculations
  defenderActive?: boolean; // Is the defender actively playing?
  attackerLevel: ItemLevel; // Level of the attacking player
  defenderLevel?: ItemLevel; // Level of the defending player (if applicable)
}

/**
 * Calculates the total required successful entries to bypass a lock, considering
 * the lock's base strength, fortifiers, and attacking tools.
 * @param state The current Key Cracker state.
 * @returns The total number of successful entries required.
 */
export function calculateRequiredEntries(state: KeyCrackerState): number {
  let requiredEntries = state.lock.strength.current; // Start with lock's current strength

  // Apply Lock Fortifier effects that increase required entries
  state.fortifiers.forEach(fortifier => {
    if (fortifier.name === 'Dummy Node') {
      requiredEntries += fortifier.level; // Dummy Node increases required entries by its level
    }
    if (fortifier.name === 'Adaptive Shield') {
      // Adaptive Shield increases lock's resistance by level * 10
      // This indirectly increases required entries as per the formula:
      // Required Entries = Lock Strength / (Attacker's Tool Strength / (1 + (Lock Resistance / 100)))
      // We'll apply this in `calculateStrengthReductionPerEntry`
    }
    // Add other fortifier logic that directly increases required entries
  });

  // Apply Assault Tech effects that reduce required entries
  state.assaultTechActive.forEach(tech => {
    if (tech.name === 'System Hack') {
      // System Hack reduces the required number of successful code entries.
      // Assuming a linear reduction for now, e.g., Level * some_base_reduction
      requiredEntries -= tech.level * 10; // Example: reduce by 10 per level
    }
    if (tech.name === 'Seismic Charge') {
      // Seismic Charge instantly reduces entries needed
      requiredEntries -= tech.level * 10; // Example: reduce by 10 per level
    }
  });

  // Ensure required entries doesn't go below 0
  return Math.max(0, Math.round(requiredEntries));
}

/**
 * Calculates how much a lock's strength is reduced per successful entry,
 * considering the attacking tool's strength and lock's resistance/fortifier effects.
 * @param state The current Key Cracker state.
 * @returns The amount of strength to reduce per successful entry.
 */
export function calculateStrengthReductionPerEntry(state: KeyCrackerState): number {
  let toolStrengthPerEntry = state.attackingTool.attackFactor;

  // Apply Lock-specific resistances/penalties to attacking tool
  switch (state.lock.name) {
    case 'Reinforced Deadbolt':
      if (state.attackingTool.name.includes('Pick')) {
        toolStrengthPerEntry *= 0.50; // Picks remove 50% less strength
      } else if (state.attackingTool.name.includes('Drill')) {
        toolStrengthPerEntry *= 0.25; // Drills remove 75% less strength (i.e. 25% effectiveness)
      }
      break;
    case 'Plasma Conduit Lock':
      if (state.attackingTool.name === 'Code Injector') {
        toolStrengthPerEntry *= 0.5; // Code Injector's Strength per entry is halved
      }
      toolStrengthPerEntry *= 0.5; // Energy flow defense, cuts standard damage in half
      break;
    case 'Biometric Seal':
      if (state.attackingTool.name.includes('Pick')) {
        toolStrengthPerEntry *= 0.5; // Picks remove half the normal strength
      }
      break;
    case 'Neural Network Lock':
      if (state.attackingTool.name.includes('Drill')) {
        toolStrengthPerEntry = 0; // Drills are ineffective
      }
      break;
    // Add other lock-specific tool effectiveness modifiers
  }

  // Apply Lock Fortifier effects that influence effective resistance/strength reduction
  state.fortifiers.forEach(fortifier => {
    if (fortifier.name === 'Adaptive Shield') {
      // This is the formula from your document: Required Entries = Lock Strength / (Attacker's Tool Strength / (1 + (Lock Resistance / 100)))
      // Which means effective tool strength is reduced.
      const resistanceBoost = fortifier.level * 10;
      const combinedResistance = state.lock.resistance.current + resistanceBoost;
      toolStrengthPerEntry /= (1 + (combinedResistance / 100)); // Apply resistance
    }
    if (fortifier.name === 'Sonic Dampener') {
      if (state.attackingTool.name === 'Hydraulic Drill') {
        toolStrengthPerEntry = 0; // Drills completely ineffective
      }
    }
    // Universal Key bypasses fortifiers, but this function calculates for an *active* fortifier
    // The Universal Key's logic would need to *prevent* the fortifier from being in `state.fortifiers`
    // or set `toolStrengthPerEntry` to its default if the fortifier is disabled.
    if (fortifier.name === 'Reactive Armor') {
      if (state.attackingTool.name === 'Code Injector') {
        // Code Injectors have reduced effectiveness (50% less reduction of 'Symbols Displayed')
        // This primarily affects symbol display, not strength reduction directly, but keeping here for context
      }
    }
    if (fortifier.name === 'Feedback Loop') {
        if (state.attackingTool.name === 'Code Injector') {
             // Code Injectors have reduced effectiveness (50% less reduction of 'Symbols Displayed')
        }
    }
  });

  // Apply Infiltration Gear effectiveness modifiers
  if (state.attackingTool.category === 'Infiltration Gear') {
    if (state.attackingTool.lockTypeEffectiveness?.poorMatchPenaltyAgainst?.includes(state.lock.name)) {
      if (state.attackingTool.name === 'Bio-Scanner Override' && state.lock.name !== 'Biometric Seal') {
        toolStrengthPerEntry *= 0.5; // 50% less reduction of 'Correct Entries Required'
      }
      if (state.attackingTool.name === 'Temporal Dephaser' && state.lock.name !== 'Temporal Flux Lock' && state.lock.name !== 'Temporal Anchor') {
        // 50% less increase to 'Time Allowed Per Sequence' - this is time, not strength, but useful to note
      }
      if (state.attackingTool.name === 'Quantum Dephaser' && 
          (state.lock.name === 'Reinforced Deadbolt' || state.lock.name === 'Cypher Lock' || state.lock.name === 'Plasma Conduit Lock' || state.lock.name === 'Reactive Armor')) {
        toolStrengthPerEntry *= 0.5; // 50% less reduction of 'Symbols Displayed' - this is symbols, not strength, but useful to note
      }
    }
    if (state.attackingTool.lockTypeEffectiveness?.idealMatchBonus && state.attackingTool.lockTypeEffectiveness.idealCounterAgainst.includes(state.lock.name)) {
        if (state.attackingTool.name === 'Code Injector') {
            toolStrengthPerEntry *= 1.5; // Damage dealt is multiplied by 1.5
        }
        if (state.attackingTool.name === 'Quantum Dephaser') {
            toolStrengthPerEntry *= 1.5; // Damage dealt is multiplied by 1.5
        }
    }
  }


  return Math.max(0, toolStrengthPerEntry); // Ensure strength reduction is not negative
}

/**
 * Calculates the time allowed for a single sequence entry.
 * @param state The current Key Cracker state.
 * @returns Time allowed in seconds.
 */
export function calculateTimeAllowedPerSequence(state: KeyCrackerState): number {
  let timeAllowed = 20; // Base time

  // Apply Lock effects
  if (state.lock.name === 'Sonic Pulse Lock') {
    timeAllowed = 20 - state.lock.level; // L1 = 19s, L8 = 12s
  }
  if (state.lock.name === 'Plasma Conduit Lock') {
    // Successful entries slightly decrease time allowed for subsequent entries.
    // The time reduction for subsequent entries is equal to the lock's level in seconds.
    // This implies stateful tracking of successful entries and applying the penalty dynamically.
    timeAllowed -= state.successfulEntriesCount * state.lock.level;
  }
  
  // Apply Infiltration Gear effects
  if (state.attackingTool.name === 'Hydraulic Drill') {
    timeAllowed += state.attackingTool.level; // Increases time by 1s per level
  }
  if (state.attackingTool.name === 'Sonic Pulser') {
    timeAllowed += state.attackingTool.level * 0.5; // Increases time by 0.5s per level
  }
  if (state.attackingTool.name === 'Temporal Dephaser') {
    timeAllowed += state.attackingTool.level * 0.75; // Increases time by 0.75s per level
  }

  // Apply Lock Fortifier penalties
  state.fortifiers.forEach(fortifier => {
    if (fortifier.name === 'Sonic Dampener') {
        if (state.attackingTool.name === 'Sonic Pulser') {
             timeAllowed *= 0.5; // Sonic Pulser's time bonus is halved
        }
    }
    if (fortifier.name === 'Temporal Anchor') {
        // This fortifier reverses sequence, doesn't directly affect time allowed per sequence.
    }
  });

  // Apply Infiltration Gear poor match penalties to time
  if (state.attackingTool.lockTypeEffectiveness?.poorMatchPenaltyAgainst?.includes(state.lock.name)) {
    if ((state.attackingTool.name === 'Temporal Dephaser' && state.lock.name === 'Temporal Flux Lock') || (state.attackingTool.name === 'Sonic Pulser' && state.lock.name === 'Temporal Flux Lock' || state.lock.name === 'Quantum Entanglement Lock')) {
      // From your document: "Temporal Flux Lock, Quantum Entanglement Lock (Time Allowed Per Sequence increased by 25% less)"
      // This means the *increase* from the tool is reduced by 25%.
      // This specific logic should probably be applied where the tool's bonus is added.
      // For simplicity here, assuming it's a direct reduction of final time if the bonus was already applied.
    }
  }

  // Apply Hardware (Lock) poor match penalties to time
  if (state.lock.name === 'Quantum Entanglement Lock' && state.attackingTool.name === 'Sonic Pulser') {
    timeAllowed *= 0.75; // Sonic Pulsers have reduced effectiveness (Time Allowed Per Sequence increased by 25% less)
  }
  if (state.lock.name === 'Temporal Flux Lock' && state.attackingTool.name === 'Sonic Pulser') {
    timeAllowed *= 0.75; // Sonic Pulsers have reduced effectiveness (Time Allowed Per Sequence increased by 25% less)
  }

  return Math.max(1, timeAllowed); // Minimum 1 second
}

/**
 * Calculates the number of symbols to display in a sequence.
 * @param state The current Key Cracker state.
 * @returns Number of symbols.
 */
export function calculateSymbolsDisplayed(state: KeyCrackerState): number {
  let symbols = 0;

  // Base symbols for Neural Network Lock
  if (state.lock.name === 'Neural Network Lock') {
    symbols = 5 + state.lock.level; // L1 starts with 6, L8 with 13
    // For every two successful entries, symbols increase by one.
    symbols += Math.floor(state.successfulEntriesCount / 2);
  } else {
    // Default symbols for other locks, assuming a base.
    // Your doc doesn't specify default, so let's assume a reasonable base for general locks.
    symbols = 6; 
  }

  // Apply Infiltration Gear effects
  if (state.attackingTool.name === 'Code Injector') {
    symbols = Math.max(1, symbols - state.attackingTool.level); // Reduces symbols by 1 per level
    // Halved against Quantum Entanglement Locks
    if (state.lock.name === 'Quantum Entanglement Lock' || state.lock.name === 'Plasma Conduit Lock') {
      symbols = Math.max(1, symbols - Math.floor(state.attackingTool.level * 0.5)); // Halved reduction
    }
  }
  if (state.attackingTool.name === 'Stealth Program') {
    symbols = Math.max(1, symbols - state.attackingTool.level); // Reduces digits by Level * 1
  }
  if (state.attackingTool.name === 'Quantum Dephaser') {
    symbols = Math.max(1, symbols - Math.floor(state.attackingTool.level * 0.5)); // Reduces by 0.5 per level (round down)
  }

  // Apply Lock Fortifier effects
  state.fortifiers.forEach(fortifier => {
    if (fortifier.name === 'Entanglement Field Inhibitor') {
      symbols += fortifier.level; // Adds random emojis, amount equal to level
    }
    if (fortifier.name === 'Biometric Seal' || fortifier.name === 'Reactive Armor' || fortifier.name === 'Feedback Loop') {
        if (state.attackingTool.name === 'Code Injector') {
            // Code Injectors have reduced effectiveness (50% less reduction of 'Symbols Displayed')
            // This is handled above by halving the Code Injector's reduction for these types.
        }
    }
  });

  return Math.max(1, symbols); // Minimum 1 symbol
}

/**
 * Determines if a special effect, like symbol flashing or reversal, is active for the current round.
 * @param state The current Key Cracker state.
 * @returns An object indicating active effects and their parameters.
 */
export function getSpecialEffects(state: KeyCrackerState) {
  let effects = {
    flashSymbols: { active: false, frequency: 0, duration: 0 },
    reverseSequence: { active: false, frequency: 0 },
    randomizeKeypad: { active: false, frequency: 0 },
    disableFortifier: { active: false, level: 0, targetFortifierId: '' },
    resetOnFail: { active: false, retriesReduced: 0 },
  };

  // Lock-specific effects
  if (state.lock.name === 'Biometric Seal') {
    const flashFrequency = state.lock.level <= 2 ? 4 : state.lock.level <= 4 ? 3 : state.lock.level <= 6 ? 2 : 1;
    const flashDuration = state.lock.level * 0.1;
    if (state.currentRound % flashFrequency === 0) {
      effects.flashSymbols = { active: true, frequency: flashFrequency, duration: flashDuration };
    }
  }
  if (state.lock.name === 'Quantum Entanglement Lock') {
    const extraSymbolFrequency = state.lock.level === 8 ? 3 : state.lock.level === 7 ? 4 : state.lock.level === 6 ? 5 : state.lock.level === 5 ? 6 : state.lock.level === 4 ? 7 : state.lock.level === 3 ? 8 : state.lock.level === 2 ? 9 : 10;
    if (state.currentRound % extraSymbolFrequency === 0) {
        // This effect adds symbols, which is handled in calculateSymbolsDisplayed,
        // but here we could indicate the "trigger" for it.
        // For now, no direct boolean flag here, as it's a modifier to symbols count.
    }
  }

  // Fortifier-specific effects
  state.fortifiers.forEach(fortifier => {
    if (fortifier.name === 'Temporal Anchor') {
        const reverseFrequency = fortifier.level === 8 ? 3 : fortifier.level === 7 ? 4 : fortifier.level === 6 ? 5 : fortifier.level === 5 ? 6 : fortifier.level === 4 ? 7 : fortifier.level === 3 ? 8 : fortifier.level === 2 ? 9 : 10; // This is the round frequency
        if (state.currentRound % reverseFrequency === 0) {
            effects.reverseSequence = { active: true, frequency: reverseFrequency };
        }
    }
    if (fortifier.name === 'Neural Feedback Spore') {
        const randomizeFrequency = fortifier.level === 8 ? 3 : fortifier.level === 7 ? 4 : fortifier.level === 6 ? 5 : fortifier.level === 5 ? 6 : fortifier.level === 4 ? 7 : fortifier.level === 3 ? 8 : fortifier.level === 2 ? 9 : 10; // This is the round frequency
        if (state.currentRound % randomizeFrequency === 0) {
            effects.randomizeKeypad = { active: true, frequency: randomizeFrequency };
        }
    }
    if (fortifier.name === 'Entanglement Field Inhibitor') {
        // "When an incorrect sequence is entered, the lock failure resets the game. The reset amount is equal to the level number"
        // This is a penalty on failure, which would be handled in the game loop's failure state.
        // But we can set a flag if this fortifier is active.
        effects.resetOnFail = { active: true, retriesReduced: fortifier.level };
    }
  });

  // Attacking Tool special effects (probabilities and durations)
  if (state.attackingTool.name === 'Temporal Dephaser') {
    const reverseProbability = state.attackingTool.level * 0.10; // 10% per level
    if (Math.random() < reverseProbability) {
      effects.reverseSequence = { active: true, frequency: 1 }; // Always active if triggered by probability
    }
  }
  if (state.attackingTool.name === 'Quantum Dephaser') {
    const disableProbability = state.attackingTool.level * 0.125; // 12.5% per level
    if (Math.random() < disableProbability) {
      // This would need a target fortifier. For now, just indicating it's active.
      // The actual logic for which fortifier to disable, and its duration, would be external.
      effects.disableFortifier = { active: true, level: state.attackingTool.level, targetFortifierId: 'TBD' };
    }
  }
  if (state.attackingTool.name === 'Universal Key') {
    // "Disables fortifier effects on the target lock if the Universal Key's level is equal to or greater than the fortifier's level."
    // This is a pre-computation: the fortifier wouldn't even be passed into the KeyCrackerState.fortifiers if disabled.
    // So this effect is more about *how* the `fortifiers` array is constructed for the `KeyCrackerState`.
  }

  // Assault Tech special effects
  state.assaultTechActive.forEach(tech => {
    if (tech.name === 'Code Scrambler') {
      // "temporarily randomizes the position of the symbol buttons on the defender's Keypad interface"
      // "duration of this effect scales with the Code Scrambler's level (e.g., lasts for Level * 2 code input rounds)"
      effects.randomizeKeypad = { active: true, frequency: 1 }; // Always active if used
    }
    if (tech.name === 'Power Spike') {
      // "temporarily disables that gadget's active effects for a limited duration"
      // Similar to Universal Key, this implies modifying the `state` before passing it to mechanics functions,
      // or handling a list of disabled gadgets.
    }
  });

  return effects;
}


// You would add more functions here for other aspects of the minigame:
// - calculateXPOnSuccess(state: KeyCrackerState): number
// - calculateELINTLossOnFail(state: KeyCrackerState): number
// - applyFortifierDamage(fortifier: LockFortifierItem, damage: number): LockFortifierItem
// - determineNextSequence(state: KeyCrackerState): string[] (for the symbols to display)

