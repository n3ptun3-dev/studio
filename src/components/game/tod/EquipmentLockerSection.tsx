// src/components/game/tod/EquipmentLockerSection.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAppContext, type PlayerInventoryItem } from '@/contexts/AppContext'; 
import { useTheme } from '@/contexts/ThemeContext';
import { HolographicPanel, HolographicButton } from '@/components/game/shared/HolographicPanel';
import { cn } from '@/lib/utils';
import { getItemById, type GameItemBase, type ItemCategory, type ItemLevel, ITEM_LEVELS } from '@/lib/game-items';
import { ITEM_LEVEL_COLORS_CSS_VARS, XP_THRESHOLDS } from '@/lib/constants'; 
import { ShoppingCart, ArrowLeft, Layers, XCircle } from 'lucide-react'; 
import NextImage from 'next/image';
import { AnimatePresence, motion } from 'framer-motion'; 


// Constants for carousel behavior and sizing
const CAROUSEL_ITEM_WIDTH = 180; // px - Adjusted for better visibility in 3D
const CAROUSEL_ITEM_HEIGHT = 180; // px - Adjusted for better visibility in 3D
const OVERLAY_CHILD_ITEM_WIDTH = 130; // px
const OVERLAY_CHILD_ITEM_GAP = 15; // px
const MAX_DISPLAY_ENTITIES_MAIN_CAROUSEL = 8; // Number of items in carousel
const AUTO_ROTATE_SPEED = 0.0005; // Slower auto-rotation for 3D effect
const DRAG_SENSITIVITY = 0.003; // Sensitivity for mouse/touch drag


// Define DisplayIndividualItem type here, as it's used before EquipmentLockerSection
// This type is crucial for the internal representation of items for display purposes
// and includes properties needed for rendering (like colorVar, imageSrc) that might
// not be directly on PlayerInventoryItem or GameItemBase
interface DisplayIndividualItem extends PlayerInventoryItem {
  name: string; // Add name property for easier access
  type: 'individual_item'; // Explicit type for clarity
  imageSrc?: string; // Image source for display
  level: ItemLevel; // Level for display and sorting
  colorVar: string; // CSS variable string for color
  gameItem: GameItemBase; // Full game item details
  inventoryDetails: PlayerInventoryItem; // Original inventory item details
  isEquipped: boolean; // Equipped status
}

interface CarouselDisplayEntity {
  id: string;
  name: string;
  type: 'category' | 'item_stack' | 'individual_item';
  imageSrc?: string;
  level?: ItemLevel;
  colorVar?: string; // CSS variable string for color
  itemCount?: number; // For categories
  items?: GameItemBase[]; // For item stacks, list of game item variants
  highestLevel?: ItemLevel; // For item stacks
  // Add properties from PlayerInventoryItem and GameItemBase if 'individual_item'
  gameItem?: GameItemBase;
  isEquipped?: boolean;
  quantity?: number;
  inventoryDetails?: PlayerInventoryItem;
}

// Helper to find an entity by ID, useful for restoring overlay title (optional)
function findEntityByIdRecursive(entities: CarouselDisplayEntity[], id: string): CarouselDisplayEntity | null {
  for (const entity of entities) {
    if (entity.id === id) return entity;
    if (entity.type === 'stack' && entity.items) { // Check 'items' as children source for stacks
      const foundInChildren = findEntityByIdRecursive(entity.items as CarouselDisplayEntity[], id); // Cast items to CarouselDisplayEntity[]
      if (foundInChildren) return foundInChildren;
    }
  }
  return null;
}

// Helper function to find the highest level item in an array of DisplayIndividualItem
function findHighestLevelItem(items: DisplayIndividualItem[]): DisplayIndividualItem | undefined {
  if (!items || items.length === 0) {
    return undefined;
  }
  return items.reduce((prev, current) => (prev.level > current.level ? prev : current));
}


interface CarouselItemProps {
  entity: CarouselDisplayEntity;
  onClick: (entity: CarouselDisplayEntity) => void;
  isActive: boolean;
  isEquipped: boolean;
  style?: React.CSSProperties; // Style prop for 3D transforms
}

const CarouselItem: React.FC<CarouselItemProps> = ({ entity, onClick, isActive, isEquipped, style }) => {
  const { theme } = useTheme();
  // Use optional chaining and nullish coalescing for safe access
  const itemLevelForColor = entity.level || 1;
  const itemColorCssVar = entity.colorVar || ITEM_LEVEL_COLORS_CSS_VARS?.[1] || 'var(--primary-foreground-hsl)';


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
        borderColor: `hsl(var(${itemColorCssVar}))`, // Apply level-based border color
        boxShadow: isActive ? `0 0 25px hsl(var(${itemColorCssVar}))` : `0 0 10px hsl(var(${itemColorCssVar}))`, // Glow based on active state and color
        ...style // Apply 3D transform styles
      }}
    >
      {/* Item Image */}
      <div className="relative w-20 h-20 md:w-24 md:h-24 flex items-center justify-center">
        <NextImage
          src={entity.imageSrc || '/images/spi_vs_spi_icon.png'} // Use new global placeholder
          alt={entity.name}
          width={96} // md:w-24 = 96px
          height={96} // md:h-24 = 96px
          className="object-contain"
          onError={(e) => {
            e.currentTarget.onerror = null; // Prevent infinite loop
            e.currentTarget.src = '/images/spi_vs_spi_icon.png'; // Fallback to icon on error
          }}
        />
        {entity.type === 'item_stack' && (
          <div className="absolute bottom-0 right-0 bg-primary/80 text-primary-foreground text-xs px-1 rounded-br-md rounded-tl-md">
            <Layers className="inline-block w-3 h-3 align-text-bottom mr-0.5" />
            {entity.items?.length}
          </div>
        )}
      </div>

      {/* Item Name */}
      <p className="text-center text-xs md:text-sm font-semibold mt-2 leading-tight text-white/90">
        {entity.name} {entity.level ? `L${entity.level}` : ''}
      </p>
      {/* Quantity if applicable */}
      {entity.quantity && entity.quantity > 1 && (
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
  const { 
    playerInventory, 
    playerStats, 
    updatePlayerInventoryItemStrength, 
    deployItemToVault, 
    faction, 
    openTODWindow, 
    openSpyShop,
    spendElint, 
    addMessage, 
  } = appContext;
  const { theme } = useTheme();

  const [allDetailedInventoryItems, setAllDetailedInventoryItems] = useState<DisplayIndividualItem[]>([]);
  const [carouselItems, setCarouselItems] = useState<CarouselDisplayEntity[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [carouselOffset, setCarouselOffset] = useState(0);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [overlayItems, setOverlayItems] = useState<DisplayIndividualItem[]>([]);
  const [overlayTitle, setOverlayTitle] = useState('');
  const [expandedStackPath, setExpandedStackPath] = useState<string[]>([]);
  const [selectedEntityForOverlay, setSelectedEntityForOverlay] = useState<CarouselDisplayEntity | null>(null); // State for the selected item in the overlay

  const mainCarouselContainerRef = useRef<HTMLDivElement>(null);
  const overlayScrollContainerRef = useRef<HTMLDivElement>(null);
  const isMouseOverCarouselRef = useRef(false);
  const carouselInteractedTimestampRef = useRef(0);

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

  // Function to open Spy Shop (uses the openSpyShop from AppContext)
  const handleOpenSpyShop = useCallback(() => {
    openSpyShop(); 
  }, [openSpyShop]);

  // Functions for managing the item detail overlay
  const openOverlay = useCallback((entity: CarouselDisplayEntity) => {
    setSelectedEntityForOverlay(entity);
    setIsOverlayOpen(true);
  }, []);

  const closeOverlay = useCallback(() => {
    setIsOverlayOpen(false);
    setSelectedEntityForOverlay(null); // Clear selected entity when closing
  }, []);

  // Placeholder for Level Up functionality
  const handleLevelUpClick = useCallback(() => {
    addMessage({ type: 'system', text: 'Level Up functionality is not yet implemented.' });
    // In a real scenario, this would trigger an upgrade logic (e.g., spend ELINT, update item data)
  }, [addMessage]);

  // Placeholder for Deploy to Vault functionality
  const handleDeployToVaultClick = useCallback(() => {
    addMessage({ type: 'system', text: 'Deploy to Vault functionality is not yet implemented.' });
    // In a real scenario, this would transfer the item to the vault
  }, [addMessage]);


  useEffect(() => {
    // Correctly process playerInventory which is a Record (object)
    const detailedItems: DisplayIndividualItem[] = Object.values(playerInventory || {}) 
      .map(invItem => {
        const gameItem = getItemById(invItem.id);
        if (!gameItem) return null; 
        return {
          id: invItem.id,
          name: gameItem.name,
          type: 'individual_item',
          imageSrc: gameItem.tileImageSrc || gameItem.imageSrc,
          level: gameItem.level,
          // Use optional chaining and nullish coalescing for safe access
          colorVar: ITEM_LEVEL_COLORS_CSS_VARS?.[gameItem.level as ItemLevel] ?? ITEM_LEVEL_COLORS_CSS_VARS?.[1] ?? 'var(--primary-foreground-hsl)',
          gameItem: gameItem,
          inventoryDetails: invItem,
          isEquipped: false, // Placeholder for actual equipped status check
        };
      })
      .filter(Boolean) as DisplayIndividualItem[];
    setAllDetailedInventoryItems(detailedItems);
  }, [playerInventory]);

  const processInventoryForCarousel = useCallback((
    currentInventory: DisplayIndividualItem[],
    currentExpansionPath: string[]
  ): CarouselDisplayEntity[] => {
    if (currentExpansionPath.length === 0) {
      const categories: Record<ItemCategory, DisplayIndividualItem[]> = {
        'Hardware': [], 'Lock Fortifiers': [], 'Nexus Upgrades': [],
        'Infiltration Gear': [], 'Assault Tech': [], 'Aesthetic Schemes': [],
      };
      currentInventory.forEach(item => {
        if (categories[item.gameItem.category]) {
          categories[item.gameItem.category].push(item);
        }
      });
      return Object.entries(categories)
        .filter(([_, items]) => items.length > 0)
        .map(([categoryName, items]) => {
          const highestLevelItem = findHighestLevelItem(items);
          return {
            id: `stack_category_${categoryName.replace(/\s+/g, '_')}`,
            name: categoryName,
            type: 'category',
            imageSrc: highestLevelItem?.imageSrc,
            level: highestLevelItem?.level,
            colorVar: highestLevelItem ? (ITEM_LEVEL_COLORS_CSS_VARS?.[highestLevelItem.level as ItemLevel] ?? ITEM_LEVEL_COLORS_CSS_VARS?.[1] ?? 'var(--primary-foreground-hsl)') : (ITEM_LEVEL_COLORS_CSS_VARS?.[1] ?? 'var(--primary-foreground-hsl)'),
            itemCount: items.length,
          };
        });
    }

    const deepestStackId = currentExpansionPath[currentExpansionPath.length - 1];

    if (deepestStackId.startsWith('stack_category_')) {
      const categoryName = deepestStackId.replace('stack_category_', '').replace(/_/g, ' ') as ItemCategory;
      const itemsInCategory = currentInventory.filter(item => item.gameItem.category === categoryName);
      const itemsByName: Record<string, DisplayIndividualItem[]> = {};
      itemsInCategory.forEach(item => {
        if (!itemsByName[item.name]) itemsByName[item.name] = [];
        itemsByName[item.name].push(item);
      });
      return Object.entries(itemsByName).map(([name, items]) => {
        const highestLevelGameItem = findHighestLevelItem(items);
        return {
          id: `stack_item_${categoryName.replace(/\s+/g, '_')}_${name.replace(/\s+/g, '_')}`,
          name: name,
          type: 'item_stack',
          baseName: name,
          category: categoryName,
          items: items.map(i => i.gameItem).sort((a, b) => a.level - b.level),
          highestLevel: highestLevelGameItem?.level, // Added optional chaining
          imageSrc: highestLevelGameItem?.imageSrc, // Added optional chaining
          level: highestLevelGameItem?.level, // Added optional chaining
          colorVar: ITEM_LEVEL_COLORS_CSS_VARS?.[highestLevelGameItem?.level as ItemLevel] ?? ITEM_LEVEL_COLORS_CSS_VARS?.[1] ?? 'var(--primary-foreground-hsl)', // Added optional chaining
        };
      });
    }

    if (deepestStackId.startsWith('stack_item_')) {
      const parts = deepestStackId.replace('stack_item_', '').split('_');
      const categoryFromId = parts.slice(0, -1).join(' ') as ItemCategory; // Handles categories with spaces
      const baseNameFromId = parts[parts.length - 1].replace(/_/g, ' ');

      return currentInventory.filter(item =>
        item.gameItem.category === categoryFromId && item.name === baseNameFromId
      ).sort((a,b) => a.gameItem.level - b.gameItem.level);
    }
    return [];
  }, []);

  // Moved mainCarouselItems definition earlier to prevent initialization errors
  const mainCarouselItems = useMemo(() => {
    return processInventoryForCarousel(allDetailedInventoryItems, expandedStackPath);
  }, [allDetailedInventoryItems, expandedStackPath, processInventoryForCarousel]);


  useEffect(() => {
    setCarouselItems(mainCarouselItems); // Now depends on the memoized value
    setActiveIndex(0);
    setCarouselOffset(0);
  }, [mainCarouselItems]); // Depend on mainCarouselItems


  const handleNavigateCarousel = useCallback((direction: 'prev' | 'next') => {
    if (carouselItems.length === 0) return;
    setActiveIndex(prevIndex => {
      let newIndex = direction === 'prev' ? prevIndex - 1 : prevIndex + 1;
      if (newIndex < 0) newIndex = carouselItems.length - 1;
      if (newIndex >= carouselItems.length) newIndex = 0;
      return newIndex;
    });
    carouselInteractedTimestampRef.current = Date.now();
  }, [carouselItems.length]);

  useEffect(() => {
    if (mainCarouselContainerRef.current && carouselItems.length > 0) {
      const containerWidth = mainCarouselContainerRef.current.offsetWidth;
      const itemTotalWidth = CAROUSEL_ITEM_WIDTH * 1.1; // Approx width with some spacing
      const targetOffset = (containerWidth / 2) - (activeIndex * itemTotalWidth) - (itemTotalWidth / 2);
      setCarouselOffset(targetOffset);
    }
  }, [activeIndex, carouselItems.length]);

  const handleCarouselItemClick = useCallback((entity: CarouselDisplayEntity) => {
    if (entity.type === 'category' || entity.type === 'item_stack') {
      setExpandedStackPath(prev => [...prev, entity.id]);
      setOverlayTitle(entity.name); // Set title for potential overlay use
    } else if (entity.type === 'individual_item') {
      // This case should now primarily be handled by clicking items within the overlay
      console.log("Individual item clicked in main carousel (should be rare):", entity.name);
      setOverlayItems([entity]);
      setOverlayTitle(entity.name);
      openOverlay(entity); // Open overlay with the individual item
    }
  }, [openOverlay]); // Added openOverlay to dependency array
  
  const handleUpOrCollapseAction = useCallback(() => {
    if (isOverlayOpen) {
      setIsOverlayOpen(false);
      setOverlayItems([]);
      setOverlayTitle('');
      setSelectedEntityForOverlay(null); // Clear selected entity
    } else if (expandedStackPath.length > 0) {
      setExpandedStackPath(prev => prev.slice(0, -1));
      // Optional: Restore overlay title if needed based on the new deepest stack
      if (expandedStackPath.length > 1) {
        const parentStackId = expandedStackPath[expandedStackPath.length - 2];
        const parentEntity = findEntityByIdRecursive(carouselItems, parentStackId);
        setOverlayTitle(parentEntity?.name || '');
      } else {
        setOverlayTitle('');
      }
    }
  }, [isOverlayOpen, expandedStackPath, carouselItems]);

  const handleDownOrExpandAction = useCallback(() => {
    if (isOverlayOpen) return; // Should not happen if overlay is open

    const currentActiveEntity = carouselItems[activeIndex];
    if (!currentActiveEntity) return;

    if (currentActiveEntity.type === 'category' || currentActiveEntity.type === 'item_stack') {
      setExpandedStackPath(prev => [...prev, currentActiveEntity.id]);
      setOverlayTitle(currentActiveEntity.name);
    } else if (currentActiveEntity.type === 'individual_item') {
      // Directly open overlay for individual item if it's somehow active in main carousel
      setOverlayItems([currentActiveEntity]);
      setOverlayTitle(currentActiveEntity.name);
      openOverlay(currentActiveEntity);
    }
  }, [isOverlayOpen, carouselItems, activeIndex, openOverlay]); // Added openOverlay to dependency array
  
  // This useEffect was causing "Cannot access 'handleDownOrExpandAction' before initialization"
  // Moved handleDownOrExpandAction definition above this.
  useEffect(() => {
    if (carouselItems.length > 0 && activeIndex < carouselItems.length) {
      const currentItem = carouselItems[activeIndex];
      if (currentItem && (currentItem.type === 'category' || currentItem.type === 'item_stack')) {
        // Potentially pre-load or set context for "down" action
      }
    }
  }, [activeIndex, carouselItems]);


  const handleOverlayItemClick = useCallback((item: DisplayIndividualItem) => {
    // This function is for when an item *inside the overlay* is clicked.
    // For now, it just logs, but could open a detail view or equip action.
    console.log("Overlay item clicked:", item.name);
    // Potentially open a TODWindow with item details here
    openTODWindow(
      item.gameItem.name,
      <div className="p-4 font-rajdhani">
        <p className="text-lg font-orbitron mb-2">{item.gameItem.name} L{item.gameItem.level}</p>
        <p className="text-muted-foreground mb-1">{item.gameItem.description}</p>
        <p>Category: {item.gameItem.category}</p>
        <p>Cost: {item.gameItem.cost} ELINT</p>
        <p>Scarcity: {item.gameItem.scarcity}</p>
        {item.gameItem.strength && <p>Strength: {item.gameItem.strength.current}/{item.gameItem.strength.max}</p>}
        {item.inventoryDetails.quantity > 0 && <p>In Stock: {item.inventoryDetails.quantity}</p>}
        <div className="mt-4 flex gap-2">
          <HolographicButton onClick={() => console.log("Equip action for", item.id)} explicitTheme={theme}>Equip</HolographicButton>
          {item.gameItem.level < 8 && (
            <HolographicButton
              onClick={async () => {
                const upgradeCost = (item.gameItem.cost * 0.5) * (item.gameItem.level + 1); // Example cost
                if (playerStats.elintReserves >= upgradeCost) {
                  if (await spendElint(upgradeCost)) {
                    // This is a mock. Real upgrade would involve changing item ID or properties.
                    addMessage({ type: 'notification', text: `Successfully upgraded ${item.gameItem.name} (mock).` });
                  }
                } else {
                  addMessage({ type: 'error', text: `Not enough ELINT to upgrade ${item.gameItem.name}.` });
                }
              }}
              explicitTheme={theme}
            >
              Upgrade (Cost: {((item.gameItem.cost * 0.5) * (item.gameItem.level + 1)).toFixed(0)})
            </HolographicButton>
          )}
        </div>
      </div>,
      { showCloseButton: true }
    );
  }, [theme, openTODWindow, playerStats, spendElint, addMessage]);

  const snapToNearestItemAfterScroll = useCallback((currentOffset: number) => {
    if (carouselItems.length === 0 || !mainCarouselContainerRef.current) return;
    if (!isMouseOverCarouselRef.current && (Date.now() - carouselInteractedTimestampRef.current > 500)) {
      // If mouse isn't over and no recent interaction, don't snap due to external scrolls
      return;
    }

    const containerWidth = mainCarouselContainerRef.current.offsetWidth;
    const itemTotalWidth = CAROUSEL_ITEM_WIDTH * 1.1;
    // Calculate index based on where the center of the container aligns with item centers
    const centerPoint = containerWidth / 2;
    const closestIndex = Math.round((centerPoint - currentOffset - (itemTotalWidth / 2)) / itemTotalWidth);
    const newActiveIndex = Math.max(0, Math.min(carouselItems.length - 1, closestIndex));

    if (activeIndex !== newActiveIndex) {
      setActiveIndex(newActiveIndex);
    }
  }, [carouselItems.length, activeIndex]);

  const debouncedSnapAfterScroll = useMemo(
    () => debounce(snapToNearestItemAfterScroll, 150),
    [snapToNearestItemAfterScroll]
  );

  useEffect(() => {
    if (mainCarouselItems.length > 0 && mainCarouselContainerRef.current) {
       // Only snap if the mouse is (or was recently) over the carousel
      if (isMouseOverCarouselRef.current || (Date.now() - carouselInteractedTimestampRef.current < 300)) {
        debouncedSnapAfterScroll(carouselOffset);
      }
    }
  }, [carouselOffset, mainCarouselItems.length, debouncedSnapAfterScroll]);


  const handleWheelScroll = useCallback((event: WheelEvent) => {
    if (!mainCarouselContainerRef.current || !isMouseOverCarouselRef.current) return;

    event.preventDefault();
    event.stopPropagation();
    carouselInteractedTimestampRef.current = Date.now();

    const newOffset = carouselOffset - event.deltaX;
    const itemTotalWidth = CAROUSEL_ITEM_WIDTH * 1.1;
    const minOffset = (mainCarouselContainerRef.current.offsetWidth / 2) - ((carouselItems.length -1) * itemTotalWidth) - (itemTotalWidth / 2) ;
    const maxOffset = (mainCarouselContainerRef.current.offsetWidth / 2) - (itemTotalWidth / 2);
    
    setCarouselOffset(Math.max(minOffset, Math.min(maxOffset, newOffset)));
    debouncedSnapAfterScroll(newOffset);
  }, [mainCarouselContainerRef, carouselOffset, carouselItems.length, debouncedSnapAfterScroll]);

  useEffect(() => {
    if (!mainCarouselContainerRef.current || carouselItems.length === 0) return;

    const container = mainCarouselContainerRef.current;
    // The wheel event listener is generic, not specific to React WheelEvent
    const wheelHandler = (e: Event) => handleWheelScroll(e as WheelEvent);
    container.addEventListener('wheel', wheelHandler, { passive: false });

    return () => {
      container.removeEventListener('wheel', wheelHandler);
    };
  }, [carouselItems.length, handleWheelScroll]); // Re-attach if items change or handler changes


  // Calculate carousel radius based on container width for responsiveness
  const carouselRadius = useMemo(() => {
    if (mainCarouselContainerRef.current) { 
      return mainCarouselContainerRef.current.offsetWidth / 2 / (2 * Math.tan(Math.PI / MAX_DISPLAY_ENTITIES_MAIN_CAROUSEL));
    }
    return 300; // Default fallback radius
  }, [mainCarouselContainerRef.current?.offsetWidth]);


  // Calculate 3D transforms for each item
  const carouselItemStyles = useMemo(() => {
    if (mainCarouselItems.length === 0) return []; // Now mainCarouselItems is defined earlier
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
  }, [mainCarouselItems.length, rotationY, carouselRadius]); // Adjusted dependencies


  const renderCard = (entity: CarouselDisplayEntity, index: number, isOverlayCard: boolean = false) => {
    // Determine the actual item for styling based on entity type
    // If it's an individual item, use its gameItem. If it's a stack/category, use the entity itself
    const itemForStyling = entity.type === 'individual_item' ? (entity.gameItem || {}) : entity;
    const itemLevelForColor = itemForStyling.level || 1;
    const itemColorCssVar = itemForStyling.colorVar || ITEM_LEVEL_COLORS_CSS_VARS?.[itemLevelForColor as ItemLevel] || 'var(--primary-foreground-hsl)';

    // Fallback for bgClass if not defined in your constants or entity
    const bgClass = 'bg-muted/30'; 

    let content;
    if (entity.type === 'category') {
      content = (
        <>
          <Layers className="w-10 h-10 md:w-12 md:h-12 text-primary mb-2 icon-glow" />
          <p className="text-sm md:text-base font-semibold text-center">{entity.name}</p>
          <p className="text-xs text-muted-foreground">{entity.itemCount} types</p>
        </>
      );
    } else if (entity.type === 'item_stack') {
      content = (
        <>
          <div className="relative w-16 h-16 md:w-20 md:h-20 mb-1">
            <NextImage src={entity.imageSrc || '/images/spi_vs_spi_icon.png'} alt={entity.name} layout="fill" objectFit="contain" data-ai-hint="item stack"/>
          </div>
          <p className="text-xs md:text-sm font-semibold text-center leading-tight">{entity.name}</p>
          <p className="text-xs text-muted-foreground">L{entity.highestLevel} ({entity.items?.length} variants)</p>
        </>
      );
    } else if (entity.type === 'individual_item') {
      const gameItem = entity.gameItem as GameItemBase; // Cast to GameItemBase
      const individualItemEntity = entity as DisplayIndividualItem; // Cast to DisplayIndividualItem
      content = (
        <>
          <div className="relative w-16 h-16 md:w-20 md:h-20 mb-1">
            <NextImage src={gameItem.tileImageSrc || gameItem.imageSrc || '/images/spi_vs_spi_icon.png'} alt={gameItem.name} layout="fill" objectFit="contain" data-ai-hint="item icon"/>
          </div>
          <p className="text-xs md:text-sm font-semibold text-center leading-tight">{gameItem.name}</p>
          <p className="text-xs" style={{ color: `hsl(var(${itemColorCssVar}))` }}>Level {gameItem.level}</p>
          <p className="text-xs text-muted-foreground">x{individualItemEntity.inventoryDetails.quantity}</p>
        </>
      );
    }

    // Define ACTIVE_ITEM_SCALE and INACTIVE_ITEM_SCALE or set them to reasonable defaults
    const ACTIVE_ITEM_SCALE = 1.0; 
    const INACTIVE_ITEM_SCALE = 0.9;

    const isActive = !isOverlayCard && index === activeIndex;
    const scale = isOverlayCard ? 1 : (isActive ? ACTIVE_ITEM_SCALE : INACTIVE_ITEM_SCALE);
    
    // Define OVERLAY_ITEM_WIDTH_VISIBLE and OVERLAY_ITEM_HEIGHT_VISIBLE or set them to reasonable defaults
    const OVERLAY_ITEM_WIDTH_VISIBLE = 150; // Example value
    const OVERLAY_ITEM_HEIGHT_VISIBLE = 150; // Example value


    return (
      <motion.div
        key={entity.id}
        layoutId={isOverlayCard ? undefined : `carousel-item-${entity.id}`}
        onClick={() => isOverlayCard ? handleOverlayItemClick(entity as DisplayIndividualItem) : openOverlay(entity)} // Pass entity to openOverlay
        className={cn(
          "holographic-panel flex flex-col items-center justify-center text-center cursor-pointer",
          "p-2 md:p-3 relative overflow-hidden",
           bgClass // Use the direct Tailwind class for background
        )}
        style={{
          width: isOverlayCard ? OVERLAY_ITEM_WIDTH_VISIBLE : CAROUSEL_ITEM_WIDTH,
          height: CAROUSEL_ITEM_HEIGHT, // Height is always CAROUSEL_ITEM_HEIGHT for consistency
          scale: scale,
          zIndex: isActive ? 10 : 1,
          borderWidth: '1px', 
          borderStyle: 'solid',
          borderColor: `hsl(var(${itemColorCssVar}))`, // Use the CSS variable for border color
          boxShadow: isActive ? `0 0 15px hsl(var(${itemColorCssVar}))` : `0 0 5px hsl(var(${itemColorCssVar}))`,
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.3, delay: isOverlayCard ? index * 0.05 : 0 } }}
        exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {content}
      </motion.div>
    );
  };

  const renderOverlayContent = () => {
    if (!isOverlayOpen || !selectedEntityForOverlay) return null; // Ensure selectedEntityForOverlay exists

    return (
      <motion.div
        key="overlay-content"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-20 bg-black/80 flex flex-col items-center justify-center p-4"
        onClick={(e) => { e.stopPropagation(); closeOverlay();}} // Close on backdrop click
      >
        <motion.div
          className="w-full max-w-3xl p-4 rounded-lg shadow-xl relative"
          style={{ backgroundColor: `hsl(var(--background-hsl))`, borderColor: `hsl(var(--border-hsl))`}} // Themed background for overlay panel
          onClick={(e) => e.stopPropagation()} // Prevent clicks inside from closing
          layoutId={`carousel-item-${expandedStackPath[expandedStackPath.length -1] || 'root'}`}
        >
          <div className="flex justify-between items-center mb-4">
            <HolographicButton onClick={closeOverlay} className="!p-2" explicitTheme={theme}>
              <ArrowLeft className="w-5 h-5" />
            </HolographicButton>
            <h3 className="text-xl font-orbitron holographic-text">{selectedEntityForOverlay.gameItem?.title || `${selectedEntityForOverlay.gameItem?.name || ''} L${selectedEntityForOverlay.gameItem?.level || ''}`}</h3>
            <div className="w-10"> {/* Spacer */} </div>
          </div>

          <div
            ref={overlayScrollContainerRef}
            className="overflow-x-auto overflow-y-hidden whitespace-nowrap pb-4 scrollbar-hide"
            // onWheel prop for horizontal scroll could be added here if desired
          >
            {/* Render selectedEntityForOverlay itself, or its children if it's a stack */}
            <div className="inline-flex space-x-4 px-2">
              <AnimatePresence>
                {selectedEntityForOverlay.type === 'individual_item' && renderCard(selectedEntityForOverlay, 0, true)}
                {selectedEntityForOverlay.type === 'item_stack' && selectedEntityForOverlay.items?.map((item, index) => {
                  const detailedItem: DisplayIndividualItem = {
                    id: item.id,
                    name: item.name,
                    type: 'individual_item',
                    imageSrc: item.imageSrc,
                    level: item.level,
                    colorVar: ITEM_LEVEL_COLORS_CSS_VARS?.[item.level as ItemLevel] ?? ITEM_LEVEL_COLORS_CSS_VARS?.[1] ?? 'var(--primary-foreground-hsl)',
                    gameItem: item,
                    inventoryDetails: { id: item.id, quantity: 1, strength: item.strength }, // Mock quantity if not available
                    isEquipped: false,
                  };
                  return renderCard(detailedItem, index, true);
                })}
              </AnimatePresence>
            </div>
          </div>
          <div className="mt-4 flex justify-center">
             <HolographicButton onClick={openSpyShop} className="!px-4 !py-2" explicitTheme={theme}>
                <ShoppingCart className="w-4 h-4 mr-2" /> Go to Spy Shop
            </HolographicButton>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 md:p-6 h-full max-w-4xl mx-auto">
      <HolographicPanel
        id="equipment-locker-section"
        title="Equipment Locker" 
        className={cn("w-full h-full flex flex-col relative overflow-hidden", isOverlayOpen && "pointer-events-none")} 
        theme={theme}
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
            ref={mainCarouselContainerRef} 
            className="relative w-full h-[300px] flex items-center justify-center rounded-xl bg-gray-900/50 my-4" 
            style={{ perspective: '1000px' }} 
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
          >
            {mainCarouselItems.length > 0 ? (
              <div
                className="relative w-full h-full preserve-3d"
                style={{
                  transformStyle: 'preserve-3d', 
                  transform: `rotateY(${rotationY}rad)`, 
                  transition: isDragging ? 'none' : 'transform 0.1s ease-out' 
                }}
              >
                <AnimatePresence>
                  {mainCarouselItems.map((entity, index) => (
                    <CarouselItem
                      key={entity.id}
                      entity={entity}
                      onClick={openOverlay} // Now uses the defined openOverlay
                      isActive={false} 
                      isEquipped={entity.isEquipped}
                      style={carouselItemStyles[index]} 
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
              `Selected: ${selectedEntityForOverlay?.gameItem?.name || (mainCarouselItems[activeIndex]?.name || 'N/A')} L${selectedEntityForOverlay?.gameItem?.level || (mainCarouselItems[activeIndex]?.level || '')}`
            ) : ""}
          </div>
        </div>

        {/* Overlay for Item Details (if active) */}
        <AnimatePresence>
          {isOverlayOpen && selectedEntityForOverlay && renderOverlayContent()}
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
