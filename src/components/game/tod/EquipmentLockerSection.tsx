
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
      // Create one DisplayIndividualItem per actual instance for accurate counting and individual display
      return Array.from({ length: invItem.quantity }, (_, index) => ({
        type: 'item' as 'item',
        id: `${itemId}_instance_${index}`,
        item: baseItem,
        inventoryQuantity: 1, // Each instance is 1
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
      // Now, for this category, group by base item name to form item stacks
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
      const categoryFromId = stackIdParts[2] as ItemCategory;
      const baseNameFromId = stackIdParts.slice(3).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
      // This is a stack of identical items; expand to individual items
      return allDetailedInventoryItems.filter(di => di.item.name === baseNameFromId && di.item.category === categoryFromId);
    }
    return []; // Should not happen if path is valid
  } else {
    // Root level: group by base item name first
    const groupedByNameForRoot = groupBy(itemsToProcess, (di) => di.item.name);
    const rootEntitiesByName: CarouselDisplayEntity[] = [];
    Object.entries(groupedByNameForRoot).forEach(([name, items]) => {
      if (items.length === 1) {
        rootEntitiesByName.push(items[0]); // Single item, show directly
      } else {
        rootEntitiesByName.push({ // Multiple of same item, create a stack
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

    // If still too many, group by category
    const groupedByCategory = groupBy(itemsToProcess, (di) => di.item.category);
    return Object.entries(groupedByCategory).map(([categoryName, items]): DisplayItemStack => ({
      type: 'stack',
      id: `stack_category_${categoryName as ItemCategory}`,
      name: categoryName as ItemCategory,
      items: items, // All items in this category
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
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [carouselOffset, setCarouselOffset] = useState(0);
  const [expandedStackPath, setExpandedStackPath] = useState<string[]>([]);
  
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [overlayItems, setOverlayItems] = useState<CarouselDisplayEntity[]>([]);
  const [overlayTitle, setOverlayTitle] = useState<string>("Expanded View");

  const carouselRef = useRef<HTMLDivElement>(null);
  const overlayContentRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const mainCarouselSnapshotRef = useRef<{ activeIndex: number, offset: number } | null>(null);


  useEffect(() => {
    const newMainItems = processInventoryForCarousel(playerInventory, []);
    setMainCarouselItems(newMainItems);
    if (newMainItems.length > 0) {
        setActiveIndex(0);
    } else {
        setActiveIndex(0); // Or handle empty state appropriately
    }
    // Reset overlay when main inventory changes fundamentally
    setIsOverlayOpen(false);
    setExpandedStackPath([]);
    setSelectedEntityId(null);
  }, [playerInventory]);


  useEffect(() => {
    if (isOverlayOpen) {
      const newOverlayItems = processInventoryForCarousel(playerInventory, expandedStackPath);
      setOverlayItems(newOverlayItems);
      if (expandedStackPath.length > 0) {
        const currentStackId = expandedStackPath[expandedStackPath.length - 1];
        const stackEntity = mainCarouselItems.find(e => e.id === currentStackId) || overlayItems.find(e => e.id === currentStackId);
        if (stackEntity && stackEntity.type === 'stack') {
          setOverlayTitle(stackEntity.name);
        } else {
            const parts = currentStackId.replace(/^stack_(category|item)_/, '').split('_');
            setOverlayTitle(parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' '));
        }
      }
    }
  }, [isOverlayOpen, expandedStackPath, playerInventory, mainCarouselItems]);


  const navigateCarousel = useCallback((direction: number, itemsArray: CarouselDisplayEntity[], setActiveIdxFunc: React.Dispatch<React.SetStateAction<number>>) => {
    if (itemsArray.length === 0) return;
    setActiveIdxFunc(prev => {
      const newIndex = prev + direction;
      return Math.max(0, Math.min(itemsArray.length - 1, newIndex));
    });
  }, []);

  // Effect for main carousel offset
  useEffect(() => {
    if (carouselRef.current && mainCarouselItems.length > 0 && !isOverlayOpen) {
      const itemWidth = CAROUSEL_ITEM_WIDTH;
      const totalWidthBeforeActive = activeIndex * (itemWidth + CAROUSEL_ITEM_GAP);
      const targetOffset = -totalWidthBeforeActive + (carouselRef.current.clientWidth / 2 - itemWidth / 2);
      setCarouselOffset(targetOffset);
    } else if (mainCarouselItems.length === 0 && carouselRef.current) {
        setCarouselOffset(carouselRef.current.clientWidth / 2 - CAROUSEL_ITEM_WIDTH / 2); // Center placeholder if empty
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

  const handleEntityInteraction = (entity: CarouselDisplayEntity, isFromOverlay: boolean = false) => {
    if (entity.type === 'stack') {
      setSelectedEntityId(entity.id); // Keep track of the stack that was clicked to open overlay
      setExpandedStackPath(prev => [...prev, entity.id]);
      setIsOverlayOpen(true);
      if (!isFromOverlay && carouselRef.current) { // Snapshot main carousel state
        mainCarouselSnapshotRef.current = { activeIndex, offset: carouselOffset };
      }
    } else if (entity.type === 'item') {
      openItemActionModal(entity as DisplayIndividualItem);
    }
  };

  const handleDownOrExpandAction = () => {
    if (isOverlayOpen && overlayItems.length > 0) {
      // If overlay is open, "down" action targets the first item in the overlay for further expansion or action
      // This logic might need refinement based on how selection works *within* the overlay
      const firstOverlayItem = overlayItems[0];
      if (firstOverlayItem) handleEntityInteraction(firstOverlayItem, true);
    } else if (mainCarouselItems.length > 0) {
      const entityAtActiveIndex = mainCarouselItems[activeIndex];
      if (!entityAtActiveIndex) return;

      if (selectedEntityId && selectedEntityId !== entityAtActiveIndex.id) {
        setSelectedEntityId(entityAtActiveIndex.id);
      } else if (!selectedEntityId) {
        setSelectedEntityId(entityAtActiveIndex.id);
      } else { // selectedEntityId IS entityAtActiveIndex.id
        handleEntityInteraction(entityAtActiveIndex, false);
      }
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
            setCarouselOffset(mainCarouselSnapshotRef.current.offset);
            mainCarouselSnapshotRef.current = null; // Clear snapshot
        }
        // The selectedEntityId should ideally be the stack that was just collapsed from
        // For now, setting to null or the parent might be complex without direct parent ref
        // setSelectedEntityId(newPath.length > 0 ? newPath[newPath.length - 1] : null);
      } else {
        // Update overlay for the new shallower path
        const parentStackId = newPath[newPath.length - 1];
        setSelectedEntityId(parentStackId); // Select the parent stack
      }
    } else if (selectedEntityId) {
      setSelectedEntityId(null); // Just deselect if no overlay/expansion active
    }
  };
  
  const handleMainCarouselCardTap = (entity: CarouselDisplayEntity, index: number) => {
    if (isDraggingRef.current) return;
    setActiveIndex(index); // Center the tapped card
    setSelectedEntityId(entity.id); // Mark as selected for potential "down" action
    // If it's a stack, the "down" action or another tap will expand it into the overlay
    // If it's an item, "down" or another tap will open modal
    if (entity.type === 'stack') {
        // Prepare for overlay on next "down" or direct tap if desired
        // For immediate overlay on tap:
        handleEntityInteraction(entity, false);
    } else {
        openItemActionModal(entity as DisplayIndividualItem);
    }
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
  

  const renderCard = (entity: CarouselDisplayEntity, isOverlayChild: boolean, indexInCurrentView?: number) => {
    const itemForStyling = entity.type === 'item' ? entity.item : (entity as DisplayItemStack).topItem || FALLBACK_GAME_ITEM;
    const itemLevelForColor = itemForStyling.level || 1;
    const itemColorCssVar = ITEM_LEVEL_COLORS_CSS_VARS[itemLevelForColor] || ITEM_LEVEL_COLORS_CSS_VARS[1];
    
    const isActuallySelectedInMain = !isOverlayChild && entity.id === selectedEntityId;
    // For overlay, "selected" state might not be used in the same way, or could be first item.
    
    const scale = !isOverlayChild && isActuallySelectedInMain ? 1.15 : 1;
    const opacity = !isOverlayChild && isActuallySelectedInMain ? 1 : 0.75;
    const yOffset = !isOverlayChild && isActuallySelectedInMain ? -10 : 0;

    const cardStyle: React.CSSProperties = {
        borderColor: itemColorCssVar,
        boxShadow: isActuallySelectedInMain ? `0 0 20px 0px ${itemColorCssVar}B3, inset 0 0 12px ${itemColorCssVar}50` : `0 0 8px -3px ${itemColorCssVar}90, inset 0 0 6px ${itemColorCssVar}30`,
    };
    
    return (
        <motion.div
            key={entity.id}
            layout // Enable layout animation for this card
            className={cn(
                "flex-shrink-0 origin-center cursor-pointer rounded-lg border-2 p-2 flex flex-col items-center justify-start text-center overflow-hidden relative transition-all duration-200 aspect-[3/4]",
                "bg-[hsla(var(--primary-hsl)/0.1)] backdrop-blur-sm", // Themed background
                isActuallySelectedInMain ? "shadow-2xl" : "shadow-md"
            )}
            style={{
                width: isOverlayChild ? OVERLAY_CHILD_ITEM_WIDTH : CAROUSEL_ITEM_WIDTH,
                marginRight: isOverlayChild ? (indexInCurrentView === (overlayItems.length -1) ? 0 : OVERLAY_CHILD_ITEM_GAP) : (indexInCurrentView === (mainCarouselItems.length-1) ? 0 : CAROUSEL_ITEM_GAP),
                ...cardStyle
            }}
            animate={isOverlayChild ? {} : { scale, opacity, y: yOffset }} // Simpler animation for overlay children
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onTap={() => isOverlayChild ? handleEntityInteraction(entity, true) : handleMainCarouselCardTap(entity, indexInCurrentView ?? 0)}
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
                        {itemForStyling.perUseCost && <p className="text-muted-foreground text-[9px]">Cost: {itemForStyling.perUseCost} ELINT</p>}
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
    <HolographicPanel
      className="w-full h-full flex flex-col relative overflow-hidden p-0 md:p-0"
      explicitTheme={theme}
    >
      <div className="flex-shrink-0 flex justify-between items-center p-2 md:p-4 mb-0 border-b border-current/20">
        <h2 className="text-xl md:text-2xl font-orbitron holographic-text truncate max-w-[calc(100%-100px)]">
          {isOverlayOpen ? overlayTitle : "Equipment Locker"}
        </h2>
        <div className="flex items-center space-x-2">
            <HolographicButton onClick={openSpyShop} className="!p-1.5 md:!p-2" title="Open Spy Shop">
                <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
            </HolographicButton>
        </div>
      </div>

      {/* Main Carousel Area */}
      {mainCarouselItems.length === 0 ? (
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
                    left: mainCarouselItems.length > 0 ? -(mainCarouselItems.reduce((acc) => acc + CAROUSEL_ITEM_WIDTH + CAROUSEL_ITEM_GAP, 0) - (carouselRef.current?.clientWidth || 0) + CAROUSEL_ITEM_WIDTH / 2 + CAROUSEL_ITEM_GAP / 2 ) : 0, 
                    right: mainCarouselItems.length > 0 ? ((carouselRef.current?.clientWidth || 0)/2 - CAROUSEL_ITEM_WIDTH/2 - CAROUSEL_ITEM_GAP/2) : 0 
                }}
                onDragStart={() => isDraggingRef.current = true}
                onDragEnd={handleDragEnd}
                animate={{ x: carouselOffset }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                style={{ paddingLeft: CAROUSEL_ITEM_GAP / 2, paddingRight: CAROUSEL_ITEM_GAP / 2 }} 
            >
              {mainCarouselItems.map((entity, index) => renderCard(entity, false, index))}
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
            className="absolute inset-0 z-30 flex flex-col bg-[hsla(var(--background-hsl)/0.8)] backdrop-blur-md p-2"
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="flex-shrink-0 flex justify-between items-center p-2 border-b border-current/30 mb-2">
              <h3 className="text-lg font-orbitron holographic-text">{overlayTitle}</h3>
              <HolographicButton onClick={handleUpOrCollapseAction} className="!p-1.5" title="Back/Collapse">
                <ArrowLeft className="w-5 h-5" />
              </HolographicButton>
            </div>
            <div ref={overlayContentRef} className="flex-grow overflow-x-auto overflow-y-hidden flex items-center p-2 scrollbar-hide">
              {overlayItems.map((entity, index) => renderCard(entity, true, index))}
            </div>
            {overlayItems.length === 0 && (
              <p className="text-center text-muted-foreground flex-grow flex items-center justify-center">This stack is empty or contains no further sub-stacks.</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Button Bar - Always visible, interacts with main carousel or overlay */}
      <div className="flex-shrink-0 flex justify-center items-center space-x-2 p-2 mt-auto z-20 bg-transparent">
        <HolographicButton onClick={() => navigateCarousel(-1, isOverlayOpen ? overlayItems : mainCarouselItems, isOverlayOpen ? () => {} : setActiveIndex)} disabled={(isOverlayOpen ? overlayItems.length : mainCarouselItems.length) <= 1 || (!isOverlayOpen && activeIndex === 0)} className="!p-1.5 md:!p-2">
            <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
        </HolographicButton>
        <HolographicButton onClick={handleDownOrExpandAction} disabled={(isOverlayOpen ? overlayItems.length : mainCarouselItems.length) === 0} className="!p-1.5 md:!p-2">
            <ChevronDown className="w-4 h-4 md:w-5 md:h-5" />
        </HolographicButton>
        <HolographicButton onClick={handleUpOrCollapseAction} disabled={!isOverlayOpen && !selectedEntityId} className="!p-1.5 md:!p-2">
            <ChevronUp className="w-4 h-4 md:w-5 md:h-5" />
        </HolographicButton>
        <HolographicButton onClick={() => navigateCarousel(1, isOverlayOpen ? overlayItems : mainCarouselItems, isOverlayOpen ? () => {} : setActiveIndex)} disabled={(isOverlayOpen ? overlayItems.length : mainCarouselItems.length) <= 1 || (!isOverlayOpen && activeIndex === (isOverlayOpen ? overlayItems.length : mainCarouselItems.length) - 1)} className="!p-1.5 md:!p-2">
            <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
        </HolographicButton>
      </div>
    </HolographicPanel>
  );
}

// Helper to generate placeholder images - replace with actual images or a robust service
const generatePlaceholderImage = (text: string, width = 128, height = 128, bgColor = "333", textColor = "eee") => {
    return `https://placehold.co/${width}x${height}/${bgColor}/${textColor}.png?text=${encodeURIComponent(text)}`;
}
