
// src/components/game/tod/EquipmentLockerSection.tsx

"use client";

import React, { useRef, useState, useEffect, useCallback, useLayoutEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useAppContext, type GameItemBase, type ItemLevel, type ItemCategory, type PlayerInventoryItem } from '@/contexts/AppContext';
import { HolographicButton, HolographicPanel } from '@/components/game/shared/HolographicPanel';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { ITEM_LEVEL_COLORS_CSS_VARS } from '@/lib/constants';
import { SHOP_CATEGORIES } from '@/lib/game-items';
import { ShoppingCart } from 'lucide-react';


const ITEM_WIDTH = 1;
const ITEM_HEIGHT = 1.7;
const ROTATION_SPEED = 0.0035;
const CLICK_DRAG_THRESHOLD_SQUARED = 10 * 10;
const CLICK_DURATION_THRESHOLD = 250;

// Constants for dynamic radius and camera calculations - User adjusted
const MIN_RADIUS_FOR_TWO_ITEMS = 1.4;
const CARD_SPACING_FACTOR = 1.7;
const CAMERA_DISTANCE_FROM_FRONT_CARD = 5.0;
const MIN_CAMERA_Z = 3.5;

const INITIAL_CAROUSEL_TARGET_COUNT = 8;


const LEVEL_TO_BG_CLASS: Record<ItemLevel, string> = {
  1: 'bg-level-1/30',
  2: 'bg-level-2/30',
  3: 'bg-level-3/30',
  4: 'bg-level-4/30',
  5: 'bg-level-5/30',
  6: 'bg-level-6/30',
  7: 'bg-level-7/30',
  8: 'bg-level-8/30',
};

const CardProgressBar: React.FC<{ label?: string; current: number; max: number; colorVar: string }> = React.memo(({ label, current, max, colorVar }) => {
  const percentage = max > 0 ? Math.min(100, Math.max(0, (current / max) * 100)) : 0;
  return (
    <div className="w-full text-xs mt-auto px-1">
      <div className="flex justify-between items-center text-[9px] opacity-80 mb-px">
        {label && <span className="text-left font-semibold">{label}</span>}
        <span className="text-right">{current}/{max}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden w-full" style={{ backgroundColor: `hsla(var(--muted-hsl), 0.3)` }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${percentage}%`,
            backgroundColor: colorVar,
          }}
        />
      </div>
    </div>
  );
});
CardProgressBar.displayName = 'CardProgressBar';

interface DisplayItem {
  id: string; // Unique key for React (e.g., item.id + "-instance-" + i, or category name, or itemBaseName)
  baseItem: GameItemBase | null; // Null for category/itemType stacks, populated for itemLevel/individual
  title: string;
  quantityInStack: number;
  imageSrc: string;
  colorVar: string; // CSS variable string
  levelForVisuals: ItemLevel; // Level to use for card theming and image (highest in stack)
  
  // For progress aggregation in stacks
  aggregateCurrentStrength?: number;
  aggregateMaxStrength?: number;
  aggregateCurrentCharges?: number;
  aggregateMaxCharges?: number;
  aggregateCurrentUses?: number;
  aggregateMaxUses?: number;
  aggregateCurrentAlerts?: number;
  aggregateMaxAlerts?: number;

  // Instance-specific values (for individual cards)
  instanceCurrentStrength?: number;
  instanceCurrentCharges?: number;
  instanceCurrentUses?: number;
  instanceCurrentAlerts?: number;

  // Stacking metadata
  stackType: 'category' | 'itemType' | 'itemLevel' | 'individual';
  itemCategory?: ItemCategory; // For category stacks
  itemBaseName?: string; // For itemType stacks (e.g., "Cypher Lock")
  originalPlayerInventoryItemId?: string; // For itemLevel and individual stacks (e.g., "cypher_lock_l1")
  dataAiHint?: string; // For image alt text
}


interface CarouselItemProps {
  displayItem: DisplayItem;
  index: number;
  totalItems: number;
  carouselRadius: number;
}

const CarouselItem = React.memo(function CarouselItem({ displayItem, index, totalItems, carouselRadius }: CarouselItemProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const { baseItem, quantityInStack, title, imageSrc, colorVar: itemColorCssVar, levelForVisuals } = displayItem;
  const fallbackImageSrc = '/Spi vs Spi icon.png';
  const actualImageSrc = imageSrc || fallbackImageSrc;

  useLayoutEffect(() => {
    if (meshRef.current) {
      if (totalItems <= 1) {
        meshRef.current.position.set(0, 0, 0);
      } else {
        const angle = (index / totalItems) * Math.PI * 2;
        const x = carouselRadius * Math.sin(angle);
        const z = carouselRadius * Math.cos(angle);
        meshRef.current.position.set(x, 0, z);
      }
      meshRef.current.userData = { displayItem, isCarouselItem: true, id: displayItem.id };
    }
  }, [index, totalItems, carouselRadius, displayItem]);

  useFrame(({ camera }) => {
    if (meshRef.current) {
      meshRef.current.lookAt(camera.position);
    }
  });

  const cardBgClass = LEVEL_TO_BG_CLASS[levelForVisuals] || 'bg-muted/30';

  let detailContent = null;
  // Determine current and max values for the progress bar
  let currentVal = 0;
  let maxVal = 0;
  let progressBarLabel: string | undefined = undefined;

  if (displayItem.stackType === 'individual' || displayItem.stackType === 'itemLevel') {
    currentVal = displayItem.instanceCurrentStrength ?? displayItem.baseItem?.strength?.current ?? displayItem.aggregateCurrentStrength ?? 0;
    maxVal = displayItem.baseItem?.strength?.max ?? displayItem.aggregateMaxStrength ?? 100;
    progressBarLabel = "Strength";

    if (baseItem?.category === 'Lock Fortifiers' && baseItem.type === 'Rechargeable') {
      currentVal = displayItem.instanceCurrentCharges ?? displayItem.baseItem?.currentCharges ?? displayItem.aggregateCurrentCharges ?? 0;
      maxVal = displayItem.baseItem?.maxCharges ?? displayItem.aggregateMaxCharges ?? 100;
      progressBarLabel = "Charges";
    } else if (baseItem?.category === 'Infiltration Gear' && baseItem.type === 'Rechargeable') {
      currentVal = displayItem.instanceCurrentUses ?? displayItem.baseItem?.currentUses ?? displayItem.aggregateCurrentUses ?? 0;
      maxVal = displayItem.baseItem?.maxUses ?? displayItem.aggregateMaxUses ?? 100;
      progressBarLabel = "Uses";
    } else if (baseItem?.category === 'Nexus Upgrades' && baseItem.name === 'Security Camera') {
      currentVal = displayItem.instanceCurrentAlerts ?? displayItem.baseItem?.currentAlerts ?? displayItem.aggregateCurrentAlerts ?? 0;
      maxVal = displayItem.baseItem?.maxAlerts ?? displayItem.aggregateMaxAlerts ?? levelForVisuals;
      progressBarLabel = "Alerts";
    } else if (baseItem?.category === 'Nexus Upgrades' && (baseItem.name === 'Emergency Repair System (ERS)' || baseItem.name === 'Emergency Power Cell (EPC)')) {
      currentVal = displayItem.instanceCurrentStrength ?? baseItem.strength?.current ?? displayItem.aggregateCurrentStrength ?? 0;
      maxVal = baseItem.strength?.max ?? displayItem.aggregateMaxStrength ?? 100;
      progressBarLabel = "Strength";
    }
  } else { // For 'category' or 'itemType' stacks
    currentVal = displayItem.aggregateCurrentStrength ?? 0;
    maxVal = displayItem.aggregateMaxStrength ?? (quantityInStack > 0 ? quantityInStack * 100 : 100); // Default max if no items
    progressBarLabel = "Status"; // Generic label for aggregate stacks
  }
  
  // Specific "Single Use" or "Permanent" text overrides progress bar for certain types
  const isSingleUseType = baseItem?.type === 'One-Time Use' || baseItem?.type === 'Consumable';
  const isPermanentType = baseItem?.type === 'Permanent';

  if (displayItem.stackType === 'individual' || displayItem.stackType === 'itemLevel') {
    if (isSingleUseType) {
      detailContent = <p className="text-[9px] text-center font-semibold p-0.5 rounded bg-black/30 mt-auto mx-1" style={{color: itemColorCssVar}}>Single Use</p>;
    } else if (isPermanentType) {
      detailContent = <p className="text-[9px] text-center font-semibold p-0.5 rounded bg-black/30 mt-auto mx-1" style={{color: itemColorCssVar}}>Permanent</p>;
    } else if (progressBarLabel) {
      detailContent = <CardProgressBar label={progressBarLabel} current={currentVal} max={maxVal} colorVar={itemColorCssVar} />;
    }
  } else if (displayItem.stackType === 'category' || displayItem.stackType === 'itemType') {
     if (maxVal > 0) { // Only show progress bar if there's something to measure
        detailContent = <CardProgressBar label={progressBarLabel || "Status"} current={currentVal} max={maxVal} colorVar={itemColorCssVar} />;
     }
  }


  return (
    <mesh ref={meshRef} userData={{ displayItem, isCarouselItem: true, id: displayItem.id }}>
      <planeGeometry args={[ITEM_WIDTH, ITEM_HEIGHT]} />
      {/* Ensure material allows HTML to be visible. Opacity 0 means mesh is invisible, HTML is separate. */}
      <meshBasicMaterial transparent opacity={0} /> 
      <Html
        center
        // removed transform, prepend, occlude
        style={{ pointerEvents: 'none', width: `${ITEM_WIDTH * 100}px`, height: `${ITEM_HEIGHT * 100}px` }}
      >
        <div
          className={cn(
            "w-full h-full rounded-md border flex flex-col items-center justify-start overflow-hidden relative",
            cardBgClass
          )}
          style={{
            borderColor: itemColorCssVar,
            fontFamily: 'var(--font-rajdhani)',
            color: `hsl(var(--foreground-hsl))`,
            boxShadow: `0 0 5px ${itemColorCssVar}`,
          }}
        >
          {quantityInStack > 1 && displayItem.stackType !== 'individual' && (
            <div
              className="absolute top-1 right-1 bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full z-10 shadow-md"
              style={{ borderColor: itemColorCssVar, borderWidth: '1px' }}
            >
              {quantityInStack}
            </div>
          )}
          <div className="w-full h-3/5 relative flex-shrink-0">
            <img
              src={actualImageSrc}
              alt={title}
              className="w-full h-full object-fill" // Changed from object-contain
              data-ai-hint={displayItem.dataAiHint || "item icon"}
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                if (target.src !== fallbackImageSrc) {
                  target.src = fallbackImageSrc;
                  target.onerror = null;
                }
              }}
            />
          </div>
          <div className="w-full px-1 py-0.5 flex flex-col justify-between flex-grow min-h-0">
            <p className="text-[10px] font-semibold text-center leading-tight mb-0.5" style={{ color: itemColorCssVar }}>
              {title} {/* Removed truncate */}
            </p>
            <div className="w-full text-xs space-y-0.5 overflow-y-auto scrollbar-hide flex-grow mt-auto">
              {detailContent}
            </div>
          </div>
        </div>
      </Html>
    </mesh>
  );
});
CarouselItem.displayName = 'CarouselItem';

interface EquipmentCarouselProps {
  itemsToDisplay: DisplayItem[];
  onItemClick: (displayItem: DisplayItem, mesh: THREE.Mesh) => void;
  carouselRadius: number;
}

const EquipmentCarousel = React.memo(function EquipmentCarousel(props: EquipmentCarouselProps) {
  const { itemsToDisplay, onItemClick, carouselRadius } = props;
  const group = useRef<THREE.Group>(null!);
  const { gl, camera, raycaster, scene, invalidate } = useThree(); // Call useThree at the top level
  const appContext = useAppContext();

  const isDraggingRef = useRef(false);
  const autoRotateRef = useRef(true);
  const accumulatedDeltaXRef = useRef(0);
  const pointerDownTimeRef = useRef(0);
  const pointerDownCoords = useRef({ x: 0, y: 0 });
  const activePointerIdRef = useRef<number | null>(null);

  useEffect(() => {
    const canvasElement = gl?.domElement;
    if (!canvasElement) return;

    // Ensure pointer events are enabled on the canvas
    if (canvasElement.style.pointerEvents !== 'auto') {
        canvasElement.style.pointerEvents = 'auto';
    }
    
    const handlePointerDownInternal = (event: PointerEvent | TouchEvent) => {
      let clientX: number, clientY: number;

      if (event.type.startsWith('touch')) {
        const touchEvent = event as TouchEvent;
        if (touchEvent.touches.length === 0) return;
        if (touchEvent.cancelable) event.preventDefault();
        clientX = touchEvent.touches[0].clientX;
        clientY = touchEvent.touches[0].clientY;
      } else {
        const pointerEvent = event as PointerEvent;
        if (pointerEvent.button !== 0) return; // Only left click
        clientX = pointerEvent.clientX;
        clientY = pointerEvent.clientY;
        activePointerIdRef.current = pointerEvent.pointerId;
        try { canvasElement.setPointerCapture(pointerEvent.pointerId); } catch (e) { /* ignore */ }
      }

      isDraggingRef.current = true;
      autoRotateRef.current = false;
      appContext.setIsScrollLockActive(true);
      accumulatedDeltaXRef.current = 0;
      pointerDownTimeRef.current = performance.now();
      pointerDownCoords.current = { x: clientX, y: clientY };
      canvasElement.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none'; // Prevent text selection during drag

      const moveEventName = event.type.startsWith('touch') ? 'touchmove' : 'pointermove';
      const upEventName = event.type.startsWith('touch') ? 'touchend' : 'pointerup';
      
      window.addEventListener(moveEventName, handlePointerMoveInternal, { passive: !event.type.startsWith('touch') });
      window.addEventListener(upEventName, handlePointerUpInternal, { passive: false });
    };

    const handlePointerMoveInternal = (event: PointerEvent | TouchEvent) => {
      if (!isDraggingRef.current) return;
      let currentX: number;

      if (event.type.startsWith('touch')) {
        const touchEvent = event as TouchEvent;
        if (touchEvent.touches.length === 0) return;
        if (touchEvent.cancelable) event.preventDefault();
        currentX = touchEvent.touches[0].clientX;
      } else {
        const pointerEvent = event as PointerEvent;
        if (activePointerIdRef.current !== null && pointerEvent.pointerId !== activePointerIdRef.current) return;
        currentX = pointerEvent.clientX;
      }

      const deltaX = currentX - pointerDownCoords.current.x;
      pointerDownCoords.current.x = currentX; // Update for next move
      accumulatedDeltaXRef.current += Math.abs(deltaX);

      if (group.current) {
        const rotationAmount = deltaX * 0.005; // Adjust sensitivity as needed
        if (itemsToDisplay.length === 1 && group.current.children[0]) {
          (group.current.children[0] as THREE.Mesh).rotation.y += rotationAmount;
        } else if (itemsToDisplay.length > 1) {
          group.current.rotation.y += rotationAmount;
        }
        invalidate(); // Request a re-render
      }
    };

    const handlePointerUpInternal = (event: PointerEvent | TouchEvent) => {
      if (!isDraggingRef.current && (event.type === 'pointerup' && activePointerIdRef.current === null) && !(event.type.startsWith('touch'))) {
          return;
      }

      const dragDuration = performance.now() - pointerDownTimeRef.current;
      let clickClientX = 0, clickClientY = 0;

      if (event.type.startsWith('touch')) {
          const touchEvent = event as TouchEvent;
          if (touchEvent.changedTouches.length > 0) {
              clickClientX = touchEvent.changedTouches[0].clientX;
              clickClientY = touchEvent.changedTouches[0].clientY;
          }
      } else {
          const pointerEvent = event as PointerEvent;
          clickClientX = pointerEvent.clientX;
          clickClientY = pointerEvent.clientY;
      }
      
      canvasElement.style.cursor = 'grab';
      document.body.style.userSelect = ''; // Re-enable text selection

      if (event.type === 'pointerup' && activePointerIdRef.current !== null) {
        try { canvasElement.releasePointerCapture(activePointerIdRef.current); } catch (e) { /* ignore */ }
      }
      activePointerIdRef.current = null;

      const wasSignificantDrag = accumulatedDeltaXRef.current > Math.sqrt(CLICK_DRAG_THRESHOLD_SQUARED);
      const wasQuickEnoughForClick = dragDuration < CLICK_DURATION_THRESHOLD;
      
      if (!wasSignificantDrag && wasQuickEnoughForClick) {
        const rect = canvasElement.getBoundingClientRect();
        const pointerVector = new THREE.Vector2(
          ((clickClientX - rect.left) / rect.width) * 2 - 1,
          -((clickClientY - rect.top) / rect.height) * 2 + 1
        );
        raycaster.setFromCamera(pointerVector, camera);
        const intersects = raycaster.intersectObjects(group.current?.children || [], true);

        if (intersects.length > 0) {
          let clickedMesh: THREE.Mesh | null = null;
          for (const intersect of intersects) {
            let obj: THREE.Object3D | null = intersect.object;
            while (obj && !(obj.userData?.isCarouselItem)) {
              obj = obj.parent;
            }
            if (obj?.userData?.isCarouselItem && obj instanceof THREE.Mesh) {
              clickedMesh = obj;
              break;
            }
          }
          if (clickedMesh && clickedMesh.userData.displayItem) {
            onItemClick(clickedMesh.userData.displayItem, clickedMesh);
          }
        }
      }
      
      isDraggingRef.current = false;
      appContext.setIsScrollLockActive(false);

      const moveEventName = event.type.startsWith('touch') ? 'touchmove' : 'pointermove';
      const upEventName = event.type.startsWith('touch') ? 'touchend' : 'pointerup';
      window.removeEventListener(moveEventName, handlePointerMoveInternal);
      window.removeEventListener(upEventName, handlePointerUpInternal);
      window.removeEventListener('touchmove', handlePointerMoveInternal);
      window.removeEventListener('touchend', handlePointerUpInternal);
      
      if (isDraggingRef.current) { // Ensure cleanup if component unmounts mid-drag
          document.body.style.userSelect = '';
          appContext.setIsScrollLockActive(false);
          if(canvasElement.style.cursor === 'grabbing') canvasElement.style.cursor = 'grab';
          if (activePointerIdRef.current !== null) {
              try { canvasElement.releasePointerCapture(activePointerIdRef.current); } catch(e) { /* ignore */ }
              activePointerIdRef.current = null;
          }
      }
    };

    canvasElement.addEventListener('pointerdown', handlePointerDownInternal);
    canvasElement.addEventListener('touchstart', handlePointerDownInternal, { passive: false });

    return () => {
      canvasElement.removeEventListener('pointerdown', handlePointerDownInternal);
      canvasElement.removeEventListener('touchstart', handlePointerDownInternal);
      window.removeEventListener('pointermove', handlePointerMoveInternal);
      window.removeEventListener('pointerup', handlePointerUpInternal);
      window.removeEventListener('touchmove', handlePointerMoveInternal);
      window.removeEventListener('touchend', handlePointerUpInternal);
      
      if (isDraggingRef.current) { // Ensure cleanup if component unmounts mid-drag
          document.body.style.userSelect = '';
          appContext.setIsScrollLockActive(false);
          if(canvasElement.style.cursor === 'grabbing') canvasElement.style.cursor = 'grab';
          if (activePointerIdRef.current !== null) {
              try { canvasElement.releasePointerCapture(activePointerIdRef.current); } catch(e) { /* ignore */ }
              activePointerIdRef.current = null;
          }
      }
    };
  }, [gl, onItemClick, camera, raycaster, scene, invalidate, appContext.setIsScrollLockActive, itemsToDisplay.length]); // Added itemsToDisplay.length

  useFrame((state, delta) => {
    if (group.current && autoRotateRef.current && !isDraggingRef.current) {
      if (itemsToDisplay.length === 1 && group.current.children[0]) {
        (group.current.children[0] as THREE.Mesh).rotation.y += ROTATION_SPEED * delta * 60;
      } else if (itemsToDisplay.length > 1) {
        group.current.rotation.y += ROTATION_SPEED * delta * 60;
      }
    }
  });

  return (
    <group ref={group}>
      {itemsToDisplay.map((item, index) => (
        <CarouselItem
          key={item.id}
          displayItem={item}
          index={index}
          totalItems={itemsToDisplay.length}
          carouselRadius={carouselRadius}
        />
      ))}
    </group>
  );
});
EquipmentCarousel.displayName = 'EquipmentCarousel';


const Resizer = React.memo(function Resizer() {
  const { camera, gl } = useThree();
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    containerRef.current = document.getElementById('locker-carousel-canvas-container');
    const container = containerRef.current;

    const handleResize = () => {
      if (container) {
        const width = container.offsetWidth;
        const height = container.offsetHeight;
        if (width > 0 && height > 0) {
          gl.setSize(width, height);
          if (camera instanceof THREE.PerspectiveCamera) {
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
          }
        }
      }
    };

    if (container) {
        handleResize(); // Initial call
        const resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(container);
        return () => {
          if (container) resizeObserver.unobserve(container);
        };
    }
  }, [camera, gl]);

  return null;
});
Resizer.displayName = 'Resizer';


const fallbackImageSrc = '/Spi vs Spi icon.png';

interface SectionProps {
  parallaxOffset: number;
}

// Helper to get base item name, e.g., "cypher_lock_l1" -> "Cypher Lock"
function getBaseItemNameFromId(itemId: string, getItemByIdFunc: (id: string) => GameItemBase | undefined): string {
    const itemDef = getItemByIdFunc(itemId);
    return itemDef?.name || "Unknown Item Type";
}


export function EquipmentLockerSection({ parallaxOffset }: SectionProps) {
  const appContext = useAppContext();
  const {
    openTODWindow,
    closeTODWindow,
    playerInventory,
    // getItemById is now part of appContext
    openSpyShop,
  } = appContext;

  const { theme: currentGlobalTheme, themeVersion } = useTheme();
  const [pointLightColor, setPointLightColor] = useState<THREE.ColorRepresentation>('hsl(0, 0%, 100%)');
  const [expandedStackPath, setExpandedStackPath] = useState<string[]>([]);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      let hslVarName = '--accent-hsl';
      if (currentGlobalTheme === 'cyphers' || currentGlobalTheme === 'shadows') {
        hslVarName = '--primary-hsl';
      }
      const computedHSLStringRaw = getComputedStyle(document.documentElement).getPropertyValue(hslVarName).trim();

      if (computedHSLStringRaw) {
        const parts = computedHSLStringRaw.match(/(\d+)\s*(\d+)%?\s*(\d+)%?/);
        if (parts && parts.length === 4) {
          const h = parseFloat(parts[1]);
          const s = parseFloat(parts[2]);
          const l = parseFloat(parts[3]);
          const colorStringForThree = `hsl(${h}, ${s}%, ${l}%)`; // Correct HSL format for Three.js
          setPointLightColor(colorStringForThree);
        } else {
          setPointLightColor('hsl(0, 0%, 100%)');
        }
      } else {
        setPointLightColor('hsl(0, 0%, 100%)');
      }
    }
  }, [currentGlobalTheme, themeVersion]);

  const carouselDisplayItems = useMemo((): DisplayItem[] => {
    const items: DisplayItem[] = [];
    if (typeof playerInventory !== 'object' || playerInventory === null || typeof appContext.getItemById !== 'function') {
      return [];
    }

    const inventoryEntries = Object.entries(playerInventory).filter(([, deets]) => deets.quantity > 0);

    if (expandedStackPath.length === 3) { // Individual item instances from an item-level stack
      const itemLevelIdToExpand = expandedStackPath[2];
      const invItemDetails = playerInventory[itemLevelIdToExpand];
      const baseItemDefinition = appContext.getItemById(itemLevelIdToExpand);

      if (invItemDetails && baseItemDefinition) {
        for (let i = 0; i < invItemDetails.quantity; i++) {
          items.push({
            id: `${itemLevelIdToExpand}-instance-${i}`,
            baseItem: baseItemDefinition,
            title: baseItemDefinition.title || baseItemDefinition.name,
            quantityInStack: 1,
            imageSrc: baseItemDefinition.imageSrc || fallbackImageSrc,
            colorVar: ITEM_LEVEL_COLORS_CSS_VARS[baseItemDefinition.level] || 'var(--level-1-color)',
            levelForVisuals: baseItemDefinition.level,
            instanceCurrentStrength: invItemDetails.currentStrength,
            instanceCurrentCharges: invItemDetails.currentCharges,
            instanceCurrentUses: invItemDetails.currentUses,
            instanceCurrentAlerts: invItemDetails.currentAlerts,
            stackType: 'individual',
            originalPlayerInventoryItemId: itemLevelIdToExpand,
            dataAiHint: baseItemDefinition.dataAiHint
          });
        }
      }
    } else if (expandedStackPath.length === 2) { // Item-level stacks for a specific item type
      const categoryName = expandedStackPath[0] as ItemCategory;
      const itemBaseNameToExpand = expandedStackPath[1];

      inventoryEntries.forEach(([playerInvItemId, invItemDetails]) => {
        const baseItemDefinition = appContext.getItemById(playerInvItemId);
        if (baseItemDefinition && baseItemDefinition.category === categoryName && baseItemDefinition.name === itemBaseNameToExpand) {
          items.push({
            id: playerInvItemId, // Use the specific item ID like "cypher_lock_l1"
            baseItem: baseItemDefinition,
            title: baseItemDefinition.title || baseItemDefinition.name,
            quantityInStack: invItemDetails.quantity,
            imageSrc: baseItemDefinition.imageSrc || fallbackImageSrc,
            colorVar: ITEM_LEVEL_COLORS_CSS_VARS[baseItemDefinition.level] || 'var(--level-1-color)',
            levelForVisuals: baseItemDefinition.level,
            instanceCurrentStrength: invItemDetails.currentStrength, // Show for the stack representative
            instanceCurrentCharges: invItemDetails.currentCharges,
            instanceCurrentUses: invItemDetails.currentUses,
            instanceCurrentAlerts: invItemDetails.currentAlerts,
            stackType: 'itemLevel',
            originalPlayerInventoryItemId: playerInvItemId,
            dataAiHint: baseItemDefinition.dataAiHint
          });
        }
      });
    } else if (expandedStackPath.length === 1) { // Item-type stacks within a category
      const categoryName = expandedStackPath[0] as ItemCategory;
      const itemsInCategory = inventoryEntries.filter(([_, invDeets]) => {
        const baseDef = appContext.getItemById(invDeets.id);
        return baseDef && baseDef.category === categoryName;
      });

      const groupedByItemBaseName: Record<string, PlayerInventoryItem[]> = {};
      itemsInCategory.forEach(([_, invItemDetails]) => {
        const baseDef = appContext.getItemById(invItemDetails.id);
        if (baseDef) {
          if (!groupedByItemBaseName[baseDef.name]) {
            groupedByItemBaseName[baseDef.name] = [];
          }
          groupedByItemBaseName[baseDef.name].push(invItemDetails);
        }
      });

      Object.entries(groupedByItemBaseName).forEach(([baseName, invItemsForType]) => {
        let highestLevel = 0 as ItemLevel;
        let representativeItem: GameItemBase | null = null;
        let totalQuantity = 0;
        let totalCurrentStrength = 0;
        let totalMaxStrength = 0;
        // Similar aggregations for charges, uses, alerts if needed for itemType stacks

        invItemsForType.forEach(invItem => {
          const baseDef = appContext.getItemById(invItem.id);
          if (baseDef) {
            totalQuantity += invItem.quantity;
            if (baseDef.level > highestLevel) {
              highestLevel = baseDef.level;
              representativeItem = baseDef;
            }
            if(baseDef.strength) {
                totalCurrentStrength += (invItem.currentStrength ?? baseDef.strength.current ?? 0) * invItem.quantity;
                totalMaxStrength += (baseDef.strength.max ?? 0) * invItem.quantity;
            }
          }
        });

        if (representativeItem) {
          items.push({
            id: `${categoryName}-${baseName}-typeStack`,
            baseItem: null, // This is a conceptual stack
            title: baseName, // e.g., "Cypher Locks"
            quantityInStack: totalQuantity,
            imageSrc: representativeItem.imageSrc || fallbackImageSrc,
            colorVar: ITEM_LEVEL_COLORS_CSS_VARS[highestLevel] || 'var(--level-1-color)',
            levelForVisuals: highestLevel,
            aggregateCurrentStrength: totalCurrentStrength,
            aggregateMaxStrength: totalMaxStrength,
            stackType: 'itemType',
            itemCategory: categoryName,
            itemBaseName: baseName,
            dataAiHint: representativeItem.dataAiHint
          });
        }
      });
    } else { // Initial view: Smart stacking or category stacks
      const uniquePlayerItemIds = inventoryEntries.length;

      if (uniquePlayerItemIds <= INITIAL_CAROUSEL_TARGET_COUNT) {
        // Show item-level stacks or individual items
        inventoryEntries.forEach(([playerInvItemId, invItemDetails]) => {
          const baseItemDefinition = appContext.getItemById(playerInvItemId);
          if (baseItemDefinition) {
            items.push({
              id: playerInvItemId,
              baseItem: baseItemDefinition,
              title: baseItemDefinition.title || baseItemDefinition.name,
              quantityInStack: invItemDetails.quantity,
              imageSrc: baseItemDefinition.imageSrc || fallbackImageSrc,
              colorVar: ITEM_LEVEL_COLORS_CSS_VARS[baseItemDefinition.level] || 'var(--level-1-color)',
              levelForVisuals: baseItemDefinition.level,
              instanceCurrentStrength: invItemDetails.currentStrength,
              instanceCurrentCharges: invItemDetails.currentCharges,
              instanceCurrentUses: invItemDetails.currentUses,
              instanceCurrentAlerts: invItemDetails.currentAlerts,
              stackType: invItemDetails.quantity > 1 ? 'itemLevel' : 'individual',
              originalPlayerInventoryItemId: playerInvItemId,
              dataAiHint: baseItemDefinition.dataAiHint
            });
          }
        });
      } else {
        // Show category stacks
        SHOP_CATEGORIES.slice(0, 6).forEach(catInfo => {
          const itemsInThisCategory = inventoryEntries.filter(([_, invDeets]) => {
            const baseDef = appContext.getItemById(invDeets.id);
            return baseDef && baseDef.category === catInfo.name;
          });

          if (itemsInThisCategory.length > 0) {
            let highestLevel = 0 as ItemLevel;
            let representativeItemForCat: GameItemBase | null = null;
            let totalQuantityInCategory = 0;
            let totalCurrentStrengthCat = 0;
            let totalMaxStrengthCat = 0;

            itemsInThisCategory.forEach(([_, invItem]) => {
              const baseDef = appContext.getItemById(invItem.id);
              if (baseDef) {
                totalQuantityInCategory += invItem.quantity;
                if (baseDef.level > highestLevel) {
                  highestLevel = baseDef.level;
                  representativeItemForCat = baseDef;
                }
                 if(baseDef.strength) {
                    totalCurrentStrengthCat += (invItem.currentStrength ?? baseDef.strength.current ?? 0) * invItem.quantity;
                    totalMaxStrengthCat += (baseDef.strength.max ?? 0) * invItem.quantity;
                }
              }
            });
            
            if (representativeItemForCat) {
                 items.push({
                    id: `${catInfo.name}-categoryStack`,
                    baseItem: null,
                    title: catInfo.name,
                    quantityInStack: totalQuantityInCategory,
                    imageSrc: representativeItemForCat.tileImageSrc || representativeItemForCat.imageSrc || fallbackImageSrc, // Use tileImageSrc if available
                    colorVar: ITEM_LEVEL_COLORS_CSS_VARS[highestLevel] || 'var(--level-1-color)',
                    levelForVisuals: highestLevel,
                    aggregateCurrentStrength: totalCurrentStrengthCat,
                    aggregateMaxStrength: totalMaxStrengthCat,
                    stackType: 'category',
                    itemCategory: catInfo.name as ItemCategory,
                    dataAiHint: representativeItemForCat.dataAiHint || catInfo.name.toLowerCase()
                });
            }
          }
        });
      }
    }
    return items;
  }, [playerInventory, appContext.getItemById, expandedStackPath]);


  const { dynamicCarouselRadius, dynamicCameraZ } = useMemo(() => {
    const numItems = carouselDisplayItems.length;
    let radius = 0;
    if (numItems === 1) {
      radius = 0;
    } else if (numItems === 2) {
      radius = MIN_RADIUS_FOR_TWO_ITEMS;
    } else if (numItems > 2) {
      const circumference = numItems * (ITEM_WIDTH + CARD_SPACING_FACTOR);
      radius = Math.max(MIN_RADIUS_FOR_TWO_ITEMS, circumference / (2 * Math.PI));
    }
    const cameraZ = Math.max(MIN_CAMERA_Z, radius + CAMERA_DISTANCE_FROM_FRONT_CARD);
    return { dynamicCarouselRadius: radius, dynamicCameraZ: cameraZ };
  }, [carouselDisplayItems.length]);

  const handleCarouselItemClick = useCallback((clickedDisplayItem: DisplayItem, mesh: THREE.Mesh) => {
    switch (clickedDisplayItem.stackType) {
      case 'category':
        if (clickedDisplayItem.itemCategory) {
          setExpandedStackPath([clickedDisplayItem.itemCategory]);
        }
        break;
      case 'itemType':
        if (expandedStackPath.length === 1 && clickedDisplayItem.itemBaseName) {
          setExpandedStackPath([expandedStackPath[0], clickedDisplayItem.itemBaseName]);
        }
        break;
      case 'itemLevel':
        if (expandedStackPath.length === 2 && clickedDisplayItem.originalPlayerInventoryItemId && clickedDisplayItem.quantityInStack > 1) {
          setExpandedStackPath([...expandedStackPath, clickedDisplayItem.originalPlayerInventoryItemId]);
        } else if (clickedDisplayItem.baseItem) { // Treat as individual if quantity is 1 or already at itemLevel
          openTODWindow(
            clickedDisplayItem.baseItem.title || clickedDisplayItem.baseItem.name,
            // ... (TOD Window content as before, using clickedDisplayItem.baseItem and clickedDisplayItem.instanceCurrentStrength etc.)
            <div className="font-rajdhani p-4 text-center">
              <h3 className="text-xl font-bold mb-2" style={{color: clickedDisplayItem.colorVar }}>{clickedDisplayItem.title}</h3>
              <div className="w-32 h-32 mx-auto my-2 rounded bg-black/30 flex items-center justify-center">
                <img
                  src={clickedDisplayItem.imageSrc}
                  alt={clickedDisplayItem.title}
                  className="max-w-full max-h-full object-contain"
                  data-ai-hint={clickedDisplayItem.dataAiHint || "item icon"}
                  onError={(e) => { /* fallback logic */ }}
                />
              </div>
              <p className="text-muted-foreground mb-1 text-sm">{clickedDisplayItem.baseItem.description}</p>
              <p className="text-xs text-muted-foreground/80">Cost: {clickedDisplayItem.baseItem.cost} ELINT</p>
              {/* Display relevant stats */}
              <HolographicButton onClick={closeTODWindow} className="mt-4" explicitTheme={currentGlobalTheme}>Close</HolographicButton>
            </div>,
            { showCloseButton: true, explicitTheme: currentGlobalTheme, themeVersion }
          );
        }
        break;
      case 'individual':
        if (clickedDisplayItem.baseItem) {
           openTODWindow(
            clickedDisplayItem.baseItem.title || clickedDisplayItem.baseItem.name,
            // ... (TOD Window content as before)
            <div className="font-rajdhani p-4 text-center">
              <h3 className="text-xl font-bold mb-2" style={{color: clickedDisplayItem.colorVar }}>{clickedDisplayItem.title}</h3>
              <div className="w-32 h-32 mx-auto my-2 rounded bg-black/30 flex items-center justify-center">
                <img
                  src={clickedDisplayItem.imageSrc}
                  alt={clickedDisplayItem.title}
                  className="max-w-full max-h-full object-contain"
                   data-ai-hint={clickedDisplayItem.dataAiHint || "item icon"}
                  onError={(e) => { /* fallback logic */ }}
                />
              </div>
              <p className="text-muted-foreground mb-1 text-sm">{clickedDisplayItem.baseItem.description}</p>
              <p className="text-xs text-muted-foreground/80">Cost: {clickedDisplayItem.baseItem.cost} ELINT</p>
              {/* Display relevant stats */}
              <HolographicButton onClick={closeTODWindow} className="mt-4" explicitTheme={currentGlobalTheme}>Close</HolographicButton>
            </div>,
            { showCloseButton: true, explicitTheme: currentGlobalTheme, themeVersion }
          );
        }
        break;
    }
  }, [openTODWindow, closeTODWindow, currentGlobalTheme, themeVersion, expandedStackPath]);

  useEffect(() => {
    const currentSectionRef = sectionRef.current;
    if (!currentSectionRef) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting && expandedStackPath.length > 0) {
          setExpandedStackPath([]);
        }
      },
      { threshold: 0.1 } 
    );

    observer.observe(currentSectionRef);
    return () => {
      if (currentSectionRef) {
        observer.unobserve(currentSectionRef);
      }
    };
  }, [expandedStackPath]);


  return (
    <div ref={sectionRef} className="flex flex-col items-center justify-center p-4 md:p-6 h-full max-w-4xl mx-auto">
      <HolographicPanel
        className="w-full h-full flex flex-col items-center p-2 md:p-4 overflow-hidden"
        explicitTheme={currentGlobalTheme}
      >
        <div className="flex-shrink-0 w-full flex items-center justify-between my-2 md:my-3 px-2">
          <h2 className="text-xl md:text-2xl font-orbitron holographic-text text-center flex-grow">Equipment Locker</h2>
          <HolographicButton
            onClick={openSpyShop}
            className="!p-2"
            aria-label="Open Spy Shop"
            explicitTheme={currentGlobalTheme}
          >
            <ShoppingCart className="w-5 h-5 icon-glow" />
          </HolographicButton>
        </div>
        <div
          id="locker-carousel-canvas-container"
          className="w-full flex-grow min-h-0 relative"
          style={{ cursor: 'grab', touchAction: 'none' }}
        >
          {carouselDisplayItems.length > 0 ? (
            <Canvas
              id="locker-carousel-canvas"
              camera={{ position: [0, 0.5, dynamicCameraZ], fov: 60 }}
              shadows
              gl={{ antialias: true, alpha: true, preserveDrawingBuffer: false }}
              style={{ background: 'transparent' }} // pointerEvents: 'auto' set by EquipmentCarousel
              onCreated={({ gl: canvasGl }) => {
                canvasGl.setClearColor(0x000000, 0);
              }}
            >
              <ambientLight intensity={1.5} />
              <directionalLight position={[5, 5, 5]} intensity={1} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
              <pointLight position={[-5, -5, -10]} intensity={0.5} color={pointLightColor} />
              <pointLight position={[0, 10, 0]} intensity={0.3} />
              <EquipmentCarousel
                itemsToDisplay={carouselDisplayItems}
                onItemClick={handleCarouselItemClick}
                carouselRadius={dynamicCarouselRadius}
              />
              <Resizer />
            </Canvas>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <p className="holographic-text text-lg">Locker Empty</p>
              <p className="text-muted-foreground text-sm">Visit the Spy Shop or Check In with HQ.</p>
            </div>
          )}
        </div>
         <p className="text-center text-xs text-muted-foreground mt-2 flex-shrink-0 px-2">
            {carouselDisplayItems.length > 0 ? (expandedStackPath.length > 0 ? "Click item for details or another stack to navigate." : "Drag to rotate. Click stack to expand or item for details.") : ""}
          </p>
      </HolographicPanel>
    </div>
  );
}

