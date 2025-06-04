
// src/components/game/tod/EquipmentLockerSection.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { AnimatePresence, motion, PanInfo } from 'framer-motion';
import { useAppContext, type PlayerInventoryItem } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { HolographicButton, HolographicPanel } from '@/components/game/shared/HolographicPanel';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { getItemById, type GameItemBase, type ItemCategory, type ItemLevel } from '@/lib/game-items';
import { ITEM_LEVEL_COLORS_CSS_VARS } from '@/lib/constants';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Layers, ShoppingCart, XCircle } from 'lucide-react'; // Added XCircle for collapse
import NextImage from 'next/image';

const CAROUSEL_ITEM_WIDTH = 160; // width of a single card in px
const CAROUSEL_ITEM_GAP = 20; // gap between cards in px
const EXPANDED_CHILD_ITEM_WIDTH = 120; // width for items inside an expanded stack
const EXPANDED_CHILD_ITEM_GAP = 10;
const MAX_DISPLAY_ENTITIES = 8;

interface DisplayIndividualItem {
  type: 'item';
  id: string;
  item: GameItemBase;
  inventoryQuantity: number;
  currentStrength?: number;
}

interface DisplayItemStack {
  type: 'stack';
  id: string; // e.g., stack_category_Hardware, stack_item_Hardware_cypher_lock
  name: string; // Category name or base item name
  items: DisplayIndividualItem[]; // All individual items that make up this stack
  topItem: GameItemBase;
  count: number;
  isCategoryStack?: boolean; // True if this stack represents a whole category
  categoryName?: ItemCategory; // The category this stack belongs to or represents
  isExpanded?: boolean; // New: True if this stack is currently rendering its children
  childrenToDisplay?: CarouselDisplayEntity[]; // New: Children to render if expanded
}

type CarouselDisplayEntity = DisplayIndividualItem | DisplayItemStack;

const FALLBACK_GAME_ITEM: GameItemBase = {
  id: 'fallback_item_error', name: 'Error Item', description: 'This item could not be loaded.',
  level: 1, cost: 0, scarcity: 'Common', category: 'Hardware', colorVar: 1,
  imageSrc: 'https://placehold.co/128x128/ff0000/ffffff.png?text=ERR',
  tileImageSrc: 'https://placehold.co/128x128/ff0000/ffffff.png?text=ERR',
  dataAiHint: 'error placeholder'
};

const findHighestLevelItem = (items: DisplayIndividualItem[]): GameItemBase => {
  if (!items || items.length === 0) return FALLBACK_GAME_ITEM;
  const validItems = items.filter(di => di && di.item);
  if (validItems.length === 0) return FALLBACK_GAME_ITEM;
  return validItems.reduce((highest: GameItemBase, current: DisplayIndividualItem) => {
    if (!current || !current.item) return highest;
    return current.item.level > highest.level ? current.item : highest;
  }, validItems[0]?.item || FALLBACK_GAME_ITEM);
};

// Helper: Simple groupBy function
function groupBy<T>(array: T[], keyAccessor: (item: T) => string): Record<string, T[]> {
  return array.reduce((result, currentValue) => {
    const groupKey = keyAccessor(currentValue);
    (result[groupKey] = result[groupKey] || []).push(currentValue);
    return result;
  }, {} as Record<string, T[]>);
}

const processInventoryForCarousel = (
  inventory: Record<string, PlayerInventoryItem>,
  expandedStackPath: string[] = []
): CarouselDisplayEntity[] => {
  if (!inventory || Object.keys(inventory).length === 0) return [];

  const detailedInventoryItems: DisplayIndividualItem[] = Object.entries(inventory)
    .flatMap(([itemId, invItem]) => {
      const baseItem = getItemById(itemId);
      if (!baseItem) return [];
      return Array.from({ length: invItem.quantity }, (_, index) => ({
        type: 'item' as 'item',
        id: `${itemId}_instance_${index}`, // Ensure unique ID for each instance
        item: baseItem,
        inventoryQuantity: 1, // Each instance is 1
        currentStrength: invItem.currentStrength,
      }));
    })
    .filter((item): item is DisplayIndividualItem => !!item && !!item.item)
    .sort((a, b) => b.item.level - a.item.level || a.item.name.localeCompare(b.item.name));

  if (detailedInventoryItems.length === 0) return [];

  let currentLevelEntities: CarouselDisplayEntity[] = [];

  if (expandedStackPath.length > 0) {
    const currentStackIdToExpand = expandedStackPath[expandedStackPath.length - 1];
    const parentStackId = expandedStackPath.length > 1 ? expandedStackPath[expandedStackPath.length - 2] : null;

    if (currentStackIdToExpand.startsWith('stack_category_')) {
      const category = currentStackIdToExpand.replace('stack_category_', '') as ItemCategory;
      const itemsInCategory = detailedInventoryItems.filter(di => di.item.category === category);
      const groupedByName = groupBy(itemsInCategory, (di) => di.item.name);
      
      currentLevelEntities = Object.entries(groupedByName).map(([name, itemsInNameGroup]): DisplayItemStack => ({
        type: 'stack',
        id: `stack_item_${category}_${name.toLowerCase().replace(/\s+/g, '_').replace(/[()]/g, '')}`,
        name: name,
        items: itemsInNameGroup,
        topItem: findHighestLevelItem(itemsInNameGroup),
        count: itemsInNameGroup.length,
        categoryName: category,
      })).sort((a,b) => a.name.localeCompare(b.name));

    } else if (currentStackIdToExpand.startsWith('stack_item_')) {
      const stackIdParts = currentStackIdToExpand.split('_');
      const categoryFromId = stackIdParts[2] as ItemCategory;
      const baseNameFromId = stackIdParts.slice(3).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
      currentLevelEntities = detailedInventoryItems.filter(di => di.item.name === baseNameFromId && di.item.category === categoryFromId);
    }
     // If we are deep in an expansion, mark the parent stack as expanded and set its children
     if (parentStackId) {
        const grandParentPath = expandedStackPath.slice(0, -2);
        const parentLevelEntities = processInventoryForCarousel(inventory, grandParentPath); // Get entities at parent level
        return parentLevelEntities.map(entity => {
            if (entity.id === parentStackId && entity.type === 'stack') {
                // Find the specific child stack that is now expanded
                const expandedChildStack = (entity.items // Assuming items are individual items here, need to re-group if parent was category
                    .filter(item => item.item.name === currentLevelEntities[0]?.item?.name) // Find items matching the current expansion
                );
                // This part is tricky: processInventoryForCarousel returns the *current* level.
                // We need to inject the `isExpanded` and `childrenToDisplay` into the *parent's* representation.
                // This logic might need rethinking for deep in-place expansion.
                // For now, returning currentLevelEntities for the deepest expansion.
                return {
                    ...entity,
                    isExpanded: true, // Mark the parent as expanded
                    // childrenToDisplay: currentLevelEntities, // THIS IS WHERE THE MAGIC HAPPENS
                    // The children are actually what currentLevelEntities represent for the *parent's context*
                    // This recursive structure is a bit complex. Let's simplify for now.
                    // For the in-place version, the stack being expanded will have its children processed differently.
                } as DisplayItemStack;

            }
            return entity;
        });
        // This indicates a deeper expansion. The `processInventoryForCarousel` logic
        // as structured returns the items for the *current deepest path*.
        // The in-place expansion will require the *parent stack* to know it's expanded and what children to render.
        return currentLevelEntities; // This is correct for showing the items of the deepest stack.
    }
    return currentLevelEntities;

  } else { // Root level (no expansion path)
    const groupedByNameForRoot = groupBy(detailedInventoryItems, (di) => di.item.name);
    const rootEntitiesByName: CarouselDisplayEntity[] = [];
    Object.entries(groupedByNameForRoot).forEach(([name, items]) => {
      if (items.length === 1) {
        rootEntitiesByName.push(items[0]);
      } else {
        rootEntitiesByName.push({
          type: 'stack',
          id: `stack_item_${items[0].item.category}_${name.toLowerCase().replace(/\s+/g, '_').replace(/[()]/g, '')}`,
          name: name,
          items: items,
          topItem: findHighestLevelItem(items),
          count: items.length,
          categoryName: items[0].item.category,
        });
      }
    });

    if (rootEntitiesByName.length <= MAX_DISPLAY_ENTITIES) {
      return rootEntitiesByName.sort((a, b) => {
          const nameA = a.type === 'item' ? a.item.name : a.name;
          const nameB = b.type === 'item' ? b.item.name : b.name;
          return nameA.localeCompare(nameB);
      });
    }

    // If more than MAX_DISPLAY_ENTITIES by name, group by category
    const groupedByCategory = groupBy(detailedInventoryItems, (di) => di.item.category);
    return Object.entries(groupedByCategory).map(([categoryName, items]): DisplayItemStack => ({
      type: 'stack',
      id: `stack_category_${categoryName as ItemCategory}`,
      name: categoryName as ItemCategory,
      items: items,
      topItem: findHighestLevelItem(items),
      count: items.length,
      isCategoryStack: true,
      categoryName: categoryName as ItemCategory,
    })).sort((a,b) => a.name.localeCompare(b.name));
  }
};


export function EquipmentLockerSection({ parallaxOffset }: { parallaxOffset: number }) {
  const { playerInventory, openTODWindow, openSpyShop, faction } = useAppContext();
  const { theme } = useTheme(); // For themed backgrounds

  const [expandedStackPath, setExpandedStackPath] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [carouselOffset, setCarouselOffset] = useState(0);

  // Determine primary HSL for themed background
  const getPrimaryHslForTheme = useCallback(() => {
    // This needs access to the actual HSL values from ThemeContext or globals.css
    // For simplicity, I'll use a placeholder logic based on faction.
    // A robust solution would involve ThemeContext providing these values.
    if (faction === 'Cyphers') return 'var(--primary-hsl)'; // Assumes primary HSL is set for cyphers
    if (faction === 'Shadows') return 'var(--primary-hsl)'; // Assumes primary HSL is set for shadows
    return 'var(--primary-hsl)'; // Default for Observer or terminal-green
  }, [faction]);


  const carouselItems = useMemo(() => {
    const baseItems = processInventoryForCarousel(playerInventory, expandedStackPath);
    // If a stack is selected and expanded, we modify its representation
    if (selectedEntityId && expandedStackPath.includes(selectedEntityId)) {
      return baseItems.map(entity => {
        if (entity.id === selectedEntityId && entity.type === 'stack') {
          // Get children for this expanded stack
          const children = processInventoryForCarousel(playerInventory, [...expandedStackPath]);
          return { ...entity, isExpanded: true, childrenToDisplay: children };
        }
        return entity;
      });
    }
    return baseItems;
  }, [playerInventory, expandedStackPath, selectedEntityId]);


  const carouselRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    // When carousel items change (e.g., stack expansion/collapse),
    // try to maintain a sensible activeIndex or reset if necessary.
    if (carouselItems.length > 0) {
        const newIndex = Math.max(0, Math.min(carouselItems.length - 1, activeIndex));
        if (newIndex !== activeIndex) {
            setActiveIndex(newIndex);
        }
    } else {
        setActiveIndex(0);
    }
  }, [carouselItems.length]);


  const navigateCarousel = useCallback((direction: number) => {
    if (carouselItems.length === 0) return;
    setActiveIndex(prev => {
      const newIndex = prev + direction;
      return Math.max(0, Math.min(carouselItems.length - 1, newIndex));
    });
  }, [carouselItems.length]);

  useEffect(() => {
    if (carouselRef.current && carouselItems.length > 0) {
      const currentEntity = carouselItems[activeIndex];
      let currentItemWidth = CAROUSEL_ITEM_WIDTH;
      if (currentEntity?.type === 'stack' && currentEntity.isExpanded && currentEntity.childrenToDisplay) {
        // Calculate width for expanded stack
        currentItemWidth = (currentEntity.childrenToDisplay.length * (EXPANDED_CHILD_ITEM_WIDTH + EXPANDED_CHILD_ITEM_GAP)) - EXPANDED_CHILD_ITEM_GAP + 40; // + padding
      }

      let totalWidthBeforeActive = 0;
      for (let i = 0; i < activeIndex; i++) {
        const entity = carouselItems[i];
        if (entity.type === 'stack' && entity.isExpanded && entity.childrenToDisplay) {
          totalWidthBeforeActive += (entity.childrenToDisplay.length * (EXPANDED_CHILD_ITEM_WIDTH + EXPANDED_CHILD_ITEM_GAP)) - EXPANDED_CHILD_ITEM_GAP + 40 + CAROUSEL_ITEM_GAP;
        } else {
          totalWidthBeforeActive += CAROUSEL_ITEM_WIDTH + CAROUSEL_ITEM_GAP;
        }
      }
      
      const targetOffset = -totalWidthBeforeActive + (carouselRef.current.clientWidth / 2 - currentItemWidth / 2);
      setCarouselOffset(targetOffset);

    } else if (carouselItems.length === 0 && carouselRef.current) {
        setCarouselOffset(carouselRef.current.clientWidth / 2 - CAROUSEL_ITEM_WIDTH / 2);
    }
  }, [activeIndex, carouselItems, carouselRef.current?.clientWidth]);


  const openItemActionModal = (displayItem: DisplayIndividualItem) => {
    const item = displayItem.item;
    openTODWindow(
      `${item.name} L${item.level}`,
      <div className="p-4 font-rajdhani text-center space-y-3">
        <NextImage
            src={item.imageSrc || `https://placehold.co/128x128/000000/FFFFFF.png?text=${item.name.substring(0,3)}`}
            alt={item.name}
            width={128} height={128}
            className="mx-auto rounded-md mb-2 object-contain bg-black/20 p-1"
            data-ai-hint={`${item.category} icon large`}
            unoptimized
        />
        <p className="text-lg font-semibold" style={{color: ITEM_LEVEL_COLORS_CSS_VARS[item.level] || 'var(--foreground-hsl)'}}>{item.name} - L{item.level}</p>
        <p className="text-sm text-muted-foreground">{item.description}</p>

        {item.category === 'Hardware' && item.strength && typeof item.strength.current === 'number' && typeof item.strength.max === 'number' && (
          <div className="w-full max-w-xs mx-auto">
            <p className="text-xs text-muted-foreground mt-1">Strength:</p>
            <Progress value={(item.strength.current / item.strength.max) * 100} className="h-2 [&>div]:bg-[var(--progress-color)]" style={{ '--progress-color': ITEM_LEVEL_COLORS_CSS_VARS[item.level] || 'var(--primary-hsl)' } as React.CSSProperties}/>
            <p className="text-xs text-muted-foreground mt-1">{item.strength.current} / {item.strength.max}</p>
          </div>
        )}
        {item.category === 'Infiltration Gear' && typeof item.attackFactor === 'number' && (
           <div className="w-full max-w-xs mx-auto">
            <p className="text-xs text-muted-foreground mt-1">Attack Factor:</p>
            <Progress value={(item.attackFactor / 100) * 100} className="h-2 [&>div]:bg-[var(--progress-color)]" style={{ '--progress-color': ITEM_LEVEL_COLORS_CSS_VARS[item.level] || 'var(--primary-hsl)' } as React.CSSProperties}/>
           </div>
        )}
        {item.type === 'Rechargeable' && (
            <>
              <p className="text-sm">Type: Rechargeable</p>
              {item.perUseCost && <p className="text-sm text-muted-foreground">Recharge Cost: {item.perUseCost} ELINT</p>}
            </>
        )}
        {(item.type === 'Consumable' || item.type === 'One-Time Use') && <p className="text-sm">Type: {item.type}</p>}

        <HolographicButton onClick={() => console.log("Deploy", item.id)} className="w-full">Deploy</HolographicButton>
        {item.type === 'Rechargeable' && (
           <HolographicButton onClick={() => console.log("Recharge", item.id)} className="w-full">Recharge ({item.perUseCost || 'N/A'} ELINT)</HolographicButton>
        )}
        <HolographicButton onClick={() => console.log("Drop", item.id)} className="w-full border-destructive text-destructive hover:bg-destructive hover:text-background">Drop</HolographicButton>
      </div>,
      { showCloseButton: true }
    );
  };

 const handleDownOrExpandAction = () => {
    if (carouselItems.length === 0 || activeIndex < 0 || activeIndex >= carouselItems.length) return;
    const entityAtActiveIndex = carouselItems[activeIndex];
    if (!entityAtActiveIndex) return;

    if (selectedEntityId && selectedEntityId !== entityAtActiveIndex.id) {
      // An item is selected, but it's not the one in the center. Deselect old, select new.
      setSelectedEntityId(entityAtActiveIndex.id);
    } else if (!selectedEntityId) {
      // Nothing is selected, select the one in the center.
      setSelectedEntityId(entityAtActiveIndex.id);
    } else {
      // The item in the center IS the selectedEntityId. Perform expand/action.
      if (entityAtActiveIndex.type === 'stack') {
        // If it's a stack and already selected, expand it.
        setExpandedStackPath(prev => {
            // Prevent re-adding if already the last in path (meaning it's expanded)
            if (prev.length > 0 && prev[prev.length - 1] === entityAtActiveIndex.id) return prev;
            return [...prev, entityAtActiveIndex.id];
        });
        // setSelectedEntityId(null); // Deselect to allow re-selection of children, or keep selected? For now, keep parent selected.
        setActiveIndex(0); // Reset activeIndex for the new view within the stack
      } else if (entityAtActiveIndex.type === 'item') {
        openItemActionModal(entityAtActiveIndex as DisplayIndividualItem);
      }
    }
  };

  const handleUpOrCollapseAction = () => {
    const currentExpandedStackId = expandedStackPath.length > 0 ? expandedStackPath[expandedStackPath.length - 1] : null;

    if (currentExpandedStackId && selectedEntityId === currentExpandedStackId) {
      // If the currently selected entity IS the one defining the current expanded view,
      // then "up" should collapse this view.
      const newPath = expandedStackPath.slice(0, -1);
      setExpandedStackPath(newPath);
      
      const parentViewItems = processInventoryForCarousel(playerInventory, newPath);
      const parentStackIndex = parentViewItems.findIndex(item => item.id === currentExpandedStackId);
      
      setSelectedEntityId(currentExpandedStackId); // Keep the parent stack selected.
      setActiveIndex(parentStackIndex >= 0 ? parentStackIndex : 0);

    } else if (selectedEntityId) {
      // If something else is selected (or nothing is expanded to this specific entity), just deselect.
      setSelectedEntityId(null);
    }
  };


  const handleCardTap = (entity: CarouselDisplayEntity, index: number) => {
    if (isDraggingRef.current) return;

    if (entity.id === selectedEntityId) { // Tapped an already selected card
      if (entity.type === 'stack' && !entity.isExpanded) {
        setExpandedStackPath(prev => [...prev, entity.id]);
        // When expanding a stack by tapping it, it should remain the selectedEntityId
        // And the activeIndex within its children view should be 0
        setActiveIndex(0); 
      } else if (entity.type === 'item') {
        openItemActionModal(entity as DisplayIndividualItem);
      }
      // If it's an expanded stack, tapping again might do nothing or collapse (TBD)
    } else { // Tapped a new card
      setSelectedEntityId(entity.id);
      setActiveIndex(index);
      // If this tap is on a stack that was previously part of an expanded path,
      // we need to truncate expandedStackPath to this stack's level.
      const existingPathIndex = expandedStackPath.indexOf(entity.id);
      if (entity.type === 'stack' && existingPathIndex !== -1) {
        setExpandedStackPath(expandedStackPath.slice(0, existingPathIndex + 1));
      } else if (entity.type === 'stack') {
        // If tapping a new stack not in the current path, reset path to just this stack for potential expansion
        // For now, just selecting it. Expansion happens on subsequent down/tap.
      }
    }
  };
  
  const handleDragEnd = (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    isDraggingRef.current = false;
    if (carouselRef.current && carouselItems.length > 0) {
        const itemPlusGap = CAROUSEL_ITEM_WIDTH + CAROUSEL_ITEM_GAP;
        const currentVisualStartOfCarouselContents = carouselOffset + info.offset.x;
        const viewportCenterLine = carouselRef.current.clientWidth / 2;
        let closestIndex = 0;
        let minDistance = Infinity;
        for (let i = 0; i < carouselItems.length; i++) {
            const entity = carouselItems[i];
            let itemWidth = CAROUSEL_ITEM_WIDTH;
             if (entity.type === 'stack' && entity.isExpanded && entity.childrenToDisplay) {
                itemWidth = (entity.childrenToDisplay.length * (EXPANDED_CHILD_ITEM_WIDTH + EXPANDED_CHILD_ITEM_GAP)) - EXPANDED_CHILD_ITEM_GAP + 40;
            }
            const itemCenterRelative = (i * (CAROUSEL_ITEM_WIDTH + CAROUSEL_ITEM_GAP)) + (itemWidth / 2); // Approximate center for non-expanded
            const itemCenterInViewport = currentVisualStartOfCarouselContents + itemCenterRelative;
            const distanceToViewportCenter = Math.abs(itemCenterInViewport - viewportCenterLine);
            if (distanceToViewportCenter < minDistance) {
                minDistance = distanceToViewportCenter;
                closestIndex = i;
            }
        }
        setActiveIndex(Math.max(0, Math.min(carouselItems.length - 1, closestIndex)));
    } else {
       setActiveIndex(prev => Math.max(0, Math.min(carouselItems.length - 1, prev || 0)));
    }
  };

  const primaryHsl = getPrimaryHslForTheme();
  
  return (
    <HolographicPanel
      className="w-full h-full flex flex-col relative overflow-hidden p-0 md:p-0" // Adjusted padding
      explicitTheme={theme}
    >
      {/* Header Area */}
      <div className="flex-shrink-0 flex justify-between items-center p-2 md:p-4 mb-0 border-b border-current/20">
        <h2 className="text-xl md:text-2xl font-orbitron holographic-text truncate max-w-[calc(100%-150px)]">
          {expandedStackPath.length > 0 && carouselItems[activeIndex]?.type === 'stack'
            ? (carouselItems[activeIndex] as DisplayItemStack).name // Show name of expanded stack
            : expandedStackPath.length > 0 
            ? expandedStackPath[expandedStackPath.length -1].replace('stack_category_', '').replace(/^stack_item_[^_]+_/, '').replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
            : "Equipment Locker"}
        </h2>
        <div className="flex items-center space-x-2">
            <HolographicButton onClick={handleUpOrCollapseAction} disabled={!selectedEntityId && expandedStackPath.length === 0} className="!p-1.5 md:!p-2" title="Go Up / Collapse Stack / Deselect">
                <Layers className="w-4 h-4 md:w-5 md:h-5" />
            </HolographicButton>
            <HolographicButton onClick={openSpyShop} className="!p-1.5 md:!p-2" title="Open Spy Shop">
                <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
            </HolographicButton>
        </div>
      </div>

      {/* Carousel Area */}
      {carouselItems.length === 0 ? (
        <div className="flex-grow flex items-center justify-center">
          <p className="text-muted-foreground font-rajdhani text-lg">Inventory empty.</p>
        </div>
      ) : (
        <div ref={carouselRef} className="flex-grow flex items-center justify-start relative overflow-hidden select-none -mx-2 md:-mx-4">
          <motion.div
              className="flex absolute h-full items-center" 
              drag="x"
              dragConstraints={{ 
                  left: carouselItems.length > 0 ? -(carouselItems.reduce((acc, entity) => {
                      let width = CAROUSEL_ITEM_WIDTH;
                      if (entity.type === 'stack' && entity.isExpanded && entity.childrenToDisplay) {
                          width = (entity.childrenToDisplay.length * (EXPANDED_CHILD_ITEM_WIDTH + EXPANDED_CHILD_ITEM_GAP)) - EXPANDED_CHILD_ITEM_GAP + 40;
                      }
                      return acc + width + CAROUSEL_ITEM_GAP;
                  }, 0) - (carouselRef.current?.clientWidth || 0) + CAROUSEL_ITEM_WIDTH / 2 + CAROUSEL_ITEM_GAP / 2 ) : 0, 
                  right: carouselItems.length > 0 ? ((carouselRef.current?.clientWidth || 0)/2 - CAROUSEL_ITEM_WIDTH/2 - CAROUSEL_ITEM_GAP/2) : 0 
              }}
              onDragStart={() => isDraggingRef.current = true}
              onDragEnd={handleDragEnd}
              animate={{ x: carouselOffset }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{ paddingLeft: CAROUSEL_ITEM_GAP / 2, paddingRight: CAROUSEL_ITEM_GAP / 2 }} 
              layout // Enable layout animations for children reordering/resizing
          >
            {carouselItems.map((entity, index) => {
                const isActuallySelected = entity.id === selectedEntityId;
                let itemForStyling: GameItemBase = entity.type === 'item' ? entity.item : (entity as DisplayItemStack).topItem;
                if (!itemForStyling) itemForStyling = FALLBACK_GAME_ITEM;
                
                const itemLevelForColor = itemForStyling.level || 1;
                const itemColorCssVar = ITEM_LEVEL_COLORS_CSS_VARS[itemLevelForColor] || ITEM_LEVEL_COLORS_CSS_VARS[1];
                
                const baseCardWidth = CAROUSEL_ITEM_WIDTH;
                let animatedWidth = baseCardWidth;
                const isExpandedStack = entity.type === 'stack' && entity.isExpanded && entity.childrenToDisplay && entity.childrenToDisplay.length > 0;

                if (isExpandedStack) {
                    animatedWidth = (entity.childrenToDisplay!.length * (EXPANDED_CHILD_ITEM_WIDTH + EXPANDED_CHILD_ITEM_GAP)) - EXPANDED_CHILD_ITEM_GAP + 30; // + horizontal padding for container
                }

                const scale = isActuallySelected && !isExpandedStack ? 1.15 : 1;
                const opacity = isActuallySelected && !isExpandedStack ? 1 : 0.75;
                const zIndex = isActuallySelected ? carouselItems.length + 1 : carouselItems.length - Math.abs(index - activeIndex);
                const yOffset = isActuallySelected && !isExpandedStack ? -10 : 0;
                
                const cardBgStyle: React.CSSProperties = {
                    background: `hsla(${primaryHsl}, 0.1)`,
                    backdropFilter: 'blur(4px)',
                    borderColor: itemColorCssVar,
                    boxShadow: isActuallySelected ? `0 0 20px 0px ${itemColorCssVar}B3, inset 0 0 12px ${itemColorCssVar}50` : `0 0 8px -3px ${itemColorCssVar}90, inset 0 0 6px ${itemColorCssVar}30`,
                };

                return (
                <motion.div
                    key={entity.id}
                    layout // Enable layout animation for this card
                    className="flex-shrink-0 origin-center cursor-pointer"
                    style={{
                        // width: baseCardWidth, // Initial width, framer-motion will animate if 'animate' prop changes width
                        height: CAROUSEL_ITEM_WIDTH * 1.5, 
                        marginRight: index === carouselItems.length -1 ? 0 : CAROUSEL_ITEM_GAP,
                    }}
                    animate={{ scale, opacity, zIndex, y: yOffset, width: animatedWidth }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    onTap={() => handleCardTap(entity, index)}
                >
                    <div
                        className={cn(
                            "w-full h-full rounded-lg border-2 p-2 flex flex-col items-center justify-start text-center overflow-hidden relative transition-all duration-200",
                            isActuallySelected ? "shadow-2xl" : "shadow-md"
                        )}
                        style={cardBgStyle}
                    >
                        {isExpandedStack ? (
                            // Expanded Stack Rendering
                            <div className="w-full h-full flex flex-col">
                                <div className="flex-shrink-0 flex justify-between items-center w-full p-1 border-b" style={{borderColor: itemColorCssVar}}>
                                    <span className="text-xs font-semibold" style={{color: itemColorCssVar}}>{(entity as DisplayItemStack).name} ({(entity as DisplayItemStack).count})</span>
                                    <HolographicButton 
                                        onClick={(e) => { e.stopPropagation(); handleUpOrCollapseAction();}} 
                                        className="!p-1 !text-xs"
                                        title="Collapse Stack"
                                    >
                                        <XCircle className="w-3 h-3"/>
                                    </HolographicButton>
                                </div>
                                <div className="flex-grow flex items-center overflow-x-auto py-2 px-1 space-x-2 scrollbar-hide">
                                    {(entity as DisplayItemStack).childrenToDisplay?.map(childEntity => {
                                        const childItem = childEntity.type === 'item' ? childEntity.item : (childEntity as DisplayItemStack).topItem || FALLBACK_GAME_ITEM;
                                        const childColorVar = ITEM_LEVEL_COLORS_CSS_VARS[childItem.level || 1] || ITEM_LEVEL_COLORS_CSS_VARS[1];
                                        return (
                                            <div key={childEntity.id} className="flex-shrink-0 rounded border-2 p-1.5 flex flex-col items-center" style={{
                                                width: EXPANDED_CHILD_ITEM_WIDTH, 
                                                height: CAROUSEL_ITEM_WIDTH * 1.5 * 0.8, // Slightly smaller height for children
                                                borderColor: childColorVar,
                                                background: `hsla(${primaryHsl}, 0.15)`, // Slightly different bg for children
                                                backdropFilter: 'blur(2px)'
                                            }}
                                            onClick={(e) => { e.stopPropagation(); if (childEntity.type === 'item') openItemActionModal(childEntity); else handleCardTap(childEntity, -1)/*Or find its index*/;}}
                                            >
                                                 <p className="text-[10px] font-semibold leading-tight mb-0.5" style={{ color: childColorVar }}>
                                                    {childItem.name} L{childItem.level}
                                                </p>
                                                <div className="relative w-full h-1/2 mb-0.5">
                                                   <NextImage src={(childItem.tileImageSrc || childItem.imageSrc) || `https://placehold.co/80x80.png`} alt={childItem.name} layout="fill" objectFit="contain" unoptimized data-ai-hint={`${childItem.category} icon tile`}/>
                                                </div>
                                                {childEntity.type === 'stack' && <p className="text-[9px] text-muted-foreground">(Qty: {(childEntity as DisplayItemStack).count})</p>}
                                                 {/* Simplified strength/attack factor display for children */}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            // Default Card Content (Stack or Individual Item)
                            <>
                                {entity.type === 'stack' && entity.isCategoryStack && (
                                    <div className="absolute -top-[13px] left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full border text-xs font-semibold"
                                        style={{ backgroundColor: `hsl(var(--background-hsl))`, borderColor: itemColorCssVar, color: itemColorCssVar, boxShadow: `0 2px 5px ${itemColorCssVar}50`}}>
                                        {entity.name}
                                    </div>
                                )}
                                <p className="text-xs md:text-sm font-semibold leading-tight mb-1 flex-shrink-0" style={{ color: itemColorCssVar }}>
                                    {itemForStyling.name} L{itemForStyling.level}
                                </p>
                                <div className="relative w-full h-[60%] mb-1 flex-shrink-0"> {/* Adjusted image height */}
                                    <NextImage
                                        src={(itemForStyling.tileImageSrc || itemForStyling.imageSrc) || `https://placehold.co/128x128.png`}
                                        alt={itemForStyling.name} layout="fill" objectFit="contain" className="drop-shadow-md"
                                        data-ai-hint={`${itemForStyling.category} icon tile`} unoptimized
                                    />
                                </div>
                                <div className="flex flex-col items-center w-full flex-grow justify-end text-[10px] md:text-xs mt-auto">
                                    {entity.type === 'stack' && !entity.isCategoryStack && (
                                        <p className="text-muted-foreground mb-0.5">(Quantity: {entity.count})</p>
                                    )}
                                    {itemForStyling.category === 'Hardware' && itemForStyling.strength?.max && (
                                        <div className="w-full px-1 mt-0.5">
                                            <p className="text-[9px] text-muted-foreground">Strength</p>
                                            <Progress value={((itemForStyling.strength.current ?? itemForStyling.strength.max) / itemForStyling.strength.max) * 100} className="h-1.5 [&>div]:bg-[var(--progress-color)]" style={{ '--progress-color': itemColorCssVar } as React.CSSProperties} />
                                        </div>
                                    )}
                                    {itemForStyling.category === 'Infiltration Gear' && typeof itemForStyling.attackFactor === 'number' && (
                                        <div className="w-full px-1 mt-0.5">
                                            <p className="text-[9px] text-muted-foreground">Attack Factor</p>
                                            <Progress value={(itemForStyling.attackFactor / 100) * 100} className="h-1.5 [&>div]:bg-[var(--progress-color)]" style={{ '--progress-color': itemColorCssVar } as React.CSSProperties} />
                                        </div>
                                    )}
                                    {itemForStyling.type === 'Rechargeable' && (
                                        <div className="mt-0.5 text-center">
                                            <p style={{ color: itemColorCssVar }}>Type: Rechargeable</p>
                                            {itemForStyling.perUseCost && <p className="text-muted-foreground text-[9px]">Cost: {itemForStyling.perUseCost} ELINT</p>}
                                        </div>
                                    )}
                                    {(itemForStyling.type === 'Consumable' || itemForStyling.type === 'One-Time Use') && (
                                        <p className="mt-0.5" style={{ color: itemColorCssVar }}>Type: {itemForStyling.type}</p>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </motion.div>
                );
            })}
            </motion.div>
        </div>
      )}
      {/* Button Bar Area - Separate from Carousel for gesture isolation */}
      <div className="flex-shrink-0 flex justify-center items-center space-x-2 p-2 mt-auto z-20 bg-transparent">
        <HolographicButton onClick={() => navigateCarousel(-1)} disabled={carouselItems.length <= 1 || activeIndex === 0} className="!p-1.5 md:!p-2">
            <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
        </HolographicButton>
        <HolographicButton onClick={handleDownOrExpandAction} disabled={carouselItems.length === 0} className="!p-1.5 md:!p-2">
            <ChevronDown className="w-4 h-4 md:w-5 md:h-5" />
        </HolographicButton>
        <HolographicButton onClick={handleUpOrCollapseAction} disabled={!selectedEntityId && expandedStackPath.length === 0} className="!p-1.5 md:!p-2">
            <ChevronUp className="w-4 h-4 md:w-5 md:h-5" />
        </HolographicButton>
        <HolographicButton onClick={() => navigateCarousel(1)} disabled={carouselItems.length <= 1 || activeIndex === carouselItems.length - 1} className="!p-1.5 md:!p-2">
            <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
        </HolographicButton>
      </div>
    </HolographicPanel>
  );
}

