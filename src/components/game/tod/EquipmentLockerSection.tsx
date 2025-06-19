
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

const ITEM_WIDTH = 1; // Base width of a card for layout calculations
const ITEM_HEIGHT = 1.7;
const ROTATION_SPEED = 0.0035;
const CLICK_DRAG_THRESHOLD_SQUARED = 10 * 10; // (10px)^2
const CLICK_DURATION_THRESHOLD = 250; // ms

// Constants for dynamic radius and camera calculations
const MIN_RADIUS_FOR_TWO_ITEMS = 1.4;
const CARD_SPACING_FACTOR = 1.7;
const CAMERA_DISTANCE_FROM_FRONT_CARD = 5.0;
const MIN_CAMERA_Z = 3.5; // Absolute minimum camera Z to prevent clipping if radius is tiny


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

interface CarouselItemProps {
  itemData: GameItemBase;
  index: number;
  totalItems: number;
  carouselRadius: number;
}

const CarouselItem = React.memo(function CarouselItem({ itemData, index, totalItems, carouselRadius }: CarouselItemProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const fallbackImageSrc = '/Spi vs Spi icon.png';
  const actualImageSrc = itemData.imageSrc || fallbackImageSrc;

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
      meshRef.current.userData = { itemData, isCarouselItem: true, id: itemData.id };
    }
  }, [index, totalItems, carouselRadius, itemData]);

  useFrame(({ camera }) => {
    if (meshRef.current) {
      // Make the card always face the camera
      meshRef.current.lookAt(camera.position);
    }
  });

  const itemLevelForColor = itemData.level || 1;
  const itemColorCssVar = ITEM_LEVEL_COLORS_CSS_VARS[itemLevelForColor as ItemLevel] || 'var(--level-1-color)';
  const cardBgClass = LEVEL_TO_BG_CLASS[itemLevelForColor as ItemLevel] || 'bg-muted/30';

  let detailContent = null;
  const strengthCurrent = itemData.strength?.current ?? 0;
  const strengthMax = itemData.strength?.max ?? 100;

  switch (itemData.category) {
    case 'Hardware':
      detailContent = <CardProgressBar label="Strength" current={strengthCurrent} max={strengthMax} colorVar={itemColorCssVar} />;
      break;
    case 'Lock Fortifiers':
      if (itemData.type === 'Rechargeable') {
        const currentCharges = itemData.currentCharges ?? itemData.strength?.current ?? 0;
        const maxCharges = itemData.maxCharges ?? itemData.strength?.max ?? 100;
        detailContent = <CardProgressBar label="Recharges" current={currentCharges} max={maxCharges} colorVar={itemColorCssVar} />;
      } else {
        detailContent = <p className="text-[9px] text-center font-semibold p-0.5 rounded bg-black/30 mt-auto mx-1" style={{color: itemColorCssVar}}>Single Use</p>;
      }
      break;
    case 'Nexus Upgrades':
      if (itemData.name === 'Security Camera') {
        const currentAlerts = itemData.currentAlerts ?? itemData.strength?.current ?? 0;
        const maxAlerts = itemData.maxAlerts ?? itemData.strength?.max ?? itemData.level ?? 1;
        detailContent = <CardProgressBar label="Alerts" current={currentAlerts} max={maxAlerts} colorVar={itemColorCssVar} />;
      } else if (itemData.name === 'Emergency Repair System (ERS)') {
        detailContent = <CardProgressBar label="Reserve Str." current={strengthCurrent} max={strengthMax} colorVar={itemColorCssVar} />;
      } else if (itemData.name === 'Emergency Power Cell (EPC)') {
         const currentEPCStrength = itemData.currentStrength ?? itemData.strength?.current ?? itemData.level ?? 0;
         const maxEPCStrength = itemData.maxStrength ?? itemData.strength?.max ?? itemData.level ?? 1;
        detailContent = <CardProgressBar label="Strength" current={currentEPCStrength} max={maxEPCStrength} colorVar={itemColorCssVar} />;
      } else if (itemData.name?.includes('Reinforced Foundation')) {
         detailContent = <p className="text-[9px] text-center font-semibold p-0.5 rounded bg-black/30 mt-auto mx-1" style={{color: itemColorCssVar}}>Permanent</p>;
      }
      break;
    case 'Infiltration Gear':
      if (itemData.name === 'Pick' && itemData.level === 1) {
        detailContent = <p className="text-[9px] text-center font-semibold p-0.5 rounded bg-black/30 mt-auto mx-1" style={{color: itemColorCssVar}}>Basic Tool</p>;
      } else if (itemData.type === 'Rechargeable') {
        const currentUses = itemData.currentUses ?? itemData.strength?.current ?? 0;
        const maxUses = itemData.maxUses ?? itemData.strength?.max ?? 100;
        detailContent = <CardProgressBar label="Uses Left" current={currentUses} max={maxUses} colorVar={itemColorCssVar} />;
      } else if (itemData.type === 'One-Time Use' || itemData.type === 'Consumable') {
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
      if (itemData.strength) {
        detailContent = <CardProgressBar label="Status" current={strengthCurrent} max={strengthMax} colorVar={itemColorCssVar} />;
      }
  }

  return (
    <mesh ref={meshRef} userData={{ itemData, isCarouselItem: true, id: itemData.id }}>
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
            "w-full h-full rounded-md border flex flex-col items-center justify-start overflow-hidden",
            cardBgClass
          )}
          style={{
            borderColor: itemColorCssVar,
            fontFamily: 'var(--font-rajdhani)',
            color: `hsl(var(--foreground-hsl))`,
            boxShadow: `0 0 5px ${itemColorCssVar}`,
          }}
        >
          <div className="w-full h-3/5 relative flex-shrink-0">
            <img
              src={actualImageSrc}
              alt={itemData.title || itemData.name}
              className="w-full h-full object-fill"
              data-ai-hint={itemData.dataAiHint || "item icon"}
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                if (target.src !== fallbackImageSrc) {
                  target.src = fallbackImageSrc;
                  target.onerror = null;
                }
              }}
            />
          </div>
          <div className="w-full px-1.5 py-1 flex flex-col justify-between flex-grow min-h-0">
            <p className="text-[10px] font-semibold text-center leading-tight mb-0.5" style={{ color: itemColorCssVar }}>
              {itemData.title}
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
  itemsData: GameItemBase[];
  onItemClick: (item: GameItemBase, mesh: THREE.Mesh) => void;
  carouselRadius: number;
}

const EquipmentCarousel = React.memo(function EquipmentCarousel(props: EquipmentCarouselProps) {
  const { itemsData, onItemClick, carouselRadius } = props;
  const group = useRef<THREE.Group>(null!);
  const { gl, camera, raycaster, scene, invalidate } = useThree();
  const appContext = useAppContext();

  const isDraggingRef = useRef(false);
  const autoRotateRef = useRef(true);
  const accumulatedDeltaXRef = useRef(0);
  const pointerDownTimeRef = useRef(0);
  const pointerDownCoords = useRef({ x: 0, y: 0 }); // For both pointer and touch
  const activePointerIdRef = useRef<number | null>(null); // For pointer events only


  useEffect(() => {
    console.log("[Carousel] useEffect for listeners executing. gl.domElement:", gl?.domElement);
    const canvasElement = gl?.domElement;
    if (!canvasElement) {
      console.log("[Carousel] Canvas DOM element not available yet.");
      return;
    }

    // Explicitly set pointer events on the canvas if it's not already 'auto'
    if (canvasElement.style.pointerEvents !== 'auto') {
        console.log("[Carousel] Set canvas pointerEvents to 'auto'");
        canvasElement.style.pointerEvents = 'auto';
    }


    const handlePointerDownInternal = (event: PointerEvent | TouchEvent) => {
      console.log("[Carousel] handlePointerDownInternal INVOKED. Event type:", event.type);
      let clientX: number, clientY: number;

      if (event.type.startsWith('touch')) {
        const touchEvent = event as TouchEvent;
        if (touchEvent.touches.length === 0) return;
        if (touchEvent.cancelable) event.preventDefault();
        clientX = touchEvent.touches[0].clientX;
        clientY = touchEvent.touches[0].clientY;
        // For touch, we don't manage activePointerIdRef or pointer capture in the same way
      } else {
        const pointerEvent = event as PointerEvent;
        if (pointerEvent.button !== 0) return; // Only main button
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
      document.body.style.userSelect = 'none'; // Prevent text selection during drag

      const moveEventName = event.type.startsWith('touch') ? 'touchmove' : 'pointermove';
      const upEventName = event.type.startsWith('touch') ? 'touchend' : 'pointerup';

      // Add move and up listeners to window to capture events outside canvas
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
      accumulatedDeltaXRef.current += Math.abs(deltaX); // Track total drag distance

      if (group.current) {
        const rotationAmount = deltaX * 0.005; // Sensitivity factor
        if (itemsData.length === 1 && group.current.children[0]) {
          (group.current.children[0] as THREE.Mesh).rotation.y += rotationAmount;
        } else if (itemsData.length > 1) {
          group.current.rotation.y += rotationAmount;
        }
        invalidate(); // Request a re-render from R3F
      }
    };

    const handlePointerUpInternal = (event: PointerEvent | TouchEvent) => {
      console.log("[Carousel] handlePointerUpInternal INVOKED. Event type:", event.type);
      if (!isDraggingRef.current && (event.type === 'pointerup' && activePointerIdRef.current === null) && !(event.type.startsWith('touch'))) {
          return; // Avoid processing if not dragging and it's a pointerup without an active pointer (could be other buttons)
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
        console.log("[Carousel] Click detected. Coords for raycast:", clickClientX, clickClientY);
        const rect = canvasElement.getBoundingClientRect();
        const pointerVector = new THREE.Vector2(
          ((clickClientX - rect.left) / rect.width) * 2 - 1,
          -((clickClientY - rect.top) / rect.height) * 2 + 1
        );
        raycaster.setFromCamera(pointerVector, camera);
        const intersects = raycaster.intersectObjects(group.current?.children || [], true);
        console.log(`[Carousel] Raycaster INTERSECTED count: ${intersects.length}`);

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
          if (clickedMesh && clickedMesh.userData.itemData) {
            console.log(`[Carousel] Clicked Item: ${clickedMesh.userData.itemData?.name || 'Unknown'}`);
            onItemClick(clickedMesh.userData.itemData, clickedMesh);
          } else {
            console.log("[Carousel] Clicked, but no valid item data found on intersected mesh or its parents.");
          }
        }
      } else {
         console.log(`[Carousel] Drag detected or click too long. Acc Delta: ${accumulatedDeltaXRef.current.toFixed(0)}, Duration: ${dragDuration.toFixed(0)}ms`);
      }
      
      isDraggingRef.current = false;
      appContext.setIsScrollLockActive(false);

      // Clean up window event listeners
      const moveEventName = event.type.startsWith('touch') ? 'touchmove' : 'pointermove';
      const upEventName = event.type.startsWith('touch') ? 'touchend' : 'pointerup';
      window.removeEventListener(moveEventName, handlePointerMoveInternal);
      window.removeEventListener(upEventName, handlePointerUpInternal);

      // Delay re-enabling auto-rotate to prevent immediate spin after drag
      setTimeout(() => {
        if (!isDraggingRef.current) autoRotateRef.current = true;
      }, 300);
    };

    console.log("[Carousel] Main Effect: Attaching 'pointerdown' and 'touchstart' listeners to canvas.");
    canvasElement.addEventListener('pointerdown', handlePointerDownInternal);
    canvasElement.addEventListener('touchstart', handlePointerDownInternal, { passive: false });

    return () => {
      console.log("[Carousel] Cleaning up event listeners from canvas.");
      canvasElement.removeEventListener('pointerdown', handlePointerDownInternal);
      canvasElement.removeEventListener('touchstart', handlePointerDownInternal);
      // Ensure window listeners are also cleaned up if the component unmounts mid-drag
      window.removeEventListener('pointermove', handlePointerMoveInternal);
      window.removeEventListener('pointerup', handlePointerUpInternal);
      window.removeEventListener('touchmove', handlePointerMoveInternal);
      window.removeEventListener('touchend', handlePointerUpInternal);
      
      // Reset styles and states if unmounting mid-drag
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
  }, [gl, onItemClick, camera, raycaster, scene, invalidate, appContext.setIsScrollLockActive, itemsData.length]); // Added itemsData.length


  useFrame((state, delta) => {
    if (group.current && autoRotateRef.current && !isDraggingRef.current) {
      if (itemsData.length === 1 && group.current.children[0]) {
        (group.current.children[0] as THREE.Mesh).rotation.y += ROTATION_SPEED * delta * 60;
      } else if (itemsData.length > 1) {
        group.current.rotation.y += ROTATION_SPEED * delta * 60;
      }
    }
  });

  return (
    <group ref={group}>
      {itemsData.map((item, index) => (
        <CarouselItem
          key={item.id || `item-${index}`}
          itemData={item}
          index={index}
          totalItems={itemsData.length}
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
          if (container) resizeObserver.unobserve(container);
        };
    }
  }, [camera, gl]); // Rerun if camera or gl instance changes

  return null;
});
Resizer.displayName = 'Resizer';


const fallbackImageSrc = '/Spi vs Spi icon.png'; // Fallback for item images

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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      let hslVarName = '--accent-hsl'; // Default for terminal-green or neutral
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
          const colorStringForThree = `hsl(${h}, ${s}%, ${l}%)`; // Add commas
          setPointLightColor(colorStringForThree);
          console.log(`[EquipmentLocker] Set pointLightColor to: ${colorStringForThree} from var ${hslVarName}`);
        } else {
          console.warn(`[EquipmentLocker] Could not parse HSL string: '${computedHSLStringRaw}' from var ${hslVarName}. Defaulting light color.`);
          setPointLightColor('hsl(0, 0%, 100%)'); // Default to white
        }
      } else {
        console.warn(`[EquipmentLocker] HSL variable ${hslVarName} not found. Defaulting light color.`);
        setPointLightColor('hsl(0, 0%, 100%)'); // Default to white
      }
    }
  }, [currentGlobalTheme, themeVersion]); // Re-run when theme or its version changes

  const carouselItemsData = useMemo(() => {
    if (typeof playerInventory !== 'object' || playerInventory === null || typeof getItemById !== 'function') {
      return [];
    }
    const inventoryItems = Object.values(playerInventory) as { id: string; quantity: number }[];
    return inventoryItems
      .filter(item => item.quantity > 0)
      .map(item => getItemById(item.id))
      .filter((item): item is GameItemBase => !!item);
  }, [playerInventory, getItemById]);

  const { dynamicCarouselRadius, dynamicCameraZ } = useMemo(() => {
    const numItems = carouselItemsData.length;
    let radius = 0;
    if (numItems === 1) {
      radius = 0;
    } else if (numItems === 2) {
      radius = MIN_RADIUS_FOR_TWO_ITEMS;
    } else if (numItems > 2) {
      // Calculate circumference based on number of items, item width, and spacing
      const circumference = numItems * (ITEM_WIDTH + CARD_SPACING_FACTOR);
      radius = Math.max(MIN_RADIUS_FOR_TWO_ITEMS, circumference / (2 * Math.PI));
    }
    const cameraZ = Math.max(MIN_CAMERA_Z, radius + CAMERA_DISTANCE_FROM_FRONT_CARD);
    return { dynamicCarouselRadius: radius, dynamicCameraZ: cameraZ };
  }, [carouselItemsData.length]);

  const handleItemClick3D = useCallback((item: GameItemBase, mesh: THREE.Mesh) => {
    console.log(`[EquipmentLockerSection] handleItemClick3D triggered for item: ${item.name}`);
    const itemLevelForColor = item.level || 1;
    const itemColorCssVar = ITEM_LEVEL_COLORS_CSS_VARS[itemLevelForColor as ItemLevel] || 'var(--level-1-color)';

    openTODWindow(
      item.title || item.name,
      <div className="font-rajdhani p-4 text-center">
        <h3 className="text-xl font-bold mb-2" style={{color: itemColorCssVar }}>{item.title || item.name}</h3>
        <div className="w-32 h-32 mx-auto my-2 rounded bg-black/30 flex items-center justify-center">
          <img
            src={item.imageSrc || fallbackImageSrc}
            alt={item.title || item.name}
            className="max-w-full max-h-full object-contain"
            data-ai-hint={item.dataAiHint || "item icon"}
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              if (target.src !== fallbackImageSrc) {
                target.src = fallbackImageSrc;
                target.onerror = null;
              }
            }}
          />
        </div>
        <p className="text-muted-foreground mb-1 text-sm">{item.description}</p>
        <p className="text-xs text-muted-foreground/80">Cost: {item.cost} ELINT</p>
        {item.strength && <p className="text-xs text-muted-foreground/80">Strength: {item.strength.current}/{item.strength.max}</p>}
        {item.resistance && <p className="text-xs text-muted-foreground/80">Resistance: {item.resistance.current}/{item.resistance.max}</p>}
        <HolographicButton onClick={closeTODWindow} className="mt-4" explicitTheme={currentGlobalTheme}>Close</HolographicButton>
      </div>,
      {
        showCloseButton: true,
        explicitTheme: currentGlobalTheme,
        themeVersion: themeVersion,
      }
    );
  }, [openTODWindow, closeTODWindow, currentGlobalTheme, themeVersion]);

  return (
    <div className="flex flex-col items-center justify-center p-4 md:p-6 h-full max-w-4xl mx-auto">
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
          {carouselItemsData.length > 0 ? (
            <Canvas
              id="locker-carousel-canvas"
              camera={{ position: [0, 0.5, dynamicCameraZ], fov: 60 }}
              shadows
              gl={{ antialias: true, alpha: true, preserveDrawingBuffer: false }}
              style={{ background: 'transparent', pointerEvents: 'auto' }} // Crucially ensure pointerEvents: 'auto'
              onCreated={({ gl: canvasGl }) => {
                canvasGl.setClearColor(0x000000, 0); // Transparent background
                console.log("[Canvas] Created");
              }}
            >
              <ambientLight intensity={1.5} />
              <directionalLight position={[5, 5, 5]} intensity={1} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
              <pointLight position={[-5, -5, -10]} intensity={0.5} color={pointLightColor} />
              <pointLight position={[0, 10, 0]} intensity={0.3} />
              <EquipmentCarousel
                itemsData={carouselItemsData}
                onItemClick={handleItemClick3D}
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
            {carouselItemsData.length > 0 ? "Drag to rotate. Click item for details." : ""}
          </p>
      </HolographicPanel>
    </div>
  );
}
