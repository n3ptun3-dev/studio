
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
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Layers, ShoppingCart } from 'lucide-react'; // Added ChevronUp, ChevronDown
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
    return { id:'placeholder_item', name:'No Item', description:'This stack is empty.', level:1, cost:0, scarcity:'Common', category:'Hardware', colorVar:1, dataAiHint: "placeholder item", imageSrc:'https://placehold.co/128x128/000000/FFFFFF.png?text=N/A', tileImageSrc:'https://placehold.co/128x128/000000/FFFFFF.png?text=N/A' };
  }
  // Ensure that the reduce function correctly handles the types.
  // The accumulator `highestSoFar` should be a GameItemBase.
  // The initial value should be the item of the first DisplayIndividualItem.
  return items.reduce((highestSoFarItem: GameItemBase, currentDisplayItem: DisplayIndividualItem) => {
    if (!currentDisplayItem || !currentDisplayItem.item) return highestSoFarItem; // Skip malformed current items
    if (!highestSoFarItem) return currentDisplayItem.item; // Should only happen if initial value was bad
    return currentDisplayItem.item.level > highestSoFarItem.level ? currentDisplayItem.item : highestSoFarItem;
  }, items[0]?.item || { id:'placeholder_item_fallback', name:'Error', description:'Fallback item.', level:1, cost:0, scarcity:'Common', category:'Hardware', colorVar:1, dataAiHint: "error placeholder", imageSrc:'https://placehold.co/128x128/ff0000/ffffff.png?text=ERR', tileImageSrc:'https://placehold.co/128x128/ff0000/ffffff.png?text=ERR' });
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
    .filter((item): item is DisplayIndividualItem => !!item && !!item.item) // Ensure item.item is also valid
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
        id: `stack_item_${category}_${name.toLowerCase().replace(/\s+/g, '_')}`,
        name: name,
        items: itemsInNameGroup, 
        topItem: findHighestLevelItem(itemsInNameGroup),
        count: itemsInNameGroup.length, 
        categoryName: category,
      })).sort((a,b) => a.name.localeCompare(b.name));

    } else if (currentStackIdToExpand.startsWith('stack_item_')) {
      const parts = currentStackIdToExpand.split('_');
      const category = parts[2] as ItemCategory; // e.g., stack_item_CATEGORY_itemname -> CATEGORY
      const itemName = parts.slice(3).join(' ').replace(/\b\w/g, l => l.toUpperCase()); // Reconstruct item name
      return detailedInventoryItems.filter(di => di.item.name === itemName && di.item.category === category);
    }
  }

  if (detailedInventoryItems.length <= MAX_DISPLAY_ENTITIES && detailedInventoryItems.length > 0) {
    return detailedInventoryItems;
  }

  const groupedByName = groupBy(detailedInventoryItems, (di) => di.item.name);
  let nameStacks: DisplayItemStack[] = Object.entries(groupedByName).map(([name, items]): DisplayItemStack => ({
    type: 'stack',
    id: `stack_item_${items[0].item.category}_${name.toLowerCase().replace(/\s+/g, '_')}`,
    name: name,
    items: items, 
    topItem: findHighestLevelItem(items),
    count: items.length, 
    categoryName: items[0].item.category,
  }));

  if (nameStacks.length <= MAX_DISPLAY_ENTITIES) {
    return nameStacks.sort((a,b) => a.name.localeCompare(b.name));
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
  const { playerInventory, openTODWindow, openSpyShop } = useAppContext();
  const { theme } = useTheme();

  const [expandedStackPath, setExpandedStackPath] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [carouselOffset, setCarouselOffset] = useState(0);

  const carouselItems = useMemo(() => processInventoryForCarousel(playerInventory, expandedStackPath), [playerInventory, expandedStackPath]);

  const carouselRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    setActiveIndex(0);
    setSelectedEntityId(null); 
    setCarouselOffset(0);
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
      const targetOffset = -activeIndex * (CAROUSEL_ITEM_WIDTH + CAROUSEL_ITEM_GAP) +
                           (carouselRef.current.clientWidth / 2 - CAROUSEL_ITEM_WIDTH / 2);
      setCarouselOffset(targetOffset);
    } else if (carouselItems.length === 0 && carouselRef.current) {
        setCarouselOffset(carouselRef.current.clientWidth / 2 - CAROUSEL_ITEM_WIDTH / 2);
    }
  }, [activeIndex, carouselItems, carouselRef.current?.clientWidth]);


  const openItemActionModal = (displayItem: DisplayIndividualItem) => {
    const item = displayItem.item;
    const isHardware = item.category === 'Hardware';
    const isRechargeableTool = item.category === 'Infiltration Gear' && item.type === 'Rechargeable';
    
    let currentStrengthForModal = displayItem.currentStrength;
    if (isRechargeableTool && currentStrengthForModal === undefined) {
        currentStrengthForModal = item.maxStrength; 
    }
    
    const maxStrengthForModal = isHardware && item.strength ? item.strength.max : (isRechargeableTool && item.maxStrength ? item.maxStrength : undefined);
    const canRechargeTool = isRechargeableTool && currentStrengthForModal === 0;

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
        <p className="text-lg font-semibold" style={{color: `hsl(${ITEM_LEVEL_COLORS_CSS_VARS[item.level]})`}}>{item.name} - L{item.level}</p>
        <p className="text-sm text-muted-foreground">{item.description}</p>
        
        {isHardware && typeof currentStrengthForModal === 'number' && typeof maxStrengthForModal === 'number' && (
          <div className="w-full max-w-xs mx-auto">
            <p className="text-xs text-muted-foreground mt-1">Strength:</p>
            <Progress value={(currentStrengthForModal / maxStrengthForModal) * 100} className="h-2" style={{ '--progress-color': `hsl(${ITEM_LEVEL_COLORS_CSS_VARS[item.level]})` } as React.CSSProperties}/>
            <p className="text-xs text-muted-foreground mt-1">{currentStrengthForModal} / {maxStrengthForModal}</p>
          </div>
        )}

        {item.category === 'Infiltration Gear' && typeof item.attackFactor === 'number' && (
           <div className="w-full max-w-xs mx-auto">
            <p className="text-xs text-muted-foreground mt-1">Attack Factor:</p>
            <Progress value={(item.attackFactor / 100) * 100} className="h-2" style={{ '--progress-color': `hsl(${ITEM_LEVEL_COLORS_CSS_VARS[item.level]})` } as React.CSSProperties}/>
          </div>
        )}

        {isRechargeableTool && (
            <>
              <p className="text-sm">Type: Rechargeable</p>
              {item.perUseCost && <p className="text-sm text-muted-foreground">Recharge Cost: {item.perUseCost} ELINT</p>}
              <p className="text-sm">Status: {currentStrengthForModal !== 0 ? "Ready" : "Needs Recharge"}</p>
            </>
        )}
        {(item.type === 'Consumable' || item.type === 'One-Time Use') && <p className="text-sm">Type: {item.type}</p>}


        <HolographicButton onClick={() => console.log("Deploy", item.id)} className="w-full">Deploy</HolographicButton>
        {canRechargeTool && (
           <HolographicButton onClick={() => console.log("Recharge", item.id)} className="w-full">Recharge ({item.perUseCost} ELINT)</HolographicButton>
        )}
        <HolographicButton onClick={() => console.log("Drop", item.id)} className="w-full border-destructive text-destructive hover:bg-destructive hover:text-background">Drop</HolographicButton>
      </div>,
      { showCloseButton: true }
    );
  };

  const handleDownOrExpandAction = () => {
    if (carouselItems.length === 0) return;
    const entityAtActiveIndex = carouselItems[activeIndex];

    if (selectedEntityId && entityAtActiveIndex && selectedEntityId !== entityAtActiveIndex.id) {
      setSelectedEntityId(entityAtActiveIndex.id); // Select new item at center
    } else if (entityAtActiveIndex) {
      setSelectedEntityId(entityAtActiveIndex.id); // Ensure it's selected
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
        const parentStackId = expandedStackPath[expandedStackPath.length - 2]; 
        setExpandedStackPath(prev => prev.slice(0, -1));
        const newCarouselItemsAfterCollapse = processInventoryForCarousel(playerInventory, expandedStackPath.slice(0, -1));
        const parentIndexInNewItems = newCarouselItemsAfterCollapse.findIndex(item => item.id === parentStackId);
        
        setSelectedEntityId(parentStackId || null); 
        setActiveIndex(parentIndexInNewItems >=0 ? parentIndexInNewItems : 0);

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
        // Current visual position of the start of the carousel (taking into account current carouselOffset)
        const currentVisualStart = carouselOffset + info.offset.x;
        // The X coordinate in the viewport that represents the center of the carousel container
        const viewportCenterLine = carouselRef.current.clientWidth / 2;

        // Calculate which item's center is closest to the viewport's center line after drag
        let closestIndex = 0;
        let minDistance = Infinity;

        for (let i = 0; i < carouselItems.length; i++) {
            // X position of the center of item 'i' relative to the start of the carousel
            const itemCenterRelative = (i * itemPlusGap) + (CAROUSEL_ITEM_WIDTH / 2);
            // X position of the center of item 'i' in viewport coordinates after drag
            const itemCenterInViewport = currentVisualStart + itemCenterRelative;
            
            const distanceToViewportCenter = Math.abs(itemCenterInViewport - viewportCenterLine);
            
            if (distanceToViewportCenter < minDistance) {
                minDistance = distanceToViewportCenter;
                closestIndex = i;
            }
        }
        setActiveIndex(Math.max(0, Math.min(carouselItems.length - 1, closestIndex)));
    } else {
      // Fallback if no items or ref, just reset to 0 or current activeIndex
       setActiveIndex(prev => Math.max(0, Math.min(carouselItems.length - 1, prev)));
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
            <HolographicButton onClick={handleUpOrCollapseAction} className="!p-1.5 md:!p-2" title="Go Up / Collapse Stack / Deselect">
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
                    right: carouselItems.length > 0 ? (carouselRef.current?.clientWidth || 0)/2 - CAROUSEL_ITEM_WIDTH/2 - CAROUSEL_ITEM_GAP/2 : 0 
                }}
                onDragStart={() => isDraggingRef.current = true}
                onDragEnd={handleDragEnd}
                animate={{ x: carouselOffset }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                style={{ paddingLeft: CAROUSEL_ITEM_GAP / 2, paddingRight: CAROUSEL_ITEM_GAP / 2 }} 
            >
            {carouselItems.map((entity, index) => {
                const isActuallySelected = entity.id === selectedEntityId;
                let itemForStyling = entity.type === 'item' ? entity.item : entity.topItem;

                if (!itemForStyling) {
                    console.warn('Critical Error: itemForStyling is undefined for entity:', JSON.stringify(entity));
                    itemForStyling = {
                        id: `fallback-${entity?.id || index}`, name: 'Error Item', description: 'This item could not be loaded.',
                        level: 1, cost: 0, scarcity: 'Common', category: 'Hardware', colorVar: 1,
                        imageSrc: 'https://placehold.co/128x128/ff0000/ffffff.png?text=ERR',
                        tileImageSrc: 'https://placehold.co/128x128/ff0000/ffffff.png?text=ERR',
                        dataAiHint: 'error placeholder'
                    };
                }
                
                const itemLevelForColor = itemForStyling.level || 1; // Default to level 1 if undefined
                const itemColorVar = ITEM_LEVEL_COLORS_CSS_VARS[itemLevelForColor] || ITEM_LEVEL_COLORS_CSS_VARS[1] ||'--foreground';
                const itemColor = `hsl(${itemColorVar})`;

                const scale = isActuallySelected ? 1.15 : 1;
                const opacity = isActuallySelected ? 1 : 0.75;
                const zIndex = isActuallySelected ? carouselItems.length + 1 : carouselItems.length - Math.abs(index - activeIndex);
                const yOffset = isActuallySelected ? -10 : 0; // Negative yOffset to "bring forward"

                let cardContent;
                if (entity.type === 'item') {
                    const item = entity.item;
                    cardContent = (
                        <>
                            <p className="text-xs md:text-sm font-semibold leading-tight mb-0.5" style={{ color: itemColor }}>
                                {item.name} L{item.level}
                            </p>
                            {item.category === 'Hardware' && item.strength && typeof item.strength.max === 'number' && item.strength.max > 0 && (
                                <div className="w-full px-1 mt-1.5 flex-shrink-0">
                                    <p className="text-[9px] text-muted-foreground">Strength</p>
                                    <Progress value={((entity.currentStrength ?? item.strength.current) / item.strength.max) * 100} className="h-1.5" style={{ '--progress-color': itemColor } as React.CSSProperties} />
                                </div>
                            )}
                            {item.category === 'Infiltration Gear' && typeof item.attackFactor === 'number' && (
                                <div className="w-full px-1 mt-1.5 flex-shrink-0">
                                    <p className="text-[9px] text-muted-foreground">Attack Factor</p>
                                    <Progress value={(item.attackFactor / 100) * 100} className="h-1.5" style={{ '--progress-color': itemColor } as React.CSSProperties} />
                                </div>
                            )}
                            {item.type === 'Rechargeable' && (
                                <div className="mt-1.5 text-[10px] md:text-xs text-center">
                                    <p style={{ color: itemColor }}>Type: Rechargeable</p>
                                    {item.perUseCost && <p className="text-muted-foreground text-[9px]">Cost: {item.perUseCost} ELINT</p>}
                                </div>
                            )}
                            {(item.type === 'Consumable' || item.type === 'One-Time Use') && (
                                 <p className="mt-1.5 text-[10px] md:text-xs" style={{ color: itemColor }}>Type: {item.type}</p>
                            )}
                        </>
                    );
                } else { // entity.type === 'stack'
                    cardContent = (
                        <>
                            <p className="text-xs md:text-sm font-semibold leading-tight mb-0.5" style={{ color: itemColor }}>
                                {entity.name}
                            </p>
                            <p className="text-[10px] md:text-xs text-muted-foreground mb-1">(Quantity: {entity.count})</p>
                            <p className="text-[10px] md:text-xs text-primary-foreground font-semibold">
                                Top: Lvl {itemForStyling.level}
                            </p>
                            {itemForStyling.category === 'Hardware' && itemForStyling.strength && typeof itemForStyling.strength.max === 'number' && itemForStyling.strength.max > 0 && (
                                <div className="w-full px-1 mt-1.5 flex-shrink-0">
                                     <p className="text-[9px] text-muted-foreground">Top Item Strength</p>
                                    <Progress value={(itemForStyling.strength.current / itemForStyling.strength.max) * 100} className="h-1.5" style={{ '--progress-color': itemColor } as React.CSSProperties} />
                                </div>
                            )}
                            {itemForStyling.category === 'Infiltration Gear' && typeof itemForStyling.attackFactor === 'number' && (
                                <div className="w-full px-1 mt-1.5 flex-shrink-0">
                                    <p className="text-[9px] text-muted-foreground">Top Item Attack</p>
                                    <Progress value={(itemForStyling.attackFactor / 100) * 100} className="h-1.5" style={{ '--progress-color': itemColor } as React.CSSProperties} />
                                </div>
                            )}
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
                            "w-full h-full rounded-lg border-2 p-2.5 flex flex-col items-center justify-between text-center overflow-hidden relative transition-all duration-200",
                            isActuallySelected ? "shadow-2xl" : "shadow-md"
                        )}
                        style={{
                            borderColor: itemColor,
                            background: `
                                linear-gradient(145deg, hsla(var(--card-hsl), 0.95), hsla(var(--card-hsl), 0.75)),
                                radial-gradient(circle at top left, ${itemColor}0A, transparent 70%),
                                radial-gradient(circle at bottom right, ${itemColor}1A, transparent 60%)
                            `,
                            boxShadow: isActuallySelected ? `0 0 20px 0px ${itemColor}B3, inset 0 0 12px ${itemColor}50` : `0 0 8px -3px ${itemColor}90, inset 0 0 6px ${itemColor}30`,
                        }}
                    >
                        {entity.type === 'stack' && entity.isCategoryStack && (
                            <div
                                className="absolute -top-[13px] left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full border text-xs font-semibold"
                                style={{
                                    backgroundColor: `hsl(var(--background-hsl))`,
                                    borderColor: itemColor,
                                    color: itemColor,
                                    boxShadow: `0 2px 5px ${itemColor}50`
                                }}
                            >
                                {entity.name}
                            </div>
                        )}
                        <div className="relative w-full h-2/3 mb-1 flex-shrink-0">
                            <NextImage
                                src={(itemForStyling.tileImageSrc || itemForStyling.imageSrc) || `https://placehold.co/128x128/1a1a1a/FFFFFF.png?text=${itemForStyling.name.substring(0,3)}`}
                                alt={itemForStyling.name}
                                layout="fill"
                                objectFit="contain"
                                className="drop-shadow-md"
                                data-ai-hint={`${itemForStyling.category} icon tile`}
                                unoptimized
                            />
                        </div>

                        <div className="flex flex-col items-center mt-auto flex-grow justify-end w-full">
                           {cardContent}
                        </div>
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

