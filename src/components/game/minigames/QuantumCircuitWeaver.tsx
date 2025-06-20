// src/components/game/minigames/QuantumCircuitWeaver.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion'; // For smooth animations
import { HolographicPanel, HolographicButton } from '@/components/game/shared/HolographicPanel';
import { cn } from '@/lib/utils'; // Assuming you have a utility for class names
import { useTheme } from '@/contexts/ThemeContext'; // For consistent theming
import type { ItemLevel } from '@/lib/game-items'; // Assuming ItemLevel is exported
import {
  initializeCircuitBoard,
  checkCircuitCompletion,
  generateCircuitFragments,
  type CircuitBoard,
  type CircuitFragment,
  type BoardCell,
  BoardCellType,
} from '@/lib/minigames/quantum-circuit-weaver/logic';
import { Lock } from 'lucide-react'; // Example icon for the lock

interface QuantumCircuitWeaverProps {
  lockLevel: ItemLevel; // Level of the Quantum Entanglement Lock
  onGameComplete: (success: boolean, strengthReduced: number) => void; // Callback to AppContext
  initialBoard?: CircuitBoard; // Optional: for resuming or specific setups
  initialFragments?: CircuitFragment[]; // Optional: for resuming
}

// Visual constants for the grid and pieces
const GRID_SIZE = { rows: 8, cols: 8 }; // Example grid size
const CELL_SIZE = 'min(10vw, 50px)'; // Responsive cell size
const FRAGMENT_BANK_SIZE = 5; // How many fragments are available at once

const QuantumCircuitWeaver: React.FC<QuantumCircuitWeaverProps> = ({ lockLevel, onGameComplete, initialBoard, initialFragments }) => {
  const { theme: currentGlobalTheme } = useTheme();

  // State for the game board and available fragments
  const [board, setBoard] = useState<CircuitBoard>(initialBoard || []);
  const [availableFragments, setAvailableFragments] = useState<CircuitFragment[]>(initialFragments || []);
  const [selectedFragment, setSelectedFragment] = useState<CircuitFragment | null>(null);
  const [strengthProgress, setStrengthProgress] = useState(0); // Current progress towards solving
  const [message, setMessage] = useState(''); // Game messages
  const [isGameSolved, setIsGameSolved] = useState(false); // Game completion state

  // Initialize board and fragments on component mount or lockLevel change
  useEffect(() => {
    const newBoard = initializeCircuitBoard(lockLevel, GRID_SIZE.rows, GRID_SIZE.cols);
    setBoard(newBoard);
    setAvailableFragments(generateCircuitFragments(lockLevel, FRAGMENT_BANK_SIZE));
    setStrengthProgress(0); // Reset progress
    setMessage('Connect the Quantum Emitter to the Receiver!');
    setIsGameSolved(false);
  }, [lockLevel]);

  // Function to handle dropping a fragment onto a cell
  const handleDrop = useCallback((rowIndex: number, colIndex: number) => {
    if (!selectedFragment || isGameSolved) return;

    const newBoard = board.map(row => [...row]); // Deep copy of the board
    const targetCell = newBoard[rowIndex][colIndex];

    // Basic validation: Can only place on empty cells or cells that are part of the path (for rotations)
    if (targetCell.type === BoardCellType.Empty || targetCell.type === BoardCellType.Fragment) {
      newBoard[rowIndex][colIndex] = {
        ...targetCell,
        type: BoardCellType.Fragment,
        fragment: selectedFragment, // Assign the fragment to the cell
      };

      setBoard(newBoard);
      setSelectedFragment(null); // Clear selected fragment

      // Remove the used fragment and generate a new one
      setAvailableFragments(prev => {
        const newFragments = prev.filter(f => f.id !== selectedFragment.id);
        const nextFragment = generateCircuitFragments(lockLevel, 1)[0]; // Generate one new fragment
        return [...newFragments, nextFragment];
      });

      // Check for completion
      const completionResult = checkCircuitCompletion(newBoard);
      if (completionResult.isComplete) {
        setMessage('Quantum Circuit Complete! Lock Bypassed!');
        setIsGameSolved(true);
        // Calculate strength reduction based on complexity or fixed amount
        const strengthReduced = lockLevel * 100; // Example: scale with lock level
        onGameComplete(true, strengthReduced);
      } else if (completionResult.progress > strengthProgress) {
        setStrengthProgress(completionResult.progress);
        setMessage(`Coherence increasing: ${Math.round(completionResult.progress * 100)}%`);
      }
    } else {
      setMessage('Cannot place fragment here!');
    }
  }, [board, selectedFragment, isGameSolved, lockLevel, strengthProgress, onGameComplete]);

  // Function to handle rotating a fragment already on the board
  const handleRotate = useCallback((rowIndex: number, colIndex: number) => {
    if (isGameSolved) return;
    const newBoard = board.map(row => [...row]);
    const cell = newBoard[rowIndex][colIndex];

    if (cell.type === BoardCellType.Fragment && cell.fragment) {
      // Rotate the fragment (logic for rotation is in the logic.ts file's fragment definition)
      const newOrientation = (cell.fragment.orientation + 90) % 360;
      newBoard[rowIndex][colIndex] = {
        ...cell,
        fragment: { ...cell.fragment, orientation: newOrientation },
      };
      setBoard(newBoard);

      // Re-check completion and update progress after rotation
      const completionResult = checkCircuitCompletion(newBoard);
      if (completionResult.isComplete) {
        setMessage('Quantum Circuit Complete! Lock Bypassed!');
        setIsGameSolved(true);
        const strengthReduced = lockLevel * 100;
        onGameComplete(true, strengthReduced);
      } else if (completionResult.progress > strengthProgress) {
        setStrengthProgress(completionResult.progress);
        setMessage(`Coherence increasing: ${Math.round(completionResult.progress * 100)}%`);
      }
    }
  }, [board, isGameSolved, lockLevel, strengthProgress, onGameComplete]);

  // Visual representation of a circuit fragment in the bank
  const FragmentDisplay: React.FC<{ fragment: CircuitFragment; isSelected: boolean }> = ({ fragment, isSelected }) => (
    <motion.div
      className={cn(
        "flex items-center justify-center border-2 rounded-lg cursor-pointer transition-all duration-200",
        isSelected ? "border-amber-400 scale-105 shadow-amber-glow" : "border-gray-600 hover:border-gray-400",
        "p-1 m-1 aspect-square w-[60px] md:w-[80px] lg:w-[100px]", // Responsive sizing
        currentGlobalTheme === 'cyphers' ? 'bg-blue-950/50' : currentGlobalTheme === 'shadows' ? 'bg-red-950/50' : 'bg-green-950/50'
      )}
      onClick={() => setSelectedFragment(fragment)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      layoutId={`fragment-${fragment.id}`}
      whileTap={{ scale: 0.95 }}
      style={{
        transform: `rotate(${fragment.orientation || 0}deg)`, // Apply rotation visually
        backgroundImage: `url(${fragment.imagePath})`, // Assuming fragments have images
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
      }}
    >
      {/* Fallback for fragments without images, or for simple representation */}
      {!fragment.imagePath && <span className="text-xs text-white opacity-70">{fragment.type.substring(0, 3)}</span>}
    </motion.div>
  );

  return (
    <HolographicPanel
      title={`Quantum Circuit Weaver (L${lockLevel})`}
      explicitTheme={currentGlobalTheme}
      className="flex flex-col p-4 w-full h-full max-w-4xl mx-auto items-center justify-between bg-gray-950" // <-- Added bg-gray-950 here
    >
      <div className="flex-shrink-0 text-center mb-4">
        <p className="text-xl holographic-text-secondary animate-pulse">{message}</p>
        <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2">
          <motion.div
            className="bg-purple-500 h-2.5 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${strengthProgress * 100}%` }}
            transition={{ duration: 0.5 }}
          ></motion.div>
        </div>
      </div>

      {/* Game Grid */}
      <div
        className="grid gap-0.5 border-2 border-gray-700 rounded-lg p-1 bg-gray-900/50 flex-grow"
        style={{
          gridTemplateColumns: `repeat(${GRID_SIZE.cols}, ${CELL_SIZE})`,
          gridTemplateRows: `repeat(${GRID_SIZE.rows}, ${CELL_SIZE})`,
          maxWidth: `calc(${CELL_SIZE} * ${GRID_SIZE.cols} + 8px)`, // Account for padding/borders
          maxHeight: `calc(${CELL_SIZE} * ${GRID_SIZE.rows} + 8px)`,
          width: '90%', // Ensure responsiveness
          height: 'auto',
          aspectRatio: `${GRID_SIZE.cols} / ${GRID_SIZE.rows}` // Maintain aspect ratio
        }}
      >
        {board.map((row, rIdx) => (
          row.map((cell, cIdx) => (
            <motion.div
              key={`${rIdx}-${cIdx}`}
              className={cn(
                "w-full h-full border border-gray-800 flex items-center justify-center relative overflow-hidden",
                cell.type === BoardCellType.Emitter && "bg-lime-600/70 pulse-glow",
                cell.type === BoardCellType.Receiver && "bg-red-600/70 pulse-glow",
                cell.type === BoardCellType.Obstacle && "bg-gray-800/80 cursor-not-allowed",
                cell.type === BoardCellType.Fragment && "bg-gradient-to-br from-indigo-900/50 to-blue-900/50",
                cell.type === BoardCellType.Empty && selectedFragment && "hover:bg-blue-700/30 cursor-pointer",
                "rounded-sm" // Slightly rounded cells
              )}
              onDoubleClick={() => handleRotate(rIdx, cIdx)} // Double click to rotate placed fragments
              onClick={() => handleDrop(rIdx, cIdx)} // Click to drop fragment
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: (rIdx + cIdx) * 0.02 }} // Staggered entry animation
              style={{
                backgroundImage: cell.fragment?.imagePath ? `url(${cell.fragment.imagePath})` : 'none',
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                transform: cell.fragment ? `rotate(${cell.fragment.orientation}deg)` : 'none',
              }}
            >
              {cell.type === BoardCellType.Obstacle && (
                <Lock className="w-1/2 h-1/2 text-gray-500 opacity-50" /> // Simple obstacle icon
              )}
              {/* Optional: Visual for fragment type if no image */}
              {cell.type === BoardCellType.Fragment && !cell.fragment?.imagePath && (
                 <span className="text-xs text-white opacity-80">{cell.fragment?.type.substring(0,3)}</span>
              )}
            </motion.div>
          ))
        ))}
      </div>

      {/* Fragment Bank */}
      <div className="flex flex-wrap justify-center items-center mt-4 p-2 border-2 border-dashed border-gray-700 rounded-lg w-full max-w-lg mx-auto bg-gray-800/30 flex-shrink-0">
        <p className="w-full text-center text-sm text-gray-400 mb-2">Available Circuit Fragments:</p>
        {availableFragments.map(fragment => (
          <FragmentDisplay
            key={fragment.id}
            fragment={fragment}
            isSelected={selectedFragment?.id === fragment.id}
          />
        ))}
      </div>

      {/* Action Buttons (e.g., for giving up or for hints) */}
      <div className="flex justify-center mt-4 w-full">
        <HolographicButton
          onClick={() => onGameComplete(false, 0)} // Fail the game
          className="!bg-destructive/70 hover:!bg-destructive !border-destructive mr-4"
          explicitTheme={currentGlobalTheme}
          disabled={isGameSolved}
        >
          Abandon Infiltration
        </HolographicButton>
        <HolographicButton
          onClick={() => {
            // Implement hint logic here (e.g., reveal a piece, highlight correct placement)
            setMessage("Hint: Look for the flow!");
          }}
          className="!bg-accent/70 hover:!bg-accent !border-accent"
          explicitTheme={currentGlobalTheme}
          disabled={isGameSolved}
        >
          Request Hint
        </HolographicButton>
      </div>
    </HolographicPanel>
  );
};

export default QuantumCircuitWeaver;
