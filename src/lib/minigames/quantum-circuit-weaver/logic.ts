// src/lib/minigames/quantum-circuit-weaver/logic.ts
// This file contains the core logic for the Quantum Circuit Weaver minigame.

import { type ItemLevel } from '@/lib/game-items';

// --- Data Structures ---

export enum BoardCellType {
  Empty = 'empty',
  Emitter = 'emitter', // Start point
  Receiver = 'receiver', // End point
  Obstacle = 'obstacle', // Impassable
  Fragment = 'fragment', // Placed circuit piece
}

export interface CircuitFragment {
  id: string;
  type: 'straight' | 'corner' | 't_junction' | 'cross' | 'amplifier'; // Types of circuit pieces
  orientation: 0 | 90 | 180 | 270; // Rotation in degrees
  connections: { // Defines which sides of the fragment have connections (relative to 0 deg)
    north: boolean;
    east: boolean;
    south: boolean;
    west: boolean;
  };
  imagePath?: string; // Optional: path to an SVG or PNG asset for the fragment
}

export interface BoardCell {
  type: BoardCellType;
  fragment?: CircuitFragment; // If type is Fragment
  isPath?: boolean; // For visualization of the correct path
}

export type CircuitBoard = BoardCell[][]; // 2D array representing the game board

// --- Game Logic Functions ---

/**
 * Initializes the circuit board with an emitter, receiver, and obstacles based on lock level.
 * @param lockLevel The level of the Quantum Entanglement Lock, influences difficulty.
 * @param rows Number of rows in the grid.
 * @param cols Number of columns in the grid.
 * @returns An initialized CircuitBoard.
 */
export function initializeCircuitBoard(lockLevel: ItemLevel, rows: number, cols: number): CircuitBoard {
  const board: CircuitBoard = Array(rows).fill(null).map(() =>
    Array(cols).fill(null).map(() => ({ type: BoardCellType.Empty }))
  );

  // Place Emitter (start) and Receiver (end) strategically
  // Example: Emitter top-left, Receiver bottom-right
  board[0][0] = { type: BoardCellType.Emitter };
  board[rows - 1][cols - 1] = { type: BoardCellType.Receiver };

  // Add obstacles based on lock level (difficulty)
  let numObstacles = Math.floor(lockLevel * 0.5); // More obstacles for higher levels
  for (let i = 0; i < numObstacles; i++) {
    let r, c;
    do {
      r = Math.floor(Math.random() * rows);
      c = Math.floor(Math.random() * cols);
    } while (board[r][c].type !== BoardCellType.Empty); // Ensure we don't place on Emitter/Receiver or existing obstacle

    board[r][c] = { type: BoardCellType.Obstacle };
  }

  return board;
}

/**
 * Generates a set of random circuit fragments for the player to use.
 * @param lockLevel The level of the Quantum Entanglement Lock.
 * @param count The number of fragments to generate.
 * @returns An array of CircuitFragments.
 */
export function generateCircuitFragments(lockLevel: ItemLevel, count: number): CircuitFragment[] {
  const fragments: CircuitFragment[] = [];
  const fragmentTypes: CircuitFragment['type'][] = ['straight', 'corner', 't_junction']; // Start with basic types

  // Introduce more complex fragments at higher levels
  if (lockLevel >= 4) fragmentTypes.push('cross');
  // if (lockLevel >= 6) fragmentTypes.push('amplifier'); // Example of a special fragment

  for (let i = 0; i < count; i++) {
    const randomType = fragmentTypes[Math.floor(Math.random() * fragmentTypes.length)];
    const randomOrientation = (Math.floor(Math.random() * 4) * 90) as CircuitFragment['orientation']; // 0, 90, 180, 270

    const getConnections = (type: CircuitFragment['type']): CircuitFragment['connections'] => {
      switch (type) {
        case 'straight': return { north: true, east: false, south: true, west: false };
        case 'corner': return { north: true, east: true, south: false, west: false };
        case 't_junction': return { north: true, east: true, south: true, west: false };
        case 'cross': return { north: true, east: true, south: true, west: true };
        case 'amplifier': return { north: true, east: true, south: true, west: true }; // All connections for amplifier example
        default: return { north: false, east: false, south: false, west: false };
      }
    };

    fragments.push({
      id: `fragment-${Date.now()}-${i}-${Math.random().toString(36).substring(7)}`, // Unique ID
      type: randomType,
      orientation: randomOrientation,
      connections: getConnections(randomType),
      // imagePath: `/game/circuit_fragments/${randomType}_${randomOrientation}.svg` // Example image path
    });
  }
  return fragments;
}

/**
 * Checks if the circuit is complete from Emitter to Receiver.
 * Uses a pathfinding algorithm (e.g., Breadth-First Search or Depth-First Search).
 * @param board The current state of the circuit board.
 * @returns An object with isComplete (boolean) and progress (number 0-1).
 */
export function checkCircuitCompletion(board: CircuitBoard): { isComplete: boolean; progress: number } {
  const rows = board.length;
  const cols = board[0].length;

  let emitterPos: { r: number, c: number } | null = null;
  let receiverPos: { r: number, c: number } | null = null;

  // Find Emitter and Receiver positions
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].type === BoardCellType.Emitter) emitterPos = { r, c };
      if (board[r][c].type === BoardCellType.Receiver) receiverPos = { r, c };
    }
  }

  if (!emitterPos || !receiverPos) {
    console.error("Emitter or Receiver not found on board!");
    return { isComplete: false, progress: 0 };
  }

  // --- Pathfinding Logic (Simplified BFS/DFS for circuit) ---
  const visited = new Set<string>(); // Keep track of visited cells to prevent infinite loops
  const queue: { r: number, c: number, incomingDirection: 'north' | 'east' | 'south' | 'west' | null }[] = [];
  
  // Start from the emitter. Assume emitter can connect outwards in all directions.
  // We'll simulate starting with a "fragment" that has connections on all sides
  // for the first cell's outgoing connections.
  queue.push({ r: emitterPos.r, c: emitterPos.c, incomingDirection: null });
  visited.add(`${emitterPos.r},${emitterPos.c}`);

  let maxPathLength = 0; // To estimate progress, count connected cells
  let pathFound = false;

  while (queue.length > 0) {
    const { r, c, incomingDirection } = queue.shift()!;
    maxPathLength++; // Count this cell as part of the path

    if (r === receiverPos.r && c === receiverPos.c) {
      pathFound = true;
      break; // Found a path to the receiver
    }

    const currentCell = board[r][c];
    let outgoingConnections: CircuitFragment['connections'] = { north: false, east: false, south: false, west: false };

    if (currentCell.type === BoardCellType.Emitter) {
      // Emitter can send connection in all directions
      outgoingConnections = { north: true, east: true, south: true, west: true };
    } else if (currentCell.type === BoardCellType.Fragment && currentCell.fragment) {
      // Rotate the fragment's connections based on its orientation
      const baseConnections = currentCell.fragment.connections;
      const orientation = currentCell.fragment.orientation;

      if (orientation === 0) outgoingConnections = baseConnections;
      else if (orientation === 90) outgoingConnections = { north: baseConnections.west, east: baseConnections.north, south: baseConnections.east, west: baseConnections.south };
      else if (orientation === 180) outgoingConnections = { north: baseConnections.south, east: baseConnections.west, south: baseConnections.north, west: baseConnections.east };
      else if (orientation === 270) outgoingConnections = { north: baseConnections.east, east: baseConnections.south, south: baseConnections.west, west: baseConnections.north };
    } else {
        // If it's an empty cell or an obstacle, it doesn't extend the path unless it's the emitter/receiver
        continue;
    }

    // Check neighbors
    const neighbors = [
      { dr: -1, dc: 0, dir: 'north' as const, connectsTo: 'south' as const }, // North neighbor
      { dr: 0, dc: 1, dir: 'east' as const, connectsTo: 'west' as const },   // East neighbor
      { dr: 1, dc: 0, dir: 'south' as const, connectsTo: 'north' as const }, // South neighbor
      { dr: 0, dc: -1, dir: 'west' as const, connectsTo: 'east' as const },   // West neighbor
    ];

    for (const { dr, dc, dir, connectsTo } of neighbors) {
      const nr = r + dr;
      const nc = c + dc;

      // Check bounds
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;

      // Don't go back immediately if there's a specific incoming direction constraint
      // (not strictly needed for BFS but good for clarity in circuit logic)
      if (incomingDirection && dir === incomingDirection) continue;

      const neighborCell = board[nr][nc];
      const neighborVisited = visited.has(`${nr},${nc}`);

      if (neighborCell.type === BoardCellType.Obstacle || neighborVisited) continue; // Cannot pass through obstacles or re-visit

      // Check if current cell can connect to neighbor AND neighbor can connect back
      let currentCanConnect = false;
      if (dir === 'north' && outgoingConnections.north) currentCanConnect = true;
      if (dir === 'east' && outgoingConnections.east) currentCanConnect = true;
      if (dir === 'south' && outgoingConnections.south) currentCanConnect = true;
      if (dir === 'west' && outgoingConnections.west) currentCanConnect = true;

      if (!currentCanConnect) continue; // No connection from current cell

      let neighborCanConnectBack = false;
      if (neighborCell.type === BoardCellType.Receiver) {
          // Receiver can connect from any direction if it's the target
          neighborCanConnectBack = true;
      } else if (neighborCell.type === BoardCellType.Fragment && neighborCell.fragment) {
          // Get neighbor's connections based on its orientation
          const neighborConnections = rotateConnections(neighborCell.fragment.connections, neighborCell.fragment.orientation);
          if (connectsTo === 'north' && neighborConnections.north) neighborCanConnectBack = true;
          if (connectsTo === 'east' && neighborConnections.east) neighborCanConnectBack = true;
          if (connectsTo === 'south' && neighborConnections.south) neighborCanConnectBack = true;
          if (connectsTo === 'west' && neighborConnections.west) neighborCanConnectBack = true;
      } else if (neighborCell.type === BoardCellType.Empty) {
          // Empty cells don't extend the path
          continue;
      }
      
      if (currentCanConnect && neighborCanConnectBack) {
        visited.add(`${nr},${nc}`);
        queue.push({ r: nr, c: nc, incomingDirection: connectsTo });
      }
    }
  }

  // Simple progress estimation: number of visited cells / total cells required for a direct path
  // A more complex progress would involve measuring "connectedness" or "critical nodes"
  const totalPossiblePathLength = Math.abs(emitterPos.r - receiverPos.r) + Math.abs(emitterPos.c - receiverPos.c) + 1;
  const progress = pathFound ? 1 : Math.min(1, maxPathLength / totalPossiblePathLength); // Max 1, could be less if path is circuitous

  return { isComplete: pathFound, progress: progress };
}

/**
 * Helper to rotate a fragment's connections based on its orientation.
 * @param baseConnections The connections at 0 degree orientation.
 * @param orientation The current rotation (0, 90, 180, 270).
 * @returns Rotated connections.
 */
function rotateConnections(baseConnections: CircuitFragment['connections'], orientation: 0 | 90 | 180 | 270): CircuitFragment['connections'] {
  if (orientation === 0) return baseConnections;
  if (orientation === 90) return { north: baseConnections.west, east: baseConnections.north, south: baseConnections.east, west: baseConnections.south };
  if (orientation === 180) return { north: baseConnections.south, east: baseConnections.west, south: baseConnections.north, west: baseConnections.east };
  if (orientation === 270) return { north: baseConnections.east, east: baseConnections.south, south: baseConnections.west, west: baseConnections.north };
  return baseConnections; // Should not happen
}

// You can add more logic here for specific Quantum Entanglement Lock effects
// For example, a function that modifies the board or fragments based on the lock's properties
export function applyQuantumLockEffects(
  board: CircuitBoard,
  fragments: CircuitFragment[],
  lockLevel: ItemLevel
): { newBoard: CircuitBoard; newFragments: CircuitFragment[] } {
  // Example: Higher lock levels might add more obstacles periodically
  // Example: Some attacking tools might "cleanse" some obstacles
  return { newBoard: board, newFragments: fragments };
}
