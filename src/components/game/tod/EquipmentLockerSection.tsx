
// src/components/game/tod/EquipmentLockerSection.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { AnimatePresence, motion, PanInfo } from 'framer-motion';
import { useAppContext, type PlayerInventoryItem } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { HolographicButton } from '@/components/game/shared/HolographicPanel';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { getItemById, type GameItemBase, type ItemCategory, type ItemLevel } from '@/lib/game-items';
import { ITEM_LEVEL_COLORS_CSS_VARS } from '@/lib/constants';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ShoppingCart, ArrowLeft, XCircle } from 'lucide-react';
import NextImage from 'next/image';

const CAROUSEL_ITEM_WIDTH = 160;
const CAROUSEL_ITEM_GAP = 20;
const OVERLAY_CHILD_ITEM_WIDTH = 130;
const OVERLAY_CHILD_ITEM_GAP = 15;
const MAX_DISPLAY_ENTITIES_MAIN_CAROUSEL = 8;

interface DisplayIndividualItem {
  type: 'item';
  id: string;
  item: GameItemBase;
  inventoryQuantity: number; // Should be 1 for individual display
  currentStrength?: number;
}

interface DisplayItemStack {
  type: 'stack';
  id: string; // e.g., stack_category_Hardware, stack_item_Hardware_cypher_lock
  name: string; // Category name or base item name
  items: DisplayIndividualItem[]; // All individual items within this stack
  topItem: GameItemBase; // Highest level item for visual representation
  count: number; // Total number of individual items in this stack
  isCategoryStack?: boolean; // True if this stack represents a whole category
  categoryName?: ItemCategory; // The category this stack belongs to
}

type CarouselDisplayEntity = DisplayIndividualItem | DisplayItemStack;

const FALLBACK_GAME_ITEM: GameItemBase = {
  id: 'fallback_item_error', name: 'Error Item', description: 'This item could not be loaded.',
  level: 1, cost: 0, scarcity: 'Common', category: 'Hardware', colorVar: 1,
  imageSrc: 'https://placehold.co/128x128/ff0000/ffffff.png?text=ERR',
  tileImageSrc: 'https://placehold.co/128x128/ff0000/ffffff.png?text=ERR',
  dataAiHint: "error placeholder"
};

const findHighestLevelItem = (items: DisplayIndividualItem[]): GameItemBase => {
  if (!items || items.length === 0) return FALLBACK_GAME_ITEM;
  const validItems = items.filter(di => di && di.item);
  if (validItems.length === 0) return FALLBACK_GAME_ITEM;
  return validItems.reduce((highest: GameItemBase, current: DisplayIndividualItem) => {
    if (!current || !current.item) return highest; // Should not happen if validItems filter works
    return current.item.level > highest.level ? current.item : highest;
  }, validItems[0]?.item || FALLBACK_GAME_ITEM);
};

function groupBy<T>(array: T[], keyAccessor: (item: T) => string): Record<string, T[]> {
  return array.reduce((result, currentValue) => {
    const groupKey = keyAccessor(currentValue);
    (result[groupKey] = result[groupKey] || []).push(currentValue);
    return result;
  }, {} as Record<string, T[]>);
}

const processInventoryForCarousel = (
  inventory: Record<string, PlayerInventoryItem>,
  currentExpansionPath: string[] = []
): CarouselDisplayEntity[] => {
  if (!inventory || Object.keys(inventory).length === 0) return [];

  const allDetailedInventoryItems: DisplayIndividualItem[] = Object.entries(inventory)
    .flatMap(([itemId, invItem]) => {
      const baseItem = getItemById(itemId);
      if (!baseItem) {
        console.warn(`[processInventory] Base item not found for itemId: ${itemId}`);
        return [];
      }
      // Create one DisplayIndividualItem for each unit in quantity
      return Array.from({ length: invItem.quantity }, (_, index) => ({
        type: 'item' as 'item',
        id: `${itemId}_instance_${index}`,
        item: baseItem,
        inventoryQuantity: 1, // Each instance is 1
        currentStrength: invItem.currentStrength,
      }));
    })
    .filter((item): item is DisplayIndividualItem => !!item && !!item.item) // Ensure item and item.item are defined
    .sort((a, b) => b.item.level - a.item.level || a.item.name.localeCompare(b.item.name));

  if (allDetailedInventoryItems.length === 0) return [];

  if (currentExpansionPath.length > 0) {
    const deepestStackId = currentExpansionPath[currentExpansionPath.length - 1];

    if (deepestStackId.startsWith('stack_category_')) {
      const category = deepestStackId.replace('stack_category_', '') as ItemCategory;
      const itemsInCategory = allDetailedInventoryItems.filter(di => di.item.category === category);
      const groupedByName = groupBy(itemsInCategory, (di) => di.item.name);

      return Object.entries(groupedByName).map(([name, itemsInNameGroup]): DisplayItemStack => ({
        type: 'stack',
        id: `stack_item_${category}_${name.toLowerCase().replace(/\s+/g, '_').replace(/[()]/g, '')}`,
        name: name,
        items: itemsInNameGroup,
        topItem: findHighestLevelItem(itemsInNameGroup),
        count: itemsInNameGroup.length,
        categoryName: category,
      })).sort((a,b) => a.name.localeCompare(b.name));

    } else if (deepestStackId.startsWith('stack_item_')) {
      // Expanding a stack of identical items (e.g., all "Basic Pick L1")
      const stackIdParts = deepestStackId.split('_');
      const categoryFromId = stackIdParts[2] as ItemCategory;
      const baseNameFromIdParts = stackIdParts.slice(3);
      const baseNameFromId = baseNameFromIdParts.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
      
      // Return all individual instances of this specific item (e.g., all 11 Basic Pick L1s)
      return allDetailedInventoryItems.filter(di => di.item.name === baseNameFromId && di.item.category === categoryFromId);
    }
    return []; // Should not happen if path is valid
  } else { // Root level of the carousel
    const groupedByNameForRoot = groupBy(allDetailedInventoryItems, (di) => di.item.name);
    const rootEntitiesByName: CarouselDisplayEntity[] = [];

    Object.entries(groupedByNameForRoot).forEach(([name, items]) => {
      if (items.length === 1) {
        rootEntitiesByName.push(items[0]); // Show as individual item if only one instance exists across all levels
      } else {
        // If multiple instances of the same base name (could be different levels or same level)
        // We need to check if all items in this group are *identical* (same ID, thus same level)
        const firstItemId = items[0].item.id;
        const allSameSpecificItem = items.every(it => it.item.id === firstItemId);

        if (allSameSpecificItem) { // All are, e.g., "Basic Pick L1"
             rootEntitiesByName.push({
                type: 'stack',
                id: `stack_item_${items[0].item.category}_${name.toLowerCase().replace(/\s+/g, '_').replace(/[()]/g, '')}`,
                name: name, // Base name like "Basic Pick"
                items: items, // All instances
                topItem: items[0].item, // All are the same item, so take the first
                count: items.length,
                categoryName: items[0].item.category,
            });
        } else { // Mixed levels of the same base item name, e.g., "Cypher Lock L1" and "Cypher Lock L2"
            // This case is more complex. For root view, if not exceeding MAX_DISPLAY_ENTITIES_MAIN_CAROUSEL,
            // we might show them as individual stacks per level or individual items if count is 1 per level.
            // For now, let's simplify: if MAX_DISPLAY_ENTITIES_MAIN_CAROUSEL is exceeded, we group by category.
            // This logic branch might need refinement if mixed-level stacks are desired at root.
            // Current behavior: still groups them under one name, topItem is highest level.
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
      }
    });
    
    if (rootEntitiesByName.length <= MAX_DISPLAY_ENTITIES_MAIN_CAROUSEL) {
      return rootEntitiesByName.sort((a, b) => {
        const nameA = a.type === 'item' ? a.item.name : a.name;
        const nameB = b.type === 'item' ? b.item.name : b.name;
        return nameA.localeCompare(nameB);
      });
    }

    // If too many unique item names, group by category for the root view
    const groupedByCategory = groupBy(allDetailedInventoryItems, (di) => di.item.category);
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
  const { theme } = useTheme();

  const [carouselItems, setCarouselItems] = useState<CarouselDisplayEntity[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [carouselOffset, setCarouselOffset] = useState(0);
  
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [overlayItems, setOverlayItems] = useState<CarouselDisplayEntity[]>([]);
  const [expandedStackPath, setExpandedStackPath] = useState<string[]>([]);

  const mainCarouselContainerRef = useRef<HTMLDivElement>(null); // For main carousel width calculation
  const mainCarouselRef = useRef<HTMLDivElement>(null); // Ref for the draggable motion.div
  const overlayContentRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const mainCarouselSnapshotRef = useRef<{ activeIndex: number, offset: number } | null>(null);

  useEffect(() => {
    const newMainItems = processInventoryForCarousel(playerInventory, []);
    setCarouselItems(newMainItems);
    setActiveIndex(newMainItems.length > 0 ? Math.floor(newMainItems.length / 2) : 0);
    setIsOverlayOpen(false);
    setExpandedStackPath([]);
  }, [playerInventory]);

  useEffect(() => {
    if (isOverlayOpen && expandedStackPath.length > 0) {
      const newOverlayItems = processInventoryForCarousel(playerInventory, expandedStackPath);
      setOverlayItems(newOverlayItems);
    } else if (!isOverlayOpen) {
      setOverlayItems([]);
    }
  }, [isOverlayOpen, expandedStackPath, playerInventory]);

  const navigateCarousel = useCallback((direction: number) => {
    if (carouselItems.length === 0) return;
    setActiveIndex(prev => {
      const newIndex = prev + direction;
      return Math.max(0, Math.min(carouselItems.length - 1, newIndex));
    });
  }, [carouselItems.length]);

  useEffect(() => {
    if (mainCarouselContainerRef.current && carouselItems.length > 0 && !isOverlayOpen) {
      const itemWidth = CAROUSEL_ITEM_WIDTH;
      const totalWidthBeforeActive = activeIndex * (itemWidth + CAROUSEL_ITEM_GAP);
      const targetOffset = -totalWidthBeforeActive + (mainCarouselContainerRef.current.clientWidth / 2 - itemWidth / 2);
      setCarouselOffset(targetOffset);
    } else if (carouselItems.length === 0 && mainCarouselContainerRef.current) {
        setCarouselOffset(mainCarouselContainerRef.current.clientWidth / 2 - CAROUSEL_ITEM_WIDTH / 2);
    }
  }, [activeIndex, carouselItems, mainCarouselContainerRef.current?.clientWidth, isOverlayOpen]);

  const openItemActionModal = (displayItem: DisplayIndividualItem) => {
    const item = displayItem.item;
    openTODWindow(
      `${item.name} L${item.level}`,
      <div className="p-4 font-rajdhani text-center space-y-3">
        <NextImage
            src={item.tileImageSrc || item.imageSrc || `https://placehold.co/128x128.png?text=${item.name.substring(0,3)}`}
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
            <Progress value={((item.strength.current ?? item.strength.max) / item.strength.max) * 100} className="h-2 [&>div]:bg-[var(--progress-color)]" style={{ '--progress-color': ITEM_LEVEL_COLORS_CSS_VARS[item.level] || 'var(--primary-hsl)' } as React.CSSProperties}/>
            <p className="text-xs text-muted-foreground mt-1">{item.strength.current ?? item.strength.max} / {item.strength.max}</p>
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

  const handleEntityInteractionInOverlay = (entity: CarouselDisplayEntity) => {
    if (entity.type === 'stack') {
      setExpandedStackPath(prev => [...prev, entity.id]);
    } else if (entity.type === 'item') {
      openItemActionModal(entity as DisplayIndividualItem);
    }
  };
  
  const handleMainCarouselCardTap = (entity: CarouselDisplayEntity, index: number) => {
    if (isDraggingRef.current) return;
    setActiveIndex(index);
    // No immediate action on tap; "Down" button will handle expansion/modal.
  };

  const handleDownOrExpandAction = () => {
    if (isOverlayOpen) {
        if (overlayItems.length > 0) {
            // For now, let's assume the first item in overlay is targeted if no specific selection mechanism exists within overlay
            handleEntityInteractionInOverlay(overlayItems[0]);
        }
        return;
    }

    if (carouselItems.length === 0) return;
    const entityAtActiveIndex = carouselItems[activeIndex];
    if (!entityAtActiveIndex) return;

    if (entityAtActiveIndex.type === 'stack') {
      if (mainCarouselRef.current) { // Ensure mainCarouselRef.current is used here
        mainCarouselSnapshotRef.current = { activeIndex, offset: carouselOffset };
      }
      setExpandedStackPath([entityAtActiveIndex.id]);
      setIsOverlayOpen(true);
    } else if (entityAtActiveIndex.type === 'item') {
      openItemActionModal(entityAtActiveIndex as DisplayIndividualItem);
    }
  };
  
  const handleUpOrCollapseAction = () => {
    if (expandedStackPath.length > 0) {
      const newPath = expandedStackPath.slice(0, -1);
      setExpandedStackPath(newPath);

      if (newPath.length === 0) {
        setIsOverlayOpen(false);
        if (mainCarouselSnapshotRef.current) {
            const restoredActiveIndex = mainCarouselSnapshotRef.current.activeIndex;
            // Ensure activeIndex is valid for current carouselItems
            setActiveIndex(Math.min(restoredActiveIndex, carouselItems.length > 0 ? carouselItems.length - 1 : 0));
            mainCarouselSnapshotRef.current = null;
        } else if (carouselItems.length > 0) {
            // If no snapshot, try to find the parent stack in current carouselItems
            const parentStackId = expandedStackPath[expandedStackPath.length -1]; // ID of the stack that was just closed
            const parentIndexInMain = carouselItems.findIndex(item => item.id === parentStackId);
            if (parentIndexInMain !== -1) {
                setActiveIndex(parentIndexInMain);
            }
        }
      }
    }
  };
  
  const handleDragEnd = (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    isDraggingRef.current = false;
    if (mainCarouselContainerRef.current && carouselItems.length > 0) {
        const itemPlusGap = CAROUSEL_ITEM_WIDTH + CAROUSEL_ITEM_GAP;
        const currentVisualStartOfCarouselContents = carouselOffset + info.offset.x;
        const viewportCenterLine = mainCarouselContainerRef.current.clientWidth / 2;
        
        let cumulativeWidth = 0;
        let closestIndex = 0;
        let minDistance = Infinity;

        for (let i = 0; i < carouselItems.length; i++) {
            const itemWidth = CAROUSEL_ITEM_WIDTH;
            const itemCenterRelative = cumulativeWidth + (itemWidth / 2);
            const itemCenterInViewport = currentVisualStartOfCarouselContents + itemCenterRelative;
            const distanceToViewportCenter = Math.abs(itemCenterInViewport - viewportCenterLine);

            if (distanceToViewportCenter < minDistance) {
                minDistance = distanceToViewportCenter;
                closestIndex = i;
            }
            cumulativeWidth += itemWidth + CAROUSEL_ITEM_GAP;
        }
        setActiveIndex(Math.max(0, Math.min(carouselItems.length - 1, closestIndex)));
    }
  };

  const renderCard = (entity: CarouselDisplayEntity | undefined, isOverlayChild: boolean, indexInCurrentView?: number, isMainActive?: boolean) => {
    if (!entity) {
        console.warn("Attempted to render an undefined entity in carousel.");
        return <div key={`empty-card-${indexInCurrentView || Math.random()}`} className="w-0 h-0" />;
    }

    let itemForStyling = entity.type === 'item' ? entity.item : (entity as DisplayItemStack).topItem;
    
    if (!itemForStyling) {
      console.warn("[RenderCard] itemForStyling is undefined for entity:", JSON.stringify(entity));
      itemForStyling = FALLBACK_GAME_ITEM; // Use fallback
    }

    const itemLevelForColor = itemForStyling.level || 1;
    // ITEM_LEVEL_COLORS_CSS_VARS maps level number to "var(--level-X-color)"
    const itemLevelColorVar = ITEM_LEVEL_COLORS_CSS_VARS[itemLevelForColor] || ITEM_LEVEL_COLORS_CSS_VARS[1];
    
    const scale = isMainActive ? 1.15 : 1;
    const opacity = isMainActive ? 1 : 0.75;
    const yOffset = isMainActive ? -10 : 0;
    const zIndexVal = isMainActive ? 20 : (isOverlayChild ? 5 : 10); // Overlay children above non-active main, active main above all

    const cardStyle: React.CSSProperties = {
        borderColor: `hsl(${itemLevelColorVar.replace('var(','').replace(')','')})`, // Use HSL var for border
        boxShadow: isMainActive ? `0 0 20px 0px hsla(${itemLevelColorVar.replace('var(','').replace(')','')}, 0.7), inset 0 0 12px hsla(${itemLevelColorVar.replace('var(','').replace(')','')}, 0.3)` 
                               : `0 0 8px -3px hsla(${itemLevelColorVar.replace('var(','').replace(')','')}, 0.5), inset 0 0 6px hsla(${itemLevelColorVar.replace('var(','').replace(')','')}, 0.2)`,
        zIndex: zIndexVal,
    };
    
    return (
        <motion.div
            key={entity.id}
            layout
            className={cn(
                "flex-shrink-0 origin-center cursor-pointer rounded-lg border-2 p-2 flex flex-col items-center justify-start text-center overflow-hidden relative transition-all duration-200 aspect-[3/4]",
                `bg-[${itemLevelColorVar}]/10 backdrop-blur-sm`, // Tailwind JIT for bg with opacity
                isMainActive ? "shadow-2xl" : "shadow-md"
            )}
            style={{
                width: isOverlayChild ? OVERLAY_CHILD_ITEM_WIDTH : CAROUSEL_ITEM_WIDTH,
                marginRight: isOverlayChild ? (indexInCurrentView === (overlayItems.length -1) ? 0 : OVERLAY_CHILD_ITEM_GAP) : (indexInCurrentView === (carouselItems.length-1) ? 0 : CAROUSEL_ITEM_GAP),
                ...cardStyle
            }}
            animate={isOverlayChild ? {} : { scale, opacity, y: yOffset }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onTap={() => isOverlayChild ? handleEntityInteractionInOverlay(entity) : handleMainCarouselCardTap(entity, indexInCurrentView ?? 0)}
        >
            {entity.type === 'stack' && entity.isCategoryStack && (
                <div className="absolute -top-[13px] left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full border text-xs font-semibold"
                    style={{ backgroundColor: `hsl(var(--background-hsl))`, borderColor: `hsl(${itemLevelColorVar.replace('var(','').replace(')','')})`, color: `hsl(${itemLevelColorVar.replace('var(','').replace(')','')})`, boxShadow: `0 2px 5px hsla(${itemLevelColorVar.replace('var(','').replace(')','')}, 0.3)`}}>
                    {entity.name}
                </div>
            )}
            <p className="text-xs md:text-sm font-semibold leading-tight mb-1 flex-shrink-0 truncate w-full px-1" style={{ color: `hsl(${itemLevelColorVar.replace('var(','').replace(')','')})` }}>
                {itemForStyling.name} L{itemForStyling.level}
            </p>
            <div className="relative w-full h-2/3 mb-1 flex-shrink-0">
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
                        <Progress value={((itemForStyling.strength.current ?? itemForStyling.strength.max) / itemForStyling.strength.max) * 100} className="h-1.5 [&>div]:bg-[var(--progress-color)]" style={{ '--progress-color': itemLevelColorVar } as React.CSSProperties} />
                    </div>
                )}
                {itemForStyling.category === 'Infiltration Gear' && typeof itemForStyling.attackFactor === 'number' && (
                    <div className="w-full px-1 mt-0.5">
                        <p className="text-[9px] text-muted-foreground">Attack Factor</p>
                        <Progress value={(itemForStyling.attackFactor / 100) * 100} className="h-1.5 [&>div]:bg-[var(--progress-color)]" style={{ '--progress-color': itemLevelColorVar } as React.CSSProperties} />
                    </div>
                )}
                {itemForStyling.type === 'Rechargeable' && (
                    <div className="mt-0.5 text-center">
                        <p style={{ color: `hsl(${itemLevelColorVar.replace('var(','').replace(')','')})` }}>Type: Rechargeable</p>
                        {itemForStyling.perUseCost && <p className="text-muted-foreground text-[9px]">Recharge Cost: {itemForStyling.perUseCost} ELINT</p>}
                    </div>
                )}
                {(itemForStyling.type === 'Consumable' || itemForStyling.type === 'One-Time Use') && (
                    <p className="mt-0.5" style={{ color: `hsl(${itemLevelColorVar.replace('var(','').replace(')','')})` }}>Type: {itemForStyling.type}</p>
                )}
            </div>
        </motion.div>
    );
  };
  
  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden p-2 md:p-4 bg-transparent">
      <div className="flex-shrink-0 flex justify-between items-center p-3 md:p-4 border-b border-current/20">
        <h2 className="text-xl md:text-2xl font-orbitron holographic-text truncate max-w-[calc(100%-100px)]">
          Equipment Locker
        </h2>
        <div className="flex items-center space-x-2">
            <HolographicButton onClick={openSpyShop} className="!p-1.5 md:!p-2" title="Open Spy Shop">
                <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
            </HolographicButton>
        </div>
      </div>

        <div ref={mainCarouselContainerRef} className="flex-grow flex items-center justify-start relative overflow-hidden select-none -mx-2 md:-mx-4">
          <AnimatePresence>
          {!isOverlayOpen && carouselItems.length > 0 && (
            <motion.div
                key="main-carousel-draggable"
                ref={mainCarouselRef} // Attach the ref here
                className="flex absolute h-full items-center" 
                drag="x"
                dragConstraints={{ 
                    left: carouselItems.length > 0 ? -(carouselItems.reduce((acc, item) => acc + (item ? CAROUSEL_ITEM_WIDTH : 0) + CAROUSEL_ITEM_GAP, 0) - (mainCarouselContainerRef.current?.clientWidth || 0) + CAROUSEL_ITEM_WIDTH / 2 + CAROUSEL_ITEM_GAP / 2 ) : 0, 
                    right: carouselItems.length > 0 ? ((mainCarouselContainerRef.current?.clientWidth || 0)/2 - CAROUSEL_ITEM_WIDTH/2 - CAROUSEL_ITEM_GAP/2) : 0 
                }}
                onDragStart={() => isDraggingRef.current = true}
                onDragEnd={handleDragEnd}
                animate={{ x: carouselOffset }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                style={{ paddingLeft: CAROUSEL_ITEM_GAP / 2, paddingRight: CAROUSEL_ITEM_GAP / 2 }} 
            >
              {carouselItems.map((entity, index) => renderCard(entity, false, index, index === activeIndex))}
            </motion.div>
          )}
           {!isOverlayOpen && carouselItems.length === 0 && (
                <div className="flex-grow flex items-center justify-center w-full">
                    <p className="text-muted-foreground font-rajdhani text-lg">Inventory empty.</p>
                </div>
            )}
          </AnimatePresence>
        </div>

      {/* Overlay Window for Expanded Stacks */}
      <AnimatePresence>
        {isOverlayOpen && (
          <motion.div
            key="overlay-window"
            className="fixed inset-0 z-30 flex flex-col items-center justify-center p-4 bg-black/50" // Semi-transparent full screen backdrop
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "circOut" }}
          >
            <motion.div
              className="relative w-full max-w-3xl p-4 rounded-lg" // No explicit bg or border for the content box itself
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2, ease: "circOut" }}
            >
              <div className="flex justify-start mb-3">
                  <HolographicButton onClick={handleUpOrCollapseAction} className="!p-1.5 !bg-transparent hover:!bg-black/30" title="Back/Collapse">
                      <ArrowLeft className="w-5 h-5" />
                  </HolographicButton>
              </div>
              <div ref={overlayContentRef} className="flex overflow-x-auto overflow-y-hidden items-center p-2 scrollbar-hide -mx-2"> {/* Negative margin to allow edge cards to be fully visible if needed */}
                {overlayItems.map((entity, index) => renderCard(entity, true, index, false))}
              </div>
              {overlayItems.length === 0 && (
                <p className="text-center text-muted-foreground flex-grow flex items-center justify-center">This stack is empty.</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-shrink-0 flex justify-center items-center space-x-2 p-8 mt-auto z-20 bg-transparent"> {/* Increased padding to p-8 */}
        <HolographicButton onClick={() => navigateCarousel(-1)} disabled={carouselItems.length <= 1 || activeIndex === 0 || isOverlayOpen} className="!p-1.5 md:!p-2">
            <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
        </HolographicButton>
        <HolographicButton onClick={handleDownOrExpandAction} disabled={(carouselItems.length === 0 && !isOverlayOpen) || (isOverlayOpen && overlayItems.length === 0) } className="!p-1.5 md:!p-2">
            <ChevronDown className="w-4 h-4 md:w-5 md:h-5" />
        </HolographicButton>
        <HolographicButton onClick={handleUpOrCollapseAction} disabled={!isOverlayOpen && expandedStackPath.length === 0} className="!p-1.5 md:!p-2"> 
            <ChevronUp className="w-4 h-4 md:w-5 md:h-5" />
        </HolographicButton>
        <HolographicButton onClick={() => navigateCarousel(1)} disabled={carouselItems.length <= 1 || activeIndex === carouselItems.length - 1 || isOverlayOpen} className="!p-1.5 md:!p-2">
            <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
        </HolographicButton>
      </div>
    </div>
  );
}
    
