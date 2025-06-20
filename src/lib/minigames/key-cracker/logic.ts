// src/lib/minigames/key-cracker/logic.ts
// This file contains the core game logic and state management for the Key Cracker minigame.

import {
  type HardwareItem,
  type InfiltrationGearItem,
  type LockFortifierItem,
  type ItemLevel,
  type GameItemBase,
} from '@/lib/game-items';
import {
  calculateRequiredEntries,
  calculateSymbolsDisplayed,
  calculateTimeAllowedPerSequence,
  calculateStrengthReductionPerEntry,
  getSpecialEffects,
  type KeyCrackerState as GlobalKeyCrackerState, // Import with alias to avoid name collision
} from '@/lib/minigames/key-cracker/key-cracker-mechanics'; // Corrected import path for mechanics

// --- Game State Interfaces ---

// Mapping of internal number values to display symbols
// Reduced to 8 symbols (0-7) as requested
export const SYMBOL_MAP: Record<string, string> = {
  '0': '∅', // Empty set symbol for zero
  '1': '↱', // Arrow for one
  '2': '⥃', // Double loop for two
  '3': '∆', // Triangle for three
  '4': '☩', // Cross for four
  '5': '⭓', // Pentagon for five
  '6': '☗', // Chess pawn for six (looks like a 6-sided die)
  '7': '⚇', // Double circle for seven
  // Removed '8', '9', '⚡', '★' as requested
  '§': '▓', // Placeholder for Quantum Entanglement Lock's extra non-keypad symbol
  // Add symbols for ⚡ and ★ if they are needed for generating sequences later, even if not on keypad
  '10': '⚡', // Lightning (kept for consistency with generateNewSequence if needed)
  '11': '★', // Star (kept for consistency with generateNewSequence if needed)
};

// Internal values used for generating sequences and input validation
// Reduced to 8 values (0-7) as requested
export const KEYPAD_VALUES = ['0', '1', '2', '3', '4', '5', '6', '7'];


export enum KeyCrackerGamePhase {
  Instruction = 'instruction', // Initial message: "Memorise symbols. Press ENTER to start."
  Memorise = 'memorise',     // Code sequence is displayed: "Code shown only once. Press ENTER to continue."
  Input = 'input',           // Player inputs code: "ENTER CODE"
  Feedback = 'feedback',     // Shows "CODE ACCEPTED" or "INVALID CODE"
  GameOver = 'game_over',    // Game ended (success or fail)
}

/**
 * Interface for the Key Cracker minigame's internal state.
 * This is specific to the UI component's needs.
 */
export interface KeyCrackerGameState {
  lock: HardwareItem;
  fortifiers: LockFortifierItem[];
  attackingTool: InfiltrationGearItem;
  assaultTechActive: GameItemBase[];
  attackerLevel: ItemLevel;
  defenderLevel?: ItemLevel;

  currentPhase: KeyCrackerGamePhase;
  currentSequence: string[]; // The sequence the player needs to memorise (using internal values, converted to symbols for display)
  userInput: string[];       // The symbols currently entered by the player (using internal values)
  successfulEntries: number; // Number of correct sequences entered
  totalRequiredEntries: number; // Total entries needed to bypass the lock/fortifier
  timeRemaining: number;     // Time left for current round (in seconds)
  attemptsRemaining: number; // Attempts left for current sequence
  maxAttemptsPerSequence: number; // Configured max attempts
  message: string;           // Message displayed on the digital display
  isComplete: boolean;       // True if the lock is bypassed
  isFailed: boolean;         // True if the game is failed
  toolDamageOnFail: number;  // Amount of damage to apply to tool if game fails

  // Dynamic values derived from mechanics functions, updated per round/phase
  symbolsToDisplayCount: number;
  timeAllowedPerSequence: number; // This is the total time for the current phase (memorise or input)
  strengthReductionPerEntry: number;
  specialEffects: ReturnType<typeof getSpecialEffects>; // Store active special effects

  // Unique ID for the current sequence, used to force re-render/reset animations
  sequenceId: string;
}

// --- Initialization ---

/**
 * Initializes the Key Cracker game state based on the lock and other factors.
 * This should be called once when the minigame starts.
 * @param lock The HardwareItem representing the lock.
 * @param fortifiers Array of LockFortifierItems deployed on the lock.
 * @param attackingTool The InfiltrationGearItem used.
 * @param assaultTechActive Array of active AssaultTechItems.
 * @param attackerLevel The attacking player's level.
 * @param defenderLevel The defending player's level (optional).
 * @param maxAttemptsPerSequence The maximum number of attempts allowed per sequence.
 * @returns The initial KeyCrackerGameState.
 */
export function initializeKeyCrackerGame(
  lock: HardwareItem,
  fortifiers: LockFortifierItem[],
  attackingTool: InfiltrationGearItem,
  assaultTechActive: GameItemBase[],
  attackerLevel: ItemLevel,
  defenderLevel: ItemLevel | undefined,
  maxAttemptsPerSequence: number, // New parameter
): KeyCrackerGameState {
  // Create a mock KeyCrackerState for initial mechanics calculations
  const initialStateForMechanics: GlobalKeyCrackerState = {
    lock,
    fortifiers,
    attackingTool,
    assaultTechActive,
    successfulEntriesCount: 0,
    failedEntriesCount: 0,
    timeElapsedInRound: 0,
    currentRound: 0,
    attackerLevel,
    defenderLevel,
  };

  const totalRequiredEntries = calculateRequiredEntries(initialStateForMechanics);
  const timeAllowed = calculateTimeAllowedPerSequence(initialStateForMechanics);
  const symbolsCount = calculateSymbolsDisplayed(initialStateForMechanics);
  const strengthReduction = calculateStrengthReductionPerEntry(initialStateForMechanics);
  const specialFx = getSpecialEffects(initialStateForMechanics);

  // Determine Feedback Loop damage for tool
  const feedbackLoop = fortifiers.find(f => f.name === 'Feedback Loop');
  const toolDamageAmount = feedbackLoop ? feedbackLoop.level : 0;


  return {
    lock,
    fortifiers,
    attackingTool,
    assaultTechActive,
    attackerLevel,
    defenderLevel,

    currentPhase: KeyCrackerGamePhase.Instruction,
    currentSequence: [], // Sequence is generated on START
    userInput: [],
    successfulEntries: 0,
    totalRequiredEntries: totalRequiredEntries,
    timeRemaining: timeAllowed, // Initial time is allowed time for first phase
    attemptsRemaining: maxAttemptsPerSequence,
    maxAttemptsPerSequence: maxAttemptsPerSequence,
    message: "Code sequence incoming.\nPress START to begin.", // Updated message with new line
    isComplete: false,
    isFailed: false,
    toolDamageOnFail: toolDamageAmount, // Store damage amount here

    symbolsToDisplayCount: symbolsCount,
    timeAllowedPerSequence: timeAllowed, // This is the base time for any timed phase
    strengthReductionPerEntry: strengthReduction,
    specialEffects: specialFx,
    sequenceId: 'initial', // Unique ID for visual resets
  };
}

/**
 * Generates a new random symbol sequence (using internal KEYPAD_VALUES).
 * @param state The current KeyCrackerGameState.
 * @returns The updated KeyCrackerGameState with a new sequence.
 */
export function generateNewSequence(state: KeyCrackerGameState): KeyCrackerGameState {
  const newSequence: string[] = [];
  // Use KEYPAD_VALUES for random generation, which only includes 0-7 now
  const availableKeysForGeneration = [...KEYPAD_VALUES]; 
  // If Quantum Entanglement Lock active, add special symbol '§' to generation pool for this sequence
  if (state.lock.name === 'Quantum Entanglement Lock') {
    // Note: The logic for WHEN to add the '§' symbol is in KeyCracker.tsx for display.
    // Here, we just ensure '§' is available if it's possible.
    // No, this needs to be checked here during generation based on frequency.
    const qel = state.lock;
    const injectionFrequency = 11 - qel.level;
    if ((state.successfulEntries + 1) % injectionFrequency === 0) {
      availableKeysForGeneration.push('§'); // Make the special symbol available for this sequence
    }
  }

  // Generate symbols based on `symbolsToDisplayCount`
  for (let i = 0; i < state.symbolsToDisplayCount; i++) {
    const randomIndex = Math.floor(Math.random() * availableKeysForGeneration.length);
    newSequence.push(availableKeysForGeneration[randomIndex]);
  }

  // Apply Entanglement Field Inhibitor: inserts random emojis
  const entanglementInhibitor = state.fortifiers.find(f => f.name === 'Entanglement Field Inhibitor');
  if (entanglementInhibitor && state.specialEffects.randomizeKeypad.active) { // Only apply if not disabled by Quantum Dephaser
    for (let i = 0; i < entanglementInhibitor.level; i++) {
        // Choose from original keypad values for emojis, not special symbols
        const emojiIndex = Math.floor(Math.random() * KEYPAD_VALUES.length); 
        const insertIndex = Math.floor(Math.random() * (newSequence.length + 1));
        newSequence.splice(insertIndex, 0, KEYPAD_VALUES[emojiIndex]);
    }
  }

  // Apply Temporal Anchor: periodically reverses sequence
  const temporalAnchor = state.fortifiers.find(f => f.name === 'Temporal Anchor');
  if (temporalAnchor && state.specialEffects.reverseSequence.active) { // Only apply if not disabled by Quantum Dephaser
      const reverseFrequency = 11 - temporalAnchor.level;
      if ((state.successfulEntries + 1) % reverseFrequency === 0) {
          newSequence.reverse();
          return {
              ...state,
              currentSequence: newSequence,
              userInput: [],
              currentPhase: KeyCrackerGamePhase.Memorise,
              message: "CODE REVERSED! Memorise symbols.\nPress CONTINUE to proceed.",
              timeRemaining: state.timeAllowedPerSequence,
              sequenceId: Date.now().toString(),
          };
      }
  }

  return {
    ...state,
    currentSequence: newSequence,
    userInput: [],
    currentPhase: KeyCrackerGamePhase.Memorise,
    message: "Code shown only once.\nPress CONTINUE to proceed.",
    timeRemaining: state.timeAllowedPerSequence,
    sequenceId: Date.now().toString(),
  };
}

/**
 * Handles a player's symbol input.
 * @param state The current KeyCrackerGameState.
 * @param displaySymbol The symbol entered by the player (this is the *display symbol*, needs conversion).
 * @returns The updated KeyCrackerGameState.
 */
export function handleSymbolInput(state: KeyCrackerGameState, displaySymbol: string): KeyCrackerGameState {
  if (state.currentPhase !== KeyCrackerGamePhase.Input || state.userInput.length >= state.currentSequence.length) {
    return state;
  }

  // Find the internal value corresponding to the displaySymbol
  const internalValue = Object.keys(SYMBOL_MAP).find(key => SYMBOL_MAP[key] === displaySymbol);

  if (!internalValue) {
      console.warn(`Attempted to input unknown symbol: ${displaySymbol}`);
      return state; // Do not process unknown symbols
  }

  return {
    ...state,
    userInput: [...state.userInput, internalValue],
  };
}

/**
 * Handles backspace action.
 * @param state The current KeyCrackerGameState.
 * @returns The updated KeyCrackerGameState.
 */
export function handleBackspace(state: KeyCrackerGameState): KeyCrackerGameState {
  if (state.currentPhase !== KeyCrackerGamePhase.Input || state.userInput.length === 0) {
    return state;
  }

  const newUserInput = [...state.userInput];
  newUserInput.pop(); // Remove last symbol

  return {
    ...state,
    userInput: newUserInput,
  };
}

/**
 * Handles the "Enter" button press. This function acts as a phase transitioner.
 * @param state The current KeyCrackerGameState.
 * @returns The updated KeyCrackerGameState.
 */
export function handleEnter(state: KeyCrackerGameState): KeyCrackerGameState {
  let newState = { ...state };

  switch (state.currentPhase) {
    case KeyCrackerGamePhase.Instruction:
      newState = generateNewSequence(newState);
      break;

    case KeyCrackerGamePhase.Memorise:
      newState.currentPhase = KeyCrackerGamePhase.Input;
      newState.message = "ENTER CODE";
      newState.timeRemaining = state.timeAllowedPerSequence; // Reset timer for input phase
      break;

    case KeyCrackerGamePhase.Input:
      if (newState.userInput.length === newState.currentSequence.length) {
        const isCorrect = newState.userInput.every((val, index) => val === newState.currentSequence[index]);

        if (isCorrect) {
          newState.successfulEntries += 1;
          newState.message = "CODE ACCEPTED";
          newState.currentPhase = KeyCrackerGamePhase.Feedback;
          newState.attemptsRemaining = newState.maxAttemptsPerSequence;
          
          // Plasma Conduit Lock: "Successful entries slightly decrease the time allowed for subsequent entries.
          // The time reduction for subsequent entries is equal to the lock's level in seconds (L1: 1s, L2: 2s, ..., L8: 8s)."
          if (state.specialEffects.plasmaConduitTimeReduction.active) {
            newState.timeAllowedPerSequence = Math.max(5, newState.timeAllowedPerSequence - state.specialEffects.plasmaConduitTimeReduction.amount);
          }

          if (newState.successfulEntries >= newState.totalRequiredEntries) {
            newState.isComplete = true;
            newState.message = "ACCESS GRANTED";
            newState.currentPhase = KeyCrackerGamePhase.GameOver;
          }
        } else {
          newState.attemptsRemaining -= 1;
          newState.message = "INVALID CODE";
          newState.currentPhase = KeyCrackerGamePhase.Feedback;
          newState.userInput = [];
          
          const entanglementInhibitor = state.fortifiers.find(f => f.name === 'Entanglement Field Inhibitor');
          if (entanglementInhibitor) {
            newState.attemptsRemaining = Math.max(0, newState.attemptsRemaining - entanglementInhibitor.level);
          }

          if (newState.attemptsRemaining <= 0) {
            newState.isFailed = true;
            newState.message = "INFILTRATION FAILED: ATTEMPTS EXHAUSTED";
            newState.currentPhase = KeyCrackerGamePhase.GameOver;
          }
        }
      } else {
        newState.message = "Incomplete code. ENTER CODE";
      }
      break;

    case KeyCrackerGamePhase.Feedback:
      if (newState.isComplete || newState.isFailed) {
        // Stay in Game Over state
      } else {
        if (state.message.includes("ACCEPTED")) {
             newState = generateNewSequence(newState);
        } else {
             // If previous was incorrect or timed out, the user clicks RETRY.
             // Reset time and transition back to Input.
             newState.currentPhase = KeyCrackerGamePhase.Input;
             newState.message = "ENTER CODE";
             newState.timeRemaining = state.timeAllowedPerSequence; // Reset timer for retry!
             newState.userInput = []; // Clear user input on retry
        }
      }
      break;

    case KeyCrackerGamePhase.GameOver:
      break;
  }

  return newState;
}

/**
 * Handles the timer ticking down.
 * @param state The current KeyCrackerGameState.
 * @returns The updated KeyCrackerGameState.
 */
export function handleTick(state: KeyCrackerGameState): KeyCrackerGameState {
  if (state.isComplete || state.isFailed) return state; // Stop ticking if game over

  // Only tick down if in Memorise or Input phases
  if (state.currentPhase !== KeyCrackerGamePhase.Memorise && state.currentPhase !== KeyCrackerGamePhase.Input) {
    return state;
  }

  let newTimeRemaining = state.timeRemaining - 1;

  if (newTimeRemaining <= 0) {
    let newState = { ...state, timeRemaining: 0 };
    
    if (state.currentPhase === KeyCrackerGamePhase.Memorise) {
        // If memorise timer runs out, transition to input phase
        newState.currentPhase = KeyCrackerGamePhase.Input;
        newState.message = "TIME OUT! ENTER CODE.";
        newState.timeRemaining = state.timeAllowedPerSequence; // Reset timer for input phase
        return newState;
    } else if (state.currentPhase === KeyCrackerGamePhase.Input) {
        // If input timer runs out, it's a failed attempt
        newState.attemptsRemaining -= 1;
        newState.message = "TIME OUT! INVALID CODE."; // Indicate failure due to timeout
        newState.currentPhase = KeyCrackerGamePhase.Feedback; // Move to feedback phase. Do not go to GameOver yet.

        // Entanglement Field Inhibitor: resets game on incorrect sequence (including timeout)
        const entanglementInhibitor = state.fortifiers.find(f => f.name === 'Entanglement Field Inhibitor');
        if (entanglementInhibitor) {
          newState.attemptsRemaining = Math.max(0, newState.attemptsRemaining - entanglementInhibitor.level);
        }

        // If attempts run out, game is over (failure)
        if (newState.attemptsRemaining <= 0) {
          newState.isFailed = true;
          newState.message = "INFILTRATION FAILED: ATTEMPTS EXHAUSTED";
          newState.currentPhase = KeyCrackerGamePhase.GameOver;
        }
        return newState;
    }
  }

  return {
    ...state,
    timeRemaining: newTimeRemaining,
  };
}

/**
 * Applies passive lock effects that might change over time (e.g., Temporal Flux Lock).
 * This should be called periodically by the game loop.
 * @param state The current KeyCrackerGameState.
 * @returns The updated KeyCrackerGameState.
 */
export function applyPassiveLockEffects(state: KeyCrackerGameState): KeyCrackerGameState {
  if (state.isComplete || state.isFailed) return state;

  let newState = { ...state };

  // Temporal Flux Lock: strength increases over time
  if (state.lock.name === 'Temporal Flux Lock') {
    const strengthIncreasePerSecond = state.lock.level * 5;
    newState.totalRequiredEntries += strengthIncreasePerSecond; // Increase required entries
    // Update message only if it's not currently displaying something critical like "INVALID CODE" or "TIME OUT!"
    if (!newState.message.includes("INVALID") && !newState.message.includes("TIME OUT") && !newState.message.includes("ACCEPTED") && newState.currentPhase === KeyCrackerGamePhase.Input) {
        newState.message = `LOCK STRENGTH INCREASING: ${strengthIncreasePerSecond}/s!`;
    }
  }
  // Neural Network Lock: "For every two successful entries, the number of displayed symbols increases by one."
  // This logic is tricky to do 'passively' and is probably better handled when generating a new sequence or recalculating symbols for the *next* sequence.
  // For simplicity now, we'll keep `symbolsToDisplayCount` static per game instance based on initial mechanics.
  // If the requirement is strict, `symbolsToDisplayCount` would need to be mutable and updated here or in `generateNewSequence` based on `successfulEntries`.

  return newState;
}
