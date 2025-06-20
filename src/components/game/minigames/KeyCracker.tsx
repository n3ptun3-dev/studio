// src/components/game/minigames/KeyCracker.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HolographicPanel, HolographicButton } from '@/components/game/shared/HolographicPanel';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import type { HardwareItem, InfiltrationGearItem, LockFortifierItem, ItemLevel, GameItemBase } from '@/lib/game-items';
import {
  initializeKeyCrackerGame,
  handleSymbolInput,
  handleBackspace,
  handleEnter,
  handleTick,
  generateNewSequence,
  applyPassiveLockEffects,
  KeyCrackerGamePhase,
  KEYPAD_VALUES, // Import internal values
  SYMBOL_MAP,    // Import symbol map
} from '@/lib/minigames/key-cracker/logic'; // Import logic functions

interface KeyCrackerProps {
  lockData: HardwareItem;
  attackingTool: InfiltrationGearItem; // The actual tool being used
  fortifiers: LockFortifierItem[]; // Fortifiers currently on the lock
  attackerLevel: ItemLevel; // Player's level
  defenderLevel?: ItemLevel; // Defender's level (if applicable)
  onGameComplete: (success: boolean, strengthReduced: number, toolDamageAmount?: number) => void; // Callback to AppContext
}

const MAX_ATTEMPTS_PER_SEQUENCE = 3; // Max attempts per sequence, passed to logic init

const KeyCracker: React.FC<KeyCrackerProps> = ({ lockData, attackingTool, fortifiers, attackerLevel, defenderLevel, onGameComplete }) => {
  const { theme: currentGlobalTheme } = useTheme();

  const [gameState, setGameState] = useState(() =>
    initializeKeyCrackerGame(lockData, fortifiers, attackingTool, [], attackerLevel, defenderLevel, MAX_ATTEMPTS_PER_SEQUENCE)
  );
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [showAbortConfirmation, setShowAbortConfirmation] = useState(false);
  const [previousPhase, setPreviousPhase] = useState<KeyCrackerGamePhase | null>(null);
  const [previousTimeRemaining, setPreviousTimeRemaining] = useState<number | null>(null);

  // Timer effect
  useEffect(() => {
    // Only tick down if not paused, and in Memorise or Input phase, and game is not complete/failed
    if (
      isTimerPaused ||
      (gameState.currentPhase !== KeyCrackerGamePhase.Memorise && gameState.currentPhase !== KeyCrackerGamePhase.Input) ||
      gameState.isComplete ||
      gameState.isFailed
    ) {
      return; // Stop timer
    }

    const timer = setInterval(() => {
      setGameState(prev => {
        let newState = handleTick(prev);
        // Only apply passive lock effects if in an active input phase (to avoid increasing difficulty while just memorising)
        if (newState.currentPhase === KeyCrackerGamePhase.Input) {
            newState = applyPassiveLockEffects(newState);
        }
        return newState;
      });
    }, 1000); // Tick every second

    return () => clearInterval(timer); // Cleanup on unmount or phase change
  }, [gameState.currentPhase, gameState.isComplete, gameState.isFailed, isTimerPaused]);

  // Handle game completion via onGameComplete callback
  useEffect(() => {
    if (gameState.isComplete) {
      const totalStrengthReduced = lockData.strength.max; // Assuming full bypass if game is complete
      onGameComplete(true, totalStrengthReduced);
    } else if (gameState.isFailed) {
      // If the game failed, pass the pre-calculated tool damage
      // Do NOT auto-close. Allow user to click ABORT.
      // The `onGameComplete` will be called explicitly when the user clicks the final ABORT.
    }
  }, [gameState.isComplete, gameState.isFailed, onGameComplete, lockData.strength.max, gameState.toolDamageOnFail]);


  const handleKeypadClick = useCallback((symbol: string) => {
    if (showAbortConfirmation) return; // Prevent input if confirmation is open
    setGameState(prev => handleSymbolInput(prev, symbol));
  }, [showAbortConfirmation]);

  const handleAbortOrBackspaceClick = useCallback(() => {
    if (showAbortConfirmation) {
      // If confirmation is active, this is the "CANCEL" button
      setShowAbortConfirmation(false);
      setIsTimerPaused(false); // Resume timer
      // Restore previous game state if necessary
      if (previousPhase !== null && previousTimeRemaining !== null) {
          setGameState(prev => ({
              ...prev,
              currentPhase: previousPhase,
              timeRemaining: previousTimeRemaining,
              message: previousPhase === KeyCrackerGamePhase.Memorise ? "Code shown only once.\nPress CONTINUE to proceed." : "ENTER CODE"
          }));
      }
      setPreviousPhase(null);
      setPreviousTimeRemaining(null);
    } else {
      // If not in confirmation, determine if it's Backspace or initial Abort
      if (gameState.currentPhase === KeyCrackerGamePhase.Input && !gameState.isFailed) { // Only Backspace if NOT failed
        // If in input phase, it's Backspace
        setGameState(prev => handleBackspace(prev));
      } else if (gameState.isFailed) {
          // If game is failed, and user clicks ABORT, close directly without confirmation
          onGameComplete(false, 0, gameState.toolDamageOnFail);
      } else {
        // Otherwise, it's Abort: show confirmation
        setPreviousPhase(gameState.currentPhase); // Store current phase
        setPreviousTimeRemaining(gameState.timeRemaining); // Store current timer
        setIsTimerPaused(true); // Pause timer
        setShowAbortConfirmation(true);
      }
    }
  }, [gameState.currentPhase, gameState.timeRemaining, showAbortConfirmation, onGameComplete, previousPhase, previousTimeRemaining, gameState.isFailed, gameState.toolDamageOnFail]);


  const handleMainButtonClick = useCallback(() => {
    if (showAbortConfirmation) {
        // If confirmation is active, this is the "CONFIRM ABORT" button
        onGameComplete(false, 0, 0); // Close the minigame
    } else {
        setGameState(prev => {
            let newState = handleEnter(prev);
            return newState;
        });
    }
  }, [showAbortConfirmation, onGameComplete]);

  const progressPercentage = (gameState.successfulEntries / gameState.totalRequiredEntries) * 100;

  // Variants for symbol animation
  const symbolVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  };

  // Filter symbols based on KeyCrackerGamePhase.Input and special effects for 'randomizeKeypad'
  const displayedKeypadSymbols = useMemo(() => {
    // Only randomize if special effect is active and not disabled by Quantum Dephaser
    const randomizeActive = gameState.specialEffects.randomizeKeypad.active;
    
    if (randomizeActive && gameState.currentPhase === KeyCrackerGamePhase.Input) {
      const shuffledValues = [...KEYPAD_VALUES]; // Use internal values for shuffle
      for (let i = shuffledValues.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledValues[i], shuffledValues[j]] = [shuffledValues[j], shuffledValues[i]]; // Fixed typo here, was 'shuffledSymbols'
      }
      return shuffledValues.map(val => SYMBOL_MAP[val]); // Convert to display symbols
    }
    return KEYPAD_VALUES.map(val => SYMBOL_MAP[val]); // Convert all to display symbols
  }, [gameState.specialEffects.randomizeKeypad.active, gameState.currentPhase, gameState.sequenceId]);

  // Determine if symbols should flash
  const shouldFlashSymbols = gameState.specialEffects.flashSymbols.active && gameState.currentPhase === KeyCrackerGamePhase.Memorise;
  const flashInterval = gameState.specialEffects.flashSymbols.frequency * 1000;
  // flashDuration is currently not used, but kept for future reference
  // const flashDuration = gameState.specialEffects.flashSymbols.duration * 1000;

  const [symbolsVisible, setSymbolsVisible] = useState(true);
  useEffect(() => {
      if (shouldFlashSymbols) {
          const toggle = setInterval(() => {
              setSymbolsVisible(prev => !prev);
          }, flashInterval);
          return () => clearInterval(toggle);
      } else {
          setSymbolsVisible(true);
      }
  }, [shouldFlashSymbols, flashInterval]);

  // --- Button Logic ---
  let abortButtonText: string;
  let abortButtonColor: string;
  let abortButtonDisabled: boolean;
  
  let mainButtonText: string;
  let mainButtonColor: string;
  let mainButtonDisabled: boolean;

  if (showAbortConfirmation) {
      abortButtonText = "CANCEL";
      abortButtonColor = "!bg-gray-700/50 hover:!bg-gray-600/70 !border-gray-500/60";
      abortButtonDisabled = false; // Always allow cancel

      mainButtonText = "ABORT"; // Confirmation abort
      mainButtonColor = "!bg-destructive/70 hover:!bg-destructive !border-destructive";
      mainButtonDisabled = false; // Always allow confirm abort
  } else {
      // Regular game state button logic
      abortButtonText = (gameState.currentPhase === KeyCrackerGamePhase.Input && !gameState.isFailed) ? "BACKSPACE" : "ABORT"; // If failed, it's always ABORT
      abortButtonColor = abortButtonText === "ABORT" ? 
        "!bg-destructive/70 hover:!bg-destructive !border-destructive" : 
        "!bg-gray-700/50 hover:!bg-gray-600/70 !border-gray-500/60";
      
      // The backspace button is disabled if there's no input to delete AND it's in backspace mode
      const isBackspaceDisabledLogic = gameState.currentPhase === KeyCrackerGamePhase.Input && gameState.userInput.length === 0;
      abortButtonDisabled = (abortButtonText === "BACKSPACE" && isBackspaceDisabledLogic) || (gameState.isComplete); // Disable if backspace & no input, or if game is complete

      switch (gameState.currentPhase) {
        case KeyCrackerGamePhase.Instruction:
          mainButtonText = "START";
          mainButtonColor = "!bg-lime-700/50 hover:!bg-lime-600/70 !border-lime-500/60";
          mainButtonDisabled = false;
          break;
        case KeyCrackerGamePhase.Memorise:
          mainButtonText = "CONTINUE";
          mainButtonColor = "!bg-lime-700/50 hover:!bg-lime-600/70 !border-lime-500/60";
          mainButtonDisabled = false;
          break;
        case KeyCrackerGamePhase.Input:
          mainButtonText = "SUBMIT";
          mainButtonColor = "!bg-lime-700/50 hover:!bg-lime-600/70 !border-lime-500/60";
          mainButtonDisabled = gameState.userInput.length !== gameState.currentSequence.length;
          break;
        case KeyCrackerGamePhase.Feedback:
          mainButtonText = gameState.message.includes("ACCEPTED") ? "NEXT" : "RETRY";
          mainButtonColor = "!bg-lime-700/50 hover:!bg-lime-600/70 !border-lime-500/60";
          mainButtonDisabled = false;
          break;
        case KeyCrackerGamePhase.GameOver:
          mainButtonText = gameState.isComplete ? "ACCESS GRANTED" : "FAILED"; // Changed from "INFILTRATION FAILED" to "FAILED"
          mainButtonColor = gameState.isComplete ? "!bg-lime-700/50 !border-lime-500/60" : "!bg-gray-700/50 !border-gray-500/60";
          mainButtonDisabled = true;
          break;
        default:
          mainButtonText = "ACTION";
          mainButtonColor = "!bg-gray-700/50 !border-gray-500/60";
          mainButtonDisabled = true;
          break;
      }
      // If the game is in GameOver phase, main button is non-functional, abort button is always 'ABORT' and enabled
      if (gameState.currentPhase === KeyCrackerGamePhase.GameOver) {
          abortButtonText = "ABORT";
          abortButtonColor = "!bg-destructive/70 hover:!bg-destructive !border-destructive";
          abortButtonDisabled = false; // Always enabled to close the game
      }
  }


  return (
    <HolographicPanel
      title={`KEY CRACKER - ${lockData.name.toUpperCase()} (L${lockData.level})`}
      explicitTheme={currentGlobalTheme}
      className="flex flex-col p-4 w-full h-full max-w-4xl mx-auto items-center justify-between bg-gray-950"
    >
      {/* Digital Display */}
      <div
        className={cn(
          "relative w-full flex-grow bg-gradient-to-br from-gray-900/70 to-gray-800/70 border-2 rounded-lg flex items-center justify-center overflow-hidden font-mono select-none shadow-inner-glow",
          currentGlobalTheme === 'cyphers' && "border-blue-700/80 text-blue-400",
          currentGlobalTheme === 'shadows' && "border-red-700/80 text-red-400",
          currentGlobalTheme === 'terminal-green' && "border-green-700/80 text-green-400",
          "overflow-y-auto" // Added for vertical scrolling
        )}
      >
        <AnimatePresence mode="wait">
          {showAbortConfirmation ? (
              <motion.div
                key="confirmation"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                className="absolute text-center flex flex-col justify-center items-center h-full w-full p-4"
              >
                  <p className="text-xl md:text-2xl lg:text-3xl font-bold text-yellow-400 mb-2">ABORT INFILTRATION</p>
                  <p className="text-lg md:text-xl lg:text-2xl text-white">Are you sure?</p>
              </motion.div>
          ) : (
            <>
              {/* Main Message Display */}
              {(gameState.currentPhase === KeyCrackerGamePhase.Instruction || gameState.currentPhase === KeyCrackerGamePhase.Feedback || gameState.currentPhase === KeyCrackerGamePhase.GameOver) && (
                <motion.p
                  key="message"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    "absolute text-center px-2",
                    // Adjusted font size for "Code Accepted" etc. to match buttons
                    (gameState.message.includes("ACCEPTED") || gameState.message.includes("INVALID") || gameState.message.includes("TIME OUT") || gameState.message.includes("GRANTED") || gameState.message.includes("FAILED"))
                    ? "text-xl md:text-2xl" // Matching button font size
                    : "text-lg md:text-xl lg:text-2xl", // Smaller for instructions
                    gameState.message.includes("ACCEPTED") && "text-green-400 drop-shadow-green-glow",
                    (gameState.message.includes("INVALID") || gameState.message.includes("TIME OUT")) && "text-red-400 drop-shadow-red-glow",
                    gameState.message.includes("FAILED") && "text-red-500 drop-shadow-red-glow animate-pulse-slow",
                    gameState.message.includes("GRANTED") && "text-lime-400 drop-shadow-lime-glow animate-pulse-slow",
                    gameState.currentPhase === KeyCrackerGamePhase.Instruction && "whitespace-pre-line", // For new line in instructions
                    "flex items-start justify-center h-full w-full overflow-y-auto" // Added for scrolling and top alignment
                  )}
                >
                  {gameState.message}
                </motion.p>
              )}

              {/* Code Sequence Display (Memorise Phase) */}
              {(gameState.currentPhase === KeyCrackerGamePhase.Memorise && symbolsVisible) && (
                <motion.div
                  key={gameState.sequenceId}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.5 }}
                  className="absolute flex flex-wrap justify-center space-x-2 md:space-x-4 text-4xl md:text-5xl lg:text-6xl max-w-full overflow-hidden"
                >
                  <AnimatePresence>
                    {gameState.currentSequence.map((internalValue, index) => (
                      <motion.span
                        key={`${gameState.sequenceId}-${index}`}
                        variants={symbolVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={{ delay: index * 0.05, duration: 0.2 }}
                        className={cn(
                          "inline-block holographic-text-glow",
                          currentGlobalTheme === 'cyphers' && "text-blue-300",
                          currentGlobalTheme === 'shadows' && "text-red-300",
                          currentGlobalTheme === 'terminal-green' && "text-green-300",
                          gameState.specialEffects.reverseSequence.active && "transform rotate-180"
                        )}
                      >
                        {SYMBOL_MAP[internalValue] || internalValue}
                      </motion.span>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* User Input Display (Input Phase) */}
              {gameState.currentPhase === KeyCrackerGamePhase.Input && (
                <motion.div
                  key="userInput"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="absolute flex flex-wrap justify-center space-x-2 md:space-x-4 text-4xl md:text-5xl lg:text-6xl max-w-full overflow-hidden"
                >
                  {gameState.userInput.map((internalValue, index) => (
                    <motion.span
                      key={`input-${index}`}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={cn(
                        "inline-block holographic-text-secondary",
                        currentGlobalTheme === 'cyphers' && "text-blue-200",
                        currentGlobalTheme === 'shadows' && "text-red-200",
                        currentGlobalTheme === 'terminal-green' && "text-green-200"
                      )}
                    >
                      {SYMBOL_MAP[internalValue] || internalValue}
                    </motion.span>
                  ))}
                  {/* Cursor for input */}
                  {gameState.userInput.length < gameState.currentSequence.length && (
                    <motion.span
                      className={cn(
                        "inline-block w-4 h-8 bg-blue-400 animate-pulse",
                        currentGlobalTheme === 'cyphers' && "bg-blue-400",
                        currentGlobalTheme === 'shadows' && "bg-red-400",
                        currentGlobalTheme === 'terminal-green' && "bg-green-400"
                      )}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ repeat: Infinity, duration: 0.8 }}
                    />
                  )}
                </motion.div>
              )}
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Progress Bars & Info */}
      <div className="w-full flex flex-col md:flex-row justify-between items-center mt-2 mb-2 gap-1 text-xs text-gray-400">
        <div className="flex-1 w-full md:w-auto">
          <p className="text-center md:text-left mb-0.5">Required Entries: {gameState.successfulEntries} / {gameState.totalRequiredEntries}</p>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <motion.div
              className="bg-lime-500 h-2 rounded-full shadow-lime-glow"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5 }}
            ></motion.div>
          </div>
        </div>

        <div className="flex-1 w-full md:w-auto mt-1 md:mt-0">
          <p className="text-center md:text-right mb-0.5">Time Remaining: {gameState.timeRemaining}s</p>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <motion.div
              className={cn("h-2 rounded-full",
                gameState.timeRemaining <= 5 ? "bg-red-500 shadow-red-glow animate-pulse" : "bg-cyan-500 shadow-cyan-glow"
              )}
              initial={{ width: '100%' }}
              animate={{ width: `${(gameState.timeRemaining / gameState.timeAllowedPerSequence) * 100}%` }}
              transition={{ duration: 1, ease: "linear" }}
            ></motion.div>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-400 mb-2">Attempts Remaining: {gameState.attemptsRemaining} / {gameState.maxAttemptsPerSequence}</p>

      {/* Keypad */}
      <div className="grid grid-cols-4 gap-2 md:gap-4 w-full max-w-md mx-auto flex-grow-0 pb-4 max-w-[50vh] mt-6"> {/* Added mt-6 for more padding */}
        {KEYPAD_VALUES.map((internalValue, index) => ( // Iterate over internal values
          <HolographicButton
            key={internalValue} // Use internal value as key
            onClick={() => handleKeypadClick(SYMBOL_MAP[internalValue])} // Pass display symbol
            className={cn(
              "p-4 md:p-6 text-xl md:text-2xl font-bold flex items-center justify-center aspect-square",
              "transition-transform duration-100 active:scale-95",
              currentGlobalTheme === 'cyphers' && "!bg-blue-900/50 hover:!bg-blue-800/70 !border-blue-700/60",
              currentGlobalTheme === 'shadows' && "!bg-red-900/50 hover:!bg-red-800/70 !border-red-700/60",
              currentGlobalTheme === 'terminal-green' && "!bg-green-900/50 hover:!bg-green-800/70 !border-green-700/60",
              (gameState.currentPhase !== KeyCrackerGamePhase.Input || gameState.isComplete || gameState.isFailed || showAbortConfirmation) && "opacity-50 cursor-not-allowed" // Disable if confirmation is open
            )}
            explicitTheme={currentGlobalTheme}
            disabled={gameState.currentPhase !== KeyCrackerGamePhase.Input || gameState.isComplete || gameState.isFailed || showAbortConfirmation} // Disable if confirmation is open
          >
            {SYMBOL_MAP[internalValue]}
          </HolographicButton>
        ))}
        
        {/* Control Buttons */}
        <HolographicButton
          onClick={handleAbortOrBackspaceClick}
          className={cn(
            "col-span-2 p-4 md:p-6 text-xl md:text-2xl font-bold",
            abortButtonColor,
            abortButtonDisabled && "opacity-50 cursor-not-allowed" // Use the local disabled check
          )}
          explicitTheme={currentGlobalTheme}
          disabled={abortButtonDisabled}
        >
          {abortButtonText}
        </HolographicButton>
        <HolographicButton
          onClick={handleMainButtonClick}
          className={cn(
            "col-span-2 p-4 md:p-6 text-xl md:text-2xl font-bold",
            mainButtonColor,
            mainButtonDisabled && "opacity-50 cursor-not-allowed"
          )}
          explicitTheme={currentGlobalTheme}
          disabled={mainButtonDisabled}
        >
          {mainButtonText}
        </HolographicButton>
      </div>
      
      {/* Universal Key Active Indicator */}
      {fortifiers.some(f => f.id.startsWith('universal_key')) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="absolute bottom-4 left-4 text-xs text-amber-300 flex items-center bg-gray-900/70 p-2 rounded-lg shadow-amber-glow"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-key-round mr-1"><path d="M2 18v3c0 .6.4 1 1 1h4v-3h3v-3.88L18.12 3.88a2.92 2.92 0 1 1 3.88 3.88L12.88 18H9v-3H6v-3H2Z"/><circle cx="17.5" cy="6.5" r=".5" fill="currentColor"/></svg>
          Universal Key Active!
        </motion.div>
      )}

      {/* Lock Protection Gadget Status (Example, needs actual data) */}
      {fortifiers.length > 0 && (
        <div className="absolute top-4 right-4 flex items-center space-x-2 text-sm text-blue-300 bg-gray-900/70 p-2 rounded-lg shadow-blue-glow">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield-half"><path d="M12 21a8 8 0 0 0 8-8V5l-8-3-8 3v8a8 8 0 0 0 8 8Z"/><path d="M12 21V3"/></svg>
          <span className="font-semibold">{fortifiers[0].name} Active (L{fortifiers[0].level})</span>
        </div>
      )}

    </HolographicPanel>
  );
};

export default KeyCracker;
