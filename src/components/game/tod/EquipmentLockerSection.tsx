
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
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ShoppingCart, ArrowLeft, XCircle } from 'lucide-react';
import NextImage from 'next/image';

const CAROUSEL_ITEM_WIDTH = 160;
const CAROUSEL_ITEM_GAP = 20;
const OVERLAY_CHILD_ITEM_WIDTH = 130;
const OVERLAY_CHILD_ITEM_GAP = 15;
const MAX_DISPLAY_ENTITIES_MAIN_CAROUSEL = 8;

interface DisplayIndividualItem {
  type: 'item';
  id: string; // Unique ID for this specific instance in display, e.g., item_basic_pick_l1_instance_0
  item: GameItemBase;
  inventoryQuantity: number; // Should be 1 for individual display
  currentStrength?: number;
}

interface DisplayItemStack {
  type: 'stack';
  id: string; // e.g., stack_category_Hardware, stack_item_Hardware_cypher_lock
  name: string; // Category name or base item name
  items: DisplayIndividualItem[]; // All individual items (full GameItemBase) within this stack
  topItem: GameItemBase; // Highest level item for visual representation
  count: number; // Total number of individual items in this stack
  isCategoryStack?: boolean; // True if this stack represents a whole category
  categoryName?: ItemCategory; // The category this stack belongs to (for item stacks)
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
  return validItems.reduce((highest, current) => {
    if (!current || !current.item) return highest;
    return current.item.level > highest.item.level ? current.item : highest.item;
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
      // Expanding a stack of items with the same base name (e.g., all "Basic Pick")
      // The items in `items` array of the parent stack are already DisplayIndividualItem
      const parentStackIdParts = deepestStackId.split('_'); // e.g. stack_item_InfiltrationGear_basic_pick
      // const categoryFromId = parentStackIdParts[2] as ItemCategory;
      // const baseNameFromId = parentStackIdParts.slice(3).join('_').replace(/_/g, ' '); // Reconstruct base name
      
      // Find the parent stack in a reconstructed root view to get its 'items' array
      // This is a bit indirect; ideally, the parent stack object would be passed down.
      // For now, re-filter allDetailedInventoryItems based on the name derived from ID.
      const baseNameFromId = parentStackIdParts.slice(3).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
      const categoryFromId = parentStackIdParts[2] as ItemCategory;

      return allDetailedInventoryItems.filter(di => di.item.name === baseNameFromId && di.item.category === categoryFromId);
    }
    return [];
  } else { // Root level of the carousel
    const groupedByNameForRoot = groupBy(allDetailedInventoryItems, (di) => di.item.name);
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
  const { playerInventory, openTODWindow, openSpyShop, faction } = useAppContext();
  const { theme } = useTheme();

  const [mainCarouselItems, setMainCarouselItems] = useState<CarouselDisplayEntity[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [carouselOffset, setCarouselOffset] = useState(0);

  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [overlayItems, setOverlayItems] = useState<CarouselDisplayEntity[]>([]);
  const [overlayTitle, setOverlayTitle] = useState(''); // Not used anymore for display
  const [expandedStackPath, setExpandedStackPath] = useState<string[]>([]);

  const mainCarouselContainerRef = useRef<HTMLDivElement>(null);
  const mainCarouselDraggableRef = useRef<HTMLDivElement>(null); // Ref for the draggable motion.div
  const overlayContentRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const mainCarouselSnapshotRef = useRef<{ activeIndex: number; offset: number } | null>(null);

  useEffect(() => {
    const newMainItems = processInventoryForCarousel(playerInventory, []);
    setMainCarouselItems(newMainItems);
    setActiveIndex(newMainItems.length > 0 ? Math.floor(newMainItems.length / 2) : 0);
    setIsOverlayOpen(false);
    setExpandedStackPath([]);
  }, [playerInventory]);

  useEffect(() => {
    if (isOverlayOpen && expandedStackPath.length > 0) {
      const newOverlayItems = processInventoryForCarousel(playerInventory, expandedStackPath);
      setOverlayItems(newOverlayItems);
      // Set overlay title based on the last item in expandedStackPath if needed, though it's not displayed
      const currentStackId = expandedStackPath[expandedStackPath.length - 1];
      const currentStackEntity = findEntityByIdRecursive(mainCarouselItems, currentStackId) || 
                                 findEntityByIdRecursive(overlayItems, currentStackId); // Search in overlay if path > 1
      if (currentStackEntity && currentStackEntity.type === 'stack') {
        setOverlayTitle(currentStackEntity.name);
      }

    } else if (!isOverlayOpen) {
      setOverlayItems([]);
    }
  }, [isOverlayOpen, expandedStackPath, playerInventory, mainCarouselItems]); // Added mainCarouselItems dependency for findEntityByIdRecursive


  const findEntityByIdRecursive = (items: CarouselDisplayEntity[], id: string): CarouselDisplayEntity | undefined => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.type === 'stack' && item.items) {
        // This recursive part is tricky if item.items are not CarouselDisplayEntity but raw GameItemBase
        // For now, this find is mostly for top-level or one-level-deep stacks if their children are also CarouselDisplayEntity.
        // The current processInventoryForCarousel returns GameItemBase for expanded individual items,
        // so a deep search for a stack ID within another stack's *displayed children* needs care.
        // Let's assume for title setting, we only need to find the parent stack.
      }
    }
    return undefined;
  };


  const navigateCarousel = useCallback((direction: number) => {
    if (mainCarouselItems.length === 0 || isOverlayOpen) return;
    setActiveIndex(prev => {
      const newIndex = prev + direction;
      return Math.max(0, Math.min(mainCarouselItems.length - 1, newIndex));
    });
  }, [mainCarouselItems.length, isOverlayOpen]);

  useEffect(() => {
    if (mainCarouselContainerRef.current && mainCarouselItems.length > 0 && !isOverlayOpen) {
      const itemWidth = CAROUSEL_ITEM_WIDTH;
      const totalWidthBeforeActive = activeIndex * (itemWidth + CAROUSEL_ITEM_GAP);
      const targetOffset = -totalWidthBeforeActive + (mainCarouselContainerRef.current.clientWidth / 2 - itemWidth / 2);
      setCarouselOffset(targetOffset);
    } else if (mainCarouselItems.length === 0 && mainCarouselContainerRef.current) {
      setCarouselOffset(mainCarouselContainerRef.current.clientWidth / 2 - CAROUSEL_ITEM_WIDTH / 2);
    }
  }, [activeIndex, mainCarouselItems, mainCarouselContainerRef.current?.clientWidth, isOverlayOpen]);


  const openItemActionModal = (displayItem: DisplayIndividualItem) => {
    const item = displayItem.item;
    openTODWindow(
      `${item.name} L${item.level}`,
      <div className="p-4 font-rajdhani text-center space-y-3">
        <NextImage
          src={item.tileImageSrc || item.imageSrc || `https://placehold.co/128x128.png?text=${item.name.substring(0, 3)}`}
          alt={item.name}
          width={128} height={128}
          className="mx-auto rounded-md mb-2 object-contain bg-black/20 p-1"
          data-ai-hint={`${item.category} icon large`}
          unoptimized
        />
        <p className="text-lg font-semibold" style={{ color: ITEM_LEVEL_COLORS_CSS_VARS[item.level] || 'var(--foreground-hsl)' }}>{item.name} - L{item.level}</p>
        <p className="text-sm text-muted-foreground">{item.description}</p>

        {item.category === 'Hardware' && item.strength && typeof item.strength.current === 'number' && typeof item.strength.max === 'number' && (
          <div className="w-full max-w-xs mx-auto">
            <p className="text-xs text-muted-foreground mt-1">Strength:</p>
            <Progress value={((item.strength.current ?? item.strength.max) / item.strength.max) * 100} className="h-2 [&>div]:bg-[var(--progress-color)]" style={{ '--progress-color': ITEM_LEVEL_COLORS_CSS_VARS[item.level] || 'var(--primary-hsl)' } as React.CSSProperties} />
            <p className="text-xs text-muted-foreground mt-1">{item.strength.current ?? item.strength.max} / {item.strength.max}</p>
          </div>
        )}
        {item.category === 'Infiltration Gear' && typeof item.attackFactor === 'number' && (
          <div className="w-full max-w-xs mx-auto">
            <p className="text-xs text-muted-foreground mt-1">Attack Factor:</p>
            <Progress value={(item.attackFactor / 100) * 100} className="h-2 [&>div]:bg-[var(--progress-color)]" style={{ '--progress-color': ITEM_LEVEL_COLORS_CSS_VARS[item.level] || 'var(--primary-hsl)' } as React.CSSProperties} />
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

  const handleOverlayItemTap = (entity: CarouselDisplayEntity) => {
    if (entity.type === 'stack') {
      const newPath = [...expandedStackPath, entity.id];
      setExpandedStackPath(newPath);
      const newOverlayDisplayItems = processInventoryForCarousel(playerInventory, newPath);
      setOverlayItems(newOverlayDisplayItems);
    } else if (entity.type === 'item') {
      openItemActionModal(entity as DisplayIndividualItem);
    }
  };

  const handleMainCarouselCardTap = (entity: CarouselDisplayEntity, index: number) => {
    if (isDraggingRef.current) return;
    setActiveIndex(index);
    // Further action (expand/open modal) is now handled by the "Down" button.
  };

  const handleDownOrExpandAction = () => {
    if (isOverlayOpen) {
      // Logic for acting on items within the overlay (e.g., if overlay items themselves can be stacks)
      // For now, assume overlay items are mostly individual or final stacks.
      // If an item in overlay is selected, open its modal.
      // This part needs a concept of "selected item within overlay" if complex interactions are needed there.
      // Let's simplify: if overlay is open, "Down" does nothing for now, or targets first item.
      if (overlayItems.length > 0 && overlayItems[0].type === 'item') {
        openItemActionModal(overlayItems[0] as DisplayIndividualItem);
      } else if (overlayItems.length > 0 && overlayItems[0].type === 'stack') {
        handleOverlayItemTap(overlayItems[0]); // Allow drilling deeper if overlay item is a stack
      }
      return;
    }

    if (mainCarouselItems.length === 0) return;
    const entityAtActiveIndex = mainCarouselItems[activeIndex];
    if (!entityAtActiveIndex) return;

    if (entityAtActiveIndex.type === 'stack') {
      if (mainCarouselDraggableRef.current) {
        mainCarouselSnapshotRef.current = { activeIndex, offset: carouselOffset };
      }
      const newExpandedPath = [entityAtActiveIndex.id];
      setExpandedStackPath(newExpandedPath);
      const newOverlayDisplayItems = processInventoryForCarousel(playerInventory, newExpandedPath);
      setOverlayItems(newOverlayDisplayItems);
      setOverlayTitle(entityAtActiveIndex.name); // Set title based on the stack being opened
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
          setActiveIndex(Math.min(restoredActiveIndex, mainCarouselItems.length > 0 ? mainCarouselItems.length - 1 : 0));
          mainCarouselSnapshotRef.current = null;
        } else if (mainCarouselItems.length > 0 && expandedStackPath.length > 0) {
           const parentStackId = expandedStackPath[expandedStackPath.length -1];
           const parentIndexInMain = mainCarouselItems.findIndex(item => item.id === parentStackId);
           if (parentIndexInMain !== -1) setActiveIndex(parentIndexInMain);
        }
      } else {
        // Still in overlay, but one level up
        const newOverlayDisplayItems = processInventoryForCarousel(playerInventory, newPath);
        setOverlayItems(newOverlayDisplayItems);
        // Update overlay title if needed
        const currentStackId = newPath[newPath.length - 1];
        const currentStackEntity = findEntityByIdRecursive(mainCarouselItems, currentStackId) || 
                                   findEntityByIdRecursive(overlayItems, currentStackId); 
        if (currentStackEntity && currentStackEntity.type === 'stack') {
            setOverlayTitle(currentStackEntity.name);
        }
      }
    } else if (!isOverlayOpen && activeIndex !== -1) { // Deselect in main carousel if something was 'active'
      // setActiveIndex(-1); // Or some other state to indicate no selection, though activeIndex always points to centered.
      // For now, "Up" when overlay is closed and an item is centered does nothing extra.
    }
  };

  const handleDragEnd = (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    isDraggingRef.current = false;
    if (mainCarouselContainerRef.current && mainCarouselItems.length > 0) {
      const itemPlusGap = CAROUSEL_ITEM_WIDTH + CAROUSEL_ITEM_GAP;
      const currentVisualStartOfCarouselContents = carouselOffset + info.offset.x;
      const viewportCenterLine = mainCarouselContainerRef.current.clientWidth / 2;

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
    let currentItemForStyling: GameItemBase | undefined = undefined;
    if (entity?.type === 'item') {
      currentItemForStyling = entity.item;
    } else if (entity?.type === 'stack') {
      currentItemForStyling = entity.topItem;
    }

    if (!currentItemForStyling) {
      console.warn("[RenderCard] itemForStyling is undefined for entity:", JSON.stringify(entity));
      currentItemForStyling = FALLBACK_GAME_ITEM;
    }
    const itemForStyling = currentItemForStyling; // Ensure it's not undefined

    const itemLevelForColor = itemForStyling.level || 1;
    const itemColorCssVar = ITEM_LEVEL_COLORS_CSS_VARS[itemLevelForColor] || ITEM_LEVEL_COLORS_CSS_VARS[1];

    const scale = isMainActive ? 1.15 : 1;
    const opacity = isMainActive ? 1 : 0.75;
    const yOffset = isMainActive ? -10 : 0;
    const zIndexVal = isMainActive ? 20 : (isOverlayChild ? 15 : 10);

    const cardStyle: React.CSSProperties = {
      borderColor: `hsl(${itemColorCssVar.replace('var(', '').replace(')', '')})`,
      boxShadow: isMainActive ? `0 0 20px 0px hsla(${itemColorCssVar.replace('var(', '').replace(')', '')}, 0.7), inset 0 0 12px hsla(${itemColorCssVar.replace('var(', '').replace(')', '')}, 0.3)`
        : `0 0 8px -3px hsla(${itemColorCssVar.replace('var(', '').replace(')', '')}, 0.5), inset 0 0 6px hsla(${itemColorCssVar.replace('var(', '').replace(')', '')}, 0.2)`,
      zIndex: zIndexVal,
    };

    return (
      <motion.div
        key={entity.id}
        layout
        className={cn(
          "flex-shrink-0 origin-center cursor-pointer rounded-lg border-2 p-2 flex flex-col items-center justify-start text-center overflow-hidden relative transition-all duration-200 aspect-[3/4]",
          `bg-[${itemColorCssVar}]/10 backdrop-blur-sm`, // Apply level-colored bg with opacity & blur
          isMainActive ? "shadow-2xl" : "shadow-md"
        )}
        style={{
          width: isOverlayChild ? OVERLAY_CHILD_ITEM_WIDTH : CAROUSEL_ITEM_WIDTH,
          marginRight: isOverlayChild ? (indexInCurrentView === (overlayItems.length - 1) ? 0 : OVERLAY_CHILD_ITEM_GAP) 
                       : (indexInCurrentView === (mainCarouselItems.length - 1) ? 0 : CAROUSEL_ITEM_GAP),
          ...cardStyle
        }}
        animate={isOverlayChild ? {} : { scale, opacity, y: yOffset }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        onTap={() => {
          if (isDraggingRef.current) return;
          if (isOverlayChild) {
            handleOverlayItemTap(entity);
          } else {
            handleMainCarouselCardTap(entity, indexInCurrentView ?? 0);
          }
        }}
      >
        {entity.type === 'stack' && entity.isCategoryStack && (
          <div className="absolute -top-[13px] left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full border text-xs font-semibold"
            style={{ backgroundColor: `hsl(var(--background-hsl))`, borderColor: `hsl(${itemColorCssVar.replace('var(', '').replace(')', '')})`, color: `hsl(${itemColorCssVar.replace('var(', '').replace(')', '')})`, boxShadow: `0 2px 5px hsla(${itemColorCssVar.replace('var(', '').replace(')', '')}, 0.3)` }}>
            {entity.name}
          </div>
        )}
        <p className="text-xs md:text-sm font-semibold leading-tight mb-1 flex-shrink-0 truncate w-full px-1" style={{ color: `hsl(${itemColorCssVar.replace('var(', '').replace(')', '')})` }}>
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
              <p style={{ color: `hsl(${itemColorCssVar.replace('var(', '').replace(')', '')})` }}>Type: Rechargeable</p>
              {itemForStyling.perUseCost && <p className="text-muted-foreground text-[9px]">Recharge Cost: {itemForStyling.perUseCost} ELINT</p>}
            </div>
          )}
          {(itemForStyling.type === 'Consumable' || itemForStyling.type === 'One-Time Use') && (
            <p className="mt-0.5" style={{ color: `hsl(${itemColorCssVar.replace('var(', '').replace(')', '')})` }}>Type: {itemForStyling.type}</p>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <HolographicPanel
      className="w-full h-full flex flex-col relative overflow-hidden p-2 md:p-4 bg-background/80 backdrop-blur-sm"
      explicitTheme={theme}
    >
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
          {!isOverlayOpen && mainCarouselItems.length > 0 && (
            <motion.div
              key="main-carousel-draggable"
              ref={mainCarouselDraggableRef}
              className="flex absolute h-full items-center"
              drag="x"
              dragConstraints={{
                left: mainCarouselItems.length > 0 ? -(mainCarouselItems.reduce((acc, item) => acc + (item ? CAROUSEL_ITEM_WIDTH : 0) + CAROUSEL_ITEM_GAP, 0) - (mainCarouselContainerRef.current?.clientWidth || 0) + CAROUSEL_ITEM_WIDTH / 2 + CAROUSEL_ITEM_GAP / 2) : 0,
                right: mainCarouselItems.length > 0 ? ((mainCarouselContainerRef.current?.clientWidth || 0) / 2 - CAROUSEL_ITEM_WIDTH / 2 - CAROUSEL_ITEM_GAP / 2) : 0
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
          {!isOverlayOpen && mainCarouselItems.length === 0 && (
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
            className="fixed inset-0 z-30 flex flex-col items-center justify-center p-4" // Transparent backdrop
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2, ease: "circOut" }}
            style={{
                // Calculate transform origin based on the selected card's position if possible
                // This requires knowing the selected card's screen position before opening.
                // For simplicity, default to center or implement later.
                transformOrigin: 'center center' 
            }}
          >
            <div className="relative w-full max-w-3xl"> {/* Container for button and items */}
                <div className="flex justify-center mb-2">
                    <HolographicButton 
                        onClick={handleUpOrCollapseAction} 
                        className="!p-1.5 !bg-background/50 hover:!bg-background/70 backdrop-blur-sm" 
                        title="Back/Collapse"
                        explicitTheme={theme}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </HolographicButton>
                </div>
                <div 
                    ref={overlayContentRef} 
                    className="flex overflow-x-auto overflow-y-hidden items-center p-2 scrollbar-hide -mx-2 justify-center"
                    style={{minHeight: `${CAROUSEL_ITEM_WIDTH * 1.33 + 20}px`}} // Ensure enough height for cards
                >
                    {overlayItems.map((entity, index) => renderCard(entity, true, index, false))}
                </div>
                {overlayItems.length === 0 && (
                    <p className="text-center text-muted-foreground mt-4">This stack is empty or could not be loaded.</p>
                )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-shrink-0 flex justify-center items-center space-x-2 p-4 mt-auto z-20 bg-transparent">
        <HolographicButton onClick={() => navigateCarousel(-1)} disabled={mainCarouselItems.length <= 1 || isOverlayOpen || activeIndex === 0} className="!p-1.5 md:!p-2" explicitTheme={theme}>
          <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
        </HolographicButton>
        <HolographicButton onClick={handleDownOrExpandAction} disabled={(mainCarouselItems.length === 0 && !isOverlayOpen) || (isOverlayOpen && overlayItems.length === 0)} className="!p-1.5 md:!p-2" explicitTheme={theme}>
          <ChevronDown className="w-4 h-4 md:w-5 md:h-5" />
        </HolographicButton>
        <HolographicButton onClick={handleUpOrCollapseAction} disabled={!isOverlayOpen && expandedStackPath.length === 0} className="!p-1.5 md:!p-2" explicitTheme={theme}>
          <ChevronUp className="w-4 h-4 md:w-5 md:h-5" />
        </HolographicButton>
        <HolographicButton onClick={() => navigateCarousel(1)} disabled={mainCarouselItems.length <= 1 || isOverlayOpen || activeIndex === mainCarouselItems.length - 1} className="!p-1.5 md:!p-2" explicitTheme={theme}>
          <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
        </HolographicButton>
      </div>
    </HolographicPanel>
  );
}
