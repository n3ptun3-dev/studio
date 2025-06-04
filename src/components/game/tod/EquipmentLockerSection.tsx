
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
import { Layers, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ShoppingCart } from 'lucide-react';
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
    return { id:'placeholder', name:'No Item', description:'Empty stack', level:1, cost:0, scarcity:'Common', category:'Hardware', colorVar:1, dataAiHint: "placeholder item" };
  }
  return items.reduce((highest, current) => (current.item.level > highest.item.level ? current.item : highest.item), items[0].item);
};

const processInventoryForCarousel = (
  inventory: Record<string, PlayerInventoryItem>,
  expandedStackPath: string[] = []
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
        id: invItem.id,
        item: baseItem,
        inventoryQuantity: invItem.quantity,
        currentStrength: invItem.currentStrength,
      };
    })
    .filter((item): item is DisplayIndividualItem => item !== null)
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
        count: itemsInNameGroup.reduce((sum, i) => sum + i.inventoryQuantity, 0),
        categoryName: category,
      })).sort((a,b) => a.name.localeCompare(b.name));

    } else if (currentStackIdToExpand.startsWith('stack_item_')) {
      const [,, categoryPart, ...nameParts] = currentStackIdToExpand.split('_');
      const itemName = nameParts.join(' ').replace(/\b\w/g, l => l.toUpperCase());
      return detailedInventoryItems.filter(di => di.item.name === itemName && di.item.category === categoryPart as ItemCategory);
    }
  }

  if (detailedInventoryItems.length <= MAX_DISPLAY_ENTITIES) {
    return detailedInventoryItems;
  }

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
    setSelectedEntityId(null); // No pre-selection
    setCarouselOffset(0);
  }, [carouselItems.length]); // Also reset activeIndex and selection on carouselItems change

  const navigateCarousel = useCallback((direction: number) => {
    if (carouselItems.length === 0) return;
    setActiveIndex(prev => {
      const newIndex = prev + direction;
      return Math.max(0, Math.min(carouselItems.length - 1, newIndex));
    });
  }, [carouselItems.length]);

  useEffect(() => {
    if (carouselRef.current) {
      const targetOffset = -activeIndex * (CAROUSEL_ITEM_WIDTH + CAROUSEL_ITEM_GAP) +
                           (carouselRef.current.clientWidth / 2 - CAROUSEL_ITEM_WIDTH / 2);
      setCarouselOffset(targetOffset);
    }
  }, [activeIndex, carouselItems.length, carouselRef.current?.clientWidth]);


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

  const handleDownOrExpandAction = () => {
    if (carouselItems.length === 0) return;

    if (!selectedEntityId) {
      // If nothing is selected, select the item at activeIndex
      const entityToSelect = carouselItems[activeIndex];
      if (entityToSelect) {
        setSelectedEntityId(entityToSelect.id);
      }
    } else {
      // If something is selected, try to expand it or open modal
      const currentSelectedEntity = carouselItems.find(e => e.id === selectedEntityId);
      if (currentSelectedEntity) {
        if (currentSelectedEntity.type === 'stack') {
          setExpandedStackPath(prev => [...prev, currentSelectedEntity!.id]);
          setSelectedEntityId(null); // Deselect after expanding to allow new selection in expanded view
          setActiveIndex(0);
        } else if (currentSelectedEntity.type === 'item') {
          openItemActionModal(currentSelectedEntity as DisplayIndividualItem);
        }
      }
    }
  };

  const handleUpOrCollapseAction = () => {
    if (selectedEntityId) {
      const currentSelectedEntity = carouselItems.find(e => e.id === selectedEntityId);
      // Check if current selected is the one being shown due to expandedStackPath
      const isViewingExpandedStackContent = expandedStackPath.length > 0 && 
                                           carouselItems.some(item => item.id === selectedEntityId); // Simplified check for demo

      if (currentSelectedEntity?.type === 'stack' && expandedStackPath.includes(currentSelectedEntity.id) && expandedStackPath[expandedStackPath.length -1] !== currentSelectedEntity.id ) {
        // If the selected item is a stack, but not the *currently expanded* stack (meaning we are viewing its children)
        // then collapsing should go up one level in expandedStackPath.
        setExpandedStackPath(prev => prev.slice(0, -1));
        setSelectedEntityId(expandedStackPath[expandedStackPath.length -2] || null); // Select the parent stack or null
        setActiveIndex(0);
      } else if (expandedStackPath.length > 0) {
        // If any stack is expanded, collapse it
        const parentStackId = expandedStackPath[expandedStackPath.length - 2];
        setExpandedStackPath(prev => prev.slice(0, -1));
        setSelectedEntityId(parentStackId || null); // Select the parent stack or null
        setActiveIndex(0);
      } else {
        // If no stack is expanded, just deselect the current item
        setSelectedEntityId(null);
      }
    } else if (expandedStackPath.length > 0) {
        // If nothing is selected, but a stack is expanded, collapse it.
        const parentStackId = expandedStackPath[expandedStackPath.length - 2];
        setExpandedStackPath(prev => prev.slice(0, -1));
        setSelectedEntityId(parentStackId || null);
        setActiveIndex(0);
    }
  };

  const handleCardTap = (entity: CarouselDisplayEntity, index: number) => {
    if (isDraggingRef.current) return;

    if (entity.id === selectedEntityId) {
      // Tapped on already selected entity: expand if stack, open modal if item
      if (entity.type === 'stack') {
        setExpandedStackPath(prev => [...prev, entity.id]);
        setSelectedEntityId(null); // Deselect current to allow selection within new view
        setActiveIndex(0); // Reset index for new view
      } else {
        openItemActionModal(entity as DisplayIndividualItem);
      }
    } else {
      // Tapped on a new entity: select it and set as activeIndex
      setSelectedEntityId(entity.id);
      setActiveIndex(index);
    }
  };

  const handleDragEnd = (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    isDraggingRef.current = false;
    const velocityThreshold = 200;
    const offsetThreshold = CAROUSEL_ITEM_WIDTH / 3;

    let newActiveIndex = activeIndex;
    if (Math.abs(info.velocity.x) > velocityThreshold || Math.abs(info.offset.x) > offsetThreshold) {
        newActiveIndex = info.offset.x < 0 ? Math.min(activeIndex + 1, carouselItems.length - 1)
                                      : Math.max(activeIndex - 1, 0);
    }
    // Even if no swipe, snap to the nearest item based on final drag position
    // Or simply recalculate based on current scroll
    if (carouselRef.current) {
        const currentScroll = -carouselOffset + info.offset.x;
        const itemPlusGap = CAROUSEL_ITEM_WIDTH + CAROUSEL_ITEM_GAP;
        // Rough calculation for nearest index
        const closestIndex = Math.round(-currentScroll / itemPlusGap);
        newActiveIndex = Math.max(0, Math.min(carouselItems.length -1, closestIndex));
    }
    setActiveIndex(newActiveIndex);
  };
  
  useEffect(() => {
    // This effect ensures that if activeIndex changes (e.g. due to drag finishing or button press),
    // the carousel animates to the new centered position.
    if (carouselRef.current && carouselItems.length > 0) {
      const targetOffset = -activeIndex * (CAROUSEL_ITEM_WIDTH + CAROUSEL_ITEM_GAP) +
                           (carouselRef.current.clientWidth / 2 - CAROUSEL_ITEM_WIDTH / 2);
      setCarouselOffset(targetOffset);
    } else if (carouselItems.length === 0 && carouselRef.current) {
        // Center if empty or reset
        setCarouselOffset(carouselRef.current.clientWidth / 2 - CAROUSEL_ITEM_WIDTH / 2);
    }
  }, [activeIndex, carouselItems, carouselRef.current?.clientWidth]);


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
            {/* Layers button always calls handleUpOrCollapseAction */}
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
        <div ref={carouselRef} className="flex-grow flex items-center justify-start relative overflow-hidden select-none -mx-2 md:-mx-4"> {/* Negative margin to allow cards to peek */}
            <motion.div
                className="flex absolute h-full items-center" 
                drag="x"
                dragConstraints={{ left: -(carouselItems.length * (CAROUSEL_ITEM_WIDTH + CAROUSEL_ITEM_GAP) - (carouselRef.current?.clientWidth || 0) + CAROUSEL_ITEM_GAP / 2), right: CAROUSEL_ITEM_GAP / 2 }}
                onDragStart={() => isDraggingRef.current = true}
                onDragEnd={handleDragEnd}
                animate={{ x: carouselOffset }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                style={{ paddingLeft: CAROUSEL_ITEM_GAP / 2, paddingRight: CAROUSEL_ITEM_GAP / 2 }} 
            >
            {carouselItems.map((entity, index) => {
                const isSelected = entity.id === selectedEntityId;
                const itemForStyling = entity.type === 'item' ? entity.item : entity.topItem;
                const itemColorVar = ITEM_LEVEL_COLORS_CSS_VARS[itemForStyling.level] || '--foreground';
                const itemColor = `hsl(${itemColorVar})`;

                const scale = isSelected ? 1.15 : 1; // Enlarge more when selected
                const opacity = isSelected ? 1 : 0.75;
                const zIndex = isSelected ? carouselItems.length +1 : carouselItems.length - Math.abs(index - activeIndex);
                // Selected item slightly lower
                const yOffset = isSelected ? 10 : 0;


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
                            isSelected ? "shadow-2xl" : "shadow-md"
                        )}
                        style={{
                            borderColor: itemColor,
                            background: `
                                linear-gradient(145deg, hsla(var(--card-hsl), 0.95), hsla(var(--card-hsl), 0.75)),
                                radial-gradient(circle at top left, ${itemColor}0A, transparent 70%),
                                radial-gradient(circle at bottom right, ${itemColor}1A, transparent 60%)
                            `,
                            boxShadow: isSelected ? `0 0 20px 0px ${itemColor}B3, inset 0 0 12px ${itemColor}50` : `0 0 8px -3px ${itemColor}90, inset 0 0 6px ${itemColor}30`,
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
                        ) : <div className="h-[calc(0.375rem+0.375rem)] flex-shrink-0"></div> }
                    </div>
                </motion.div>
                );
            })}
            </motion.div>
        </div>
      )}
      {/* Bottom Navigation/Action Bar - Separate from Carousel */}
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

    