
// src/components/game/tod/EquipmentLockerSection.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { AnimatePresence, motion, PanInfo } from 'framer-motion';
import { useAppContext, type PlayerInventoryItem } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { HolographicButton } from '@/components/game/shared/HolographicPanel'; // HolographicPanel removed as root
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { getItemById, type GameItemBase, type ItemCategory, type ItemLevel } from '@/lib/game-items';
import { ITEM_LEVEL_COLORS_CSS_VARS } from '@/lib/constants';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Layers, ShoppingCart, XCircle, ArrowLeft } from 'lucide-react';
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
  inventoryQuantity: number;
  currentStrength?: number;
}

interface DisplayItemStack {
  type: 'stack';
  id: string;
  name: string;
  items: DisplayIndividualItem[];
  topItem: GameItemBase;
  count: number;
  isCategoryStack?: boolean;
  categoryName?: ItemCategory;
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
    if (!current || !current.item) return highest;
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
      if (!baseItem) return [];
      return Array.from({ length: invItem.quantity }, (_, index) => ({
        type: 'item' as 'item',
        id: `${itemId}_instance_${index}`, // Ensure unique ID for each instance
        item: baseItem,
        inventoryQuantity: 1,
        currentStrength: invItem.currentStrength,
      }));
    })
    .filter((item): item is DisplayIndividualItem => !!item && !!item.item)
    .sort((a, b) => b.item.level - a.item.level || a.item.name.localeCompare(b.item.name));

  if (allDetailedInventoryItems.length === 0) return [];

  let itemsToProcess = allDetailedInventoryItems;

  if (currentExpansionPath.length > 0) {
    const deepestStackId = currentExpansionPath[currentExpansionPath.length - 1];
    if (deepestStackId.startsWith('stack_category_')) {
      const category = deepestStackId.replace('stack_category_', '') as ItemCategory;
      itemsToProcess = allDetailedInventoryItems.filter(di => di.item.category === category);
      const groupedByName = groupBy(itemsToProcess, (di) => di.item.name);
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
      const stackIdParts = deepestStackId.split('_');
      const categoryFromId = stackIdParts[2] as ItemCategory; // Assuming category is always 3rd part
      const baseNameFromIdParts = stackIdParts.slice(3);
      const baseNameFromId = baseNameFromIdParts.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
      
      return allDetailedInventoryItems.filter(di => di.item.name === baseNameFromId && di.item.category === categoryFromId);
    }
    return [];
  } else {
    const groupedByNameForRoot = groupBy(itemsToProcess, (di) => di.item.name);
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

    if (rootEntitiesByName.length <= MAX_DISPLAY_ENTITIES_MAIN_CAROUSEL) {
      return rootEntitiesByName.sort((a, b) => {
        const nameA = a.type === 'item' ? a.item.name : a.name;
        const nameB = b.type === 'item' ? b.item.name : b.name;
        return nameA.localeCompare(nameB);
      });
    }

    const groupedByCategory = groupBy(itemsToProcess, (di) => di.item.category);
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

  const [mainCarouselItems, setMainCarouselItems] = useState<CarouselDisplayEntity[]>([]);
  const [activeIndex, setActiveIndex] = useState(0); // Item visually in center
  const [carouselOffset, setCarouselOffset] = useState(0);
  
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [overlayItems, setOverlayItems] = useState<CarouselDisplayEntity[]>([]);
  const [overlayTitle, setOverlayTitle] = useState<string>("Expanded View"); // Not used anymore visually
  const [expandedStackPath, setExpandedStackPath] = useState<string[]>([]); // Path of stack IDs being viewed in overlay

  const carouselRef = useRef<HTMLDivElement>(null);
  const overlayContentRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const mainCarouselSnapshotRef = useRef<{ activeIndex: number, offset: number } | null>(null);

  useEffect(() => {
    const newMainItems = processInventoryForCarousel(playerInventory, []);
    setMainCarouselItems(newMainItems);
    setActiveIndex(newMainItems.length > 0 ? Math.floor(newMainItems.length / 2) : 0); // Start near middle or at 0
    setIsOverlayOpen(false);
    setExpandedStackPath([]);
  }, [playerInventory]);

  // Effect to update overlay items when expandedStackPath changes AND overlay is open
  useEffect(() => {
    if (isOverlayOpen && expandedStackPath.length > 0) {
      const newOverlayItems = processInventoryForCarousel(playerInventory, expandedStackPath);
      setOverlayItems(newOverlayItems);
      // Title for overlay is implicitly from the items shown, or could be the name of the parent stack
    } else if (!isOverlayOpen) {
      setOverlayItems([]); // Clear overlay items when closed
    }
  }, [isOverlayOpen, expandedStackPath, playerInventory]);


  const navigateCarousel = useCallback((direction: number) => {
    if (mainCarouselItems.length === 0) return;
    setActiveIndex(prev => {
      const newIndex = prev + direction;
      return Math.max(0, Math.min(mainCarouselItems.length - 1, newIndex));
    });
  }, [mainCarouselItems.length]);

  useEffect(() => {
    if (carouselRef.current && mainCarouselItems.length > 0 && !isOverlayOpen) {
      const itemWidth = CAROUSEL_ITEM_WIDTH;
      const totalWidthBeforeActive = activeIndex * (itemWidth + CAROUSEL_ITEM_GAP);
      const targetOffset = -totalWidthBeforeActive + (carouselRef.current.clientWidth / 2 - itemWidth / 2);
      setCarouselOffset(targetOffset);
    } else if (mainCarouselItems.length === 0 && carouselRef.current) {
        setCarouselOffset(carouselRef.current.clientWidth / 2 - CAROUSEL_ITEM_WIDTH / 2);
    }
  }, [activeIndex, mainCarouselItems, carouselRef.current?.clientWidth, isOverlayOpen]);

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
      setExpandedStackPath(prev => [...prev, entity.id]); // Drill deeper
      // Overlay items will update via useEffect on expandedStackPath
    } else if (entity.type === 'item') {
      openItemActionModal(entity as DisplayIndividualItem);
    }
  };

  const handleDownOrExpandAction = () => {
    if (isOverlayOpen) {
      // This case might need a "selected item within overlay" concept if complex interaction is needed.
      // For now, if overlay is open, "down" doesn't do much unless we define selection within it.
      // Perhaps it targets the first item in the overlay for its action.
      if (overlayItems.length > 0) {
        handleEntityInteractionInOverlay(overlayItems[0]);
      }
      return;
    }

    if (mainCarouselItems.length === 0) return;
    const entityAtActiveIndex = mainCarouselItems[activeIndex];
    if (!entityAtActiveIndex) return;

    if (entityAtActiveIndex.type === 'stack') {
      if (mainCarouselRef.current) { // Snapshot main carousel state before opening overlay
        mainCarouselSnapshotRef.current = { activeIndex, offset: carouselOffset };
      }
      setExpandedStackPath([entityAtActiveIndex.id]);
      // setOverlayTitle(entityAtActiveIndex.name); // Title removed from overlay
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
        // Restore main carousel position if snapshot exists
        if (mainCarouselSnapshotRef.current) {
            setActiveIndex(mainCarouselSnapshotRef.current.activeIndex);
            // The offset will be reapplied by the useEffect watching activeIndex
            mainCarouselSnapshotRef.current = null; // Clear snapshot
        }
      }
      // Overlay items & title will update via useEffect
    }
    // If not in overlay, "up" currently does nothing from buttons.
    // If we had a `selectedEntityId` for main carousel separate from activeIndex, it would clear here.
  };
  
  const handleMainCarouselCardTap = (entity: CarouselDisplayEntity, index: number) => {
    if (isDraggingRef.current) return;
    setActiveIndex(index); // Center the tapped card, makes it visually selected

    // If it's a stack, tapping it directly can prepare for "down" action to expand
    // If it's an item, tapping it directly can prepare for "down" action to open modal
    // No immediate expansion/modal on first tap here, "Down" button or second tap would trigger that.
  };
  
  const handleDragEnd = (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    isDraggingRef.current = false;
    if (carouselRef.current && mainCarouselItems.length > 0) {
        const itemPlusGap = CAROUSEL_ITEM_WIDTH + CAROUSEL_ITEM_GAP;
        const currentVisualStartOfCarouselContents = carouselOffset + info.offset.x;
        const viewportCenterLine = carouselRef.current.clientWidth / 2;
        
        let cumulativeWidth = 0;
        let closestIndex = 0;
        let minDistance = Infinity;

        for (let i = 0; i < mainCarouselItems.length; i++) {
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
        setActiveIndex(Math.max(0, Math.min(mainCarouselItems.length - 1, closestIndex)));
    }
  };

  const renderCard = (entity: CarouselDisplayEntity | undefined, isOverlayChild: boolean, indexInCurrentView?: number, isMainActive?: boolean) => {
    if (!entity) {
        // This case should ideally be prevented by filtering before mapping,
        // but as a fallback, render a placeholder or nothing.
        console.warn("Attempted to render an undefined entity in carousel.");
        return <div key={`empty-card-${indexInCurrentView}`} className="w-0 h-0" />;
    }

    const itemForStyling = entity.type === 'item' ? entity.item : (entity as DisplayItemStack).topItem;
    
    if (!itemForStyling) {
      console.warn("Item for styling is undefined for entity:", JSON.stringify(entity));
      // Use FALLBACK_GAME_ITEM or render a specific error card
      const tempItem = FALLBACK_GAME_ITEM;
      const itemColorCssVar = ITEM_LEVEL_COLORS_CSS_VARS[tempItem.level] || ITEM_LEVEL_COLORS_CSS_VARS[1];
       return (
        <motion.div 
            key={entity.id || `fallback-card-${indexInCurrentView}`}
            className="flex-shrink-0 origin-center rounded-lg border-2 p-2 flex flex-col items-center justify-start text-center overflow-hidden relative transition-all duration-200 aspect-[3/4] bg-destructive/20 backdrop-blur-sm"
            style={{
                width: isOverlayChild ? OVERLAY_CHILD_ITEM_WIDTH : CAROUSEL_ITEM_WIDTH,
                marginRight: isOverlayChild ? (indexInCurrentView === (overlayItems.length -1) ? 0 : OVERLAY_CHILD_ITEM_GAP) : (indexInCurrentView === (mainCarouselItems.length-1) ? 0 : CAROUSEL_ITEM_GAP),
                borderColor: 'var(--destructive)',
            }}
        >
            <p className="text-destructive-foreground text-xs">Error Displaying Item</p>
        </motion.div>
      );
    }

    const itemLevelForColor = itemForStyling.level || 1;
    const itemColorCssVar = ITEM_LEVEL_COLORS_CSS_VARS[itemLevelForColor] || ITEM_LEVEL_COLORS_CSS_VARS[1];
    
    const scale = isMainActive ? 1.15 : 1;
    const opacity = isMainActive ? 1 : 0.75;
    const yOffset = isMainActive ? -10 : 0;
    const zIndex = isMainActive ? 20 : 10;

    const cardStyle: React.CSSProperties = {
        borderColor: itemColorCssVar,
        boxShadow: isMainActive ? `0 0 20px 0px ${itemColorCssVar}B3, inset 0 0 12px ${itemColorCssVar}50` : `0 0 8px -3px ${itemColorCssVar}90, inset 0 0 6px ${itemColorCssVar}30`,
        zIndex: isOverlayChild ? 1 : zIndex, // Overlay children don't need complex z-indexing against each other
    };
    
    return (
        <motion.div
            key={entity.id}
            layout // Enable layout animation for this card
            className={cn(
                "flex-shrink-0 origin-center cursor-pointer rounded-lg border-2 p-2 flex flex-col items-center justify-start text-center overflow-hidden relative transition-all duration-200 aspect-[3/4]",
                `bg-[hsla(${itemColorCssVar.replace('var(', '').replace(')', '')}/0.1)] backdrop-blur-sm`,
                isMainActive ? "shadow-2xl" : "shadow-md"
            )}
            style={{
                width: isOverlayChild ? OVERLAY_CHILD_ITEM_WIDTH : CAROUSEL_ITEM_WIDTH,
                marginRight: isOverlayChild ? (indexInCurrentView === (overlayItems.length -1) ? 0 : OVERLAY_CHILD_ITEM_GAP) : (indexInCurrentView === (mainCarouselItems.length-1) ? 0 : CAROUSEL_ITEM_GAP),
                ...cardStyle
            }}
            animate={isOverlayChild ? {} : { scale, opacity, y: yOffset }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onTap={() => isOverlayChild ? handleEntityInteractionInOverlay(entity) : handleMainCarouselCardTap(entity, indexInCurrentView ?? 0)}
        >
            {entity.type === 'stack' && entity.isCategoryStack && (
                <div className="absolute -top-[13px] left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full border text-xs font-semibold"
                    style={{ backgroundColor: `hsl(var(--background-hsl))`, borderColor: itemColorCssVar, color: itemColorCssVar, boxShadow: `0 2px 5px ${itemColorCssVar}50`}}>
                    {entity.name}
                </div>
            )}
            <p className="text-xs md:text-sm font-semibold leading-tight mb-1 flex-shrink-0 truncate w-full px-1" style={{ color: itemColorCssVar }}>
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
                        {itemForStyling.perUseCost && <p className="text-muted-foreground text-[9px]">Recharge Cost: {itemForStyling.perUseCost} ELINT</p>}
                    </div>
                )}
                {(itemForStyling.type === 'Consumable' || itemForStyling.type === 'One-Time Use') && (
                    <p className="mt-0.5" style={{ color: itemColorCssVar }}>Type: {itemForStyling.type}</p>
                )}
            </div>
        </motion.div>
    );
  };
  
  return (
    <div // Changed from HolographicPanel to a simple div to control padding better
      className="w-full h-full flex flex-col relative overflow-hidden p-0 bg-transparent"
    >
      <div className="flex-shrink-0 flex justify-between items-center p-3 md:p-4 border-b border-current/20">
        <h2 className="text-xl md:text-2xl font-orbitron holographic-text truncate max-w-[calc(100%-100px)]">
          Equipment Locker
        </h2>
        <div className="flex items-center space-x-2">
            <HolographicButton onClick={handleUpOrCollapseAction} disabled={!isOverlayOpen} className="!p-1.5 md:!p-2" title="Collapse/Back">
                <Layers className="w-4 h-4 md:w-5 md:h-5" />
            </HolographicButton>
            <HolographicButton onClick={openSpyShop} className="!p-1.5 md:!p-2" title="Open Spy Shop">
                <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
            </HolographicButton>
        </div>
      </div>

      {mainCarouselItems.length === 0 && !isOverlayOpen ? (
        <div className="flex-grow flex items-center justify-center">
          <p className="text-muted-foreground font-rajdhani text-lg">Inventory empty.</p>
        </div>
      ) : (
        <div ref={carouselRef} className="flex-grow flex items-center justify-start relative overflow-hidden select-none -mx-2 md:-mx-4">
          <AnimatePresence>
          {!isOverlayOpen && (
            <motion.div
                key="main-carousel"
                className="flex absolute h-full items-center" 
                drag="x"
                dragConstraints={{ 
                    left: mainCarouselItems.length > 0 ? -(mainCarouselItems.reduce((acc, item) => acc + (item ? CAROUSEL_ITEM_WIDTH : 0) + CAROUSEL_ITEM_GAP, 0) - (carouselRef.current?.clientWidth || 0) + CAROUSEL_ITEM_WIDTH / 2 + CAROUSEL_ITEM_GAP / 2 ) : 0, 
                    right: mainCarouselItems.length > 0 ? ((carouselRef.current?.clientWidth || 0)/2 - CAROUSEL_ITEM_WIDTH/2 - CAROUSEL_ITEM_GAP/2) : 0 
                }}
                onDragStart={() => isDraggingRef.current = true}
                onDragEnd={handleDragEnd}
                animate={{ x: carouselOffset }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                style={{ paddingLeft: CAROUSEL_ITEM_GAP / 2, paddingRight: CAROUSEL_ITEM_GAP / 2 }} 
            >
              {mainCarouselItems.map((entity, index) => renderCard(entity, false, index, index === activeIndex))}
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      )}

      {/* Overlay Window for Expanded Stacks */}
      <AnimatePresence>
        {isOverlayOpen && (
          <motion.div
            key="overlay-window"
            className="absolute inset-0 z-30 flex flex-col bg-transparent p-2" // Removed explicit background, border
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2, ease: "circOut" }}
            style={{ transformOrigin: 'center center' }} // Zoom from center
          >
            <div className="flex-shrink-0 flex justify-start items-center py-2 px-0 mb-2"> {/* Removed border-b */}
              <HolographicButton onClick={handleUpOrCollapseAction} className="!p-1.5" title="Back/Collapse">
                <ArrowLeft className="w-5 h-5" />
              </HolographicButton>
              {/* Title removed from here */}
            </div>
            <div ref={overlayContentRef} className="flex-grow overflow-x-auto overflow-y-hidden flex items-center p-2 scrollbar-hide">
              {overlayItems.map((entity, index) => renderCard(entity, true, index, false))}
            </div>
            {overlayItems.length === 0 && (
              <p className="text-center text-muted-foreground flex-grow flex items-center justify-center">This stack is empty.</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-shrink-0 flex justify-center items-center space-x-2 p-4 mt-auto z-20 bg-transparent"> {/* Increased padding to p-4 */}
        <HolographicButton onClick={() => navigateCarousel(-1)} disabled={mainCarouselItems.length <= 1 || activeIndex === 0 || isOverlayOpen} className="!p-1.5 md:!p-2">
            <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
        </HolographicButton>
        <HolographicButton onClick={handleDownOrExpandAction} disabled={mainCarouselItems.length === 0 && !isOverlayOpen} className="!p-1.5 md:!p-2">
            <ChevronDown className="w-4 h-4 md:w-5 md:h-5" />
        </HolographicButton>
        <HolographicButton onClick={handleUpOrCollapseAction} disabled={!isOverlayOpen} className="!p-1.5 md:!p-2"> 
            <ChevronUp className="w-4 h-4 md:w-5 md:h-5" />
        </HolographicButton>
        <HolographicButton onClick={() => navigateCarousel(1)} disabled={mainCarouselItems.length <= 1 || activeIndex === mainCarouselItems.length - 1 || isOverlayOpen} className="!p-1.5 md:!p-2">
            <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
        </HolographicButton>
      </div>
    </div>
  );
}

// Helper to generate placeholder images - replace with actual images or a robust service
const generatePlaceholderImage = (text: string, width = 128, height = 128, bgColor = "333", textColor = "eee") => {
    return `https://placehold.co/${width}x${height}/${bgColor}/${textColor}.png?text=${encodeURIComponent(text)}`;
}

    
