
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
import { SHOP_CATEGORIES as APP_SHOP_CATEGORIES, getItemById as getBaseItemByIdFromGameItems } from '@/lib/game-items'; // Correct import for APP_SHOP_CATEGORIES
import { ShoppingCart, ArrowLeft } from 'lucide-react';

const ITEM_WIDTH = 1.2;
const ITEM_HEIGHT = 1.9;
const ROTATION_SPEED = 0.0035;
const CLICK_DRAG_THRESHOLD_SQUARED = 10 * 10;
const CLICK_DURATION_THRESHOLD = 250;
const AUTO_ROTATE_RESUME_DELAY = 3000;

// Constants for dynamic radius and camera calculations
const MIN_RADIUS_FOR_TWO_ITEMS = 1.4;
const CARD_SPACING_FACTOR = 1.7; // Adjusted as per user feedback
const CAMERA_DISTANCE_FROM_FRONT_CARD = 5.0; // Adjusted
const MIN_CAMERA_Z = 3.5;
const INITIAL_CAROUSEL_TARGET_COUNT = 8; // If total individual items <= this, show them directly or as itemLevel stacks

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

export interface DisplayItem {
  id: string; // Unique ID for this display card (can be category_name, itemType_name, itemLevel_id, or individual_id)
  baseItem: GameItemBase | null; // Null for category/itemType stacks
  title: string;
  quantityInStack: number;
  imageSrc: string;
  colorVar: string;
  levelForVisuals: ItemLevel; // Highest level in stack or item's own level

  // For progress bars on individual items or specific itemLevel stacks
  instanceCurrentStrength?: number;
  instanceMaxStrength?: number;
  instanceCurrentCharges?: number;
  instanceMaxCharges?: number;
  instanceCurrentUses?: number;
  instanceMaxUses?: number;
  instanceCurrentAlerts?: number;
  instanceMaxAlerts?: number;

  // For progress bars on aggregated stacks (category/itemType)
  aggregateCurrentStrength?: number;
  aggregateMaxStrength?: number;
  aggregateCurrentCharges?: number;
  aggregateMaxCharges?: number;

  stackType: 'category' | 'itemType' | 'itemLevel' | 'individual';
  itemCategory?: ItemCategory; // Set if this item/stack belongs to a category
  itemBaseName?: string; // Base name for itemType or itemLevel stacks (e.g., "Cypher Lock")
  itemLevel?: ItemLevel; // Specific level for itemLevel stacks or individual items
  originalPlayerInventoryItemId?: string; // The ID from PlayerInventory (e.g., "cypher_lock_l1") - set for itemLevel and individual
  dataAiHint?: string;
  path: string[]; // Path to this item/stack in the hierarchy
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
  const fallbackImageSrc = '/Spi vs Spi icon.png'; // Ensure this path is correct in your public folder
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
  let currentVal = 0;
  let maxVal = 0;
  let progressBarLabel: string | undefined = undefined;

  if (displayItem.stackType === 'individual' || displayItem.stackType === 'itemLevel') {
    if (baseItem) {
      // Prioritize instance values for progress bar
      if (baseItem.category === 'Lock Fortifiers' && baseItem.type === 'Rechargeable') {
        currentVal = displayItem.instanceCurrentCharges ?? (baseItem as any).currentCharges ?? (baseItem as any).maxCharges ?? 0;
        maxVal = displayItem.instanceMaxCharges ?? (baseItem as any).maxCharges ?? 100;
        progressBarLabel = "Charges";
      } else if (baseItem.category === 'Infiltration Gear' && (baseItem.type === 'Rechargeable' || baseItem.type === 'Consumable' || baseItem.type === 'One-Time Use')) {
        currentVal = displayItem.instanceCurrentUses ?? (baseItem as any).currentUses ?? (baseItem as any).maxUses ?? 0;
        maxVal = displayItem.instanceMaxUses ?? (baseItem as any).maxUses ?? ((baseItem.type === 'Consumable' || baseItem.type === 'One-Time Use') ? 1 : 100);
        progressBarLabel = "Uses";
      } else if (baseItem.category === 'Nexus Upgrades' && baseItem.name === 'Security Camera') {
        currentVal = displayItem.instanceCurrentAlerts ?? (baseItem as any).currentAlerts ?? (baseItem as any).maxAlerts ?? 0;
        maxVal = displayItem.instanceMaxAlerts ?? (baseItem as any).maxAlerts ?? levelForVisuals;
        progressBarLabel = "Alerts";
      } else { // Default to strength for Hardware and other Nexus Upgrades
        currentVal = displayItem.instanceCurrentStrength ?? baseItem.strength?.current ?? baseItem.strength?.max ?? 0;
        maxVal = displayItem.instanceMaxStrength ?? baseItem.strength?.max ?? 100;
        progressBarLabel = "Strength";
      }
    }
  } else if (displayItem.stackType === 'category' || displayItem.stackType === 'itemType') {
    // Use aggregate values for category/itemType stacks
    currentVal = displayItem.aggregateCurrentStrength ?? displayItem.aggregateCurrentCharges ?? 0;
    maxVal = displayItem.aggregateMaxStrength ?? displayItem.aggregateMaxCharges ?? (quantityInStack > 0 ? quantityInStack * 100 : 100);
    progressBarLabel = displayItem.aggregateCurrentStrength !== undefined ? "Integrity" : "Charge";
  }


  const isSingleUseType = displayItem.baseItem?.type === 'One-Time Use' || displayItem.baseItem?.type === 'Consumable';
  const isPermanentType = displayItem.baseItem?.type === 'Permanent';

  if (displayItem.stackType === 'individual' || (displayItem.stackType === 'itemLevel' && displayItem.baseItem)) {
    if (isSingleUseType) {
      detailContent = <p className="text-[9px] text-center font-semibold p-0.5 rounded bg-black/30 mt-auto mx-1" style={{ color: itemColorCssVar }}>Single Use</p>;
    } else if (isPermanentType) {
      detailContent = <p className="text-[9px] text-center font-semibold p-0.5 rounded bg-black/30 mt-auto mx-1" style={{ color: itemColorCssVar }}>Permanent</p>;
    } else if (progressBarLabel && maxVal > 0) {
      detailContent = <CardProgressBar label={progressBarLabel} current={currentVal} max={maxVal} colorVar={itemColorCssVar} />;
    }
  } else if ((displayItem.stackType === 'category' || displayItem.stackType === 'itemType') && maxVal > 0) {
    detailContent = <CardProgressBar label={progressBarLabel || "Status"} current={currentVal} max={maxVal} colorVar={itemColorCssVar} />;
  }


  return (
    <mesh ref={meshRef} userData={{ displayItem, isCarouselItem: true, id: displayItem.id }}>
      <planeGeometry args={[ITEM_WIDTH, ITEM_HEIGHT]} />
      <meshBasicMaterial transparent opacity={0} />
      <Html
        center
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
              className="w-full h-full object-fill"
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
              {title}
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
  autoRotateRef: React.MutableRefObject<boolean>;
  isDraggingRef: React.MutableRefObject<boolean>;
  autoRotateTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
}

const EquipmentCarousel = React.memo(function EquipmentCarousel(props: EquipmentCarouselProps) {
  const { itemsToDisplay, onItemClick, carouselRadius, autoRotateRef, isDraggingRef, autoRotateTimeoutRef } = props;
  const group = useRef<THREE.Group>(null!);
  const { gl, camera, raycaster, scene, invalidate, events } = useThree(); // Call useThree at the top level
  const appContext = useAppContext();

  useEffect(() => {
    const canvasElement = gl?.domElement;
    if (!canvasElement) return;

    if (canvasElement.style.pointerEvents !== 'auto') {
      canvasElement.style.pointerEvents = 'auto';
    }

    let pointerDownTime = 0;
    let pointerDownCoords = { x: 0, y: 0 };
    let accumulatedDeltaX = 0;
    let activePointerId: number | null = null;

    const handlePointerDownInternal = (event: PointerEvent | TouchEvent) => {
      let clientX: number, clientY: number;
      const isTouchEvent = event.type.startsWith('touch');

      if (isTouchEvent) {
        const touchEvent = event as TouchEvent;
        if (touchEvent.touches.length === 0) return;
        if (touchEvent.cancelable) event.preventDefault();
        clientX = touchEvent.touches[0].clientX;
        clientY = touchEvent.touches[0].clientY;
      } else {
        const pointerEvent = event as PointerEvent;
        if (pointerEvent.button !== 0) return; // Only left clicks
        clientX = pointerEvent.clientX;
        clientY = pointerEvent.clientY;
        activePointerId = pointerEvent.pointerId;
        try { (event.target as HTMLElement)?.setPointerCapture?.(pointerEvent.pointerId); } catch (e) { /* ignore */ }
      }

      isDraggingRef.current = true;
      autoRotateRef.current = false;
      if (autoRotateTimeoutRef.current) clearTimeout(autoRotateTimeoutRef.current);
      appContext.setIsScrollLockActive(true); // Lock main TOD scroll
      accumulatedDeltaX = 0;
      pointerDownTime = performance.now();
      pointerDownCoords = { x: clientX, y: clientY };
      canvasElement.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none'; // Prevent text selection

      const moveEventName = isTouchEvent ? 'touchmove' : 'pointermove';
      const upEventName = isTouchEvent ? 'touchend' : 'pointerup';

      window.addEventListener(moveEventName, handlePointerMoveInternal, { passive: !isTouchEvent });
      window.addEventListener(upEventName, handlePointerUpInternal, { passive: false });
    };

    const handlePointerMoveInternal = (event: PointerEvent | TouchEvent) => {
      if (!isDraggingRef.current) return;
      let currentX: number;
      const isTouchEvent = event.type.startsWith('touch');

      if (isTouchEvent) {
        const touchEvent = event as TouchEvent;
        if (touchEvent.touches.length === 0) return;
        if (touchEvent.cancelable) event.preventDefault();
        currentX = touchEvent.touches[0].clientX;
      } else {
        const pointerEvent = event as PointerEvent;
        if (activePointerId !== null && pointerEvent.pointerId !== activePointerId) return;
        currentX = pointerEvent.clientX;
      }

      const deltaX = currentX - pointerDownCoords.x;
      pointerDownCoords.x = currentX; // Update for next move
      accumulatedDeltaX += Math.abs(deltaX);

      if (group.current) {
        const rotationAmount = deltaX * 0.005; // Sensitivity factor
        if (itemsToDisplay.length === 1 && group.current.children[0]) {
          (group.current.children[0] as THREE.Mesh).rotation.y += rotationAmount;
        } else if (itemsToDisplay.length > 1) {
          group.current.rotation.y += rotationAmount;
        }
        invalidate(); // Request a re-render of the scene
      }
    };

    const handlePointerUpInternal = (event: PointerEvent | TouchEvent) => {
      if (!isDraggingRef.current && (event.type === 'pointerup' && activePointerId === null) && !(event.type.startsWith('touch'))) {
        return;
      }

      const dragDuration = performance.now() - pointerDownTime;
      let clickClientX = 0, clickClientY = 0;
      const isTouchEvent = event.type.startsWith('touch');

      if (isTouchEvent) {
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
      if (event.type === 'pointerup' && activePointerId !== null) {
        try { (event.target as HTMLElement)?.releasePointerCapture?.(activePointerId); } catch (e) { /* ignore */ }
      }
      activePointerId = null;

      const wasSignificantDrag = accumulatedDeltaX > Math.sqrt(CLICK_DRAG_THRESHOLD_SQUARED);
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
      appContext.setIsScrollLockActive(false); // Unlock main TOD scroll

      // Conditionally resume auto-rotation
      if (autoRotateTimeoutRef.current) clearTimeout(autoRotateTimeoutRef.current);
      if (!appContext.isTODWindowOpen) { // Only resume if TOD is not open
        autoRotateTimeoutRef.current = setTimeout(() => {
          if (!isDraggingRef.current && !appContext.isTODWindowOpen) { // Check again before resuming
            autoRotateRef.current = true;
          }
        }, AUTO_ROTATE_RESUME_DELAY);
      }

      const moveEventName = isTouchEvent ? 'touchmove' : 'pointermove';
      const upEventName = isTouchEvent ? 'touchend' : 'pointerup';
      window.removeEventListener(moveEventName, handlePointerMoveInternal);
      window.removeEventListener(upEventName, handlePointerUpInternal);
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
      if (autoRotateTimeoutRef.current) clearTimeout(autoRotateTimeoutRef.current);
      // Ensure cleanup if component unmounts during a drag
      if (isDraggingRef.current) {
        document.body.style.userSelect = '';
        appContext.setIsScrollLockActive(false);
        if (canvasElement.style.cursor === 'grabbing') canvasElement.style.cursor = 'grab';
        if (activePointerId !== null) {
          try { canvasElement.releasePointerCapture(activePointerId); } catch (e) {/* ignore */}
          activePointerId = null;
        }
      }
    };
  // Removed itemsToDisplay.length from deps as it might cause too frequent re-runs of listener setup
  // The internal handlers will use the latest itemsToDisplay from their closure.
  }, [gl, onItemClick, camera, raycaster, scene, invalidate, events, appContext.setIsScrollLockActive, appContext.isTODWindowOpen, autoRotateRef, isDraggingRef, autoRotateTimeoutRef]);


  useFrame((state, delta) => {
    if (group.current && autoRotateRef.current && !isDraggingRef.current && !appContext.isTODWindowOpen) {
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
          key={item.id} // Ensure key is stable and unique for each *DisplayItem* instance
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
      handleResize(); // Initial resize
      const resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(container);
      return () => {
        if (container) resizeObserver.unobserve(container); // Cleanup observer
      };
    }
  }, [camera, gl]); // Rerun if camera or gl instance changes

  return null;
});
Resizer.displayName = 'Resizer';


interface SectionProps {
  parallaxOffset: number;
}

export function EquipmentLockerSection({ parallaxOffset }: SectionProps) {
  const appContext = useAppContext();
  const {
    openTODWindow,
    closeTODWindow,
    playerInventory,
    getItemById, // Use from context
    openSpyShop,
    isTODWindowOpen,
  } = appContext;

  const { theme: currentGlobalTheme, themeVersion } = useTheme();
  const [pointLightColor, setPointLightColor] = useState<THREE.ColorRepresentation>('hsl(0, 0%, 100%)');
  const sectionRef = useRef<HTMLDivElement>(null);

  const [expandedStackPath, setExpandedStackPath] = useState<string[]>([]);
  const autoRotateRef = useRef(true);
  const isDraggingRef = useRef(false);
  const autoRotateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const todOpenedByLockerRef = useRef(false);


  useEffect(() => {
    if (typeof window !== 'undefined') {
      let hslVarName = '--accent-hsl';
      if (currentGlobalTheme === 'cyphers' || currentGlobalTheme === 'shadows') {
        hslVarName = '--primary-hsl';
      }
      const computedHSLStringRaw = getComputedStyle(document.documentElement).getPropertyValue(hslVarName).trim();
      if (computedHSLStringRaw) {
        const parts = computedHSLStringRaw.match(/(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%?/i) || computedHSLStringRaw.match(/(\d+)\s+(\d+)%\s+(\d+)%?/i);
        if (parts && parts.length === 4) {
          const h = parseFloat(parts[1]);
          const s = parseFloat(parts[2]);
          const l = parseFloat(parts[3]);
          setPointLightColor(`hsl(${h}, ${s}%, ${l}%)`); // Correct HSL format for Three.js
        } else {
          setPointLightColor('hsl(0, 0%, 100%)');
        }
      } else {
        setPointLightColor('hsl(0, 0%, 100%)');
      }
    }
  }, [currentGlobalTheme, themeVersion]);

  const inventoryWithBaseDefs = useMemo(() => {
    return Object.entries(playerInventory)
      .map(([invKey, invDetails]) => ({
        invKey,
        invDetails,
        baseDef: getItemById(invDetails.id) // Use getItemById from context
      }))
      .filter(item => item.baseDef && item.invDetails.quantity > 0);
  }, [playerInventory, getItemById]);

  const aggregatePlayerItems = useCallback(() => {
    const itemsToDisplay: DisplayItem[] = [];
    const currentPathLevel = expandedStackPath.length;

    const createIndividualDisplayItem = (
      playerInvItem: { invKey: string; invDetails: PlayerInventoryItem; baseDef: GameItemBase },
      path: string[],
      index: number
    ): DisplayItem => {
      const { invDetails, baseDef } = playerInvItem;
      return {
        id: `${invDetails.id}_instance_${index}`, // Unique ID for each instance
        baseItem: baseDef,
        title: baseDef.title || baseDef.name,
        quantityInStack: 1, // Individual items always have quantity 1
        imageSrc: baseDef.imageSrc || '/Spi vs Spi icon.png',
        colorVar: ITEM_LEVEL_COLORS_CSS_VARS[baseDef.level] || 'var(--level-1-color)',
        levelForVisuals: baseDef.level,
        instanceCurrentStrength: invDetails.currentStrength,
        instanceMaxStrength: baseDef.strength?.max,
        instanceCurrentCharges: invDetails.currentCharges,
        instanceMaxCharges: (baseDef as any).maxCharges,
        instanceCurrentUses: invDetails.currentUses,
        instanceMaxUses: (baseDef as any).maxUses,
        instanceCurrentAlerts: invDetails.currentAlerts,
        instanceMaxAlerts: (baseDef as any).maxAlerts,
        stackType: 'individual',
        itemCategory: baseDef.category,
        itemBaseName: baseDef.name,
        itemLevel: baseDef.level,
        originalPlayerInventoryItemId: invDetails.id,
        dataAiHint: baseDef.dataAiHint,
        path: [...path, `${invDetails.id}_instance_${index}`],
      };
    };

    const createItemStack = (
      items: Array<{ invKey: string; invDetails: PlayerInventoryItem; baseDef: GameItemBase }>,
      stackIdPrefix: string,
      stackTitle: string,
      stackType: 'category' | 'itemType' | 'itemLevel',
      path: string[],
      itemCategoryForStack?: ItemCategory,
      itemBaseNameForStack?: string
    ): DisplayItem | null => {
      if (items.length === 0) return null;

      let highestLevelItem = items[0].baseDef;
      let totalQuantity = 0;
      let aggCurrentStrength = 0, aggMaxStrength = 0;
      let aggCurrentCharges = 0, aggMaxCharges = 0;

      items.forEach(item => {
        totalQuantity += item.invDetails.quantity;
        if (item.baseDef.level > highestLevelItem.level) {
          highestLevelItem = item.baseDef;
        }
        aggCurrentStrength += (item.invDetails.currentStrength ?? item.baseDef.strength?.current ?? item.baseDef.strength?.max ?? 0) * item.invDetails.quantity;
        aggMaxStrength += (item.baseDef.strength?.max ?? 100) * item.invDetails.quantity;
        aggCurrentCharges += (item.invDetails.currentCharges ?? (item.baseDef as any).currentCharges ?? (item.baseDef as any).maxCharges ?? 0) * item.invDetails.quantity;
        aggMaxCharges += ((item.baseDef as any).maxCharges ?? 100) * item.invDetails.quantity;
      });

      const uniqueIdPart = itemCategoryForStack ? itemCategoryForStack : (itemBaseNameForStack ? itemBaseNameForStack : highestLevelItem.id);

      return {
        id: `${stackIdPrefix}_${uniqueIdPart}`,
        baseItem: stackType === 'itemLevel' ? highestLevelItem : null, // baseItem only for itemLevel stacks if needed for direct info
        title: stackTitle,
        quantityInStack: totalQuantity,
        imageSrc: highestLevelItem.tileImageSrc || highestLevelItem.imageSrc || '/Spi vs Spi icon.png',
        colorVar: ITEM_LEVEL_COLORS_CSS_VARS[highestLevelItem.level] || 'var(--level-1-color)',
        levelForVisuals: highestLevelItem.level,
        aggregateCurrentStrength: aggCurrentStrength,
        aggregateMaxStrength: aggMaxStrength,
        aggregateCurrentCharges: aggCurrentCharges,
        aggregateMaxCharges: aggMaxCharges,
        stackType: stackType,
        itemCategory: itemCategoryForStack || highestLevelItem.category,
        itemBaseName: itemBaseNameForStack || (stackType !== 'category' ? highestLevelItem.name : undefined),
        itemLevel: stackType === 'itemLevel' ? highestLevelItem.level : undefined,
        originalPlayerInventoryItemId: stackType === 'itemLevel' ? highestLevelItem.id : undefined,
        dataAiHint: highestLevelItem.dataAiHint || stackTitle.toLowerCase(),
        path: path,
      };
    };

    const processedPlayerItemInvKeys = new Set<string>();

    if (currentPathLevel === 0) {
      const totalIndividualItemsCount = inventoryWithBaseDefs.reduce((sum, item) => sum + item.invDetails.quantity, 0);
      if (totalIndividualItemsCount <= INITIAL_CAROUSEL_TARGET_COUNT && totalIndividualItemsCount > 0) {
        inventoryWithBaseDefs.forEach(item => {
          if (item.invDetails.quantity > 1) {
            const stack = createItemStack([item], 'itemLevelStack', item.baseDef.title || item.baseDef.name, 'itemLevel', [item.baseDef.category, item.baseDef.name, item.invDetails.id], item.baseDef.category, item.baseDef.name);
            if (stack) itemsToDisplay.push(stack);
          } else {
            itemsToDisplay.push(createIndividualDisplayItem(item, [item.baseDef.category, item.baseDef.name, item.invDetails.id], 0));
          }
          processedPlayerItemInvKeys.add(item.invKey);
        });
      } else if (inventoryWithBaseDefs.length > 0) {
        APP_SHOP_CATEGORIES.slice(0, 6).forEach(catInfo => {
          const itemsInThisCategory = inventoryWithBaseDefs.filter(item => item.baseDef.category === catInfo.name);
          if (itemsInThisCategory.length > 0) {
            const stack = createItemStack(itemsInThisCategory, 'categoryStack', catInfo.name, 'category', [catInfo.name as ItemCategory], catInfo.name as ItemCategory);
            if (stack) itemsToDisplay.push(stack);
            itemsInThisCategory.forEach(itm => processedPlayerItemInvKeys.add(itm.invKey));
          }
        });
      }
    } else { // Additive expansion logic
      // Always start with top-level categories as potential display items
      // or items that are not part of the current expanded path.
      const tempTopLevelDisplay: DisplayItem[] = [];
      const expandedCategoryName = expandedStackPath[0] as ItemCategory | undefined;
      const expandedItemBaseName = expandedStackPath[1] as string | undefined;
      const expandedItemLevelId = expandedStackPath[2] as string | undefined;

      APP_SHOP_CATEGORIES.slice(0, 6).forEach(catInfo => {
        const categoryPath = [catInfo.name as ItemCategory];
        const isCurrentExpandedCategory = catInfo.name === expandedCategoryName;
        const itemsInThisCategory = inventoryWithBaseDefs.filter(item => item.baseDef.category === catInfo.name);

        if (itemsInThisCategory.length === 0) return;

        if (isCurrentExpandedCategory && currentPathLevel >= 1) {
          // This category is expanded, so we show its children (item types)
          const groupedByBaseName: Record<string, typeof inventoryWithBaseDefs[0][]> = {};
          itemsInThisCategory.forEach(item => {
            if (!groupedByBaseName[item.baseDef.name]) groupedByBaseName[item.baseDef.name] = [];
            groupedByBaseName[item.baseDef.name].push(item);
          });

          Object.entries(groupedByBaseName).forEach(([baseName, itemsOfType]) => {
            const itemTypePath = [...categoryPath, baseName];
            const isCurrentExpandedItemType = baseName === expandedItemBaseName;

            if (isCurrentExpandedItemType && currentPathLevel >= 2) {
              // This item type is expanded, show its levels or individuals
              itemsOfType.forEach(item => {
                const itemLevelPath = [...itemTypePath, item.invDetails.id];
                const isCurrentExpandedItemLevel = item.invDetails.id === expandedItemLevelId;

                if (isCurrentExpandedItemLevel && currentPathLevel >= 3 && item.invDetails.quantity > 1) {
                  // This item level stack is expanded, show individuals
                  for (let i = 0; i < item.invDetails.quantity; i++) {
                    tempTopLevelDisplay.push(createIndividualDisplayItem(item, itemLevelPath, i));
                  }
                } else if (item.invDetails.quantity > 1) {
                    const stack = createItemStack([item], 'itemLevelStack', item.baseDef.title || item.baseDef.name, 'itemLevel', itemLevelPath, item.baseDef.category, item.baseDef.name);
                    if (stack) tempTopLevelDisplay.push(stack);
                } else {
                    tempTopLevelDisplay.push(createIndividualDisplayItem(item, itemLevelPath, 0));
                }
                processedPlayerItemInvKeys.add(item.invKey);
              });
            } else { // Show item type stack
              const stack = createItemStack(itemsOfType, 'itemTypeStack', baseName, 'itemType', itemTypePath, catInfo.name as ItemCategory, baseName);
              if (stack) tempTopLevelDisplay.push(stack);
              itemsOfType.forEach(itm => processedPlayerItemInvKeys.add(itm.invKey));
            }
          });
        } else { // Show category stack (not the one being expanded, or no expansion yet)
          const stack = createItemStack(itemsInThisCategory, 'categoryStack', catInfo.name, 'category', categoryPath, catInfo.name as ItemCategory);
          if (stack) tempTopLevelDisplay.push(stack);
          itemsInThisCategory.forEach(itm => processedPlayerItemInvKeys.add(itm.invKey));
        }
      });
      itemsToDisplay.push(...tempTopLevelDisplay);
    }


    return itemsToDisplay.sort((a, b) => {
      const typeOrder = { 'category': 0, 'itemType': 1, 'itemLevel': 2, 'individual': 3 };
      if (typeOrder[a.stackType] !== typeOrder[b.stackType]) {
        return typeOrder[a.stackType] - typeOrder[b.stackType];
      }
      return a.title.localeCompare(b.title);
    });
  }, [inventoryWithBaseDefs, expandedStackPath, playerInventory, getItemById]);


  const carouselDisplayItems = useMemo(aggregatePlayerItems, [aggregatePlayerItems]);

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
    if (clickedDisplayItem.stackType === 'individual') {
      if (clickedDisplayItem.baseItem) {
        todOpenedByLockerRef.current = true; // Set the flag
        autoRotateRef.current = false;
        if (autoRotateTimeoutRef.current) clearTimeout(autoRotateTimeoutRef.current);

        openTODWindow(
          clickedDisplayItem.baseItem.title || clickedDisplayItem.baseItem.name,
          <div className="font-rajdhani p-4 text-center">
            <h3 className="text-xl font-bold mb-2" style={{ color: clickedDisplayItem.colorVar }}>{clickedDisplayItem.title}</h3>
            <div className="w-32 h-32 mx-auto my-2 rounded bg-black/30 flex items-center justify-center">
              <img
                src={clickedDisplayItem.imageSrc} alt={clickedDisplayItem.title} className="max-w-full max-h-full object-contain"
                data-ai-hint={clickedDisplayItem.dataAiHint || "item icon"}
                onError={(e) => { (e.target as HTMLImageElement).src = '/Spi vs Spi icon.png'; }}
              />
            </div>
            <p className="text-muted-foreground mb-1 text-sm">{clickedDisplayItem.baseItem.description}</p>
            <p className="text-xs text-muted-foreground/80">Cost: {clickedDisplayItem.baseItem.cost} ELINT</p>
            <HolographicButton onClick={closeTODWindow} className="mt-4" explicitTheme={currentGlobalTheme}>Close</HolographicButton>
          </div>,
          { showCloseButton: true, explicitTheme: currentGlobalTheme, themeVersion }
        );
      }
    } else if (clickedDisplayItem.stackType === 'category' && clickedDisplayItem.itemCategory) {
      setExpandedStackPath([clickedDisplayItem.itemCategory]);
    } else if (clickedDisplayItem.stackType === 'itemType' && clickedDisplayItem.itemCategory && clickedDisplayItem.itemBaseName) {
      setExpandedStackPath([clickedDisplayItem.itemCategory, clickedDisplayItem.itemBaseName]);
    } else if (clickedDisplayItem.stackType === 'itemLevel' && clickedDisplayItem.originalPlayerInventoryItemId && clickedDisplayItem.itemCategory && clickedDisplayItem.itemBaseName) {
      if (clickedDisplayItem.quantityInStack > 1) {
        setExpandedStackPath([clickedDisplayItem.itemCategory, clickedDisplayItem.itemBaseName, clickedDisplayItem.originalPlayerInventoryItemId]);
      } else { // quantityInStack is 1, treat as individual click
        if (clickedDisplayItem.baseItem) {
            todOpenedByLockerRef.current = true;
            autoRotateRef.current = false;
            if (autoRotateTimeoutRef.current) clearTimeout(autoRotateTimeoutRef.current);
            openTODWindow( /* ... same as individual item ... */ );
        }
      }
    }
    // Clicking a stack should not stop rotation.
    // If rotation was paused by drag, let the drag's pointerUp handler resume it.
    // If TOD opened, rotation is handled by the useEffect watching isTODWindowOpen.
  }, [openTODWindow, closeTODWindow, currentGlobalTheme, themeVersion, setExpandedStackPath, todOpenedByLockerRef, autoRotateRef, autoRotateTimeoutRef]);

  const handleBackClick = () => {
    setExpandedStackPath(prev => prev.slice(0, -1));
    // Clicking back should not stop rotation.
  };

  useEffect(() => {
    if (isTODWindowOpen && todOpenedByLockerRef.current) {
      if (autoRotateTimeoutRef.current) clearTimeout(autoRotateTimeoutRef.current);
      autoRotateRef.current = false;
    } else if (!isTODWindowOpen && todOpenedByLockerRef.current) {
      if (autoRotateTimeoutRef.current) clearTimeout(autoRotateTimeoutRef.current);
      autoRotateTimeoutRef.current = setTimeout(() => {
        if (!isDraggingRef.current && !appContext.isTODWindowOpen) {
          autoRotateRef.current = true;
        }
      }, AUTO_ROTATE_RESUME_DELAY);
      todOpenedByLockerRef.current = false; // Reset flag
    }
  }, [isTODWindowOpen, appContext.isTODWindowOpen]); // todOpenedByLockerRef is a ref, not a dep


  useEffect(() => {
    const currentSectionRef = sectionRef.current;
    if (!currentSectionRef) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting && expandedStackPath.length > 0) {
          setExpandedStackPath([]); // Reset to top-level view
          if (!appContext.isTODWindowOpen) { // Only resume if no TOD window is blocking it
            autoRotateRef.current = true;
          }
        }
      },
      { threshold: 0.1 } // Trigger if less than 10% of the section is visible
    );
    observer.observe(currentSectionRef);
    return () => {
      if (currentSectionRef) observer.unobserve(currentSectionRef);
    };
  }, [expandedStackPath, appContext.isTODWindowOpen]); // Rerun if path changes or TOD window state changes

  const currentStackTitle = useMemo(() => {
    if (expandedStackPath.length === 0) return "Equipment Locker";
    const lastPathSegment = expandedStackPath[expandedStackPath.length - 1];
    const itemDef = getItemById(lastPathSegment) || getBaseItemByIdFromGameItems(lastPathSegment);
    if (itemDef) return itemDef.title || itemDef.name;
    return lastPathSegment.replace(/_/g, ' ').replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }, [expandedStackPath, getItemById]);


  return (
    <div ref={sectionRef} className="flex flex-col items-center justify-center p-4 md:p-6 h-full max-w-4xl mx-auto">
      <HolographicPanel
        className="w-full h-full flex flex-col items-center p-2 md:p-4 overflow-hidden"
        explicitTheme={currentGlobalTheme}
      >
        <div className="flex-shrink-0 w-full flex items-center justify-between my-2 md:my-3 px-2">
          {expandedStackPath.length > 0 ? (
            <HolographicButton
              onClick={handleBackClick}
              className="!p-2"
              aria-label="Back to previous stack"
              explicitTheme={currentGlobalTheme}
            >
              <ArrowLeft className="w-5 h-5 icon-glow" />
            </HolographicButton>
          ) : (
            <div className="w-9 h-9"></div> // Placeholder for spacing
          )}
          <h2 className="text-xl md:text-2xl font-orbitron holographic-text text-center flex-grow whitespace-nowrap overflow-hidden text-ellipsis px-2">
            {currentStackTitle}
          </h2>
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
          id="locker-carousel-canvas-container" // Ensure this ID matches Resizer
          className="w-full flex-grow min-h-0 relative" // Ensure min-h-0 for flex-grow to work
          style={{ cursor: 'grab', touchAction: 'none' }}
        >
          {carouselDisplayItems.length > 0 ? (
            <Canvas
              id="locker-carousel-canvas"
              camera={{ position: [0, 0, dynamicCameraZ], fov: 50 }} // Set y to 0 for flat plane, fov 50
              shadows
              gl={{ antialias: true, alpha: true, preserveDrawingBuffer: false }}
              style={{ background: 'transparent' }}
              onCreated={({ gl: canvasGl }) => {
                canvasGl.setClearColor(0x000000, 0); // Transparent background
              }}
            >
              <ambientLight intensity={1.5} />
              <directionalLight position={[5, 5, 5]} intensity={1} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
              <pointLight position={[-5, -5, -10]} intensity={0.5} color={pointLightColor} />
              <pointLight position={[0, 10, 0]} intensity={0.3} /> {/* Top fill light */}
              <EquipmentCarousel
                itemsToDisplay={carouselDisplayItems}
                onItemClick={handleCarouselItemClick}
                carouselRadius={dynamicCarouselRadius}
                autoRotateRef={autoRotateRef}
                isDraggingRef={isDraggingRef}
                autoRotateTimeoutRef={autoRotateTimeoutRef}
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
          {carouselDisplayItems.length > 0 ? (expandedStackPath.length > 0 ? "Click item for details or another stack to navigate. Drag to rotate." : "Drag to rotate. Click stack to expand or item for details.") : ""}
        </p>
      </HolographicPanel>
    </div>
  );
}
