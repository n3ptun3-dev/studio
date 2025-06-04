
// src/components/game/tod/EquipmentLockerSection.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { AnimatePresence, motion, PanInfo } from 'framer-motion';
import { useAppContext, type PlayerInventoryItem } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { HolographicButton } from '@/components/game/shared/HolographicPanel'; // HolographicPanel removed as it's not used directly here for the root
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { getItemById, type GameItemBase, type ItemCategory, type ItemLevel, ITEM_LEVELS } from '@/lib/game-items';
import { ITEM_LEVEL_COLORS_CSS_VARS, XP_THRESHOLDS } from '@/lib/constants';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ShoppingCart, ArrowLeft, XCircle, Layers } from 'lucide-react';
import NextImage from 'next/image';

const CAROUSEL_ITEM_WIDTH = 160;
const CAROUSEL_ITEM_GAP = 20;
const OVERLAY_CHILD_ITEM_WIDTH = 130;
const OVERLAY_CHILD_ITEM_GAP = 15;
const MAX_DISPLAY_ENTITIES_MAIN_CAROUSEL = 8;

const FALLBACK_GAME_ITEM: GameItemBase = {
  id: 'fallback_item_error', name: 'Error Item', description: 'This item could not be loaded.',
  level: 1, cost: 0, scarcity: 'Common', category: 'Hardware', colorVar: 1,
  imageSrc: 'https://placehold.co/128x128/ff0000/ffffff.png?text=ERR',
  tileImageSrc: 'https://placehold.co/128x128/ff0000/ffffff.png?text=ERR',
  dataAiHint: "error placeholder"
};

const LEVEL_TO_BG_CLASS: Record<ItemLevel, string> = {
  1: 'bg-level-1/10',
  2: 'bg-level-2/10',
  3: 'bg-level-3/10',
  4: 'bg-level-4/10',
  5: 'bg-level-5/10',
  6: 'bg-level-6/10',
  7: 'bg-level-7/10',
  8: 'bg-level-8/10',
};

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

const findHighestLevelItem = (items: DisplayIndividualItem[]): GameItemBase => {
  if (!items || items.length === 0) return FALLBACK_GAME_ITEM;
  const validItems = items.filter(di => di && di.item);
  if (validItems.length === 0) return FALLBACK_GAME_ITEM;

  return validItems.reduce((highestItemSoFar, currentDisplayItem) => {
    if (!currentDisplayItem || !currentDisplayItem.item) return highestItemSoFar;
    return currentDisplayItem.item.level > highestItemSoFar.level ? currentDisplayItem.item : highestItemSoFar;
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
        return [];
      }
      return Array.from({ length: invItem.quantity }, (_, index) => ({
        type: 'item' as 'item',
        id: `${itemId}_instance_${index}`, // Unique ID for each instance
        item: baseItem,
        inventoryQuantity: 1,
        currentStrength: invItem.currentStrength,
      }));
    })
    .filter((item): item is DisplayIndividualItem => !!item && !!item.item)
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
      })).sort((a, b) => a.name.localeCompare(b.name));

    } else if (deepestStackId.startsWith('stack_item_')) {
      const parentStackIdParts = deepestStackId.split('_');
      if (parentStackIdParts.length < 4) return [];
      const categoryFromId = parentStackIdParts[2] as ItemCategory;
      const baseNameFromIdParts = parentStackIdParts.slice(3);
      const baseNameFromId = baseNameFromIdParts.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
      
      return allDetailedInventoryItems.filter(di => di.item.name === baseNameFromId && di.item.category === categoryFromId);
    }
    return [];
  } else {
    const groupedByNameForRoot = groupBy(allDetailedInventoryItems, (di) => di.item.name);
    const rootEntitiesByName: CarouselDisplayEntity[] = [];

    Object.entries(groupedByNameForRoot).forEach(([name, items]) => {
      if (items.length === 1 && items[0]) {
        rootEntitiesByName.push(items[0]);
      } else if (items.length > 0 && items[0]?.item) {
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

    if (rootEntitiesByName.length <= MAX_DISPLAY_ENTITIES_MAIN_CAROUSEL && rootEntitiesByName.length > 0) {
      return rootEntitiesByName.sort((a, b) => {
        const nameA = a.type === 'item' ? (a.item?.name || '') : a.name;
        const nameB = b.type === 'item' ? (b.item?.name || '') : b.name;
        return nameA.localeCompare(nameB);
      });
    }
    
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
    })).sort((a, b) => a.name.localeCompare(b.name));
  }
};


export function EquipmentLockerSection({ parallaxOffset }: { parallaxOffset: number }) {
  const appContext = useAppContext();
  const { playerInventory, openTODWindow, openSpyShop, faction, setIsScrollLockActive } = appContext;
  const { theme } = useTheme();

  const [mainCarouselItems, setMainCarouselItems] = useState<CarouselDisplayEntity[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [carouselOffset, setCarouselOffset] = useState(0);
  
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [expandedStackPath, setExpandedStackPath] = useState<string[]>([]);
  
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [overlayItems, setOverlayItems] = useState<CarouselDisplayEntity[]>([]);
  // overlayTitle is not used for display, but can be kept for logic if needed later
  // const [overlayTitle, setOverlayTitle] = useState(''); 

  const mainCarouselContainerRef = useRef<HTMLDivElement>(null);
  const mainCarouselSnapshotRef = useRef<{ activeIndex: number; offset: number } | null>(null);
  
  const [isMouseOverCarousel, setIsMouseOverCarousel] = useState(false);
  const isMouseOverCarouselRef = useRef(isMouseOverCarousel);
  const lastCarouselInteractionTimeRef = useRef<number>(0);


  useEffect(() => {
    isMouseOverCarouselRef.current = isMouseOverCarousel;
    setIsScrollLockActive(isMouseOverCarousel);
  }, [isMouseOverCarousel, setIsScrollLockActive]);

  const navigateCarousel = useCallback((direction: number) => {
    if (mainCarouselItems.length === 0) return;
    lastCarouselInteractionTimeRef.current = Date.now(); // Mark interaction
    setActiveIndex(prev => {
      const newIndex = prev + direction;
      return Math.max(0, Math.min(mainCarouselItems.length - 1, newIndex));
    });
  }, [mainCarouselItems.length]);

  useEffect(() => {
    const newMainItems = processInventoryForCarousel(playerInventory, []);
    setMainCarouselItems(newMainItems);
    setActiveIndex(newMainItems.length > 0 ? Math.floor(newMainItems.length / 2) : 0);
    setIsOverlayOpen(false);
    setExpandedStackPath([]);
    setSelectedEntityId(null);
  }, [playerInventory]);

  useEffect(() => {
    if (mainCarouselContainerRef.current && mainCarouselItems.length > 0 && !isOverlayOpen) {
      const itemWidth = CAROUSEL_ITEM_WIDTH;
      const totalWidthBeforeActive = activeIndex * (itemWidth + CAROUSEL_ITEM_GAP);
      const targetOffset = -totalWidthBeforeActive + (mainCarouselContainerRef.current.clientWidth / 2 - itemWidth / 2);
      setCarouselOffset(targetOffset);
    } else if (mainCarouselItems.length === 0 && mainCarouselContainerRef.current) {
      setCarouselOffset(mainCarouselContainerRef.current.clientWidth / 2 - CAROUSEL_ITEM_WIDTH / 2);
    }
  }, [activeIndex, mainCarouselItems, isOverlayOpen]); // Removed mainCarouselContainerRef.current?.clientWidth from deps as it can cause loops

  const debouncedSnapAfterScroll = useCallback(
    debounce(() => {
      // Only snap if mouse is currently over carousel OR a very recent carousel interaction occurred
      if (isMouseOverCarouselRef.current || (Date.now() - lastCarouselInteractionTimeRef.current < 300)) {
          if (mainCarouselContainerRef.current && mainCarouselItems.length > 0 && !isOverlayOpen) {
              const viewportCenter = mainCarouselContainerRef.current.clientWidth / 2;
              let closestIndex = 0;
              let minDistance = Infinity;

              for (let i = 0; i < mainCarouselItems.length; i++) {
                  const itemCenterInViewport = carouselOffset + (i * (CAROUSEL_ITEM_WIDTH + CAROUSEL_ITEM_GAP)) + (CAROUSEL_ITEM_WIDTH / 2);
                  const distanceToViewportCenter = Math.abs(itemCenterInViewport - viewportCenter);

                  if (distanceToViewportCenter < minDistance) {
                      minDistance = distanceToViewportCenter;
                      closestIndex = i;
                  }
              }
              setActiveIndex(closestIndex);
          }
      }
    }, 150),
    [carouselOffset, mainCarouselItems, isOverlayOpen] // Dependencies for the debounced function itself
  );

  useEffect(() => {
    debouncedSnapAfterScroll();
  }, [carouselOffset, debouncedSnapAfterScroll]);


  const openItemActionModal = (displayItem: DisplayIndividualItem) => {
    const item = displayItem.item;
    if (!item) return;
    const itemLevelForColor = item.level || 1;
    const itemColorModalVar = ITEM_LEVEL_COLORS_CSS_VARS[itemLevelForColor as ItemLevel] || ITEM_LEVEL_COLORS_CSS_VARS[1];

    openTODWindow(
      `${item.name} L${item.level}`,
      <div className="p-4 font-rajdhani text-center space-y-3">
        <NextImage
          src={item.tileImageSrc || item.imageSrc || `https://placehold.co/128x128.png?text=${item.name.substring(0, 3)}`}
          alt={item.name} width={128} height={128}
          className="mx-auto rounded-md mb-2 object-contain bg-black/20 p-1"
          data-ai-hint={`${item.category} icon large`} unoptimized
        />
        <p className="text-lg font-semibold" style={{ color: `hsl(${itemColorModalVar})` }}>{item.name} - L{item.level}</p>
        <p className="text-sm text-muted-foreground">{item.description}</p>
        {item.category === 'Hardware' && item.strength && typeof item.strength.current === 'number' && typeof item.strength.max === 'number' && (
          <div className="w-full max-w-xs mx-auto">
            <p className="text-xs text-muted-foreground mt-1">Strength:</p>
            <Progress value={((item.strength.current ?? item.strength.max) / item.strength.max) * 100} className="h-2 [&>div]:bg-[var(--progress-color)]" style={{ '--progress-color': `hsl(${itemColorModalVar})` } as React.CSSProperties} />
            <p className="text-xs text-muted-foreground mt-1">{item.strength.current ?? item.strength.max} / {item.strength.max}</p>
          </div>
        )}
        {item.category === 'Infiltration Gear' && typeof item.attackFactor === 'number' && (
             <div className="w-full max-w-xs mx-auto">
              <p className="text-xs text-muted-foreground mt-1">Attack Factor:</p>
              <Progress value={(item.attackFactor / 100) * 100} className="h-1.5 [&>div]:bg-[var(--progress-color)]" style={{ '--progress-color': `hsl(${itemColorModalVar})` } as React.CSSProperties} />
             </div>
        )}
        {item.type === 'Rechargeable' && (
          <>
            <p className="text-sm" style={{ color: `hsl(${itemColorModalVar})` }}>Type: Rechargeable</p>
            {item.perUseCost && <p className="text-sm text-muted-foreground">Recharge Cost: {item.perUseCost} ELINT</p>}
          </>
        )}
        {(item.type === 'Consumable' || item.type === 'One-Time Use') && <p className="text-sm" style={{ color: `hsl(${itemColorModalVar})` }}>Type: {item.type}</p>}
        <HolographicButton onClick={() => console.log("Deploy", item.id)} className="w-full">Deploy</HolographicButton>
        {item.type === 'Rechargeable' && (
          <HolographicButton onClick={() => console.log("Recharge", item.id)} className="w-full">Recharge ({item.perUseCost || 'N/A'} ELINT)</HolographicButton>
        )}
        <HolographicButton onClick={() => console.log("Drop", item.id)} className="w-full border-destructive text-destructive hover:bg-destructive hover:text-background">Drop</HolographicButton>
      </div>,
      { showCloseButton: true }
    );
  };

  const handleEntityInteractionInOverlay = useCallback((entity: CarouselDisplayEntity) => {
    if (entity.type === 'stack') {
      const newPath = [...expandedStackPath, entity.id];
      setExpandedStackPath(newPath);
      const newOverlayDisplayItems = processInventoryForCarousel(playerInventory, newPath);
      setOverlayItems(newOverlayDisplayItems);
    } else if (entity.type === 'item') {
      openItemActionModal(entity as DisplayIndividualItem);
    }
  }, [expandedStackPath, playerInventory, openItemActionModal]);

  const handleMainCarouselCardTap = useCallback((entity: CarouselDisplayEntity, index: number) => {
    lastCarouselInteractionTimeRef.current = Date.now();
    if (activeIndex !== index) {
      setActiveIndex(index);
    } else { // If already selected, tapping again can trigger action (like "Down" button)
      handleDownOrExpandAction();
    }
  }, [activeIndex, handleDownOrExpandAction]);

  const handleDownOrExpandAction = useCallback(() => {
    if (isOverlayOpen) {
      if (overlayItems.length > 0 && overlayItems[0]) {
        handleEntityInteractionInOverlay(overlayItems[0]);
      }
      return;
    }

    if (mainCarouselItems.length === 0 || activeIndex < 0 || activeIndex >= mainCarouselItems.length) return;
    const entityAtActiveIndex = mainCarouselItems[activeIndex];
    if (!entityAtActiveIndex) return;
    
    setSelectedEntityId(entityAtActiveIndex.id);

    if (entityAtActiveIndex.type === 'stack') {
      if (mainCarouselContainerRef.current) {
        mainCarouselSnapshotRef.current = { activeIndex, offset: carouselOffset };
      }
      const newExpandedPath = [entityAtActiveIndex.id];
      setExpandedStackPath(newExpandedPath);
      const newOverlayDisplayItems = processInventoryForCarousel(playerInventory, newExpandedPath);
      setOverlayItems(newOverlayDisplayItems);
      setIsOverlayOpen(true);
    } else if (entityAtActiveIndex.type === 'item') {
      openItemActionModal(entityAtActiveIndex as DisplayIndividualItem);
    }
  }, [isOverlayOpen, overlayItems, mainCarouselItems, activeIndex, playerInventory, carouselOffset, handleEntityInteractionInOverlay, openItemActionModal]);
  
  const findEntityByIdRecursive = (items: CarouselDisplayEntity[], id: string): CarouselDisplayEntity | undefined => {
    for (const item of items) {
      if (item.id === id) return item;
    }
    return undefined;
  };

  const handleUpOrCollapseAction = useCallback(() => {
    if (isOverlayOpen) {
      const newPath = expandedStackPath.slice(0, -1);
      setExpandedStackPath(newPath);

      if (newPath.length === 0) {
        setIsOverlayOpen(false);
        if (mainCarouselSnapshotRef.current) {
          const restoredActiveIndex = mainCarouselSnapshotRef.current.activeIndex;
          const validRestoredIndex = Math.max(0, Math.min(mainCarouselItems.length - 1, restoredActiveIndex));
          setActiveIndex(validRestoredIndex);
          mainCarouselSnapshotRef.current = null;
        } else {
           setActiveIndex(mainCarouselItems.length > 0 ? 0 : 0);
        }
        setSelectedEntityId(null); 
      } else {
        const newOverlayDisplayItems = processInventoryForCarousel(playerInventory, newPath);
        setOverlayItems(newOverlayDisplayItems);
        setSelectedEntityId(newPath[newPath.length - 1]);
      }
    } else {
        // If overlay is not open, "Up" does nothing on main carousel for now
    }
  }, [isOverlayOpen, expandedStackPath, playerInventory, mainCarouselItems]);


  const handleWheelScroll = useCallback((event: React.WheelEvent) => {
    if (!isMouseOverCarouselRef.current || !mainCarouselContainerRef.current || mainCarouselItems.length === 0 || isOverlayOpen) return;

    event.preventDefault();
    event.stopPropagation();
    lastCarouselInteractionTimeRef.current = Date.now(); // Mark interaction

    setCarouselOffset(prevOffset => {
        const newOffset = prevOffset - event.deltaX; // Use deltaX for horizontal scroll
        const maxOffset = 0; 
        const minOffset = -(mainCarouselItems.length * (CAROUSEL_ITEM_WIDTH + CAROUSEL_ITEM_GAP) - mainCarouselContainerRef.current!.clientWidth + CAROUSEL_ITEM_GAP);
        return Math.max(minOffset, Math.min(maxOffset, newOffset));
    });
    // Debounced snap will be called by the useEffect watching carouselOffset
  }, [mainCarouselItems, isOverlayOpen]);


  const renderCard = (entity: CarouselDisplayEntity | undefined, isOverlayChild: boolean, indexInCurrentView?: number) => {
    if (!entity) return null;

    let itemForStyling: GameItemBase = FALLBACK_GAME_ITEM;
    if (entity.type === 'item' && entity.item) {
      itemForStyling = entity.item;
    } else if (entity.type === 'stack' && entity.topItem) {
      itemForStyling = entity.topItem;
    }

    const isVisuallySelected = !isOverlayOpen && indexInCurrentView === activeIndex;
    
    const itemLevelForColor = itemForStyling.level || 1;
    // Correctly get the CSS variable name like 'var(--level-X-color)'
    const itemColorCssVar = ITEM_LEVEL_COLORS_CSS_VARS[itemLevelForColor as ItemLevel] || ITEM_LEVEL_COLORS_CSS_VARS[1];
    // Get the Tailwind background class like 'bg-level-1/10'
    const bgClass = LEVEL_TO_BG_CLASS[itemLevelForColor as ItemLevel] || 'bg-muted/10';

    const scale = isVisuallySelected ? 1.15 : 1;
    const opacity = isVisuallySelected ? 1 : 0.75;
    const yOffset = isVisuallySelected ? -10 : 0;
    const zIndexVal = isVisuallySelected ? 20 : (isOverlayChild ? 15 : (indexInCurrentView === activeIndex ? 10 : 5));

    const cardStyle: React.CSSProperties = {
      borderColor: itemColorCssVar, // This should be 'var(--level-X-color)'
      borderWidth: '2px',
      borderStyle: 'solid',
      boxShadow: isVisuallySelected ? `0 0 20px 0px ${itemColorCssVar}, inset 0 0 12px ${itemColorCssVar}`
        : `0 0 8px -3px ${itemColorCssVar}, inset 0 0 6px -2px ${itemColorCssVar}`,
      zIndex: zIndexVal,
    };
    
    const cardClasses = cn(
      "flex-shrink-0 origin-center cursor-pointer rounded-lg p-2 flex flex-col items-center justify-start text-center overflow-hidden relative transition-all duration-200 aspect-[3/4]",
      bgClass, // Apply the level-themed background with opacity
      isVisuallySelected ? "shadow-2xl" : "shadow-md"
    );

    return (
      <motion.div
        key={entity.id}
        layout 
        className={cardClasses}
        style={{
          width: isOverlayChild ? OVERLAY_CHILD_ITEM_WIDTH : CAROUSEL_ITEM_WIDTH,
          marginRight: isOverlayChild ? (indexInCurrentView === (overlayItems.length - 1) ? 0 : OVERLAY_CHILD_ITEM_GAP) 
                       : (indexInCurrentView === (mainCarouselItems.length - 1) ? 0 : CAROUSEL_ITEM_GAP),
          ...cardStyle
        }}
        animate={{ scale, opacity, y: yOffset }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        onTap={() => {
          if (isOverlayChild) {
            handleEntityInteractionInOverlay(entity);
          } else if (typeof indexInCurrentView === 'number') {
            handleMainCarouselCardTap(entity, indexInCurrentView);
          }
        }}
      >
        {entity.type === 'stack' && entity.isCategoryStack && (
          <div className="absolute -top-[13px] left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full border text-xs font-semibold"
            style={{ backgroundColor: `hsl(var(--background-hsl))`, borderColor: itemColorCssVar, color: itemColorCssVar, boxShadow: `0 2px 5px ${itemColorCssVar}` }}>
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
          {itemForStyling.category === 'Hardware' && itemForStyling.strength?.max && (typeof itemForStyling.strength.current === 'number' || itemForStyling.strength.current === undefined) && (
            <div className="w-full px-1 mt-0.5">
              <p className="text-[9px] text-muted-foreground">Strength</p>
              <Progress value={(((itemForStyling.strength.current ?? itemForStyling.strength.max) / itemForStyling.strength.max) * 100)} className="h-1.5 [&>div]:bg-[var(--progress-color)]" style={{ '--progress-color': itemColorCssVar } as React.CSSProperties} />
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
    <div className="flex flex-col h-full overflow-hidden p-4 md:p-6 max-w-4xl mx-auto w-full">
      {/* Main Panel for Equipment Locker - This will be the transparent one */}
      <div
        className={cn(
          "w-full h-full flex flex-col relative overflow-hidden rounded-lg",
          "bg-slate-800/30" // Example: slightly darker semi-transparent background for main panel
        )}
        // explicitTheme={theme} // Not a HolographicPanel anymore
      >
        <div className="flex-shrink-0 flex justify-between items-center p-3 md:p-4 border-b border-current/20">
          <h2 className="text-xl md:text-2xl font-orbitron text-foreground holographic-text truncate max-w-[calc(100%-100px)]">
            Equipment Locker
          </h2>
          <div className="flex items-center space-x-2">
            <HolographicButton onClick={openSpyShop} className="!p-1.5 md:!p-2" title="Open Spy Shop" explicitTheme={theme}>
              <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
            </HolographicButton>
          </div>
        </div>

        <div 
          ref={mainCarouselContainerRef} 
          className="flex-grow flex items-center justify-start relative overflow-hidden select-none -mx-2 md:-mx-4"
          onWheel={handleWheelScroll}
          onMouseEnter={() => setIsMouseOverCarousel(true)}
          onMouseLeave={() => setIsMouseOverCarousel(false)}
        >
          <AnimatePresence>
            {!isOverlayOpen && mainCarouselItems.length > 0 && (
              <motion.div
                key="main-carousel-draggable"
                className="flex absolute h-full items-center"
                animate={{ x: carouselOffset }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                style={{ paddingLeft: CAROUSEL_ITEM_GAP / 2, paddingRight: CAROUSEL_ITEM_GAP / 2, touchAction: 'pan-y' }} 
              >
                {mainCarouselItems.map((entity, index) => renderCard(entity, false, index))}
              </motion.div>
            )}
            {!isOverlayOpen && mainCarouselItems.length === 0 && (
              <div className="flex-grow flex items-center justify-center w-full">
                <p className="text-muted-foreground font-rajdhani text-lg">Inventory empty.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
        
        <AnimatePresence>
          {isOverlayOpen && (
            <motion.div
              key="overlay-window"
              className="absolute inset-0 z-30 flex flex-col items-center justify-center p-0" // Transparent bg, borderless
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
              transition={{ duration: 0.25, ease: "circOut" }}
            >
              <div className="relative w-full max-w-3xl flex flex-col items-center">
                  <HolographicButton 
                      onClick={handleUpOrCollapseAction} 
                      className="!p-1.5 mb-2 z-10 self-center bg-background/50 hover:bg-background/70" // Positioned above items
                      title="Back/Collapse"
                      explicitTheme={theme}
                  >
                      <ArrowLeft className="w-5 h-5" />
                  </HolographicButton>
                  <div 
                      className="flex overflow-x-auto overflow-y-hidden items-center p-2 scrollbar-hide -mx-2 justify-start w-full"
                      style={{minHeight: `${OVERLAY_CHILD_ITEM_WIDTH * 1.33 + 30}px`}} // Ensure enough height for cards + button
                  >
                      {overlayItems.length > 0 ? 
                          overlayItems.map((entity, index) => renderCard(entity, true, index))
                          : <p className="text-muted-foreground font-rajdhani self-center mx-auto">No items to display.</p>
                      }
                  </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-shrink-0 flex justify-center items-center space-x-2 p-4 mt-auto z-20"> 
          <HolographicButton onClick={() => navigateCarousel(-1)} disabled={isOverlayOpen || activeIndex === 0 || mainCarouselItems.length <=1} className="!p-1.5 md:!p-2" explicitTheme={theme}>
            <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
          </HolographicButton>
          <HolographicButton onClick={handleDownOrExpandAction} disabled={(mainCarouselItems.length === 0 && !isOverlayOpen) || (isOverlayOpen && overlayItems.length === 0)} className="!p-1.5 md:!p-2" explicitTheme={theme}>
            <ChevronDown className="w-4 h-4 md:w-5 md:h-5" />
          </HolographicButton>
          <HolographicButton onClick={handleUpOrCollapseAction} disabled={!isOverlayOpen && expandedStackPath.length === 0 && !selectedEntityId} className="!p-1.5 md:!p-2" explicitTheme={theme}>
            <ChevronUp className="w-4 h-4 md:w-5 md:h-5" />
          </HolographicButton>
          <HolographicButton onClick={() => navigateCarousel(1)} disabled={isOverlayOpen || activeIndex === mainCarouselItems.length - 1 || mainCarouselItems.length <=1} className="!p-1.5 md:!p-2" explicitTheme={theme}>
            <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
          </HolographicButton>
        </div>
      </div>
    </div>
  );
}

// Debounce utility
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

