// src/components/game/tod/EquipmentLockerSection.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppContext, type PlayerInventoryItem } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { HolographicButton, HolographicPanel } from '@/components/game/shared/HolographicPanel';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { getItemById, type GameItemBase, type ItemCategory, type ItemLevel, ITEM_LEVELS } from '@/lib/game-items';
import { ITEM_LEVEL_COLORS_CSS_VARS, XP_THRESHOLDS } from '@/lib/constants';
import { ShoppingCart, ArrowLeft, Layers, XCircle } from 'lucide-react'; // Removed Chevron imports
import NextImage from 'next/image';


// Constants for carousel behavior and sizing
const CAROUSEL_ITEM_WIDTH = 180; // px - Adjusted for better visibility in 3D
const CAROUSEL_ITEM_HEIGHT = 180; // px - Adjusted for better visibility in 3D
const OVERLAY_CHILD_ITEM_WIDTH = 130; // px
const OVERLAY_CHILD_ITEM_GAP = 15; // px
const MAX_DISPLAY_ENTITIES_MAIN_CAROUSEL = 8; // Number of items in carousel
const AUTO_ROTATE_SPEED = 0.0005; // Slower auto-rotation for 3D effect
const DRAG_SENSITIVITY = 0.003; // Sensitivity for mouse/touch drag


// Helper to find an entity by ID, useful for restoring overlay title (optional)
function findEntityByIdRecursive(entities: CarouselDisplayEntity[], id: string): CarouselDisplayEntity | null {
  for (const entity of entities) {
    if (entity.id === id) return entity;
    if (entity.type === 'stack' && entity.items) { // Check 'items' as children source for stacks
      const foundInChildren = findEntityByIdRecursive(entity.items, id);
      if (foundInChildren) return foundInChildren;
    }
  }
  return null;
}

// Type definitions for carousel display entities
export type CarouselDisplayEntity = PlayerInventoryItem & {
  gameItem: GameItemBase;
  isEquipped: boolean; // For equipment locker to show equipped status
  type: 'item' | 'stack';
  items?: PlayerInventoryItem[]; // For stacks, list of items in the stack
};

interface CarouselItemProps {
  entity: CarouselDisplayEntity;
  onClick: (entity: CarouselDisplayEntity) => void;
  isActive: boolean;
  isEquipped: boolean;
  style?: React.CSSProperties; // Style prop for 3D transforms
}

const CarouselItem: React.FC<CarouselItemProps> = ({ entity, onClick, isActive, isEquipped, style }) => {
  const { theme } = useTheme();
  // Using a direct string for now, assuming ITEM_LEVEL_COLORS_CSS_VARS maps level to a CSS variable string
  // If ITEM_LEVEL_COLORS_CSS_VARS maps to HSL values, you would prepend `hsl(` and append `)`
  const itemLevelColorVar = `var(${ITEM_LEVEL_COLORS_CSS_VARS[entity.gameItem.level] || '--primary-foreground-hsl'})`;
  // For actual CSS properties that expect hsl() format, you'd need the HSL values directly
  // For now, using a fallback to primary-foreground-hsl as a string
  const itemBorderColor = `hsl(var(${ITEM_LEVEL_COLORS_CSS_VARS[entity.gameItem.level] || '--primary-foreground-hsl'}))`;


  return (
    <motion.div
      layout // Enable Framer Motion layout animations
      onClick={() => onClick(entity)}
      className={cn(
        "absolute flex flex-col items-center justify-start p-2 rounded-lg cursor-pointer transition-all duration-100 ease-in-out",
        "holographic-panel border-2", // Base holographic panel styling
        isActive ? "z-10 scale-105" : "z-0 scale-95", // Active item is larger and on top
        isEquipped ? "ring-2 ring-emerald-400 ring-offset-2 ring-offset-background" : "", // Equipped item ring
        theme === 'cyphers' && 'shadow-cyan-500/50',
        theme === 'shadows' && 'shadow-red-500/50',
        theme === 'terminal-green' && 'shadow-green-500/50',
        theme === 'hologram' && 'shadow-purple-500/50'
      )}
      style={{
        width: CAROUSEL_ITEM_WIDTH,
        height: CAROUSEL_ITEM_HEIGHT,
        borderColor: itemBorderColor, // Apply level-based border color
        boxShadow: isActive ? `0 0 25px ${itemBorderColor}` : `0 0 10px ${itemBorderColor}`, // Glow based on active state and color
        ...style // Apply 3D transform styles
      }}
    >
      {/* Item Image */}
      <div className="relative w-20 h-20 md:w-24 md:h-24 flex items-center justify-center">
        <NextImage
          src={entity.gameItem.imageSrc || '/images/spi_vs_spi_icon.png'} // Use new global placeholder
          alt={entity.gameItem.name}
          width={96} // md:w-24 = 96px
          height={96} // md:h-24 = 96px
          className="object-contain"
          onError={(e) => {
            e.currentTarget.onerror = null; // Prevent infinite loop
            e.currentTarget.src = '/images/spi_vs_spi_icon.png'; // Fallback to icon on error
          }}
        />
        {entity.type === 'stack' && (
          <div className="absolute bottom-0 right-0 bg-primary/80 text-primary-foreground text-xs px-1 rounded-br-md rounded-tl-md">
            <Layers className="inline-block w-3 h-3 align-text-bottom mr-0.5" />
            {entity.items?.length}
          </div>
        )}
      </div>

      {/* Item Name */}
      <p className="text-center text-xs md:text-sm font-semibold mt-2 leading-tight text-white/90">
        {entity.gameItem.name} L{entity.gameItem.level}
      </p>
      {/* Quantity if applicable */}
      {entity.quantity > 1 && (
        <span className="absolute top-1 right-1 text-xs font-bold text-blue-300 bg-blue-900/70 px-1 rounded-sm">
          x{entity.quantity}
        </span>
      )}
      {/* Equipped indicator */}
      {isEquipped && (
        <span className="absolute top-1 left-1 text-xs font-bold text-emerald-400 bg-emerald-900/70 px-1 rounded-sm">
          EQ
        </span>
      )}
    </motion.div>
  );
};

export function EquipmentLockerSection() {
  const appContext = useAppContext();
  const { playerInventory, playerStats, updatePlayerInventoryItemStrength, deployItemToVault, faction, openTODWindow, openSpyShop } = useAppContext(); // Added openSpyShop
  const { theme } = useTheme();

  const [activeIndex, setActiveIndex] = useState(0);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [selectedEntityForOverlay, setSelectedEntityForOverlay] = useState<CarouselDisplayEntity | null>(null);

  // Filter inventory for display in Equipment Locker (only Hardware, Lock Fortifiers, Infiltration Gear, Nexus Upgrades, Assault Tech)
  const filterAndPrepareInventory = useCallback((inventory: PlayerInventoryItem[]): CarouselDisplayEntity[] => {
    // Ensure inventory is an array before filtering using Array.from for robustness
    const validCategories: ItemCategory[] = ['Hardware', 'Lock Fortifiers', 'Infiltration Gear', 'Nexus Upgrades', 'Assault Tech'];
    const filteredItems = Array.from(inventory || []).filter(item => { // Changed here
      const gameItem = getItemById(item.id);
      return gameItem && validCategories.includes(gameItem.category);
    });

    // Group items into stacks if they are stackable and have the same base ID
    const groupedItems: Record<string, PlayerInventoryItem[]> = {};
    filteredItems.forEach(item => {
      const baseId = item.id.split('_l')[0]; // Extract base ID (e.g., 'cypher_lock')
      if (!groupedItems[baseId]) {
        groupedItems[baseId] = [];
      }
      groupedItems[baseId].push(item);
    });

    // Sort items within stacks by level and then prepare CarouselDisplayEntity
    const preparedEntities: CarouselDisplayEntity[] = [];
    Object.values(groupedItems).forEach(stack => {
      stack.sort((a, b) => {
        const levelA = parseInt(a.id.split('_l')[1] || '1');
        const levelB = parseInt(b.id.split('_l')[1] || '1');
        return levelA - levelB; // Sort by level ascending
      });

      if (stack.length === 1) {
        const item = stack[0];
        const gameItem = getItemById(item.id);
        if (gameItem) {
          preparedEntities.push({
            ...item,
            gameItem: gameItem,
            isEquipped: false, // Default to false, will check equipped items later
            type: 'item'
          });
        }
      } else {
        // Create a stack entity, showing the highest level item as the representative
        const highestLevelItem = stack[stack.length - 1]; // Highest level item in stack
        const gameItem = getItemById(highestLevelItem.id);
        if (gameItem) {
          preparedEntities.push({
            ...highestLevelItem, // Use properties of the highest level item
            gameItem: gameItem,
            isEquipped: false, // Default to false
            type: 'stack',
            items: stack // Include all items in the stack
          });
        }
      }
    });

    // Mark items as equipped based on player's vault
    // (This part would depend on your specific vault data structure in AppContext)
    // For now, let's assume no items are equipped in this mock-up
    // If you have player.vault data, you'd iterate through it here
    // For example:
    // playerVault.forEach(slot => {
    //   if (slot.item) {
    //     const entity = preparedEntities.find(e => e.id === slot.item.id);
    //     if (entity) entity.isEquipped = true;
    //   }
    // });

    return preparedEntities;
  }, []);


  const mainCarouselItems = useMemo(() => {
    const items = filterAndPrepareInventory(playerInventory);
    // Sort items by category and then by level for consistent display
    items.sort((a, b) => {
      const categoryOrder = ['Hardware', 'Lock Fortifiers', 'Infiltration Gear', 'Nexus Upgrades', 'Assault Tech'];
      const categoryA = categoryOrder.indexOf(a.gameItem.category);
      const categoryB = categoryOrder.indexOf(b.gameItem.category);
      if (categoryA !== categoryB) return categoryA - categoryB;
      return a.gameItem.level - b.gameItem.level;
    });
    return items;
  }, [playerInventory, filterAndPrepareInventory]);

  // Ensure activeIndex is always valid
  useEffect(() => {
    if (activeIndex >= mainCarouselItems.length && mainCarouselItems.length > 0) {
      setActiveIndex(mainCarouselItems.length - 1);
    } else if (mainCarouselItems.length === 0) {
      setActiveIndex(0);
    }
  }, [mainCarouselItems.length, activeIndex]);


  // --- Carousel 3D Rotation State and Handlers ---
  const carouselRef = useRef<HTMLDivElement>(null);
  const [rotationY, setRotationY] = useState(0); // Current rotation angle in radians
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0); // Initial mouse/touch X position
  const [initialRotationY, setInitialRotationY] = useState(0); // Rotation when drag starts

  const handleDragStart = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    setStartX('touches' in event ? event.touches[0].clientX : event.clientX);
    setInitialRotationY(rotationY);
    if ('preventDefault' in event && event.cancelable) {
      event.preventDefault(); // Prevent text selection on mouse drag
    }
  }, [rotationY]);

  const handleDrag = useCallback((event: MouseEvent | TouchEvent) => {
    if (!isDragging) return;

    const currentX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const deltaX = currentX - startX;
    setRotationY(initialRotationY + deltaX * DRAG_SENSITIVITY);

    // Prevent default scrolling on touch devices
    if ('preventDefault' in event && event.cancelable) {
      event.preventDefault(); 
    }
  }, [isDragging, startX, initialRotationY]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Effect for global mouse/touch event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDrag, { passive: false }); // Needs passive: false for preventDefault
      window.addEventListener('touchend', handleDragEnd);
      window.addEventListener('touchcancel', handleDragEnd); // Handle touches leaving screen
    } else {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDrag);
      window.removeEventListener('touchend', handleDragEnd);
      window.removeEventListener('touchcancel', handleDragEnd);
    };
  }, [isDragging, handleDrag, handleDragEnd]);


  // Auto-rotation effect
  useEffect(() => {
    let animationFrameId: number;
    const animateRotation = () => {
      if (!isDragging) { // Only auto-rotate if not dragging
        setRotationY(prev => prev + AUTO_ROTATE_SPEED);
      }
      animationFrameId = requestAnimationFrame(animateRotation);
    };

    animationFrameId = requestAnimationFrame(animateRotation);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isDragging]);


  // Calculate carousel radius based on container width for responsiveness
  const carouselRadius = useMemo(() => {
    if (carouselRef.current) {
      // Aim for the items to fit well; roughly half the container width for the radius
      // This might need fine-tuning based on actual item size and desired density
      return carouselRef.current.offsetWidth / 2 / (2 * Math.tan(Math.PI / MAX_DISPLAY_ENTITIES_MAIN_CAROUSEL));
    }
    return 300; // Default fallback radius
  }, [carouselRef.current?.offsetWidth]);


  // Calculate 3D transforms for each item
  const carouselItemStyles = useMemo(() => {
    if (mainCarouselItems.length === 0) return [];
    const angleIncrement = (2 * Math.PI) / mainCarouselItems.length; // Angle between each item

    return mainCarouselItems.map((_, index) => {
      const angle = index * angleIncrement;
      // Apply the rotationY to the current item's angle to get its effective angle
      const effectiveAngle = angle + rotationY;

      // Position items on a circle
      const x = carouselRadius * Math.sin(effectiveAngle);
      const z = carouselRadius * Math.cos(effectiveAngle);

      // Rotate each item to face the center of the carousel
      const rotateY = -effectiveAngle - Math.PI / 2; // Subtract PI/2 to make it face the center correctly

      return {
        transform: `translateX(${x}px) translateZ(${z}px) rotateY(${rotateY}rad)`,
        position: 'absolute',
        left: '50%', // Center horizontally
        top: '50%', // Center vertically
        marginLeft: -CAROUSEL_ITEM_WIDTH / 2, // Adjust for item width
        marginTop: -CAROUSEL_ITEM_HEIGHT / 2, // Adjust for item height
        backfaceVisibility: 'hidden', // Hide back of items when rotated away
        WebkitBackfaceVisibility: 'hidden', // For Safari
      };
    });
  }, [mainCarouselItems, rotationY, carouselRadius]);


  // Overlay logic (retained from previous version)
  const openOverlay = useCallback((entity: CarouselDisplayEntity) => {
    setSelectedEntityForOverlay(entity);
    setIsOverlayOpen(true);
  }, []);

  const closeOverlay = useCallback(() => {
    setIsOverlayOpen(false);
    setSelectedEntityForOverlay(null);
  }, []);

  // Function to open Spy Shop
  const handleOpenSpyShop = useCallback(() => {
    openSpyShop(); // This should be a component or identifier passed to openTODWindow
  }, [openSpyShop]);


  const handleLevelUpClick = useCallback(() => {
    // This is a mock function. In a real app, you would handle
    // the actual level-up logic, cost, and stat updates.
    // Ensure sufficient elintReserves and max level check.
    if (selectedEntityForOverlay && playerStats && playerStats.elintReserves >= selectedEntityForOverlay.gameItem.cost) {
      const newLevel = (selectedEntityForOverlay.gameItem.level + 1) as ItemLevel;
      const newId = selectedEntityForOverlay.gameItem.id.replace(`l${selectedEntityForOverlay.gameItem.level}`, `l${newLevel}`);
      
      const newGameItem = getItemById(newId);
      if (newGameItem) {
        updatePlayerInventoryItemStrength(selectedEntityForOverlay.id, newId); // Update inventory item
        // In a real app, you'd also subtract cost from playerStats.elintReserves
        // For now, this is just a visual demonstration.
        console.log(`Upgraded ${selectedEntityForOverlay.gameItem.name} to Level ${newLevel}!`);
        closeOverlay();
      } else {
        console.warn(`Cannot upgrade ${selectedEntityForOverlay.gameItem.name}: No item found for level ${newLevel}.`);
      }
    } else {
      console.warn("Not enough ELINT reserves or already max level for upgrade.");
    }
  }, [selectedEntityForOverlay, playerStats, updatePlayerInventoryItemStrength, closeOverlay]);

  const handleDeployToVaultClick = useCallback(() => {
    if (selectedEntityForOverlay) {
        deployItemToVault(selectedEntityForOverlay.id);
        console.log(`Deployed ${selectedEntityForOverlay.gameItem.name} to Vault.`);
        closeOverlay();
    }
  }, [selectedEntityForOverlay, deployItemToVault, closeOverlay]);

  // Helper function to get the level of the currently selected carousel item
  const selectedCarouselItemName = useCallback(() => {
    if (mainCarouselItems.length === 0) return '';
    
    // Find the item closest to the "front" (z-axis)
    let closestItem: CarouselDisplayEntity | null = null;
    let minZ = Infinity;

    mainCarouselItems.forEach((entity, index) => {
      // Calculate the item's effective angle with current carousel rotation
      const angleIncrement = (2 * Math.PI) / mainCarouselItems.length;
      const effectiveAngle = (index * angleIncrement) + rotationY;

      // Z-position relative to carousel center
      const z = carouselRadius * Math.cos(effectiveAngle);

      if (z < minZ) { // Smaller Z means closer to camera (more "front")
        minZ = z;
        closestItem = entity;
      }
    });

    if (closestItem) {
      return closestItem.gameItem.level;
    }
    return ''; // Fallback if no item is found
  }, [mainCarouselItems, rotationY, carouselRadius]);


  return (
    <div className="flex flex-col items-center justify-center p-4 md:p-6 h-full max-w-4xl mx-auto"> {/* Added padding and h-full for consistent sizing */}
      <HolographicPanel
        id="equipment-locker-section"
        title="Equipment Locker" {/* Restored title */}
        className={cn("w-full h-full flex flex-col relative overflow-hidden", isOverlayOpen && "pointer-events-none")} // Ensure it fills space, disabled interaction when overlay is open
        theme={theme}
        // Add a Spy Shop button to the top right actions of the HolographicPanel
        actions={
          <HolographicButton onClick={handleOpenSpyShop} className="!px-3 !py-1 text-sm md:!px-4 md:!py-2 md:text-base">
            <ShoppingCart className="w-4 h-4 mr-1" /> Spy Shop
          </HolographicButton>
        }
      >
        {/* Main Content Area */}
        <div className="flex-grow flex flex-col justify-center items-center p-4">
          {/* Main Carousel Area */}
          <div 
            ref={carouselRef}
            className="relative w-full h-[300px] flex items-center justify-center rounded-xl bg-gray-900/50 my-4" // Added background for visual clarity
            style={{ perspective: '1000px' }} // Establish 3D perspective
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
          >
            {mainCarouselItems.length > 0 ? (
              <div
                className="relative w-full h-full preserve-3d"
                style={{
                  transformStyle: 'preserve-3d', // Crucial for child 3D transforms
                  transform: `rotateY(${rotationY}rad)`, // Apply overall carousel rotation
                  transition: isDragging ? 'none' : 'transform 0.1s ease-out' // Smooth transition when not dragging
                }}
              >
                <AnimatePresence>
                  {mainCarouselItems.map((entity, index) => (
                    <CarouselItem
                      key={entity.id}
                      entity={entity}
                      onClick={openOverlay}
                      isActive={false} // No specific active item highlighting in this 3D view for now, or you'd calculate it
                      isEquipped={entity.isEquipped}
                      style={carouselItemStyles[index]} // Apply computed 3D styles
                    />
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="text-gray-400 text-lg">No items in your inventory.</div>
            )}
          </div>

          {/* Current Item Name Display (can be enhanced to show stats of active item) */}
          <div className="mt-4 text-center text-lg font-bold text-blue-300">
            {mainCarouselItems.length > 0 ? (
              // Display the name and level of the currently selected/front-facing item
              `Selected: ${selectedEntityForOverlay?.gameItem.name || (mainCarouselItems[0]?.gameItem.name || 'N/A')} L${selectedEntityForOverlay?.gameItem.level || selectedCarouselItemName()}`
            ) : ""}
          </div>


          {/* Player Stats / ELINT Reserves - REMOVED AS REQUESTED */}
        </div>

        {/* Overlay for Item Details (if active) */}
        <AnimatePresence>
          {isOverlayOpen && selectedEntityForOverlay && (
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: "0%" }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="absolute inset-0 bg-gray-950 bg-opacity-90 flex flex-col p-4 md:p-8 rounded-lg shadow-xl z-20 overflow-auto"
            >
              <HolographicPanel title={selectedEntityForOverlay.gameItem.title || `${selectedEntityForOverlay.gameItem.name} L${selectedEntityForOverlay.gameItem.level}`} theme={theme} className="flex-grow flex flex-col p-4">
                <div className="relative w-40 h-40 md:w-48 md:h-48 mx-auto mb-4 flex items-center justify-center">
                  <NextImage
                    src={selectedEntityForOverlay.gameItem.imageSrc || '/images/spi_vs_spi_icon.png'} // Fallback to icon
                    alt={selectedEntityForOverlay.gameItem.name}
                    width={192} // md:w-48 = 192px
                    height={192} // md:h-48 = 192px
                    className="object-contain"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/images/spi_vs_spi_icon.png';
                    }}
                  />
                  {selectedEntityForOverlay.quantity > 1 && (
                    <span className="absolute top-1 right-1 text-base font-bold text-blue-300 bg-blue-900/70 px-2 rounded-sm">
                      x{selectedEntityForOverlay.quantity}
                    </span>
                  )}
                   {selectedEntityForOverlay.isEquipped && (
                    <span className="absolute top-1 left-1 text-base font-bold text-emerald-400 bg-emerald-900/70 px-2 rounded-sm">
                      EQUIPPED
                    </span>
                  )}
                </div>

                <div className="text-gray-300 text-sm md:text-base mb-4 flex-grow overflow-y-auto custom-scrollbar pr-2">
                  <p className="mb-2"><strong className="text-blue-300">Category:</strong> {selectedEntityForOverlay.gameItem.category}</p>
                  <p className="mb-2"><strong className="text-blue-300">Description:</strong> {selectedEntityForOverlay.gameItem.description}</p>
                  {selectedEntityForOverlay.gameItem.functionDescription && <p className="mb-2"><strong className="text-blue-300">Function:</strong> {selectedEntityForOverlay.gameItem.functionDescription}</p>}
                  {selectedEntityForOverlay.gameItem.minigameInfluence && <p className="mb-2"><strong className="text-blue-300">Minigame Influence:</strong> {selectedEntityForOverlay.gameItem.minigameInfluence}</p>}
                  {selectedEntityForOverlay.gameItem.levelScalingNote && <p className="mb-2"><strong className="text-blue-300">Scaling:</strong> {selectedEntityForOverlay.gameItem.levelScalingNote}</p>}
                  {selectedEntityForOverlay.gameItem.scarcity && <p className="mb-2"><strong className="text-blue-300">Scarcity:</strong> {selectedEntityForOverlay.gameItem.scarcity}</p>}
                  {selectedEntityForOverlay.gameItem.strength && <p className="mb-2"><strong className="text-blue-300">Strength:</strong> {selectedEntityForOverlay.gameItem.strength.current}/{selectedEntityForOverlay.gameItem.strength.max}</p>}
                  {selectedEntityForOverlay.gameItem.resistance && <p className="mb-2"><strong className="text-blue-300">Resistance:</strong> {selectedEntityForOverlay.gameItem.resistance.current}/{selectedEntityForOverlay.gameItem.resistance.max}</p>}
                  {selectedEntityForOverlay.gameItem.attackFactor && <p className="mb-2"><strong className="text-blue-300">Attack Factor:</strong> {selectedEntityForOverlay.gameItem.attackFactor}</p>}
                  {selectedEntityForOverlay.gameItem.type && <p className="mb-2"><strong className="text-blue-300">Type:</strong> {selectedEntityForOverlay.gameItem.type}</p>}
                  {selectedEntityForOverlay.gameItem.perUseCost && <p className="mb-2"><strong className="text-blue-300">Per Use Cost:</strong> {selectedEntityForOverlay.gameItem.perUseCost} ELINT</p>}
                  {selectedEntityForOverlay.gameItem.rechargeCost && <p className="mb-2"><strong className="text-blue-300">Recharge Cost:</strong> {selectedEntityForOverlay.gameItem.rechargeCost} ELINT</p>}
                  {selectedEntityForOverlay.gameItem.rechargeCapacity && <p className="mb-2"><strong className="text-blue-300">Recharge Capacity:</strong> {selectedEntityForOverlay.gameItem.rechargeCapacity}</p>}
                  {selectedEntityForOverlay.gameItem.destructionDescription && <p className="mb-2"><strong className="text-blue-300">Destruction:</strong> {selectedEntityForOverlay.gameItem.destructionDescription}</p>}
                  {selectedEntityForOverlay.gameItem.cooldown && <p className="mb-2"><strong className="text-blue-300">Cooldown:</strong> {selectedEntityForOverlay.gameItem.cooldown}</p>}
                  {selectedEntityForOverlay.gameItem.placement && <p className="mb-2"><strong className="text-blue-300">Placement:</strong> {selectedEntityForOverlay.gameItem.placement}</p>}
                  {selectedEntityForOverlay.gameItem.durability && <p className="mb-2"><strong className="text-blue-300">Durability:</strong> {selectedEntityForOverlay.gameItem.durability}</p>}
                  {selectedEntityForOverlay.gameItem.repurchaseCost && <p className="mb-2"><strong className="text-blue-300">Repurchase Cost:</strong> {selectedEntityForOverlay.gameItem.repurchaseCost} ELINT</p>}
                  {selectedEntityForOverlay.gameItem.idealMatch && <p className="mb-2"><strong className="text-blue-300">Ideal Match:</strong> {selectedEntityForOverlay.gameItem.idealMatch}</p>}
                  {selectedEntityForOverlay.gameItem.poorMatch && <p className="mb-2"><strong className="text-blue-300">Poor Match:</strong> {selectedEntityForOverlay.gameItem.poorMatch}</p>}
                  {selectedEntityForOverlay.gameItem.lockTypeEffectiveness && (
                    <p className="mb-2">
                      <strong className="text-blue-300">Effectiveness:</strong> <br/>
                      <span className="ml-2">Ideal vs: {selectedEntityForOverlay.gameItem.lockTypeEffectiveness.idealCounterAgainst.join(', ')}</span><br/>
                      {selectedEntityForOverlay.gameItem.lockTypeEffectiveness.poorMatchPenaltyAgainst && (
                        <span className="ml-2">Poor vs: {selectedEntityForOverlay.gameItem.lockTypeEffectiveness.poorMatchPenaltyAgainst.join(', ')}</span>
                      )}
                    </p>
                  )}
                  {/* Display items in stack if it's a stack entity */}
                  {selectedEntityForOverlay.type === 'stack' && selectedEntityForOverlay.items && (
                    <div className="mt-4">
                      <p className="text-blue-300 font-bold mb-2">Items in Stack:</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {selectedEntityForOverlay.items.map(stackedItem => {
                          const stackedGameItem = getItemById(stackedItem.id);
                          if (!stackedGameItem) return null;
                          return (
                            <div key={stackedItem.id} className="flex items-center bg-gray-800 p-2 rounded-md border border-gray-700">
                              <NextImage
                                src={stackedGameItem.tileImageSrc || '/images/spi_vs_spi_icon.png'} // Fallback
                                alt={stackedGameItem.name}
                                width={32}
                                height={32}
                                className="mr-2 object-contain"
                              />
                              <span>{stackedGameItem.name} L{stackedGameItem.level} (x{stackedItem.quantity})</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-around mt-4">
                  <HolographicButton onClick={closeOverlay} className="!px-6 !py-3">
                    <ArrowLeft className="w-5 h-5 mr-2" /> Back
                  </HolographicButton>
                  {selectedEntityForOverlay.gameItem.level < 8 && ( // Only show if not max level
                    <HolographicButton
                      onClick={handleLevelUpClick}
                      className="!px-6 !py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                    >
                      Level Up ({selectedEntityForOverlay.gameItem.cost} ELINT)
                    </HolographicButton>
                  )}
                  {/* Only show deploy if not equipped and is a deployable item (Hardware/Fortifier/Nexus) */}
                  {
                    !selectedEntityForOverlay.isEquipped &&
                    (selectedEntityForOverlay.gameItem.category === 'Hardware' ||
                     selectedEntityForOverlay.gameItem.category === 'Lock Fortifiers' ||
                     selectedEntityForOverlay.gameItem.category === 'Nexus Upgrades') && (
                      <HolographicButton
                        onClick={handleDeployToVaultClick}
                        className="!px-6 !py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white"
                      >
                        <Layers className="w-5 h-5 mr-2" /> Deploy to Vault
                      </HolographicButton>
                    )
                  }
                </div>
              </HolographicPanel>
            </motion.div>
          )}
        </AnimatePresence>
      </HolographicPanel>
    </div>
  );
}

// Debounce utility (retained as it's useful)
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: NodeJS.Timeout | null = null;

  const debounced = (...args: Parameters<F>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };

  return debounced as (...args: Parameters<F>) => ReturnType<F>;
}
