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
import { ChevronsUpDown, MousePointerSquare, Layers } from 'lucide-react';
import NextImage from 'next/image'; // Changed from default import to NextImage

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
  categoryName?: ItemCategory; // Storing the actual category name
}

type CarouselDisplayEntity = DisplayIndividualItem | DisplayItemStack;

const findHighestLevelItem = (items: DisplayIndividualItem[]): GameItemBase => {
  if (!items || items.length === 0) {
    // Fallback, though this case should ideally be prevented by upstream logic
    return { id:'placeholder', name:'No Item', description:'Empty stack', level:1, cost:0, scarcity:'Common', category:'Hardware', colorVar:1, dataAiHint: "placeholder item"};
  }
  return items.reduce((highest, current) => (current.item.level > highest.item.level ? current.item : highest.item), items[0].item);
};

const processInventoryForCarousel = (
  inventory: Record<string, PlayerInventoryItem>,
  expandedStackPath: string[] = [] // e.g., ['stack_category_Hardware', 'stack_item_Cypher Lock']
): CarouselDisplayEntity[] => {
  if (!inventory || Object.keys(inventory).length === 0) {
    return [];
  }

  const detailedInventoryItems: DisplayIndividualItem[] = Object.values(inventory)
    .map(invItem => {
      const baseItem = getItemById(invItem.id);
      if (!baseItem) return null;
      return {
        type: 'item' as 'item',
        id: invItem.id, // Use the specific item ID (e.g., basic_pick_l1)
        item: baseItem,
        inventoryQuantity: invItem.quantity,
        currentStrength: invItem.currentStrength,
      };
    })
    .filter((item): item is DisplayIndividualItem => item !== null)
    .sort((a, b) => b.item.level - a.item.level || a.item.name.localeCompare(b.item.name));

  if (detailedInventoryItems.length === 0) return [];

  // Handle stack expansion
  if (expandedStackPath.length > 0) {
    const currentStackIdToExpand = expandedStackPath[expandedStackPath.length - 1];
    
    if (currentStackIdToExpand.startsWith('stack_category_')) {
      const category = currentStackIdToExpand.replace('stack_category_', '') as ItemCategory;
      const itemsInCategory = detailedInventoryItems.filter(di => di.item.category === category);

      // Group these items by their base name to form sub-stacks (e.g., "Cypher Lock" stack)
      const groupedByName = groupBy(itemsInCategory, (di) => di.item.name);
      return Object.entries(groupedByName).map(([name, itemsInNameGroup]): DisplayItemStack => ({
        type: 'stack',
        id: `stack_item_${category}_${name.toLowerCase().replace(/\s+/g, '_')}`,
        name: name,
        items: itemsInNameGroup,
        topItem: findHighestLevelItem(itemsInNameGroup),
        count: itemsInNameGroup.reduce((sum, i) => sum + i.inventoryQuantity, 0),
        categoryName: category,
      })).sort((a,b) => a.name.localeCompare(b.name));

    } else if (currentStackIdToExpand.startsWith('stack_item_')) {
      // Expanding an item-type stack shows individual level variants
      const [,, categoryPart, ...nameParts] = currentStackIdToExpand.split('_');
      const itemName = nameParts.join(' ').replace(/\b\w/g, l => l.toUpperCase()); // Reconstruct name
      
      return detailedInventoryItems.filter(di => di.item.name === itemName && di.item.category === categoryPart as ItemCategory);
    }
  }

  // Initial Grouping Strategy
  // 1. If total distinct items (name + level variants) <= MAX_DISPLAY_ENTITIES, show individually
  if (detailedInventoryItems.length <= MAX_DISPLAY_ENTITIES) {
    return detailedInventoryItems;
  }

  // 2. Group by item base name (e.g., all "Cypher Lock" regardless of level)
  const groupedByName = groupBy(detailedInventoryItems, (di) => di.item.name);
  let nameStacks: DisplayItemStack[] = Object.entries(groupedByName).map(([name, items]): DisplayItemStack => ({
    type: 'stack',
    id: `stack_item_${items[0].item.category}_${name.toLowerCase().replace(/\s+/g, '_')}`,
    name: name,
    items: items,
    topItem: findHighestLevelItem(items),
    count: items.reduce((sum, i) => sum + i.inventoryQuantity, 0),
    categoryName: items[0].item.category,
  }));

  if (nameStacks.length <= MAX_DISPLAY_ENTITIES) {
    return nameStacks.sort((a,b) => a.name.localeCompare(b.name));
  }

  // 3. Group by category
  const groupedByCategory = groupBy(detailedInventoryItems, (di) => di.item.category);
  return Object.entries(groupedByCategory).map(([categoryName, items]): DisplayItemStack => ({
    type: 'stack',
    id: `stack_category_${categoryName as ItemCategory}`,
    name: categoryName as ItemCategory,
    items: items,
    topItem: findHighestLevelItem(items),
    count: items.reduce((sum, i) => sum + i.inventoryQuantity, 0),
    isCategoryStack: true,
    categoryName: categoryName as ItemCategory,
  })).sort((a,b) => a.name.localeCompare(b.name));
};


export function EquipmentLockerSection({ parallaxOffset }: { parallaxOffset: number }) {
  const { playerInventory, openTODWindow } = useAppContext();
  const { theme } = useTheme();

  const [expandedStackPath, setExpandedStackPath] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [carouselOffset, setCarouselOffset] = useState(0);

  const carouselItems = useMemo(() => processInventoryForCarousel(playerInventory, expandedStackPath), [playerInventory, expandedStackPath]);

  const carouselRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    setActiveIndex(0);
    setCarouselOffset(0);
  }, [carouselItems.length]);
  
  const navigateCarousel = (direction: number) => {
    if (carouselItems.length === 0) return;
    setActiveIndex(prev => {
      const newIndex = prev + direction;
      return Math.max(0, Math.min(carouselItems.length - 1, newIndex));
    });
  };

  useEffect(() => {
    if (carouselRef.current) {
      const targetOffset = -activeIndex * (CAROUSEL_ITEM_WIDTH + CAROUSEL_ITEM_GAP) + 
                           (carouselRef.current.clientWidth / 2 - CAROUSEL_ITEM_WIDTH / 2);
      setCarouselOffset(targetOffset);
    }
  }, [activeIndex, carouselItems.length, carouselRef.current?.clientWidth]);


  const handleCardTapOrSwipeDown = (entity: CarouselDisplayEntity) => {
    if (entity.type === 'stack') {
      setExpandedStackPath(prev => [...prev, entity.id]);
      setActiveIndex(0); // Reset index for new view
    } else if (entity.type === 'item') {
      openItemActionModal(entity);
    }
  };

  const handleSwipeUpToCollapse = () => {
    if (expandedStackPath.length > 0) {
      setExpandedStackPath(prev => prev.slice(0, -1));
      setActiveIndex(0); // Reset index for new view
    }
  };

  const openItemActionModal = (displayItem: DisplayIndividualItem) => {
    const item = displayItem.item;
    const hasStrength = item.strength && typeof item.strength.max === 'number' && item.strength.max > 0;
    const isRechargeable = item.type === "Rechargeable" || (item.category === 'Nexus Upgrades' && (item as any).rechargeCost > 0);
    const currentStrength = displayItem.currentStrength ?? (hasStrength ? item.strength!.current : undefined);
    const maxStrength = hasStrength ? item.strength!.max : undefined;
    const canRecharge = isRechargeable && typeof currentStrength === 'number' && typeof maxStrength === 'number' && currentStrength < maxStrength;

    openTODWindow(
      item.name,
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
        {maxStrength !== undefined && typeof currentStrength === 'number' && (
          <div className="w-full max-w-xs mx-auto">
            <Progress value={(currentStrength / maxStrength) * 100} className="h-2" style={{ '--progress-color': `hsl(${ITEM_LEVEL_COLORS_CSS_VARS[item.level]})` } as React.CSSProperties}/>
            <p className="text-xs text-muted-foreground mt-1">{currentStrength} / {maxStrength} Strength</p>
          </div>
        )}
        <HolographicButton onClick={() => console.log("Deploy", item.id)} className="w-full">Deploy</HolographicButton>
        {canRecharge && (
           <HolographicButton onClick={() => console.log("Recharge", item.id)} className="w-full">Recharge</HolographicButton>
        )}
        <HolographicButton onClick={() => console.log("Drop", item.id)} className="w-full border-destructive text-destructive hover:bg-destructive hover:text-background">Drop</HolographicButton>
      </div>,
      { showCloseButton: true }
    );
  };
  
  const handleDragEnd = (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    isDraggingRef.current = false;
    const velocityThreshold = 200;
    const offsetThreshold = CAROUSEL_ITEM_WIDTH / 3;

    if (Math.abs(info.velocity.x) > velocityThreshold || Math.abs(info.offset.x) > offsetThreshold) {
        if (info.offset.x < 0) navigateCarousel(1); // Swipe left, move to next
        else navigateCarousel(-1); // Swipe right, move to previous
    } else {
        // Snap back to current activeIndex if not enough drag
         if (carouselRef.current) {
            const targetOffset = -activeIndex * (CAROUSEL_ITEM_WIDTH + CAROUSEL_ITEM_GAP) + 
                                 (carouselRef.current.clientWidth / 2 - CAROUSEL_ITEM_WIDTH / 2);
            setCarouselOffset(targetOffset);
        }
    }
  };

  return (
    <HolographicPanel
      className="w-full h-full flex flex-col relative overflow-hidden p-2 md:p-4"
      explicitTheme={theme}
    >
      <div className="flex-shrink-0 flex justify-between items-center mb-2 md:mb-4 px-2">
        <h2 className="text-xl md:text-2xl font-orbitron holographic-text">
          {expandedStackPath.length > 0 
            ? expandedStackPath[expandedStackPath.length -1].replace('stack_category_', '').replace('stack_item_', '').replace(/_/g, ' ')
            : "Equipment Locker"}
        </h2>
        <div className="flex items-center space-x-2">
            {expandedStackPath.length > 0 && (
                <HolographicButton onClick={handleSwipeUpToCollapse} className="!p-1.5 md:!p-2" title="Go Up / Collapse Stack">
                    <Layers className="w-4 h-4 md:w-5 md:h-5 transform " />
                </HolographicButton>
            )}
             <HolographicButton 
                onClick={() => carouselItems.length > 0 && handleCardTapOrSwipeDown(carouselItems[activeIndex])} 
                className="!p-1.5 md:!p-2" 
                title="Select / Expand Stack"
                disabled={carouselItems.length === 0}
            >
                <MousePointerSquare className="w-4 h-4 md:w-5 md:h-5" />
            </HolographicButton>
        </div>
      </div>

      {carouselItems.length === 0 ? (
        <div className="flex-grow flex items-center justify-center">
          <p className="text-muted-foreground font-rajdhani text-lg">Inventory empty.</p>
        </div>
      ) : (
        <div ref={carouselRef} className="flex-grow flex items-center justify-start relative overflow-hidden select-none">
            <motion.div
                className="flex absolute h-full items-center" // Ensure items are vertically centered
                drag="x"
                dragConstraints={carouselRef}
                onDragStart={() => isDraggingRef.current = true}
                onDragEnd={handleDragEnd}
                animate={{ x: carouselOffset }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                style={{ paddingLeft: CAROUSEL_ITEM_GAP / 2, paddingRight: CAROUSEL_ITEM_GAP / 2 }} // For centering first/last
            >
            {carouselItems.map((entity, index) => {
                const isActive = index === activeIndex;
                const itemForStyling = entity.type === 'item' ? entity.item : entity.topItem;
                const itemColorVar = ITEM_LEVEL_COLORS_CSS_VARS[itemForStyling.level] || '--foreground';
                const itemColor = `hsl(${itemColorVar})`;
                
                const scale = isActive ? 1.05 : 0.9;
                const opacity = isActive ? 1 : 0.65;
                const zIndex = isActive ? carouselItems.length : carouselItems.length - Math.abs(index - activeIndex);

                return (
                <motion.div
                    key={entity.id}
                    className="flex-shrink-0 origin-center cursor-pointer"
                    style={{
                        width: CAROUSEL_ITEM_WIDTH,
                        height: CAROUSEL_ITEM_WIDTH * 1.5, // Aspect ratio for card
                        marginRight: index === carouselItems.length -1 ? 0 : CAROUSEL_ITEM_GAP,
                    }}
                    animate={{ scale, opacity, zIndex }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    onTap={() => {
                      if (!isDraggingRef.current) {
                        if (index !== activeIndex) setActiveIndex(index);
                        else handleCardTapOrSwipeDown(entity);
                      }
                    }}
                >
                    <div
                        className={cn(
                            "w-full h-full rounded-lg border-2 p-2.5 flex flex-col items-center justify-between text-center overflow-hidden relative transition-all duration-200",
                            isActive ? "shadow-2xl" : "shadow-md"
                        )}
                        style={{
                            borderColor: itemColor,
                            background: `
                                linear-gradient(145deg, hsla(var(--card-hsl), 0.95), hsla(var(--card-hsl), 0.75)), 
                                radial-gradient(circle at top left, ${itemColor}0A, transparent 70%),
                                radial-gradient(circle at bottom right, ${itemColor}1A, transparent 60%)
                            `,
                            boxShadow: isActive ? `0 0 20px 0px ${itemColor}B3, inset 0 0 12px ${itemColor}50` : `0 0 8px -3px ${itemColor}90, inset 0 0 6px ${itemColor}30`,
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
                        <div className="relative w-20 h-20 md:w-24 md:h-24 my-1 flex-shrink-0">
                            <NextImage
                                src={(entity.type === 'item' ? entity.item.tileImageSrc : entity.topItem.tileImageSrc) || `https://placehold.co/128x128/1a1a1a/FFFFFF.png?text=${itemForStyling.name.substring(0,3)}`}
                                alt={entity.type === 'item' ? entity.item.name : entity.name}
                                layout="fill"
                                objectFit="contain"
                                className="drop-shadow-md"
                                data-ai-hint={`${itemForStyling.category} icon tile`}
                                unoptimized
                            />
                        </div>

                        <div className="flex flex-col items-center mt-1 flex-grow justify-center">
                            <p className="text-xs md:text-sm font-semibold leading-tight mb-0.5" style={{ color: itemColor }}>
                                {entity.name}
                            </p>
                            {entity.type === 'stack' && (
                                <p className="text-[10px] md:text-xs text-muted-foreground mb-1">({entity.count} items)</p>
                            )}
                             <p className="text-[10px] md:text-xs text-primary-foreground font-semibold">
                                Lvl: {itemForStyling.level}
                            </p>
                        </div>

                        {(entity.type === 'item' && entity.item.strength && typeof entity.item.strength.max === 'number' && entity.item.strength.max > 0) ||
                         (entity.type === 'stack' && entity.topItem.strength && typeof entity.topItem.strength.max === 'number' && entity.topItem.strength.max > 0) ? (
                            <div className="w-full px-1 mt-1.5 flex-shrink-0">
                            <Progress
                                value={
                                    entity.type === 'item'
                                    ? (( (entity.currentStrength ?? entity.item.strength!.current) / entity.item.strength!.max!) * 100)
                                    : ((entity.topItem.strength!.current / entity.topItem.strength!.max!) * 100)
                                }
                                className="h-1.5"
                                style={{ '--progress-color': itemColor } as React.CSSProperties}
                            />
                            </div>
                        ) : <div className="h-[calc(0.375rem+0.375rem)] flex-shrink-0"></div> /* Placeholder for height of progress bar area */ }
                    </div>
                </motion.div>
                );
            })}
            </motion.div>
        </div>
      )}
       {carouselItems.length > 1 && (
         <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
            <HolographicButton onClick={() => navigateCarousel(-1)} disabled={activeIndex === 0} className="!p-1.5 md:!p-2">
                <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
            </HolographicButton>
            <HolographicButton onClick={() => navigateCarousel(1)} disabled={activeIndex === carouselItems.length - 1} className="!p-1.5 md:!p-2">
                <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
            </HolographicButton>
         </div>
       )}
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

