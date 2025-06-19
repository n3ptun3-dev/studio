
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
import { SHOP_CATEGORIES as APP_SHOP_CATEGORIES, getItemById as getBaseItemById } from '@/lib/game-items'; // Corrected import
import { ShoppingCart, ArrowLeft } from 'lucide-react';


const ITEM_WIDTH = 1;
const ITEM_HEIGHT = 1.7;
const ROTATION_SPEED = 0.0035;
const CLICK_DRAG_THRESHOLD_SQUARED = 10 * 10; // For differentiating click from drag
const CLICK_DURATION_THRESHOLD = 250; // ms
const AUTO_ROTATE_RESUME_DELAY = 3000; // ms

// Constants for dynamic radius and camera calculations (User's preferred values)
const MIN_RADIUS_FOR_TWO_ITEMS = 1.4;
const CARD_SPACING_FACTOR = 1.7; // This factor is ADDED to ITEM_WIDTH per card in circumference calculation
const CAMERA_DISTANCE_FROM_FRONT_CARD = 5.0;
const MIN_CAMERA_Z = 3.5;

const INITIAL_CAROUSEL_TARGET_COUNT = 8; // If total individual items <= this, show them directly

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

// Updated DisplayItem interface
export interface DisplayItem {
  id: string; // Unique ID for this display card (can be category, item type, item level stack, or individual)
  baseItem: GameItemBase | null; // Null for category/itemType stacks
  title: string;
  quantityInStack: number;
  imageSrc: string;
  colorVar: string;
  levelForVisuals: ItemLevel; // Level to use for card color and image (highest in stack)

  // For individual items or specific item level stacks
  instanceCurrentStrength?: number;
  instanceMaxStrength?: number;
  instanceCurrentCharges?: number;
  instanceMaxCharges?: number;
  instanceCurrentUses?: number;
  instanceMaxUses?: number;
  instanceCurrentAlerts?: number;
  instanceMaxAlerts?: number;

  // For aggregated stacks (category or itemType)
  aggregateCurrentStrength?: number;
  aggregateMaxStrength?: number;
  aggregateCurrentCharges?: number;
  aggregateMaxCharges?: number;
  // ... other aggregate stats as needed

  stackType: 'category' | 'itemType' | 'itemLevel' | 'individual';
  itemCategory?: ItemCategory; // Present if stackType is 'category', 'itemType', 'itemLevel', or 'individual'
  itemBaseName?: string; // Present if stackType is 'itemType', 'itemLevel', or 'individual' (e.g., "Cypher Lock")
  itemLevel?: ItemLevel; // Present if stackType is 'itemLevel' or 'individual'
  originalPlayerInventoryItemId?: string; // The specific ID from playerInventory if this DisplayItem represents one or more of those
  dataAiHint?: string;
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
  const fallbackImageSrc = '/Spi vs Spi icon.png'; // Ensure this path is correct
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

  if (displayItem.stackType === 'individual') {
    // Individual items use their instance or baseItem stats directly
    if (baseItem) {
      currentVal = displayItem.instanceCurrentStrength ?? baseItem.strength?.current ?? baseItem.strength?.max ?? 0;
      maxVal = displayItem.instanceMaxStrength ?? baseItem.strength?.max ?? 100;
      progressBarLabel = "Strength";

      if (baseItem.category === 'Lock Fortifiers' && baseItem.type === 'Rechargeable') {
        currentVal = displayItem.instanceCurrentCharges ?? (baseItem as any).currentCharges ?? (baseItem as any).maxCharges ?? 0;
        maxVal = displayItem.instanceMaxCharges ?? (baseItem as any).maxCharges ?? 100;
        progressBarLabel = "Charges";
      } else if (baseItem.category === 'Infiltration Gear' && (baseItem.type === 'Rechargeable' || baseItem.type === 'Consumable')) {
        currentVal = displayItem.instanceCurrentUses ?? (baseItem as any).currentUses ?? (baseItem as any).maxUses ?? 0;
        maxVal = displayItem.instanceMaxUses ?? (baseItem as any).maxUses ?? ((baseItem.type === 'Consumable' || baseItem.type === 'One-Time Use') ? 1 : 100);
        progressBarLabel = "Uses";
      } else if (baseItem.category === 'Nexus Upgrades' && baseItem.name === 'Security Camera') {
        currentVal = displayItem.instanceCurrentAlerts ?? (baseItem as any).currentAlerts ?? (baseItem as any).maxAlerts ?? 0;
        maxVal = displayItem.instanceMaxAlerts ?? (baseItem as any).maxAlerts ?? levelForVisuals;
        progressBarLabel = "Alerts";
      } else if (baseItem.category === 'Nexus Upgrades' && (baseItem.name === 'Emergency Repair System (ERS)' || baseItem.name === 'Emergency Power Cell (EPC)')) {
          currentVal = displayItem.instanceCurrentStrength ?? (baseItem as any).currentStrength ?? (baseItem as any).maxStrength ?? 0;
          maxVal = displayItem.instanceMaxStrength ?? (baseItem as any).maxStrength ?? 100;
          progressBarLabel = "Strength";
      }
    }
  } else if (displayItem.stackType === 'itemLevel') {
    // ItemLevel stacks use their instance stats (which should represent the specific inventory item)
    currentVal = displayItem.instanceCurrentStrength ?? 0;
    maxVal = displayItem.instanceMaxStrength ?? 100;
    progressBarLabel = "Strength"; // Default, can be refined if itemLevel stacks have more specific types
    if (baseItem?.category === 'Lock Fortifiers' && baseItem.type === 'Rechargeable') {
        currentVal = displayItem.instanceCurrentCharges ?? 0;
        maxVal = displayItem.instanceMaxCharges ?? 100;
        progressBarLabel = "Charges";
    } // Add more conditions for itemLevel stacks if needed
  } else if (displayItem.stackType === 'category' || displayItem.stackType === 'itemType') {
    // Category or ItemType stacks use aggregate stats
    currentVal = displayItem.aggregateCurrentStrength ?? 0;
    maxVal = displayItem.aggregateMaxStrength ?? (quantityInStack > 0 ? quantityInStack * 100 : 100); // Default max if not provided
    progressBarLabel = "Integrity"; // Or "Overall Status"
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
  const { gl, camera, raycaster, scene, invalidate, events } = useThree(); // Keep events here
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
        if (pointerEvent.button !== 0) return; // Only main button
        clientX = pointerEvent.clientX;
        clientY = pointerEvent.clientY;
        activePointerId = pointerEvent.pointerId;
        try { canvasElement.setPointerCapture(pointerEvent.pointerId); } catch (e) { /* ignore */ }
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
      pointerDownCoords.x = currentX;
      accumulatedDeltaX += Math.abs(deltaX); // For differentiating click from drag

      if (group.current) {
        const rotationAmount = deltaX * 0.005; // Sensitivity factor
        if (itemsToDisplay.length === 1 && group.current.children[0]) {
          (group.current.children[0] as THREE.Mesh).rotation.y += rotationAmount;
        } else if (itemsToDisplay.length > 1) {
          group.current.rotation.y += rotationAmount;
        }
        invalidate(); // Request a re-render
      }
    };

    const handlePointerUpInternal = (event: PointerEvent | TouchEvent) => {
      if (!isDraggingRef.current && (event.type === 'pointerup' && activePointerId === null) && !(event.type.startsWith('touch'))) {
        return; // No active drag or pointer
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

      // Reset styles and flags
      canvasElement.style.cursor = 'grab';
      document.body.style.userSelect = '';
      if (event.type === 'pointerup' && activePointerId !== null) {
        try { canvasElement.releasePointerCapture(activePointerId); } catch (e) { /* ignore */ }
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
          // Iterate to find the correct mesh with userData
          for (const intersect of intersects) {
            let obj: THREE.Object3D | null = intersect.object;
            while (obj && !(obj.userData?.isCarouselItem)) { // Check for the flag we set
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

      // Resume auto-rotation after a delay, only if no TOD window is open
      if (autoRotateTimeoutRef.current) clearTimeout(autoRotateTimeoutRef.current);
      if (!appContext.isTODWindowOpen) { // Check if TOD window is globally closed
        autoRotateTimeoutRef.current = setTimeout(() => {
          if (!isDraggingRef.current && !appContext.isTODWindowOpen) { // Double check state
            autoRotateRef.current = true;
          }
        }, AUTO_ROTATE_RESUME_DELAY);
      }

      // Clean up window event listeners
      const moveEventName = isTouchEvent ? 'touchmove' : 'pointermove';
      const upEventName = isTouchEvent ? 'touchend' : 'pointerup';
      window.removeEventListener(moveEventName, handlePointerMoveInternal);
      window.removeEventListener(upEventName, handlePointerUpInternal);
    };

    // Initial attachment
    canvasElement.addEventListener('pointerdown', handlePointerDownInternal);
    canvasElement.addEventListener('touchstart', handlePointerDownInternal, { passive: false }); // passive: false for preventDefault

    return () => { // Cleanup function
      canvasElement.removeEventListener('pointerdown', handlePointerDownInternal);
      canvasElement.removeEventListener('touchstart', handlePointerDownInternal);
      // Ensure window listeners are removed if component unmounts mid-drag
      window.removeEventListener('pointermove', handlePointerMoveInternal);
      window.removeEventListener('pointerup', handlePointerUpInternal);
      window.removeEventListener('touchmove', handlePointerMoveInternal);
      window.removeEventListener('touchend', handlePointerUpInternal);

      if (autoRotateTimeoutRef.current) clearTimeout(autoRotateTimeoutRef.current);

      // Reset styles if drag was in progress
      if (isDraggingRef.current) { // If unmounting during a drag
        document.body.style.userSelect = '';
        appContext.setIsScrollLockActive(false);
        if (canvasElement.style.cursor === 'grabbing') canvasElement.style.cursor = 'grab';
        if (activePointerId !== null) {
          try { canvasElement.releasePointerCapture(activePointerId); } catch (e) {/* ignore */}
          activePointerId = null;
        }
      }
    };
  }, [gl, onItemClick, camera, raycaster, scene, invalidate, events, appContext.setIsScrollLockActive, appContext.isTODWindowOpen, itemsToDisplay.length, autoRotateRef, isDraggingRef, autoRotateTimeoutRef]); // Added autoRotateTimeoutRef


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
          key={item.id} // Use unique DisplayItem ID
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
    // Get the container once
    containerRef.current = document.getElementById('locker-carousel-canvas-container');
    const container = containerRef.current;

    const handleResize = () => {
      if (container) { // Check if container exists
        const width = container.offsetWidth;
        const height = container.offsetHeight;
        if (width > 0 && height > 0) { // Ensure valid dimensions
          gl.setSize(width, height);
          if (camera instanceof THREE.PerspectiveCamera) {
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
          }
        }
      }
    };

    if (container) { // Only proceed if container was found
      handleResize(); // Initial call
      const resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(container);
      return () => {
        if (container) resizeObserver.unobserve(container); // Check again before unobserving
      };
    }
  }, [camera, gl]); // Dependencies

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
    getItemById, // This is the one from AppContext, correctly typed now
    openSpyShop,
    isTODWindowOpen,
    todWindowTitle, // To check if the locker opened the TOD window
  } = appContext;

  const { theme: currentGlobalTheme, themeVersion } = useTheme();
  const [pointLightColor, setPointLightColor] = useState<THREE.ColorRepresentation>('hsl(0, 0%, 100%)');
  const sectionRef = useRef<HTMLDivElement>(null);

  // State for hierarchical expansion
  const [expandedStackPath, setExpandedStackPath] = useState<string[]>([]); // e.g., ['Hardware', 'Cypher Lock', 'cypher_lock_l1']

  const autoRotateRef = useRef(true);
  const isDraggingRef = useRef(false);
  const autoRotateTimeoutRef = useRef<NodeJS.Timeout | null>(null); // For managing resume delay
  const [todOpenedByLocker, setTodOpenedByLocker] = useState(false); // Track if locker opened TOD

  useEffect(() => {
    if (typeof window !== 'undefined') {
      let hslVarName = '--accent-hsl';
      if (currentGlobalTheme === 'cyphers' || currentGlobalTheme === 'shadows') {
        hslVarName = '--primary-hsl';
      }
      const computedHSLStringRaw = getComputedStyle(document.documentElement).getPropertyValue(hslVarName).trim();
      if (computedHSLStringRaw) {
        // Try parsing "H, S%, L%" first
        const partsWithComma = computedHSLStringRaw.match(/(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?/);
        if (partsWithComma && partsWithComma.length === 4) {
          const h = parseFloat(partsWithComma[1]);
          const s = parseFloat(partsWithComma[2]);
          const l = parseFloat(partsWithComma[3]);
          setPointLightColor(`hsl(${h}, ${s}%, ${l}%)`);
        } else {
          // Fallback to parsing "H S% L%" (space separated)
          const partsWithSpace = computedHSLStringRaw.match(/(\d+)\s+(\d+)%?\s+(\d+)%?/);
          if (partsWithSpace && partsWithSpace.length === 4) {
            const h = parseFloat(partsWithSpace[1]);
            const s = parseFloat(partsWithSpace[2]);
            const l = parseFloat(partsWithSpace[3]);
            setPointLightColor(`hsl(${h}, ${s}%, ${l}%)`);
          } else {
            setPointLightColor('hsl(0, 0%, 100%)'); // Final fallback
          }
        }
      } else {
        setPointLightColor('hsl(0, 0%, 100%)');
      }
    }
  }, [currentGlobalTheme, themeVersion]);


  // Memoized helper to get all PlayerInventoryItem details with their base definitions
  const inventoryWithBaseDefs = useMemo(() => {
    return Object.entries(playerInventory)
      .map(([invKey, invDetails]) => ({
        invKey,
        invDetails,
        baseDef: getBaseItemById(invDetails.id) // Use the correctly imported getBaseItemById
      }))
      .filter(item => item.baseDef && item.invDetails.quantity > 0); // Filter out items without baseDef or 0 quantity
  }, [playerInventory, getBaseItemById]);


  // --- Hierarchical Item Aggregation Logic ---
  const aggregatePlayerItems = useCallback(() => {
    const itemsToDisplay: DisplayItem[] = [];
    const currentPathLevel = expandedStackPath.length;

    const totalIndividualPhysicalItems = inventoryWithBaseDefs.reduce((sum, item) => sum + item.invDetails.quantity, 0);

    if (currentPathLevel === 0) { // Initial View
      if (totalIndividualPhysicalItems <= INITIAL_CAROUSEL_TARGET_COUNT && totalIndividualPhysicalItems > 0) {
        // Show individual items or itemLevel stacks if quantity > 1
        inventoryWithBaseDefs.forEach(item => {
          if (item.baseDef) {
            if (item.invDetails.quantity > 1) {
              itemsToDisplay.push({
                id: item.invDetails.id, // Use player inventory item id as stack id
                baseItem: item.baseDef,
                title: item.baseDef.title || item.baseDef.name,
                quantityInStack: item.invDetails.quantity,
                imageSrc: item.baseDef.imageSrc || '/Spi vs Spi icon.png',
                colorVar: ITEM_LEVEL_COLORS_CSS_VARS[item.baseDef.level] || 'var(--level-1-color)',
                levelForVisuals: item.baseDef.level,
                instanceCurrentStrength: item.invDetails.currentStrength,
                instanceMaxStrength: item.baseDef.strength?.max,
                instanceCurrentCharges: item.invDetails.currentCharges,
                instanceMaxCharges: (item.baseDef as any).maxCharges,
                instanceCurrentUses: item.invDetails.currentUses,
                instanceMaxUses: (item.baseDef as any).maxUses,
                instanceCurrentAlerts: item.invDetails.currentAlerts,
                instanceMaxAlerts: (item.baseDef as any).maxAlerts,
                stackType: 'itemLevel',
                itemCategory: item.baseDef.category,
                itemBaseName: item.baseDef.name,
                itemLevel: item.baseDef.level,
                originalPlayerInventoryItemId: item.invDetails.id,
                dataAiHint: item.baseDef.dataAiHint,
              });
            } else { // quantity === 1
              itemsToDisplay.push({
                id: `${item.invDetails.id}-instance-0`, // Unique ID for this single instance card
                baseItem: item.baseDef,
                title: item.baseDef.title || item.baseDef.name,
                quantityInStack: 1,
                imageSrc: item.baseDef.imageSrc || '/Spi vs Spi icon.png',
                colorVar: ITEM_LEVEL_COLORS_CSS_VARS[item.baseDef.level] || 'var(--level-1-color)',
                levelForVisuals: item.baseDef.level,
                instanceCurrentStrength: item.invDetails.currentStrength,
                instanceMaxStrength: item.baseDef.strength?.max,
                instanceCurrentCharges: item.invDetails.currentCharges,
                instanceMaxCharges: (item.baseDef as any).maxCharges,
                instanceCurrentUses: item.invDetails.currentUses,
                instanceMaxUses: (item.baseDef as any).maxUses,
                instanceCurrentAlerts: item.invDetails.currentAlerts,
                instanceMaxAlerts: (item.baseDef as any).maxAlerts,
                stackType: 'individual',
                itemCategory: item.baseDef.category,
                itemBaseName: item.baseDef.name,
                itemLevel: item.baseDef.level,
                originalPlayerInventoryItemId: item.invDetails.id,
                dataAiHint: item.baseDef.dataAiHint,
              });
            }
          }
        });
      } else if (totalIndividualPhysicalItems > 0) {
        // Show category stacks
        APP_SHOP_CATEGORIES.slice(0, 6).forEach(catInfo => { // Limit to 6-8 for initial view
          const itemsInThisCategory = inventoryWithBaseDefs.filter(item => item.baseDef && item.baseDef.category === catInfo.name);
          if (itemsInThisCategory.length > 0) {
            let highestLevel = 0 as ItemLevel;
            let representativeItemForCat: GameItemBase | null = null;
            let totalQuantityInCategory = 0;
            let aggCurrentStrength = 0; let aggMaxStrength = 0;

            itemsInThisCategory.forEach(item => {
              if (item.baseDef) {
                totalQuantityInCategory += item.invDetails.quantity;
                if (item.baseDef.level > highestLevel) {
                  highestLevel = item.baseDef.level;
                  representativeItemForCat = item.baseDef;
                }
                // Aggregate strength (example, can be more complex for charges/uses)
                aggCurrentStrength += (item.invDetails.currentStrength ?? item.baseDef.strength?.current ?? item.baseDef.strength?.max ?? 0) * item.invDetails.quantity;
                aggMaxStrength += (item.baseDef.strength?.max ?? 100) * item.invDetails.quantity;
              }
            });

            if (representativeItemForCat) {
              itemsToDisplay.push({
                id: `${catInfo.name}-categoryStack`,
                baseItem: null,
                title: catInfo.name,
                quantityInStack: totalQuantityInCategory,
                imageSrc: representativeItemForCat.tileImageSrc || representativeItemForCat.imageSrc || '/Spi vs Spi icon.png',
                colorVar: ITEM_LEVEL_COLORS_CSS_VARS[highestLevel] || 'var(--level-1-color)',
                levelForVisuals: highestLevel,
                aggregateCurrentStrength: aggCurrentStrength,
                aggregateMaxStrength: aggMaxStrength,
                stackType: 'category',
                itemCategory: catInfo.name as ItemCategory,
                dataAiHint: representativeItemForCat.dataAiHint || catInfo.name.toLowerCase(),
              });
            }
          }
        });
      }
    } else if (currentPathLevel === 1) { // Path: ['CategoryName'] -> Show ItemType Stacks within this category + other top-level items/stacks
        const categoryToExpand = expandedStackPath[0] as ItemCategory;
        
        // Add other categories back (as category stacks if many items, or itemLevel/individual if few)
        if (totalIndividualPhysicalItems > INITIAL_CAROUSEL_TARGET_COUNT) {
            APP_SHOP_CATEGORIES.slice(0,6).forEach(catInfo => {
                if (catInfo.name !== categoryToExpand) {
                    const itemsInOtherCategory = inventoryWithBaseDefs.filter(item => item.baseDef && item.baseDef.category === catInfo.name);
                    if (itemsInOtherCategory.length > 0) {
                        let highestLvl = 0 as ItemLevel, repItem: GameItemBase | null = null, totalQty = 0;
                        let aggCS = 0, aggMS = 0;
                        itemsInOtherCategory.forEach(i => {
                            if(i.baseDef) {
                                totalQty += i.invDetails.quantity;
                                if(i.baseDef.level > highestLvl) { highestLvl = i.baseDef.level; repItem = i.baseDef; }
                                aggCS += (i.invDetails.currentStrength ?? i.baseDef.strength?.current ?? i.baseDef.strength?.max ?? 0) * i.invDetails.quantity;
                                aggMS += (i.baseDef.strength?.max ?? 100) * i.invDetails.quantity;
                            }
                        });
                        if (repItem) itemsToDisplay.push({ id: `${catInfo.name}-categoryStack`, baseItem: null, title: catInfo.name, quantityInStack: totalQty, imageSrc: repItem.tileImageSrc || repItem.imageSrc || '', colorVar: ITEM_LEVEL_COLORS_CSS_VARS[highestLvl], levelForVisuals: highestLvl, stackType: 'category', itemCategory: catInfo.name as ItemCategory, aggregateCurrentStrength: aggCS, aggregateMaxStrength: aggMS, dataAiHint: repItem.dataAiHint });
                    }
                }
            });
        } else {
            inventoryWithBaseDefs.forEach(item => {
                if (item.baseDef && item.baseDef.category !== categoryToExpand) {
                     // Add as itemLevel or individual
                     itemsToDisplay.push({
                        id: item.invDetails.quantity > 1 ? item.invDetails.id : `${item.invDetails.id}-instance-0`,
                        baseItem: item.baseDef, title: item.baseDef.title || item.baseDef.name, quantityInStack: item.invDetails.quantity > 1 ? item.invDetails.quantity : 1,
                        imageSrc: item.baseDef.imageSrc || '', colorVar: ITEM_LEVEL_COLORS_CSS_VARS[item.baseDef.level], levelForVisuals: item.baseDef.level,
                        stackType: item.invDetails.quantity > 1 ? 'itemLevel' : 'individual',
                        itemCategory: item.baseDef.category, itemBaseName: item.baseDef.name, itemLevel: item.baseDef.level, originalPlayerInventoryItemId: item.invDetails.id,
                        instanceCurrentStrength: item.invDetails.currentStrength, instanceMaxStrength: item.baseDef.strength?.max, dataAiHint: item.baseDef.dataAiHint,
                        // ... other instance fields
                    });
                }
            });
        }

        // Expand the selected category into itemType stacks
        const itemsInExpandedCategory = inventoryWithBaseDefs.filter(item => item.baseDef && item.baseDef.category === categoryToExpand);
        const groupedByBaseName: Record<string, typeof inventoryWithBaseDefs> = {};
        itemsInExpandedCategory.forEach(item => {
          if (item.baseDef) {
            if (!groupedByBaseName[item.baseDef.name]) groupedByBaseName[item.baseDef.name] = [];
            groupedByBaseName[item.baseDef.name].push(item);
          }
        });

        Object.entries(groupedByBaseName).forEach(([baseName, itemsOfType]) => {
          let highestLevel = 0 as ItemLevel;
          let representativeItem: GameItemBase | null = null;
          let totalQuantity = 0;
          let aggCurrentStrength = 0; let aggMaxStrength = 0;

          itemsOfType.forEach(item => {
            if (item.baseDef) {
              totalQuantity += item.invDetails.quantity;
              if (item.baseDef.level > highestLevel) {
                highestLevel = item.baseDef.level;
                representativeItem = item.baseDef;
              }
              aggCurrentStrength += (item.invDetails.currentStrength ?? item.baseDef.strength?.current ?? item.baseDef.strength?.max ?? 0) * item.invDetails.quantity;
              aggMaxStrength += (item.baseDef.strength?.max ?? 100) * item.invDetails.quantity;
            }
          });
          if (representativeItem) {
            itemsToDisplay.push({
              id: `${categoryToExpand}-${baseName}-itemTypeStack`,
              baseItem: null,
              title: baseName,
              quantityInStack: totalQuantity,
              imageSrc: representativeItem.imageSrc || '/Spi vs Spi icon.png',
              colorVar: ITEM_LEVEL_COLORS_CSS_VARS[highestLevel] || 'var(--level-1-color)',
              levelForVisuals: highestLevel,
              aggregateCurrentStrength: aggCurrentStrength,
              aggregateMaxStrength: aggMaxStrength,
              stackType: 'itemType',
              itemCategory: categoryToExpand,
              itemBaseName: baseName,
              dataAiHint: representativeItem.dataAiHint,
            });
          }
        });

    } else if (currentPathLevel === 2) { // Path: ['CategoryName', 'ItemBaseName'] -> Show ItemLevel Stacks + other context items
        const categoryName = expandedStackPath[0] as ItemCategory;
        const itemBaseNameToExpand = expandedStackPath[1];

        // Add other itemType stacks from the same category, and other category stacks
        const itemsInParentCategory = inventoryWithBaseDefs.filter(item => item.baseDef && item.baseDef.category === categoryName);
        const groupedByBaseNameParent: Record<string, typeof inventoryWithBaseDefs> = {};
        itemsInParentCategory.forEach(item => { if (item.baseDef) { if (!groupedByBaseNameParent[item.baseDef.name]) groupedByBaseNameParent[item.baseDef.name] = []; groupedByBaseNameParent[item.baseDef.name].push(item); } });
        
        Object.entries(groupedByBaseNameParent).forEach(([baseName, itemsOfType]) => {
            if (baseName !== itemBaseNameToExpand) { // Add other itemType stacks from this category
                 let highestLvl = 0 as ItemLevel, repItem: GameItemBase | null = null, totalQty = 0;
                 let aggCS = 0, aggMS = 0;
                 itemsOfType.forEach(i => { if(i.baseDef) { totalQty += i.invDetails.quantity; if(i.baseDef.level > highestLvl) { highestLvl = i.baseDef.level; repItem = i.baseDef; } aggCS += (i.invDetails.currentStrength ?? i.baseDef.strength?.current ?? 0) * i.invDetails.quantity; aggMS += (i.baseDef.strength?.max ?? 100) * i.invDetails.quantity; } });
                 if (repItem) itemsToDisplay.push({ id: `${categoryName}-${baseName}-itemTypeStack`, baseItem: null, title: baseName, quantityInStack: totalQty, imageSrc: repItem.imageSrc || '', colorVar: ITEM_LEVEL_COLORS_CSS_VARS[highestLvl], levelForVisuals: highestLvl, stackType: 'itemType', itemCategory: categoryName, itemBaseName: baseName, aggregateCurrentStrength: aggCS, aggregateMaxStrength: aggMS, dataAiHint: repItem.dataAiHint });
            }
        });
         if (totalIndividualPhysicalItems > INITIAL_CAROUSEL_TARGET_COUNT) { // Add other category stacks
            APP_SHOP_CATEGORIES.slice(0,6).forEach(catInfo => {
                if (catInfo.name !== categoryName) {
                    // ... (logic to create category stack, same as in level 1)
                    const itemsInOtherCategory = inventoryWithBaseDefs.filter(item => item.baseDef && item.baseDef.category === catInfo.name);
                    if (itemsInOtherCategory.length > 0) {
                         let highestLvl = 0 as ItemLevel, repItem: GameItemBase | null = null, totalQty = 0, aggCS = 0, aggMS = 0;
                         itemsInOtherCategory.forEach(i => { if(i.baseDef) { totalQty += i.invDetails.quantity; if(i.baseDef.level > highestLvl) { highestLvl = i.baseDef.level; repItem = i.baseDef; } aggCS += (i.invDetails.currentStrength ?? 0) * i.invDetails.quantity; aggMS += (i.baseDef.strength?.max ?? 100) * i.invDetails.quantity; } });
                         if (repItem) itemsToDisplay.push({ id: `${catInfo.name}-categoryStack`, baseItem: null, title: catInfo.name, quantityInStack: totalQty, imageSrc: repItem.tileImageSrc || repItem.imageSrc || '', colorVar: ITEM_LEVEL_COLORS_CSS_VARS[highestLvl], levelForVisuals: highestLvl, stackType: 'category', itemCategory: catInfo.name as ItemCategory, aggregateCurrentStrength: aggCS, aggregateMaxStrength: aggMS, dataAiHint: repItem.dataAiHint });
                    }
                }
            });
        }

        // Expand the selected itemType into itemLevel stacks
        inventoryWithBaseDefs.forEach(item => {
          if (item.baseDef && item.baseDef.category === categoryName && item.baseDef.name === itemBaseNameToExpand) {
            itemsToDisplay.push({
              id: item.invDetails.id, // This is the specific player inventory item ID (e.g., "cypher_lock_l1")
              baseItem: item.baseDef,
              title: item.baseDef.title || item.baseDef.name, // Should include level
              quantityInStack: item.invDetails.quantity,
              imageSrc: item.baseDef.imageSrc || '/Spi vs Spi icon.png',
              colorVar: ITEM_LEVEL_COLORS_CSS_VARS[item.baseDef.level] || 'var(--level-1-color)',
              levelForVisuals: item.baseDef.level,
              instanceCurrentStrength: item.invDetails.currentStrength,
              instanceMaxStrength: item.baseDef.strength?.max,
              instanceCurrentCharges: item.invDetails.currentCharges,
              instanceMaxCharges: (item.baseDef as any).maxCharges,
              instanceCurrentUses: item.invDetails.currentUses,
              instanceMaxUses: (item.baseDef as any).maxUses,
              instanceCurrentAlerts: item.invDetails.currentAlerts,
              instanceMaxAlerts: (item.baseDef as any).maxAlerts,
              stackType: 'itemLevel', // Represents a stack of identical items (e.g., 4x L1 Cypher Locks)
              itemCategory: categoryName,
              itemBaseName: itemBaseNameToExpand,
              itemLevel: item.baseDef.level,
              originalPlayerInventoryItemId: item.invDetails.id,
              dataAiHint: item.baseDef.dataAiHint,
            });
          }
        });
    } else if (currentPathLevel === 3) { // Path: ['CategoryName', 'ItemBaseName', 'originalPlayerInvItemId_LX'] -> Show Individuals + other context items
        const categoryName = expandedStackPath[0] as ItemCategory;
        const itemBaseName = expandedStackPath[1];
        const itemLevelIdToExpand = expandedStackPath[2]; // This is originalPlayerInventoryItemId (e.g. 'cypher_lock_l1')

        // Add other itemLevel stacks from same itemType, other itemType stacks from same category, and other category stacks
        const itemsInParentItemType = inventoryWithBaseDefs.filter(item => item.baseDef && item.baseDef.category === categoryName && item.baseDef.name === itemBaseName);
        itemsInParentItemType.forEach(item => {
            if (item.invDetails.id !== itemLevelIdToExpand) { // Add other itemLevel stacks from this itemType
                 if(item.baseDef) itemsToDisplay.push({
                    id: item.invDetails.id, baseItem: item.baseDef, title: item.baseDef.title || item.baseDef.name, quantityInStack: item.invDetails.quantity,
                    imageSrc: item.baseDef.imageSrc || '', colorVar: ITEM_LEVEL_COLORS_CSS_VARS[item.baseDef.level], levelForVisuals: item.baseDef.level,
                    stackType: 'itemLevel', itemCategory: categoryName, itemBaseName: itemBaseName, itemLevel: item.baseDef.level, originalPlayerInventoryItemId: item.invDetails.id,
                    instanceCurrentStrength: item.invDetails.currentStrength, instanceMaxStrength: item.baseDef.strength?.max, dataAiHint: item.baseDef.dataAiHint,
                    // ... other instance fields
                });
            }
        });
        // ... (logic to add other itemType stacks from the same category, and other category stacks, similar to level 2's context items)
        const itemsInParentCategory = inventoryWithBaseDefs.filter(item => item.baseDef && item.baseDef.category === categoryName);
        const groupedByBaseNameParent: Record<string, typeof inventoryWithBaseDefs> = {};
        itemsInParentCategory.forEach(item => { if (item.baseDef && item.baseDef.name !== itemBaseName) { if (!groupedByBaseNameParent[item.baseDef.name]) groupedByBaseNameParent[item.baseDef.name] = []; groupedByBaseNameParent[item.baseDef.name].push(item); } });
        Object.entries(groupedByBaseNameParent).forEach(([baseNameOther, itemsOfType]) => {
            let highestLvl = 0 as ItemLevel, repItem: GameItemBase | null = null, totalQty = 0, aggCS=0, aggMS=0;
            itemsOfType.forEach(i => { if(i.baseDef){totalQty+=i.invDetails.quantity; if(i.baseDef.level > highestLvl){highestLvl=i.baseDef.level; repItem=i.baseDef;} aggCS+=(i.invDetails.currentStrength??0)*i.invDetails.quantity; aggMS+=(i.baseDef.strength?.max??100)*i.invDetails.quantity;} });
            if(repItem) itemsToDisplay.push({ id: `${categoryName}-${baseNameOther}-itemTypeStack`, baseItem: null, title: baseNameOther, quantityInStack: totalQty, imageSrc: repItem.imageSrc || '', colorVar: ITEM_LEVEL_COLORS_CSS_VARS[highestLvl], levelForVisuals: highestLvl, stackType: 'itemType', itemCategory: categoryName, itemBaseName: baseNameOther, aggregateCurrentStrength: aggCS, aggregateMaxStrength: aggMS, dataAiHint: repItem.dataAiHint });
        });
         if (totalIndividualPhysicalItems > INITIAL_CAROUSEL_TARGET_COUNT) {
            APP_SHOP_CATEGORIES.slice(0,6).forEach(catInfo => {
                if (catInfo.name !== categoryName) {
                    // ... (logic to create category stack)
                }
            });
        }


        // Expand the selected itemLevel stack into individual cards
        const invItemToExpandDetails = playerInventory[itemLevelIdToExpand];
        const baseItemDefinition = getBaseItemById(itemLevelIdToExpand); // Get base def for the specific item ID
        if (invItemToExpandDetails && baseItemDefinition) {
          for (let i = 0; i < invItemToExpandDetails.quantity; i++) {
            itemsToDisplay.push({
              id: `${itemLevelIdToExpand}-instance-${i}`, // Unique ID for this instance
              baseItem: baseItemDefinition,
              title: baseItemDefinition.title || baseItemDefinition.name,
              quantityInStack: 1, // Individual card
              imageSrc: baseItemDefinition.imageSrc || '/Spi vs Spi icon.png',
              colorVar: ITEM_LEVEL_COLORS_CSS_VARS[baseItemDefinition.level] || 'var(--level-1-color)',
              levelForVisuals: baseItemDefinition.level,
              instanceCurrentStrength: invItemToExpandDetails.currentStrength,
              instanceMaxStrength: baseItemDefinition.strength?.max,
              instanceCurrentCharges: invItemToExpandDetails.currentCharges,
              instanceMaxCharges: (baseItemDefinition as any).maxCharges,
              instanceCurrentUses: invItemToExpandDetails.currentUses,
              instanceMaxUses: (baseItemDefinition as any).maxUses,
              instanceCurrentAlerts: invItemToExpandDetails.currentAlerts,
              instanceMaxAlerts: (baseItemDefinition as any).maxAlerts,
              stackType: 'individual',
              itemCategory: baseItemDefinition.category,
              itemBaseName: baseItemDefinition.name,
              itemLevel: baseItemDefinition.level,
              originalPlayerInventoryItemId: itemLevelIdToExpand, // Store which original item this came from
              dataAiHint: baseItemDefinition.dataAiHint,
            });
          }
        }
    }

    return itemsToDisplay.sort((a, b) => {
      // Prioritize category, then itemType, then itemLevel, then individual
      const typeOrder = { 'category': 0, 'itemType': 1, 'itemLevel': 2, 'individual': 3 };
      if (typeOrder[a.stackType] !== typeOrder[b.stackType]) {
        return typeOrder[a.stackType] - typeOrder[b.stackType];
      }
      return a.title.localeCompare(b.title);
    });
  }, [inventoryWithBaseDefs, expandedStackPath, playerInventory, getBaseItemById]); // Added playerInventory and getBaseItemById

  const carouselDisplayItems = useMemo(aggregatePlayerItems, [aggregatePlayerItems]);


  const { dynamicCarouselRadius, dynamicCameraZ } = useMemo(() => {
    const numItems = carouselDisplayItems.length;
    let radius = 0;
    if (numItems === 1) {
      radius = 0;
    } else if (numItems === 2) {
      radius = MIN_RADIUS_FOR_TWO_ITEMS;
    } else if (numItems > 2) {
      const circumference = numItems * (ITEM_WIDTH + CARD_SPACING_FACTOR); // Each card takes up ITEM_WIDTH + spacing
      radius = Math.max(MIN_RADIUS_FOR_TWO_ITEMS, circumference / (2 * Math.PI));
    }
    const cameraZ = Math.max(MIN_CAMERA_Z, radius + CAMERA_DISTANCE_FROM_FRONT_CARD);
    return { dynamicCarouselRadius: radius, dynamicCameraZ: cameraZ };
  }, [carouselDisplayItems.length]);


  const handleCarouselItemClick = useCallback((clickedDisplayItem: DisplayItem, mesh: THREE.Mesh) => {
    if (clickedDisplayItem.stackType === 'category' && clickedDisplayItem.itemCategory) {
      setExpandedStackPath([clickedDisplayItem.itemCategory]);
      // Do NOT stop auto-rotation here
    } else if (clickedDisplayItem.stackType === 'itemType' && clickedDisplayItem.itemCategory && clickedDisplayItem.itemBaseName) {
      setExpandedStackPath([clickedDisplayItem.itemCategory, clickedDisplayItem.itemBaseName]);
      // Do NOT stop auto-rotation here
    } else if (clickedDisplayItem.stackType === 'itemLevel' && clickedDisplayItem.originalPlayerInventoryItemId && clickedDisplayItem.quantityInStack > 1) {
        // Path should be [category, itemBaseName, originalPlayerInventoryItemId]
        if (clickedDisplayItem.itemCategory && clickedDisplayItem.itemBaseName) {
             setExpandedStackPath([clickedDisplayItem.itemCategory, clickedDisplayItem.itemBaseName, clickedDisplayItem.originalPlayerInventoryItemId]);
        }
      // Do NOT stop auto-rotation here
    } else if (clickedDisplayItem.stackType === 'individual' || (clickedDisplayItem.stackType === 'itemLevel' && clickedDisplayItem.quantityInStack === 1)) {
      if (clickedDisplayItem.baseItem) {
        setTodOpenedByLocker(true); // Signal that locker is opening a TOD
        autoRotateRef.current = false; // Stop rotation
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
    }
  }, [openTODWindow, closeTODWindow, currentGlobalTheme, themeVersion, autoRotateRef, autoRotateTimeoutRef, setTodOpenedByLocker]);

  const handleBackClick = () => {
    setExpandedStackPath(prev => prev.slice(0, -1));
    // Do NOT stop auto-rotation here
  };

  // Effect to handle TOD window closing and resuming auto-rotation
  useEffect(() => {
    if (!isTODWindowOpen && todOpenedByLocker) { // If TOD window was opened by locker and is NOW closed
      if (autoRotateTimeoutRef.current) clearTimeout(autoRotateTimeoutRef.current);
      autoRotateTimeoutRef.current = setTimeout(() => {
        if (!isDraggingRef.current && !appContext.isTODWindowOpen) { // Check again before resuming
          autoRotateRef.current = true;
        }
      }, AUTO_ROTATE_RESUME_DELAY);
      setTodOpenedByLocker(false); // Reset the flag
    } else if (isTODWindowOpen && todOpenedByLocker) {
      // If TOD window IS open and was opened by locker, ensure rotation is stopped
      if (autoRotateTimeoutRef.current) clearTimeout(autoRotateTimeoutRef.current);
      autoRotateRef.current = false;
    }
     return () => { // Cleanup for the timeout if the component unmounts or dependencies change
      if (autoRotateTimeoutRef.current) clearTimeout(autoRotateTimeoutRef.current);
    };
  }, [isTODWindowOpen, todOpenedByLocker, appContext.isTODWindowOpen, autoRotateRef, isDraggingRef, autoRotateTimeoutRef]);


  // Intersection Observer to reset expandedStackPath when section is scrolled out of view
  useEffect(() => {
    const currentSectionRef = sectionRef.current;
    if (!currentSectionRef) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting && expandedStackPath.length > 0) {
          setExpandedStackPath([]);
          // If carousel should resume rotation when scrolled back into view and TOD is not open
          if (!appContext.isTODWindowOpen) { // Check global TOD state
            autoRotateRef.current = true;
          }
        }
      },
      { threshold: 0.1 } // Trigger when 10% of the element is visible/hidden
    );

    observer.observe(currentSectionRef);
    return () => {
      if (currentSectionRef) {
        observer.unobserve(currentSectionRef);
      }
    };
  }, [expandedStackPath, appContext.isTODWindowOpen]); // Added appContext.isTODWindowOpen


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
            {expandedStackPath.length > 0 ? expandedStackPath[expandedStackPath.length - 1].replace(/_/g, ' ').replace(/-/g, ' ') : "Equipment Locker"}
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
          id="locker-carousel-canvas-container" // Critical for Resizer
          className="w-full flex-grow min-h-0 relative" // Ensure it has dimensions
          style={{ cursor: 'grab', touchAction: 'none' }} // For pointer events
        >
          {carouselDisplayItems.length > 0 ? (
            <Canvas
              id="locker-carousel-canvas" // Unique ID for the canvas
              camera={{ position: [0, 0.5, dynamicCameraZ], fov: 60 }} // Adjusted Camera Y position
              shadows
              gl={{ antialias: true, alpha: true, preserveDrawingBuffer: false }} // preserveDrawingBuffer: false for performance
              style={{ background: 'transparent' }} // Transparent background for canvas
              onCreated={({ gl: canvasGl }) => {
                canvasGl.setClearColor(0x000000, 0); // Ensure R3F canvas is transparent
              }}
            >
              <ambientLight intensity={1.5} />
              <directionalLight position={[5, 5, 5]} intensity={1} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
              <pointLight position={[-5, -5, -10]} intensity={0.5} color={pointLightColor} />
              <pointLight position={[0, 10, 0]} intensity={0.3} /> {/* Subtle top light */}
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

