// src/components/game/tod/EquipmentLockerSection.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { AnimatePresence, motion, PanInfo } from 'framer-motion';
import { useAppContext, type PlayerInventoryItem } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { HolographicButton, HolographicPanel } from '@/components/game/shared/HolographicPanel'; // Added HolographicPanel
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { getItemById, type GameItemBase, type ItemCategory, type ItemLevel } from '@/lib/game-items';
import { ITEM_LEVEL_COLORS_CSS_VARS } from '@/lib/constants';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Layers, ShoppingCart, MousePointerClick } from 'lucide-react';
import NextImage from 'next/image';

const CAROUSEL_ITEM_WIDTH = 160; // width of a single card in px
const CAROUSEL_ITEM_GAP = 20; // gap between cards in px
const MAX_DISPLAY_ENTITIES = 8;

// Types for display entities in the carousel
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
  if (!items || items.length === 0) {
    return { id:'placeholder_item_empty_stack_hl', name:'No Item', description:'This stack is empty.', level:1, cost:0, scarcity:'Common', category:'Hardware', colorVar:1, dataAiHint: "placeholder empty", imageSrc:'https://placehold.co/128x128/000000/FFFFFF.png?text=N/A', tileImageSrc:'https://placehold.co/128x128/000000/FFFFFF.png?text=N/A' };
  }
  const validItems = items.filter(di => di && di.item);
  if (validItems.length === 0) {
     return { id:'placeholder_item_empty_stack_hl_valid', name:'No Item', description:'This stack is empty.', level:1, cost:0, scarcity:'Common', category:'Hardware', colorVar:1, dataAiHint: "placeholder empty", imageSrc:'https://placehold.co/128x128/000000/FFFFFF.png?text=N/A', tileImageSrc:'https://placehold.co/128x128/000000/FFFFFF.png?text=N/A' };
  }
  return validItems.reduce((highestSoFarItem: GameItemBase, currentDisplayItem: DisplayIndividualItem) => {
    return currentDisplayItem.item.level > highestSoFarItem.level ? currentDisplayItem.item : highestSoFarItem;
  }, validItems[0].item);
};

const processInventoryForCarousel = (
  inventory: Record<string, PlayerInventoryItem>,
  expandedStackPath: string[] = []
): CarouselDisplayEntity[] => {
  if (!inventory || Object.keys(inventory).length === 0) {
    return [];
  }

  const detailedInventoryItems: DisplayIndividualItem[] = Object.entries(inventory)
    .flatMap(([itemId, invItem]) => {
      const baseItem = getItemById(itemId);
      if (!baseItem) return [];
      return Array.from({ length: invItem.quantity }, (_, index) => ({
        type: 'item' as 'item',
        id: `${itemId}_instance_${index}`,
        item: baseItem,
        inventoryQuantity: 1,
        currentStrength: invItem.currentStrength,
      }));
    })
    .filter((item): item is DisplayIndividualItem => !!item && !!item.item)
    .sort((a, b) => b.item.level - a.item.level || a.item.name.localeCompare(b.item.name));

  if (detailedInventoryItems.length === 0) return [];

  if (expandedStackPath.length > 0) {
    const currentStackIdToExpand = expandedStackPath[expandedStackPath.length - 1];

    if (currentStackIdToExpand.startsWith('stack_category_')) {
      const category = currentStackIdToExpand.replace('stack_category_', '') as ItemCategory;
      const itemsInCategory = detailedInventoryItems.filter(di => di.item.category === category);
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

    } else if (currentStackIdToExpand.startsWith('stack_item_')) {
      // Find all items that make up this stack (e.g., all "Basic Pick L1" instances)
      const stackIdParts = currentStackIdToExpand.split('_'); // e.g., ["stack", "item", "InfiltrationGear", "basic", "pick"]
      const categoryFromId = stackIdParts[2] as ItemCategory;
      const baseNameFromId = stackIdParts.slice(3).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '); // Reconstruct base name

      return detailedInventoryItems.filter(di => di.item.name === baseNameFromId && di.item.category === categoryFromId);
    }
  }

  const groupedByNameForRoot = groupBy(detailedInventoryItems, (di) => di.item.name);
  const rootEntities: CarouselDisplayEntity[] = [];
  Object.entries(groupedByNameForRoot).forEach(([name, items]) => {
    if (items.length === 1) {
      rootEntities.push(items[0]);
    } else {
      rootEntities.push({
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

  if (rootEntities.length <= MAX_DISPLAY_ENTITIES) {
      return rootEntities.sort((a, b) => {
          const nameA = a.type === 'item' ? a.item.name : a.name;
          const nameB = b.type === 'item' ? b.item.name : b.name;
          return nameA.localeCompare(nameB);
      });
  }

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
};


export function EquipmentLockerSection({ parallaxOffset }: { parallaxOffset: number }) {
  const { playerInventory, openTODWindow, openSpyShop, closeInventoryTOD } = useAppContext();
  const { theme } = useTheme();

  const [expandedStackPath, setExpandedStackPath] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [carouselOffset, setCarouselOffset] = useState(0);

  const carouselItems = useMemo(() => processInventoryForCarousel(playerInventory, expandedStackPath), [playerInventory, expandedStackPath]);

  const carouselRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    if (expandedStackPath.length === 0) {
      // setActiveIndex(0); // Don't reset activeIndex to 0 when collapsing to root, handled by handleUpOrCollapseAction
      // setSelectedEntityId(null); // Also handled by handleUpOrCollapseAction
    }
  }, [carouselItems.length, expandedStackPath]);


  const navigateCarousel = useCallback((direction: number) => {
    if (carouselItems.length === 0) return;
    setActiveIndex(prev => {
      const newIndex = prev + direction;
      return Math.max(0, Math.min(carouselItems.length - 1, newIndex));
    });
  }, [carouselItems.length]);

  useEffect(() => {
    if (carouselRef.current && carouselItems.length > 0) {
      const targetOffset = -activeIndex * (CAROUSEL_ITEM_WIDTH + CAROUSEL_ITEM_GAP) +
                           (carouselRef.current.clientWidth / 2 - CAROUSEL_ITEM_WIDTH / 2);
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
            <Progress value={(item.strength.current / item.strength.max) * 100} className="h-2" style={{ '--progress-color': ITEM_LEVEL_COLORS_CSS_VARS[item.level] || 'var(--primary-hsl)' } as React.CSSProperties}/>
            <p className="text-xs text-muted-foreground mt-1">{item.strength.current} / {item.strength.max}</p>
          </div>
        )}
        {item.category === 'Infiltration Gear' && typeof item.attackFactor === 'number' && (
           <div className="w-full max-w-xs mx-auto">
            <p className="text-xs text-muted-foreground mt-1">Attack Factor:</p>
            <Progress value={(item.attackFactor / 100) * 100} className="h-2" style={{ '--progress-color': ITEM_LEVEL_COLORS_CSS_VARS[item.level] || 'var(--primary-hsl)' } as React.CSSProperties}/>
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
      // An item is selected, but it's not the one in the center.
      // Deselect the old one, select the new one.
      setSelectedEntityId(entityAtActiveIndex.id);
    } else if (!selectedEntityId) {
      // Nothing is selected, select the one in the center.
      setSelectedEntityId(entityAtActiveIndex.id);
    } else {
      // The item in the center IS the selectedEntityId. Perform action.
      if (entityAtActiveIndex.type === 'stack') {
        setExpandedStackPath(prev => [...prev, entityAtActiveIndex.id]);
        setSelectedEntityId(null); 
        setActiveIndex(0); 
      } else if (entityAtActiveIndex.type === 'item') {
        openItemActionModal(entityAtActiveIndex as DisplayIndividualItem);
      }
    }
  };

  const handleUpOrCollapseAction = () => {
    if (expandedStackPath.length > 0) {
      const justCollapsedStackId = expandedStackPath[expandedStackPath.length - 1];
      const newPath = expandedStackPath.slice(0, -1);
      setExpandedStackPath(newPath);
      
      // After path changes, carouselItems will re-calculate.
      // We need to find the index of the 'justCollapsedStackId' in the *new* carouselItems.
      // This needs to happen in a useEffect that watches carouselItems and newPath.
      // For now, let's set selectedEntityId and activeIndex might need adjustment in useEffect.
      const newItemsForParentView = processInventoryForCarousel(playerInventory, newPath);
      const indexToSelect = newItemsForParentView.findIndex(item => item.id === justCollapsedStackId);
      
      setSelectedEntityId(justCollapsedStackId || null);
      setActiveIndex(indexToSelect >=0 ? indexToSelect : 0);

    } else if (selectedEntityId) {
        setSelectedEntityId(null);
    }
  };


  const handleCardTap = (entity: CarouselDisplayEntity, index: number) => {
    if (isDraggingRef.current) return;

    if (entity.id === selectedEntityId) {
      if (entity.type === 'stack') {
        setExpandedStackPath(prev => [...prev, entity.id]);
        setSelectedEntityId(null);
        setActiveIndex(0);
      } else {
        openItemActionModal(entity as DisplayIndividualItem);
      }
    } else {
      setSelectedEntityId(entity.id);
      setActiveIndex(index);
    }
  };

  const handleDragEnd = (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    isDraggingRef.current = false;
    
    if (carouselRef.current && carouselItems.length > 0) {
        const itemPlusGap = CAROUSEL_ITEM_WIDTH + CAROUSEL_ITEM_GAP;
        // Corrected: drag offset is info.offset.x (how much was dragged from start of drag)
        // currentVisualStart should be the position of the carousel *before* this drag started, PLUS the drag amount
        // carouselOffset is the state variable of the carousel's x position from the animate={{ x: carouselOffset }}
        // So, the effective start of the carousel for this drag event is carouselOffset.
        const currentVisualStartOfCarouselContents = carouselOffset + info.offset.x;
        
        const viewportCenterLine = carouselRef.current.clientWidth / 2;

        let closestIndex = 0;
        let minDistance = Infinity;

        for (let i = 0; i < carouselItems.length; i++) {
            // itemCenterRelative is the center of item 'i' relative to the start of the carousel's content
            const itemCenterRelative = (i * itemPlusGap) + (CAROUSEL_ITEM_WIDTH / 2);
            // itemCenterInViewport is the absolute position of item 'i's center within the viewport
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
  
  return (
    <HolographicPanel
      className="w-full h-full flex flex-col relative overflow-hidden p-2 md:p-4"
      explicitTheme={theme}
    >
      <div className="flex-shrink-0 flex justify-between items-center mb-2 md:mb-4 px-2">
        <h2 className="text-xl md:text-2xl font-orbitron holographic-text truncate max-w-[calc(100%-100px)]">
          {expandedStackPath.length > 0
            ? expandedStackPath[expandedStackPath.length -1].replace('stack_category_', '').replace(/^stack_item_[^_]+_/, '').replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
            : "Equipment Locker"}
        </h2>
        <div className="flex items-center space-x-2">
            <HolographicButton onClick={handleUpOrCollapseAction} disabled={!selectedEntityId && expandedStackPath.length === 0} className="!p-1.5 md:!p-2" title="Go Up / Collapse Stack / Deselect">
                <Layers className="w-4 h-4 md:w-5 md:h-5" />
            </HolographicButton>
            <HolographicButton
                onClick={openSpyShop}
                className="!p-1.5 md:!p-2"
                title="Open Spy Shop"
            >
                <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
            </HolographicButton>
        </div>
      </div>

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
                    left: carouselItems.length > 0 ? -(carouselItems.length * (CAROUSEL_ITEM_WIDTH + CAROUSEL_ITEM_GAP) - (carouselRef.current?.clientWidth || 0) + CAROUSEL_ITEM_WIDTH / 2 + CAROUSEL_ITEM_GAP / 2 ) : 0, 
                    right: carouselItems.length > 0 ? ((carouselRef.current?.clientWidth || 0)/2 - CAROUSEL_ITEM_WIDTH/2 - CAROUSEL_ITEM_GAP/2) : 0 
                }}
                onDragStart={() => isDraggingRef.current = true}
                onDragEnd={handleDragEnd}
                animate={{ x: carouselOffset }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                style={{ paddingLeft: CAROUSEL_ITEM_GAP / 2, paddingRight: CAROUSEL_ITEM_GAP / 2 }} 
            >
            {carouselItems.map((entity, index) => {
                let itemForStyling: GameItemBase | undefined = entity.type === 'item' ? entity.item : entity.topItem;

                if (!itemForStyling) {
                    console.warn('CRITICAL: itemForStyling is undefined for entity:', JSON.stringify(entity));
                    itemForStyling = {
                        id: `fallback-${entity?.id || index}`, name: 'Error Item', description: 'This item could not be loaded.',
                        level: 1, cost: 0, scarcity: 'Common', category: 'Hardware', colorVar: 1,
                        imageSrc: 'https://placehold.co/128x128/ff0000/ffffff.png?text=ERR',
                        tileImageSrc: 'https://placehold.co/128x128/ff0000/ffffff.png?text=ERR',
                        dataAiHint: 'error placeholder'
                    };
                }
                
                const itemLevelForColor = itemForStyling.level || 1;
                const itemColorCssVar = ITEM_LEVEL_COLORS_CSS_VARS[itemLevelForColor] || ITEM_LEVEL_COLORS_CSS_VARS[1] || 'var(--foreground-hsl)';

                const isActuallySelected = entity.id === selectedEntityId;
                const scale = isActuallySelected ? 1.15 : 1;
                const opacity = isActuallySelected ? 1 : 0.75;
                const zIndex = isActuallySelected ? carouselItems.length + 1 : carouselItems.length - Math.abs(index - activeIndex);
                const yOffset = isActuallySelected ? -10 : 0;

                let cardContent;
                if (entity.type === 'item') {
                    const item = entity.item;
                    cardContent = (
                        <>
                            <p className="text-xs md:text-sm font-semibold leading-tight mb-1 flex-shrink-0" style={{ color: itemColorCssVar }}>
                                {item.name} L{item.level}
                            </p>
                            <div className="relative w-full h-2/3 mb-1 flex-shrink-0">
                                <NextImage
                                    src={(item.tileImageSrc || item.imageSrc) || `https://placehold.co/128x128/1a1a1a/FFFFFF.png?text=${item.name.substring(0,3)}`}
                                    alt={item.name} layout="fill" objectFit="contain" className="drop-shadow-md"
                                    data-ai-hint={`${item.category} icon tile`} unoptimized
                                />
                            </div>
                            <div className="flex flex-col items-center w-full flex-grow justify-end text-[10px] md:text-xs">
                                {item.category === 'Hardware' && item.strength && typeof item.strength.max === 'number' && item.strength.max > 0 && (
                                    <div className="w-full px-1 mt-0.5 flex-shrink-0">
                                        <p className="text-[9px] text-muted-foreground">Strength</p>
                                        <Progress value={((item.strength.current ?? item.strength.max) / item.strength.max) * 100} className="h-1.5" style={{ '--progress-color': itemColorCssVar } as React.CSSProperties} />
                                    </div>
                                )}
                                {item.category === 'Infiltration Gear' && typeof item.attackFactor === 'number' && (
                                    <div className="w-full px-1 mt-0.5 flex-shrink-0">
                                        <p className="text-[9px] text-muted-foreground">Attack Factor</p>
                                        <Progress value={(item.attackFactor / 100) * 100} className="h-1.5" style={{ '--progress-color': itemColorCssVar } as React.CSSProperties} />
                                    </div>
                                )}
                                {item.type === 'Rechargeable' && (
                                    <div className="mt-0.5 text-center">
                                        <p style={{ color: itemColorCssVar }}>Type: Rechargeable</p>
                                        {item.perUseCost && <p className="text-muted-foreground text-[9px]">Cost: {item.perUseCost} ELINT</p>}
                                    </div>
                                )}
                                {(item.type === 'Consumable' || item.type === 'One-Time Use') && (
                                     <p className="mt-0.5" style={{ color: itemColorCssVar }}>Type: {item.type}</p>
                                )}
                            </div>
                        </>
                    );
                } else { // entity.type === 'stack'
                    cardContent = (
                        <>
                             <p className="text-xs md:text-sm font-semibold leading-tight mb-1 flex-shrink-0" style={{ color: itemColorCssVar }}>
                                {entity.name}
                             </p>
                             <div className="relative w-full h-2/3 mb-1 flex-shrink-0">
                                <NextImage
                                    src={(itemForStyling.tileImageSrc || itemForStyling.imageSrc) || `https://placehold.co/128x128/1a1a1a/FFFFFF.png?text=${itemForStyling.name.substring(0,3)}`}
                                    alt={itemForStyling.name} layout="fill" objectFit="contain" className="drop-shadow-md"
                                    data-ai-hint={`${itemForStyling.category} icon tile`} unoptimized
                                />
                            </div>
                            <div className="flex flex-col items-center w-full flex-grow justify-end text-[10px] md:text-xs">
                                <p className="text-muted-foreground mb-0.5">(Quantity: {entity.count})</p>
                                <p className="font-semibold" style={{color: itemColorCssVar}}>
                                    Top: Lvl {itemForStyling.level}
                                </p>
                                {itemForStyling.category === 'Hardware' && itemForStyling.strength && typeof itemForStyling.strength.max === 'number' && itemForStyling.strength.max > 0 && (
                                    <div className="w-full px-1 mt-0.5 flex-shrink-0">
                                        <p className="text-[9px] text-muted-foreground">Top Strength</p>
                                        <Progress value={((itemForStyling.strength.current ?? itemForStyling.strength.max) / itemForStyling.strength.max) * 100} className="h-1.5" style={{ '--progress-color': itemColorCssVar } as React.CSSProperties} />
                                    </div>
                                )}
                                {itemForStyling.category === 'Infiltration Gear' && typeof itemForStyling.attackFactor === 'number' && (
                                    <div className="w-full px-1 mt-0.5 flex-shrink-0">
                                        <p className="text-[9px] text-muted-foreground">Top Attack</p>
                                        <Progress value={(itemForStyling.attackFactor / 100) * 100} className="h-1.5" style={{ '--progress-color': itemColorCssVar } as React.CSSProperties} />
                                    </div>
                                )}
                            </div>
                        </>
                    );
                }

                return (
                <motion.div
                    key={entity.id}
                    className="flex-shrink-0 origin-center cursor-pointer"
                    style={{
                        width: CAROUSEL_ITEM_WIDTH,
                        height: CAROUSEL_ITEM_WIDTH * 1.5, 
                        marginRight: index === carouselItems.length -1 ? 0 : CAROUSEL_ITEM_GAP,
                    }}
                    animate={{ scale, opacity, zIndex, y: yOffset }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    onTap={() => handleCardTap(entity, index)}
                >
                    <div
                        className={cn(
                            "w-full h-full rounded-lg border-2 p-2.5 flex flex-col items-center justify-start text-center overflow-hidden relative transition-all duration-200",
                            isActuallySelected ? "shadow-2xl" : "shadow-md"
                        )}
                        style={{
                            borderColor: itemColorCssVar,
                            background: `
                                linear-gradient(145deg, hsla(var(--card-hsl), 0.95), hsla(var(--card-hsl), 0.75)),
                                radial-gradient(circle at top left, ${itemColorCssVar}0A, transparent 70%),
                                radial-gradient(circle at bottom right, ${itemColorCssVar}1A, transparent 60%)
                            `,
                            boxShadow: isActuallySelected ? `0 0 20px 0px ${itemColorCssVar}B3, inset 0 0 12px ${itemColorCssVar}50` : `0 0 8px -3px ${itemColorCssVar}90, inset 0 0 6px ${itemColorCssVar}30`,
                        }}
                    >
                        {entity.type === 'stack' && entity.isCategoryStack && (
                            <div
                                className="absolute -top-[13px] left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full border text-xs font-semibold"
                                style={{
                                    backgroundColor: `hsl(var(--background-hsl))`,
                                    borderColor: itemColorCssVar,
                                    color: itemColorCssVar,
                                    boxShadow: `0 2px 5px ${itemColorCssVar}50`
                                }}
                            >
                                {entity.name}
                            </div>
                        )}
                       {cardContent}
                    </div>
                </motion.div>
                );
            })}
            </motion.div>
        </div>
      )}
      <div className="flex-shrink-0 flex justify-center items-center space-x-2 p-2 mt-auto z-20">
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

// Helper: Simple groupBy function
function groupBy<T>(array: T[], keyAccessor: (item: T) => string): Record<string, T[]> {
  return array.reduce((result, currentValue) => {
    const groupKey = keyAccessor(currentValue);
    (result[groupKey] = result[groupKey] || []).push(currentValue);
    return result;
  }, {} as Record<string, T[]>);
}

