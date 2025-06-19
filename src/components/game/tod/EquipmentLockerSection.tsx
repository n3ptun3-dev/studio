
// src/components/game/tod/EquipmentLockerSection.tsx

"use client";

import React, { useRef, useState, useEffect, useCallback, useLayoutEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useAppContext, type GameItemBase, type ItemLevel, type ItemCategory } from '@/contexts/AppContext';
import { HolographicButton, HolographicPanel } from '@/components/game/shared/HolographicPanel';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { ITEM_LEVEL_COLORS_CSS_VARS } from '@/lib/constants';
import { ShoppingCart } from 'lucide-react';

const ITEM_WIDTH = 1;
const ITEM_HEIGHT = 1.7;
const ROTATION_SPEED = 0.0035;
const CLICK_DRAG_THRESHOLD_SQUARED = 10 * 10;
const CLICK_DURATION_THRESHOLD = 250;

// Constants for dynamic radius and camera calculations - User adjusted
const MIN_RADIUS_FOR_TWO_ITEMS = 1.4;
const CARD_SPACING_FACTOR = 1.7; // Increased for more spacing as items grow
const CAMERA_DISTANCE_FROM_FRONT_CARD = 5.0;
const MIN_CAMERA_Z = 3.5;


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

interface CarouselDisplayItem {
  baseItem: GameItemBase;
  quantityInStack: number; // If > 1, it's a stack. If 1, it could be a single item or an instance from an expanded stack.
  isInstance: boolean;     // True if this card is an individual instance from an expanded stack.
  instanceKey: string;     // Unique key for React (e.g., item.id + "-instance-" + i)
  originalPlayerInventoryItemId: string; // The ID from playerInventory (e.g. "pick_l1")
}

interface CarouselItemProps {
  displayItem: CarouselDisplayItem; // Changed from itemData
  index: number;
  totalItems: number;
  carouselRadius: number;
}

const CarouselItem = React.memo(function CarouselItem({ displayItem, index, totalItems, carouselRadius }: CarouselItemProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const { baseItem, quantityInStack, isInstance } = displayItem;
  const fallbackImageSrc = '/Spi vs Spi icon.png';
  const actualImageSrc = baseItem.imageSrc || fallbackImageSrc;

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
      // Store the whole displayItem in userData for click handling
      meshRef.current.userData = { displayItem, isCarouselItem: true, id: displayItem.instanceKey };
    }
  }, [index, totalItems, carouselRadius, displayItem]);

  useFrame(({ camera }) => {
    if (meshRef.current) {
      meshRef.current.lookAt(camera.position);
    }
  });

  const itemLevelForColor = baseItem.level || 1;
  const itemColorCssVar = ITEM_LEVEL_COLORS_CSS_VARS[itemLevelForColor as ItemLevel] || 'var(--level-1-color)';
  const cardBgClass = LEVEL_TO_BG_CLASS[itemLevelForColor as ItemLevel] || 'bg-muted/30';

  let detailContent = null;
  const strengthCurrent = baseItem.strength?.current ?? 0;
  const strengthMax = baseItem.strength?.max ?? 100;

  switch (baseItem.category) {
    case 'Hardware':
      detailContent = <CardProgressBar label="Strength" current={strengthCurrent} max={strengthMax} colorVar={itemColorCssVar} />;
      break;
    case 'Lock Fortifiers':
      if (baseItem.type === 'Rechargeable') {
        const currentCharges = baseItem.currentCharges ?? baseItem.strength?.current ?? 0;
        const maxCharges = baseItem.maxCharges ?? baseItem.strength?.max ?? 100;
        detailContent = <CardProgressBar label="Recharges" current={currentCharges} max={maxCharges} colorVar={itemColorCssVar} />;
      } else {
        detailContent = <p className="text-[9px] text-center font-semibold p-0.5 rounded bg-black/30 mt-auto mx-1" style={{color: itemColorCssVar}}>Single Use</p>;
      }
      break;
    case 'Nexus Upgrades':
      if (baseItem.name === 'Security Camera') {
        const currentAlerts = baseItem.currentAlerts ?? baseItem.strength?.current ?? 0;
        const maxAlerts = baseItem.maxAlerts ?? baseItem.strength?.max ?? baseItem.level ?? 1;
        detailContent = <CardProgressBar label="Alerts" current={currentAlerts} max={maxAlerts} colorVar={itemColorCssVar} />;
      } else if (baseItem.name === 'Emergency Repair System (ERS)') {
        detailContent = <CardProgressBar label="Reserve Str." current={strengthCurrent} max={strengthMax} colorVar={itemColorCssVar} />;
      } else if (baseItem.name === 'Emergency Power Cell (EPC)') {
         const currentEPCStrength = baseItem.currentStrength ?? baseItem.strength?.current ?? baseItem.level ?? 0;
         const maxEPCStrength = baseItem.maxStrength ?? baseItem.strength?.max ?? baseItem.level ?? 1;
        detailContent = <CardProgressBar label="Strength" current={currentEPCStrength} max={maxEPCStrength} colorVar={itemColorCssVar} />;
      } else if (baseItem.name?.includes('Reinforced Foundation')) {
         detailContent = <p className="text-[9px] text-center font-semibold p-0.5 rounded bg-black/30 mt-auto mx-1" style={{color: itemColorCssVar}}>Permanent</p>;
      }
      break;
    case 'Infiltration Gear':
      if (baseItem.name === 'Pick' && baseItem.level === 1) {
        detailContent = <p className="text-[9px] text-center font-semibold p-0.5 rounded bg-black/30 mt-auto mx-1" style={{color: itemColorCssVar}}>Basic Tool</p>;
      } else if (baseItem.type === 'Rechargeable') {
        const currentUses = baseItem.currentUses ?? baseItem.strength?.current ?? 0;
        const maxUses = baseItem.maxUses ?? baseItem.strength?.max ?? 100;
        detailContent = <CardProgressBar label="Uses Left" current={currentUses} max={maxUses} colorVar={itemColorCssVar} />;
      } else if (baseItem.type === 'One-Time Use' || baseItem.type === 'Consumable') {
        detailContent = <p className="text-[9px] text-center font-semibold p-0.5 rounded bg-black/30 mt-auto mx-1" style={{color: itemColorCssVar}}>Single Use</p>;
      }
      break;
    case 'Assault Tech':
      detailContent = <p className="text-[9px] text-center font-semibold p-0.5 rounded bg-black/30 mt-auto mx-1" style={{color: itemColorCssVar}}>Single Use</p>;
      break;
    case 'Aesthetic Schemes':
      detailContent = null;
      break;
    default:
      if (baseItem.strength) {
        detailContent = <CardProgressBar label="Status" current={strengthCurrent} max={strengthMax} colorVar={itemColorCssVar} />;
      }
  }

  return (
    <mesh ref={meshRef} userData={{ displayItem, isCarouselItem: true, id: displayItem.instanceKey }}>
      <planeGeometry args={[ITEM_WIDTH, ITEM_HEIGHT]} />
      <meshBasicMaterial transparent opacity={0} />
      <Html
        center
        transform
        prepend
        occlude="blending"
        style={{ pointerEvents: 'none', width: `${ITEM_WIDTH * 100}px`, height: `${ITEM_HEIGHT * 100}px` }}
      >
        <div
          className={cn(
            "w-full h-full rounded-md border flex flex-col items-center justify-start overflow-hidden relative", // Added relative for badge positioning
            cardBgClass
          )}
          style={{
            borderColor: itemColorCssVar,
            fontFamily: 'var(--font-rajdhani)',
            color: `hsl(var(--foreground-hsl))`,
            boxShadow: `0 0 5px ${itemColorCssVar}`,
          }}
        >
          {quantityInStack > 1 && !isInstance && ( // Show badge only for stacks, not individual instances
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
              alt={baseItem.title || baseItem.name}
              className="w-full h-full object-fill"
              data-ai-hint={baseItem.dataAiHint || "item icon"}
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
              {baseItem.title} {/* Use pre-formatted title */}
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
  itemsToDisplay: CarouselDisplayItem[]; // Changed from itemsData
  onItemClick: (displayItem: CarouselDisplayItem, mesh: THREE.Mesh) => void; // Pass the whole displayItem
  carouselRadius: number;
}

const EquipmentCarousel = React.memo(function EquipmentCarousel(props: EquipmentCarouselProps) {
  const { itemsToDisplay, onItemClick, carouselRadius } = props;
  const group = useRef<THREE.Group>(null!);
  const { gl, camera, raycaster, scene, invalidate } = useThree();
  const appContext = useAppContext();

  const isDraggingRef = useRef(false);
  const autoRotateRef = useRef(true);
  const accumulatedDeltaXRef = useRef(0);
  const pointerDownTimeRef = useRef(0);
  const pointerDownCoords = useRef({ x: 0, y: 0 });
  const activePointerIdRef = useRef<number | null>(null);

  useEffect(() => {
    const canvasElement = gl?.domElement;
    if (!canvasElement) {
      console.log("[Carousel] Canvas DOM element not available yet.");
      return;
    }
    // console.log("[Carousel] useEffect for listeners executing. gl.domElement:", canvasElement);
    if (canvasElement.style.pointerEvents !== 'auto') {
      // console.log("[Carousel] Set canvas pointerEvents to 'auto'");
      canvasElement.style.pointerEvents = 'auto';
    }

    const handlePointerDownInternal = (event: PointerEvent | TouchEvent) => {
      // console.log("[Carousel] handlePointerDownInternal INVOKED. Event type:", event.type);
      let clientX: number, clientY: number;

      if (event.type.startsWith('touch')) {
        const touchEvent = event as TouchEvent;
        if (touchEvent.touches.length === 0) return;
        if (touchEvent.cancelable) event.preventDefault();
        clientX = touchEvent.touches[0].clientX;
        clientY = touchEvent.touches[0].clientY;
      } else {
        const pointerEvent = event as PointerEvent;
        if (pointerEvent.button !== 0) return;
        clientX = pointerEvent.clientX;
        clientY = pointerEvent.clientY;
        activePointerIdRef.current = pointerEvent.pointerId;
        try {
          canvasElement.setPointerCapture(pointerEvent.pointerId);
        } catch (e) {
          console.warn("[Carousel] Failed to set pointer capture:", e);
        }
      }

      isDraggingRef.current = true;
      autoRotateRef.current = false;
      appContext.setIsScrollLockActive(true);
      accumulatedDeltaXRef.current = 0;
      pointerDownTimeRef.current = performance.now();
      pointerDownCoords.current = { x: clientX, y: clientY };
      canvasElement.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';

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
      pointerDownCoords.current.x = currentX;
      accumulatedDeltaXRef.current += Math.abs(deltaX);

      if (group.current) {
        const rotationAmount = deltaX * 0.005;
        if (itemsToDisplay.length === 1 && group.current.children[0]) {
          (group.current.children[0] as THREE.Mesh).rotation.y += rotationAmount;
        } else if (itemsToDisplay.length > 1) {
          group.current.rotation.y += rotationAmount;
        }
        invalidate();
      }
    };

    const handlePointerUpInternal = (event: PointerEvent | TouchEvent) => {
      // console.log("[Carousel] handlePointerUpInternal INVOKED. Event type:", event.type);
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
      document.body.style.userSelect = '';

      if (event.type === 'pointerup' && activePointerIdRef.current !== null) {
        try { canvasElement.releasePointerCapture(activePointerIdRef.current); } catch (e) { /* ignore */ }
      }
      activePointerIdRef.current = null;

      const wasSignificantDrag = accumulatedDeltaXRef.current > Math.sqrt(CLICK_DRAG_THRESHOLD_SQUARED);
      const wasQuickEnoughForClick = dragDuration < CLICK_DURATION_THRESHOLD;

      if (!wasSignificantDrag && wasQuickEnoughForClick) {
        // console.log("[Carousel] Click detected. Coords for raycast:", clickClientX, clickClientY);
        const rect = canvasElement.getBoundingClientRect();
        const pointerVector = new THREE.Vector2(
          ((clickClientX - rect.left) / rect.width) * 2 - 1,
          -((clickClientY - rect.top) / rect.height) * 2 + 1
        );
        raycaster.setFromCamera(pointerVector, camera);
        const intersects = raycaster.intersectObjects(group.current?.children || [], true);
        // console.log(`[Carousel] Raycaster INTERSECTED count: ${intersects.length}`);

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
          if (clickedMesh && clickedMesh.userData.displayItem) { // Check for displayItem
            // console.log(`[Carousel] Clicked Item: ${clickedMesh.userData.displayItem.baseItem?.name || 'Unknown'}`);
            onItemClick(clickedMesh.userData.displayItem, clickedMesh); // Pass displayItem
          } else {
            // console.log("[Carousel] Clicked, but no valid item data found on intersected mesh or its parents.");
          }
        }
      } else {
        //  console.log(`[Carousel] Drag detected or click too long. Acc Delta: ${accumulatedDeltaXRef.current.toFixed(0)}, Duration: ${dragDuration.toFixed(0)}ms`);
      }
      
      isDraggingRef.current = false;
      appContext.setIsScrollLockActive(false);

      const moveEventName = event.type.startsWith('touch') ? 'touchmove' : 'pointermove';
      const upEventName = event.type.startsWith('touch') ? 'touchend' : 'pointerup';
      window.removeEventListener(moveEventName, handlePointerMoveInternal);
      window.removeEventListener(upEventName, handlePointerUpInternal);

      setTimeout(() => {
        if (!isDraggingRef.current) autoRotateRef.current = true;
      }, 300);
    };

    // console.log("[Carousel] Main Effect: Attaching 'pointerdown' and 'touchstart' listeners to canvas.");
    canvasElement.addEventListener('pointerdown', handlePointerDownInternal);
    canvasElement.addEventListener('touchstart', handlePointerDownInternal, { passive: false });

    return () => {
      // console.log("[Carousel] Cleaning up event listeners from canvas.");
      canvasElement.removeEventListener('pointerdown', handlePointerDownInternal);
      canvasElement.removeEventListener('touchstart', handlePointerDownInternal);
      window.removeEventListener('pointermove', handlePointerMoveInternal);
      window.removeEventListener('pointerup', handlePointerUpInternal);
      window.removeEventListener('touchmove', handlePointerMoveInternal);
      window.removeEventListener('touchend', handlePointerUpInternal);
      
      if (isDraggingRef.current) {
          document.body.style.userSelect = '';
          appContext.setIsScrollLockActive(false);
          if (canvasElement.style.cursor === 'grabbing') canvasElement.style.cursor = 'grab';
          if (activePointerIdRef.current !== null) {
              try { canvasElement.releasePointerCapture(activePointerIdRef.current); } catch(e) { /* ignore */ }
              activePointerIdRef.current = null;
          }
      }
    };
  }, [gl, onItemClick, camera, raycaster, scene, invalidate, appContext.setIsScrollLockActive, itemsToDisplay.length]);

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
          key={item.instanceKey} // Use instanceKey for React key
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
        handleResize();
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

export function EquipmentLockerSection({ parallaxOffset }: SectionProps) {
  const appContext = useAppContext();
  const {
    openTODWindow,
    closeTODWindow,
    playerInventory,
    getItemById,
    openSpyShop,
  } = appContext;

  const { theme: currentGlobalTheme, themeVersion } = useTheme();
  const [pointLightColor, setPointLightColor] = useState<THREE.ColorRepresentation>('hsl(0, 0%, 100%)');
  const [expandedStackItemId, setExpandedStackItemId] = useState<string | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null); // Ref for IntersectionObserver

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
          const colorStringForThree = `hsl(${h}, ${s}%, ${l}%)`;
          setPointLightColor(colorStringForThree);
          // console.log(`[EquipmentLocker] Set pointLightColor to: ${colorStringForThree} from var ${hslVarName}`);
        } else {
          // console.warn(`[EquipmentLocker] Could not parse HSL string: '${computedHSLStringRaw}' from var ${hslVarName}. Defaulting light color.`);
          setPointLightColor('hsl(0, 0%, 100%)');
        }
      } else {
        // console.warn(`[EquipmentLocker] HSL variable ${hslVarName} not found. Defaulting light color.`);
        setPointLightColor('hsl(0, 0%, 100%)');
      }
    }
  }, [currentGlobalTheme, themeVersion]);

  // Logic to derive items for carousel display
  const carouselDisplayItems = useMemo((): CarouselDisplayItem[] => {
    if (typeof playerInventory !== 'object' || playerInventory === null || typeof getItemById !== 'function') {
      return [];
    }

    const displayItems: CarouselDisplayItem[] = [];
    const inventoryEntries = Object.entries(playerInventory);

    inventoryEntries.forEach(([playerInvItemId, invItemDetails]) => {
      if (invItemDetails.quantity <= 0) return;

      const baseItem = getItemById(playerInvItemId); // playerInvItemId is like "pick_l1"
      if (!baseItem) return;

      if (expandedStackItemId === playerInvItemId && invItemDetails.quantity > 1) {
        // Expand this stack
        for (let i = 0; i < invItemDetails.quantity; i++) {
          displayItems.push({
            baseItem: { ...baseItem }, // Create a copy for each instance
            quantityInStack: 1, // Individual instance
            isInstance: true,
            instanceKey: `${playerInvItemId}-instance-${i}`,
            originalPlayerInventoryItemId: playerInvItemId,
          });
        }
      } else {
        // Show as a stack (or single item if quantity is 1)
        displayItems.push({
          baseItem,
          quantityInStack: invItemDetails.quantity,
          isInstance: false,
          instanceKey: playerInvItemId, // Base item ID can be the key for stacks
          originalPlayerInventoryItemId: playerInvItemId,
        });
      }
    });
    return displayItems;
  }, [playerInventory, getItemById, expandedStackItemId]);


  const { dynamicCarouselRadius, dynamicCameraZ } = useMemo(() => {
    const numItems = carouselDisplayItems.length; // Use the length of items being displayed
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

  const handleCarouselItemClick = useCallback((clickedDisplayItem: CarouselDisplayItem, mesh: THREE.Mesh) => {
    // console.log(`[EquipmentLockerSection] handleCarouselItemClick triggered for item: ${clickedDisplayItem.baseItem.name}`);
    
    if (!clickedDisplayItem.isInstance && clickedDisplayItem.quantityInStack > 1) {
      // Clicked on a stack, expand it
      setExpandedStackItemId(clickedDisplayItem.originalPlayerInventoryItemId);
    } else {
      // Clicked on an individual item (either a single or an instance from an expanded stack)
      // Open TOD window with details
      const itemToShowDetails = clickedDisplayItem.baseItem;
      const itemLevelForColor = itemToShowDetails.level || 1;
      const itemColorCssVar = ITEM_LEVEL_COLORS_CSS_VARS[itemLevelForColor as ItemLevel] || 'var(--level-1-color)';

      openTODWindow(
        itemToShowDetails.title || itemToShowDetails.name,
        <div className="font-rajdhani p-4 text-center">
          <h3 className="text-xl font-bold mb-2" style={{color: itemColorCssVar }}>{itemToShowDetails.title || itemToShowDetails.name}</h3>
          <div className="w-32 h-32 mx-auto my-2 rounded bg-black/30 flex items-center justify-center">
            <img
              src={itemToShowDetails.imageSrc || fallbackImageSrc}
              alt={itemToShowDetails.title || itemToShowDetails.name}
              className="max-w-full max-h-full object-contain"
              data-ai-hint={itemToShowDetails.dataAiHint || "item icon"}
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                if (target.src !== fallbackImageSrc) {
                  target.src = fallbackImageSrc;
                  target.onerror = null;
                }
              }}
            />
          </div>
          <p className="text-muted-foreground mb-1 text-sm">{itemToShowDetails.description}</p>
          <p className="text-xs text-muted-foreground/80">Cost: {itemToShowDetails.cost} ELINT</p>
          {itemToShowDetails.strength && <p className="text-xs text-muted-foreground/80">Strength: {itemToShowDetails.strength.current}/{itemToShowDetails.strength.max}</p>}
          {itemToShowDetails.resistance && <p className="text-xs text-muted-foreground/80">Resistance: {itemToShowDetails.resistance.current}/{itemToShowDetails.resistance.max}</p>}
          <HolographicButton onClick={closeTODWindow} className="mt-4" explicitTheme={currentGlobalTheme}>Close</HolographicButton>
        </div>,
        {
          showCloseButton: true,
          explicitTheme: currentGlobalTheme,
          themeVersion: themeVersion,
        }
      );
    }
  }, [openTODWindow, closeTODWindow, currentGlobalTheme, themeVersion, setExpandedStackItemId]);

  // IntersectionObserver to collapse stack when section scrolls out of view
  useEffect(() => {
    const currentSectionRef = sectionRef.current;
    if (!currentSectionRef) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting && expandedStackItemId !== null) {
          // console.log("[EquipmentLocker] Scrolled out of view, collapsing stack.");
          setExpandedStackItemId(null);
        }
      },
      { threshold: 0.1 } // Trigger if less than 10% is visible
    );

    observer.observe(currentSectionRef);
    return () => {
      if (currentSectionRef) {
        observer.unobserve(currentSectionRef);
      }
    };
  }, [expandedStackItemId]);


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
              style={{ background: 'transparent', pointerEvents: 'auto' }}
              onCreated={({ gl: canvasGl }) => {
                canvasGl.setClearColor(0x000000, 0);
                // console.log("[Canvas] Created");
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
            {carouselDisplayItems.length > 0 ? (expandedStackItemId ? "Click item for details." : "Drag to rotate. Click stack to expand or item for details.") : ""}
          </p>
      </HolographicPanel>
    </div>
  );
}
