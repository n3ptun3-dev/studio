
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
import { SHOP_CATEGORIES as APP_SHOP_CATEGORIES, getItemById as getBaseItemDefinitionById } from '@/lib/game-items';
import { ShoppingCart, ArrowLeft } from 'lucide-react';


const ITEM_WIDTH = 1;
const ITEM_HEIGHT = 1.7;
const ROTATION_SPEED = 0.0035;
const CLICK_DRAG_THRESHOLD_SQUARED = 10 * 10;
const CLICK_DURATION_THRESHOLD = 250;
const AUTO_ROTATE_RESUME_DELAY = 3000;

// Constants for dynamic radius and camera calculations
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

export interface DisplayItem {
  id: string;
  baseItem: GameItemBase | null;
  title: string;
  quantityInStack: number;
  imageSrc: string;
  colorVar: string;
  levelForVisuals: ItemLevel;
  instanceCurrentStrength?: number;
  instanceMaxStrength?: number;
  instanceCurrentCharges?: number;
  instanceMaxCharges?: number;
  instanceCurrentUses?: number;
  instanceMaxUses?: number;
  instanceCurrentAlerts?: number;
  instanceMaxAlerts?: number;
  aggregateCurrentStrength?: number;
  aggregateMaxStrength?: number;
  aggregateCurrentCharges?: number;
  aggregateMaxCharges?: number;
  aggregateCurrentUses?: number;
  aggregateMaxUses?: number;
  aggregateCurrentAlerts?: number;
  aggregateMaxAlerts?: number;
  stackType: 'category' | 'itemType' | 'itemLevel' | 'individual';
  itemCategory?: ItemCategory;
  itemBaseName?: string;
  originalPlayerInventoryItemId?: string;
  itemLevel?: ItemLevel;
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
  let currentVal = 0;
  let maxVal = 0;
  let progressBarLabel: string | undefined = undefined;

  if (displayItem.stackType === 'individual' || displayItem.stackType === 'itemLevel') {
    const itemToQuery = displayItem.baseItem;
    if (itemToQuery) {
      currentVal = displayItem.instanceCurrentStrength ?? itemToQuery.strength?.current ?? itemToQuery.strength?.max ?? 0;
      maxVal = displayItem.instanceMaxStrength ?? itemToQuery.strength?.max ?? 100;
      progressBarLabel = "Strength";

      if (itemToQuery.category === 'Lock Fortifiers' && itemToQuery.type === 'Rechargeable') {
        currentVal = displayItem.instanceCurrentCharges ?? (itemToQuery as any).currentCharges ?? (itemToQuery as any).maxCharges ?? 0;
        maxVal = displayItem.instanceMaxCharges ?? (itemToQuery as any).maxCharges ?? 100;
        progressBarLabel = "Charges";
      } else if (itemToQuery.category === 'Infiltration Gear' && (itemToQuery.type === 'Rechargeable' || itemToQuery.type === 'Consumable')) {
        currentVal = displayItem.instanceCurrentUses ?? (itemToQuery as any).currentUses ?? (itemToQuery as any).maxUses ?? 0;
        maxVal = displayItem.instanceMaxUses ?? (itemToQuery as any).maxUses ?? ((itemToQuery.type === 'Consumable' || itemToQuery.type === 'One-Time Use') ? 1 : 100);
        progressBarLabel = "Uses";
      } else if (itemToQuery.category === 'Nexus Upgrades' && itemToQuery.name === 'Security Camera') {
        currentVal = displayItem.instanceCurrentAlerts ?? (itemToQuery as any).currentAlerts ?? (itemToQuery as any).maxAlerts ?? 0;
        maxVal = displayItem.instanceMaxAlerts ?? (itemToQuery as any).maxAlerts ?? levelForVisuals;
        progressBarLabel = "Alerts";
      } else if (itemToQuery.category === 'Nexus Upgrades' && (itemToQuery.name === 'Emergency Repair System (ERS)' || itemToQuery.name === 'Emergency Power Cell (EPC)')) {
          currentVal = displayItem.instanceCurrentStrength ?? itemToQuery.strength?.current ?? itemToQuery.strength?.max ?? 0;
          maxVal = displayItem.instanceMaxStrength ?? itemToQuery.strength?.max ?? 100;
          progressBarLabel = "Strength";
      }
    }
  } else if (displayItem.stackType === 'category' || displayItem.stackType === 'itemType') {
    currentVal = displayItem.aggregateCurrentStrength ?? 0;
    maxVal = displayItem.aggregateMaxStrength ?? (quantityInStack > 0 ? quantityInStack * 100 : 100);
    progressBarLabel = "Integrity";
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
}

const EquipmentCarousel = React.memo(function EquipmentCarousel(props: EquipmentCarouselProps) {
  const { itemsToDisplay, onItemClick, carouselRadius, autoRotateRef, isDraggingRef } = props;
  const group = useRef<THREE.Group>(null!);
  const { gl, camera, raycaster, scene, invalidate, events } = useThree();
  const appContext = useAppContext();
  const autoRotateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
        if (pointerEvent.button !== 0) return;
        clientX = pointerEvent.clientX;
        clientY = pointerEvent.clientY;
        activePointerId = pointerEvent.pointerId;
        try { canvasElement.setPointerCapture(pointerEvent.pointerId); } catch (e) { /* ignore */ }
      }

      isDraggingRef.current = true;
      autoRotateRef.current = false;
      if (autoRotateTimeoutRef.current) clearTimeout(autoRotateTimeoutRef.current);
      appContext.setIsScrollLockActive(true);
      accumulatedDeltaX = 0;
      pointerDownTime = performance.now();
      pointerDownCoords = { x: clientX, y: clientY };
      canvasElement.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';

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
      accumulatedDeltaX += Math.abs(deltaX);

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
      if (autoRotateTimeoutRef.current) clearTimeout(autoRotateTimeoutRef.current);
      if (!appContext.isTODWindowOpen) {
         autoRotateTimeoutRef.current = setTimeout(() => {
            if (!isDraggingRef.current && !appContext.isTODWindowOpen) {
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
      if (autoRotateTimeoutRef.current) clearTimeout(autoRotateTimeoutRef.current);
      if (isDraggingRef.current) {
        document.body.style.userSelect = '';
        appContext.setIsScrollLockActive(false);
        if (canvasElement.style.cursor === 'grabbing') canvasElement.style.cursor = 'grab';
        if (activePointerId !== null) {
          try { canvasElement.releasePointerCapture(activePointerId); } catch (e) { /* ignore */ }
          activePointerId = null;
        }
      }
    };
  }, [gl, onItemClick, camera, raycaster, scene, invalidate, events, appContext.setIsScrollLockActive, appContext.isTODWindowOpen, itemsToDisplay.length, autoRotateRef, isDraggingRef]);


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
    isTODWindowOpen,
    todWindowTitle,
  } = appContext;

  const { theme: currentGlobalTheme, themeVersion } = useTheme();
  const [pointLightColor, setPointLightColor] = useState<THREE.ColorRepresentation>('hsl(0, 0%, 100%)');
  const sectionRef = useRef<HTMLDivElement>(null);

  const [expandedStackPath, setExpandedStackPath] = useState<string[]>([]);
  const autoRotateRef = useRef(true);
  const isDraggingRef = useRef(false);
  const [todOpenedByLocker, setTodOpenedByLocker] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      let hslVarName = '--accent-hsl';
      if (currentGlobalTheme === 'cyphers' || currentGlobalTheme === 'shadows') {
        hslVarName = '--primary-hsl';
      }
      const computedHSLStringRaw = getComputedStyle(document.documentElement).getPropertyValue(hslVarName).trim();
      if (computedHSLStringRaw) {
        const parts = computedHSLStringRaw.match(/(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?/);
        if (parts && parts.length === 4) {
          const h = parseFloat(parts[1]);
          const s = parseFloat(parts[2]);
          const l = parseFloat(parts[3]);
          const colorStringForThree = `hsl(${h}, ${s}%, ${l}%)`;
          setPointLightColor(colorStringForThree);
        } else {
           const fallbackParts = computedHSLStringRaw.match(/(\d+)\s+(\d+)%?\s+(\d+)%?/);
            if (fallbackParts && fallbackParts.length === 4) {
                 const h = parseFloat(fallbackParts[1]);
                 const s = parseFloat(fallbackParts[2]);
                 const l = parseFloat(fallbackParts[3]);
                 const colorStringForThree = `hsl(${h}, ${s}%, ${l}%)`;
                 setPointLightColor(colorStringForThree);
            } else {
                setPointLightColor('hsl(0, 0%, 100%)');
            }
        }
      } else {
        setPointLightColor('hsl(0, 0%, 100%)');
      }
    }
  }, [currentGlobalTheme, themeVersion]);

  const inventoryEntries = useMemo(() => {
    if (typeof playerInventory !== 'object' || playerInventory === null || typeof getItemById !== 'function') {
      return [];
    }
    return Object.values(playerInventory).filter(deets => deets.quantity > 0);
  }, [playerInventory, getItemById]);


  const otherTopLevelItemsForPathLevel1 = useMemo((): DisplayItem[] => {
    const tempItems: DisplayItem[] = [];
    if (expandedStackPath.length !== 1) return tempItems;
    const categoryToExpand = expandedStackPath[0] as ItemCategory;

    const totalIndividualPhysicalItems = inventoryEntries.reduce((sum, item) => sum + item.quantity, 0);
    if (totalIndividualPhysicalItems <= INITIAL_CAROUSEL_TARGET_COUNT && totalIndividualPhysicalItems > 0) {
      inventoryEntries.forEach(invItemDetails => {
        const baseDef = getItemById(invItemDetails.id);
        if (baseDef && baseDef.category !== categoryToExpand) {
          tempItems.push({
            id: invItemDetails.id, baseItem: baseDef, title: baseDef.title || baseDef.name, quantityInStack: invItemDetails.quantity,
            imageSrc: baseDef.imageSrc || '/Spi vs Spi icon.png', colorVar: ITEM_LEVEL_COLORS_CSS_VARS[baseDef.level] || 'var(--level-1-color)',
            levelForVisuals: baseDef.level,
            instanceCurrentStrength: invItemDetails.currentStrength, instanceMaxStrength: baseDef.strength?.max,
            instanceCurrentCharges: invItemDetails.currentCharges, instanceMaxCharges: (baseDef as any).maxCharges,
            instanceCurrentUses: invItemDetails.currentUses, instanceMaxUses: (baseDef as any).maxUses,
            instanceCurrentAlerts: invItemDetails.currentAlerts, instanceMaxAlerts: (baseDef as any).maxAlerts,
            stackType: invItemDetails.quantity > 1 ? 'itemLevel' : 'individual', itemCategory: baseDef.category, itemBaseName: baseDef.name,
            itemLevel: baseDef.level, originalPlayerInventoryItemId: invItemDetails.id, dataAiHint: baseDef.dataAiHint,
          });
        }
      });
    } else if (totalIndividualPhysicalItems > 0) {
      APP_SHOP_CATEGORIES.slice(0, 6).forEach(catInfo => {
        if (catInfo.name !== categoryToExpand) {
          const itemsInThisCategory = inventoryEntries.filter(invDeets => getItemById(invDeets.id)?.category === catInfo.name);
          if (itemsInThisCategory.length > 0) {
            let highestLevel = 0 as ItemLevel; let representativeItemForCat: GameItemBase | null = null; let totalQuantityInCategory = 0;
            let aggCurrentStrength = 0; let aggMaxStrength = 0;
            itemsInThisCategory.forEach(invItem => { const baseDef = getItemById(invItem.id); if (baseDef) { totalQuantityInCategory += invItem.quantity; if (baseDef.level > highestLevel) { highestLevel = baseDef.level; representativeItemForCat = baseDef; } aggCurrentStrength += (invItem.currentStrength ?? baseDef.strength?.current ?? 0) * invItem.quantity; aggMaxStrength += (baseDef.strength?.max ?? 100) * invItem.quantity; } });
            if (representativeItemForCat) tempItems.push({ id: `${catInfo.name}-categoryStack`, baseItem: null, title: catInfo.name, quantityInStack: totalQuantityInCategory, imageSrc: representativeItemForCat.tileImageSrc || representativeItemForCat.imageSrc || '/Spi vs Spi icon.png', colorVar: ITEM_LEVEL_COLORS_CSS_VARS[highestLevel] || 'var(--level-1-color)', levelForVisuals: highestLevel, aggregateCurrentStrength: aggCurrentStrength, aggregateMaxStrength: aggMaxStrength, stackType: 'category', itemCategory: catInfo.name as ItemCategory, dataAiHint: representativeItemForCat.dataAiHint || catInfo.name.toLowerCase() });
          }
        }
      });
    }
    return tempItems;
  }, [inventoryEntries, getItemById, expandedStackPath]);

  const otherContextItemsForPathLevel2 = useMemo((): DisplayItem[] => {
    const tempItems: DisplayItem[] = [];
    if (expandedStackPath.length !== 2) return tempItems;
    const categoryName = expandedStackPath[0] as ItemCategory;
    const itemBaseNameToExpand = expandedStackPath[1];

    const totalIndividualPhysicalItems = inventoryEntries.reduce((sum, item) => sum + item.quantity, 0);
    if (totalIndividualPhysicalItems > INITIAL_CAROUSEL_TARGET_COUNT) {
      APP_SHOP_CATEGORIES.slice(0, 6).forEach(catInfo => {
        if (catInfo.name !== categoryName) {
          const itemsInThisCategory = inventoryEntries.filter(invDeets => getItemById(invDeets.id)?.category === catInfo.name);
          if (itemsInThisCategory.length > 0) {
            let highestLevel = 0 as ItemLevel; let representativeItemForCat: GameItemBase | null = null; let totalQuantityInCategory = 0;
            let aggCurrentStrength = 0; let aggMaxStrength = 0;
            itemsInThisCategory.forEach(invItem => { const baseDef = getItemById(invItem.id); if (baseDef) { totalQuantityInCategory += invItem.quantity; if (baseDef.level > highestLevel) { highestLevel = baseDef.level; representativeItemForCat = baseDef; } aggCurrentStrength += (invItem.currentStrength ?? baseDef.strength?.current ?? 0) * invItem.quantity; aggMaxStrength += (baseDef.strength?.max ?? 100) * invItem.quantity; } });
            if (representativeItemForCat) tempItems.push({ id: `${catInfo.name}-categoryStack`, baseItem: null, title: catInfo.name, quantityInStack: totalQuantityInCategory, imageSrc: representativeItemForCat.tileImageSrc || representativeItemForCat.imageSrc || '/Spi vs Spi icon.png', colorVar: ITEM_LEVEL_COLORS_CSS_VARS[highestLevel] || 'var(--level-1-color)', levelForVisuals: highestLevel, aggregateCurrentStrength: aggCurrentStrength, aggregateMaxStrength: aggMaxStrength, stackType: 'category', itemCategory: catInfo.name as ItemCategory, dataAiHint: representativeItemForCat.dataAiHint || catInfo.name.toLowerCase() });
          }
        }
      });
    }

    const itemsInExpandedCategory = inventoryEntries.filter(invDeets => getItemById(invDeets.id)?.category === categoryName);
    const groupedByItemBaseName: Record<string, PlayerInventoryItem[]> = {};
    itemsInExpandedCategory.forEach(invItemDetails => { const baseDef = getItemById(invItemDetails.id); if (baseDef) { if (!groupedByItemBaseName[baseDef.name]) groupedByItemBaseName[baseDef.name] = []; groupedByItemBaseName[baseDef.name].push(invItemDetails); } });
    Object.entries(groupedByItemBaseName).forEach(([baseName, invItemsForType]) => {
      if (baseName !== itemBaseNameToExpand) {
        let highestLevel = 0 as ItemLevel; let representativeItem: GameItemBase | null = null; let totalQuantity = 0;
        let aggCurrentStrength = 0; let aggMaxStrength = 0;
        invItemsForType.forEach(invItem => { const baseDef = getItemById(invItem.id); if (baseDef) { totalQuantity += invItem.quantity; if (baseDef.level > highestLevel) { highestLevel = baseDef.level; representativeItem = baseDef; } aggCurrentStrength += (invItem.currentStrength ?? baseDef.strength?.current ?? 0) * invItem.quantity; aggMaxStrength += (baseDef.strength?.max ?? 100) * invItem.quantity; } });
        if (representativeItem) tempItems.push({ id: `${categoryName}-${baseName}-itemTypeStack`, baseItem: null, title: baseName, quantityInStack: totalQuantity, imageSrc: representativeItem.imageSrc || '/Spi vs Spi icon.png', colorVar: ITEM_LEVEL_COLORS_CSS_VARS[highestLevel] || 'var(--level-1-color)', levelForVisuals: highestLevel, aggregateCurrentStrength: aggCurrentStrength, aggregateMaxStrength: aggMaxStrength, stackType: 'itemType', itemCategory: categoryName, itemBaseName: baseName, dataAiHint: representativeItem.dataAiHint });
      }
    });
    return tempItems;
  }, [inventoryEntries, getItemById, expandedStackPath]);

  const otherContextItemsForPathLevel3 = useMemo((): DisplayItem[] => {
    const tempItems: DisplayItem[] = [];
    if (expandedStackPath.length !== 3) return tempItems;
    const categoryName = expandedStackPath[0] as ItemCategory;
    const itemBaseName = expandedStackPath[1];
    const itemLevelIdToExpand = expandedStackPath[2];

    const totalIndividualPhysicalItems = inventoryEntries.reduce((sum, item) => sum + item.quantity, 0);
    if (totalIndividualPhysicalItems > INITIAL_CAROUSEL_TARGET_COUNT) {
      APP_SHOP_CATEGORIES.slice(0, 6).forEach(catInfo => {
        if (catInfo.name !== categoryName) {
          const itemsInThisCategory = inventoryEntries.filter(invDeets => getItemById(invDeets.id)?.category === catInfo.name);
          if (itemsInThisCategory.length > 0) {
            let highestLevel = 0 as ItemLevel; let representativeItemForCat: GameItemBase | null = null; let totalQuantityInCategory = 0;
            let aggCurrentStrength = 0; let aggMaxStrength = 0;
            itemsInThisCategory.forEach(invItem => { const baseDef = getItemById(invItem.id); if (baseDef) { totalQuantityInCategory += invItem.quantity; if (baseDef.level > highestLevel) { highestLevel = baseDef.level; representativeItemForCat = baseDef; } aggCurrentStrength += (invItem.currentStrength ?? baseDef.strength?.current ?? 0) * invItem.quantity; aggMaxStrength += (baseDef.strength?.max ?? 100) * invItem.quantity; } });
            if (representativeItemForCat) tempItems.push({ id: `${catInfo.name}-categoryStack`, baseItem: null, title: catInfo.name, quantityInStack: totalQuantityInCategory, imageSrc: representativeItemForCat.tileImageSrc || representativeItemForCat.imageSrc || '/Spi vs Spi icon.png', colorVar: ITEM_LEVEL_COLORS_CSS_VARS[highestLevel] || 'var(--level-1-color)', levelForVisuals: highestLevel, aggregateCurrentStrength: aggCurrentStrength, aggregateMaxStrength: aggMaxStrength, stackType: 'category', itemCategory: catInfo.name as ItemCategory, dataAiHint: representativeItemForCat.dataAiHint || catInfo.name.toLowerCase() });
          }
        }
      });
    }
    
    const itemsInExpandedCategory = inventoryEntries.filter(invDeets => getItemById(invDeets.id)?.category === categoryName);
    const groupedByItemBaseName: Record<string, PlayerInventoryItem[]> = {};
    itemsInExpandedCategory.forEach(invItemDetails => { const baseDef = getItemById(invItemDetails.id); if (baseDef) { if (!groupedByItemBaseName[baseDef.name]) groupedByItemBaseName[baseDef.name] = []; groupedByItemBaseName[baseDef.name].push(invItemDetails); } });
    Object.entries(groupedByItemBaseName).forEach(([baseNameFromGroup, invItemsForType]) => {
      if (baseNameFromGroup !== itemBaseName) {
        let highestLevel = 0 as ItemLevel; let representativeItem: GameItemBase | null = null; let totalQuantity = 0;
        let aggCurrentStrength = 0; let aggMaxStrength = 0;
        invItemsForType.forEach(invItem => { const baseDef = getItemById(invItem.id); if (baseDef) { totalQuantity += invItem.quantity; if (baseDef.level > highestLevel) { highestLevel = baseDef.level; representativeItem = baseDef; } aggCurrentStrength += (invItem.currentStrength ?? baseDef.strength?.current ?? 0) * invItem.quantity; aggMaxStrength += (baseDef.strength?.max ?? 100) * invItem.quantity; } });
        if (representativeItem) tempItems.push({ id: `${categoryName}-${baseNameFromGroup}-itemTypeStack`, baseItem: null, title: baseNameFromGroup, quantityInStack: totalQuantity, imageSrc: representativeItem.imageSrc || '/Spi vs Spi icon.png', colorVar: ITEM_LEVEL_COLORS_CSS_VARS[highestLevel] || 'var(--level-1-color)', levelForVisuals: highestLevel, aggregateCurrentStrength: aggCurrentStrength, aggregateMaxStrength: aggMaxStrength, stackType: 'itemType', itemCategory: categoryName, itemBaseName: baseNameFromGroup, dataAiHint: representativeItem.dataAiHint });
      } else {
        invItemsForType.forEach(invItem => {
          const baseDef = getItemById(invItem.id);
          if (baseDef && invItem.id !== itemLevelIdToExpand) {
            tempItems.push({
              id: invItem.id, baseItem: baseDef, title: baseDef.title || baseDef.name, quantityInStack: invItem.quantity,
              imageSrc: baseDef.imageSrc || '/Spi vs Spi icon.png', colorVar: ITEM_LEVEL_COLORS_CSS_VARS[baseDef.level] || 'var(--level-1-color)',
              levelForVisuals: baseDef.level,
              instanceCurrentStrength: invItem.currentStrength, instanceMaxStrength: baseDef.strength?.max,
              instanceCurrentCharges: invItem.currentCharges, instanceMaxCharges: (baseDef as any).maxCharges,
              instanceCurrentUses: invItem.currentUses, instanceMaxUses: (baseDef as any).maxUses,
              instanceCurrentAlerts: invItem.currentAlerts, instanceMaxAlerts: (baseDef as any).maxAlerts,
              stackType: invItem.quantity > 1 ? 'itemLevel' : 'individual', itemCategory: categoryName, itemBaseName: baseNameFromGroup,
              itemLevel: baseDef.level, originalPlayerInventoryItemId: invItem.id, dataAiHint: baseDef.dataAiHint,
            });
          }
        });
      }
    });
    return tempItems;
  }, [inventoryEntries, getItemById, expandedStackPath]);


  const carouselDisplayItems = useMemo((): DisplayItem[] => {
    const itemsToDisplay: DisplayItem[] = [];
    const currentPathLevel = expandedStackPath.length;

    if (currentPathLevel === 0) { // Initial View: Smart or Category Stacks
      const totalIndividualPhysicalItems = inventoryEntries.reduce((sum, item) => sum + item.quantity, 0);

      if (totalIndividualPhysicalItems <= INITIAL_CAROUSEL_TARGET_COUNT && totalIndividualPhysicalItems > 0) {
        inventoryEntries.forEach(invItemDetails => {
          const baseDef = getItemById(invItemDetails.id);
          if (baseDef) {
            for (let i = 0; i < invItemDetails.quantity; i++) { // Create one card per quantity for this view
              itemsToDisplay.push({
                id: `${invItemDetails.id}-instance-${i}`,
                baseItem: baseDef,
                title: baseDef.title || baseDef.name,
                quantityInStack: 1, // Each card is an individual instance
                imageSrc: baseDef.imageSrc || '/Spi vs Spi icon.png',
                colorVar: ITEM_LEVEL_COLORS_CSS_VARS[baseDef.level] || 'var(--level-1-color)',
                levelForVisuals: baseDef.level,
                instanceCurrentStrength: invItemDetails.currentStrength, instanceMaxStrength: baseDef.strength?.max,
                instanceCurrentCharges: invItemDetails.currentCharges, instanceMaxCharges: (baseDef as any).maxCharges,
                instanceCurrentUses: invItemDetails.currentUses, instanceMaxUses: (baseDef as any).maxUses,
                instanceCurrentAlerts: invItemDetails.currentAlerts, instanceMaxAlerts: (baseDef as any).maxAlerts,
                stackType: 'individual',
                itemCategory: baseDef.category,
                itemBaseName: baseDef.name,
                itemLevel: baseDef.level,
                originalPlayerInventoryItemId: invItemDetails.id,
                dataAiHint: baseDef.dataAiHint,
              });
            }
          }
        });
      } else if (totalIndividualPhysicalItems > 0) {
        APP_SHOP_CATEGORIES.slice(0, 6).forEach(catInfo => {
          const itemsInThisCategory = inventoryEntries.filter(invDeets => getItemById(invDeets.id)?.category === catInfo.name);
          if (itemsInThisCategory.length > 0) {
            let highestLevel = 0 as ItemLevel; let representativeItemForCat: GameItemBase | null = null; let totalQuantityInCategory = 0;
            let aggCurrentStrength = 0; let aggMaxStrength = 0;
            itemsInThisCategory.forEach(invItem => { const baseDef = getItemById(invItem.id); if (baseDef) { totalQuantityInCategory += invItem.quantity; if (baseDef.level > highestLevel) { highestLevel = baseDef.level; representativeItemForCat = baseDef; } aggCurrentStrength += (invItem.currentStrength ?? baseDef.strength?.current ?? 0) * invItem.quantity; aggMaxStrength += (baseDef.strength?.max ?? 100) * invItem.quantity; } });
            if (representativeItemForCat) itemsToDisplay.push({ id: `${catInfo.name}-categoryStack`, baseItem: null, title: catInfo.name, quantityInStack: totalQuantityInCategory, imageSrc: representativeItemForCat.tileImageSrc || representativeItemForCat.imageSrc || '/Spi vs Spi icon.png', colorVar: ITEM_LEVEL_COLORS_CSS_VARS[highestLevel] || 'var(--level-1-color)', levelForVisuals: highestLevel, aggregateCurrentStrength: aggCurrentStrength, aggregateMaxStrength: aggMaxStrength, stackType: 'category', itemCategory: catInfo.name as ItemCategory, dataAiHint: representativeItemForCat.dataAiHint || catInfo.name.toLowerCase() });
          }
        });
      }
    } else if (currentPathLevel === 1) { // Path: [categoryName] -> Show ItemType Stacks + other initial items
      const categoryToExpand = expandedStackPath[0] as ItemCategory;
      itemsToDisplay.push(...otherTopLevelItemsForPathLevel1);

      const itemsInCategory = inventoryEntries.filter(invDeets => getItemById(invDeets.id)?.category === categoryToExpand);
      const groupedByItemBaseName: Record<string, PlayerInventoryItem[]> = {};
      itemsInCategory.forEach(invItemDetails => { const baseDef = getItemById(invItemDetails.id); if (baseDef) { if (!groupedByItemBaseName[baseDef.name]) groupedByItemBaseName[baseDef.name] = []; groupedByItemBaseName[baseDef.name].push(invItemDetails); } });
      Object.entries(groupedByItemBaseName).forEach(([baseName, invItemsForType]) => {
        let highestLevel = 0 as ItemLevel; let representativeItem: GameItemBase | null = null; let totalQuantity = 0;
        let aggCurrentStrength = 0; let aggMaxStrength = 0;
        invItemsForType.forEach(invItem => { const baseDef = getItemById(invItem.id); if (baseDef) { totalQuantity += invItem.quantity; if (baseDef.level > highestLevel) { highestLevel = baseDef.level; representativeItem = baseDef; } aggCurrentStrength += (invItem.currentStrength ?? baseDef.strength?.current ?? 0) * invItem.quantity; aggMaxStrength += (baseDef.strength?.max ?? 100) * invItem.quantity; } });
        if (representativeItem) itemsToDisplay.push({ id: `${categoryToExpand}-${baseName}-itemTypeStack`, baseItem: null, title: baseName, quantityInStack: totalQuantity, imageSrc: representativeItem.imageSrc || '/Spi vs Spi icon.png', colorVar: ITEM_LEVEL_COLORS_CSS_VARS[highestLevel] || 'var(--level-1-color)', levelForVisuals: highestLevel, aggregateCurrentStrength: aggCurrentStrength, aggregateMaxStrength: aggMaxStrength, stackType: 'itemType', itemCategory: categoryToExpand, itemBaseName: baseName, dataAiHint: representativeItem.dataAiHint });
      });
    } else if (currentPathLevel === 2) { // Path: [categoryName, itemBaseName] -> Show ItemLevel Stacks + others
      const categoryName = expandedStackPath[0] as ItemCategory;
      const itemBaseNameToExpand = expandedStackPath[1];
      itemsToDisplay.push(...otherContextItemsForPathLevel2);

      inventoryEntries.forEach(invItemDetails => {
        const baseDef = getItemById(invItemDetails.id);
        if (baseDef && baseDef.category === categoryName && baseDef.name === itemBaseNameToExpand) {
          itemsToDisplay.push({
            id: invItemDetails.id, baseItem: baseDef, title: baseDef.title || baseDef.name, quantityInStack: invItemDetails.quantity,
            imageSrc: baseDef.imageSrc || '/Spi vs Spi icon.png', colorVar: ITEM_LEVEL_COLORS_CSS_VARS[baseDef.level] || 'var(--level-1-color)',
            levelForVisuals: baseDef.level,
            instanceCurrentStrength: invItemDetails.currentStrength, instanceMaxStrength: baseDef.strength?.max,
            instanceCurrentCharges: invItemDetails.currentCharges, instanceMaxCharges: (baseDef as any).maxCharges,
            instanceCurrentUses: invItemDetails.currentUses, instanceMaxUses: (baseDef as any).maxUses,
            instanceCurrentAlerts: invItemDetails.currentAlerts, instanceMaxAlerts: (baseDef as any).maxAlerts,
            stackType: invItemDetails.quantity > 1 ? 'itemLevel' : 'individual', itemCategory: categoryName, itemBaseName: itemBaseNameToExpand,
            itemLevel: baseDef.level, originalPlayerInventoryItemId: invItemDetails.id, dataAiHint: baseDef.dataAiHint,
          });
        }
      });
    } else if (currentPathLevel === 3) { // Path: [categoryName, itemBaseName, itemLevelId] -> Show Individuals + others
      const itemLevelIdToExpand = expandedStackPath[2];
      itemsToDisplay.push(...otherContextItemsForPathLevel3);

      const invItemToExpandDetails = playerInventory[itemLevelIdToExpand];
      const baseItemDefinition = getItemById(itemLevelIdToExpand);
      if (invItemToExpandDetails && baseItemDefinition) {
        for (let i = 0; i < invItemToExpandDetails.quantity; i++) {
          itemsToDisplay.push({
            id: `${itemLevelIdToExpand}-instance-${i}`,
            baseItem: baseItemDefinition,
            title: baseItemDefinition.title || baseItemDefinition.name,
            quantityInStack: 1,
            imageSrc: baseItemDefinition.imageSrc || '/Spi vs Spi icon.png',
            colorVar: ITEM_LEVEL_COLORS_CSS_VARS[baseItemDefinition.level] || 'var(--level-1-color)',
            levelForVisuals: baseItemDefinition.level,
            instanceCurrentStrength: invItemToExpandDetails.currentStrength, instanceMaxStrength: baseItemDefinition.strength?.max,
            instanceCurrentCharges: invItemToExpandDetails.currentCharges, instanceMaxCharges: (baseItemDefinition as any).maxCharges,
            instanceCurrentUses: invItemToExpandDetails.currentUses, instanceMaxUses: (baseItemDefinition as any).maxUses,
            instanceCurrentAlerts: invItemToExpandDetails.currentAlerts, instanceMaxAlerts: (baseItemDefinition as any).maxAlerts,
            stackType: 'individual',
            itemCategory: baseItemDefinition.category,
            itemBaseName: baseItemDefinition.name,
            itemLevel: baseItemDefinition.level,
            originalPlayerInventoryItemId: itemLevelIdToExpand,
            dataAiHint: baseItemDefinition.dataAiHint,
          });
        }
      }
    }
    return itemsToDisplay.sort((a,b) => (a.title.localeCompare(b.title))); // Keep sorted
  }, [
      playerInventory, 
      getItemById, 
      expandedStackPath, 
      inventoryEntries, 
      otherTopLevelItemsForPathLevel1, 
      otherContextItemsForPathLevel2, 
      otherContextItemsForPathLevel3
    ]);


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
    if (clickedDisplayItem.stackType === 'category' && clickedDisplayItem.itemCategory) {
      setExpandedStackPath([clickedDisplayItem.itemCategory]);
    } else if (clickedDisplayItem.stackType === 'itemType' && clickedDisplayItem.itemCategory && clickedDisplayItem.itemBaseName) {
      setExpandedStackPath([clickedDisplayItem.itemCategory, clickedDisplayItem.itemBaseName]);
    } else if (clickedDisplayItem.stackType === 'itemLevel' && clickedDisplayItem.originalPlayerInventoryItemId && clickedDisplayItem.quantityInStack > 1 && expandedStackPath.length === 2) {
      setExpandedStackPath([...expandedStackPath, clickedDisplayItem.originalPlayerInventoryItemId]);
    } else if (clickedDisplayItem.stackType === 'individual' || (clickedDisplayItem.stackType === 'itemLevel' && clickedDisplayItem.quantityInStack === 1)) {
      if (clickedDisplayItem.baseItem) {
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
        setTodOpenedByLocker(true);
        autoRotateRef.current = false;
      }
    }
  }, [openTODWindow, closeTODWindow, currentGlobalTheme, themeVersion, expandedStackPath, setTodOpenedByLocker, autoRotateRef]);

  const handleBackClick = () => {
    setExpandedStackPath(prev => prev.slice(0, -1));
  };

  useEffect(() => {
    if (!isTODWindowOpen && todOpenedByLocker) {
      const resumeTimeout = setTimeout(() => {
        if (!isDraggingRef.current && !appContext.isTODWindowOpen) { // Double check state
            autoRotateRef.current = true;
        }
      }, AUTO_ROTATE_RESUME_DELAY);
      setTodOpenedByLocker(false);
      return () => clearTimeout(resumeTimeout);
    }
  }, [isTODWindowOpen, todOpenedByLocker, autoRotateRef, appContext.isTODWindowOpen]);


  useEffect(() => {
    const currentSectionRef = sectionRef.current;
    if (!currentSectionRef) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting && expandedStackPath.length > 0) {
          setExpandedStackPath([]);
          if (!isTODWindowOpen) { // Only resume if TOD window isn't open
            autoRotateRef.current = true;
          }
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(currentSectionRef);
    return () => {
      if (currentSectionRef) observer.unobserve(currentSectionRef);
    };
  }, [expandedStackPath, isTODWindowOpen]);


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
            <div className="w-9 h-9"></div>
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
              style={{ background: 'transparent' }}
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
                autoRotateRef={autoRotateRef}
                isDraggingRef={isDraggingRef}
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
