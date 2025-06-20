// src/components/game/tod/EquipmentLockerSection.tsx

"use client";

import React, { useRef, useState, useEffect, useCallback, useLayoutEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import CardTextureRenderer from './CardTextureRenderer'; // Import the new renderer
import * as THREE from 'three';
import { useAppContext, type GameItemBase, type ItemLevel, type ItemCategory, type PlayerInventoryItem } from '@/contexts/AppContext';
import { HolographicButton, HolographicPanel } from '@/components/game/shared/HolographicPanel';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { ITEM_LEVEL_COLORS_CSS_VARS } from '@/lib/constants';
import { SHOP_CATEGORIES as APP_SHOP_CATEGORIES, getItemById as getBaseItemByIdFromGameItems } from '@/lib/game-items';
import { ShoppingCart, ArrowLeft } from 'lucide-react';

// Carousel Constants
const ITEM_WIDTH = 1.2; // Width of the 3D plane for each card
const ITEM_HEIGHT = 1.9; // Height of the 3D plane for each card
const ROTATION_SPEED = 0.0035;
const CLICK_DRAG_THRESHOLD_SQUARED = 10 * 10; // Pixels squared
const CLICK_DURATION_THRESHOLD = 250; // Milliseconds
const AUTO_ROTATE_RESUME_DELAY = 3000; // Milliseconds

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
  stackType: 'category' | 'itemType' | 'itemLevel' | 'individual';
  itemCategory?: ItemCategory;
  itemBaseName?: string;
  itemLevel?: ItemLevel;
  originalPlayerInventoryItemId?: string;
  dataAiHint?: string;
  path: string[];
}

interface CarouselItemProps {
  displayItem: DisplayItem;
  index: number;
  totalItems: number;
  carouselRadius: number;
}

const CarouselItem = React.memo(function CarouselItem({ displayItem, index, totalItems, carouselRadius }: CarouselItemProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);
  const { gl } = useThree(); // For renderer capabilities if needed for anisotropy

  // Destructure only what's needed for CardTextureRenderer or mesh positioning/logic
  // const { baseItem, quantityInStack, title, imageSrc, colorVar: itemColorCssVar, levelForVisuals } = displayItem;

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

  const handleCanvasRendered = useCallback((newCanvas: HTMLCanvasElement) => {
    const newTexture = new THREE.CanvasTexture(newCanvas);
    // Optional: Configure texture (encoding, anisotropy)
    // newTexture.encoding = THREE.sRGBEncoding; // If using WebGLRenderer with sRGB output
    // newTexture.anisotropy = gl.capabilities.getMaxAnisotropy();

    setTexture(currentTexture => {
      currentTexture?.dispose(); // Dispose the previous texture if it exists
      return newTexture; // Set the new texture
    });
  }, [gl.capabilities]); // Dependency on gl.capabilities for anisotropy

  useEffect(() => {
    // This effect is primarily for unmounting.
    // Texture updates are handled by handleCanvasRendered which disposes of the old texture.
    return () => {
      if (texture) {
        texture.dispose();
      }
    };
  }, [texture]); // Runs when texture state changes or on unmount.

  // CardTextureRenderer is rendered but its output is captured by html2canvas,
  // it does not need to be visible in the main DOM layout.
  // Its own styling should handle off-screen rendering.
  return (
    <>
      <CardTextureRenderer
        displayItem={displayItem}
        onRendered={handleCanvasRendered}
        outputWidth={256} // Example width
        outputHeight={427} // Example height (maintaining aspect ratio of 1.2/1.9 for 256 width would be ~405, using provided 427)
      />
      <mesh ref={meshRef} userData={{ displayItem, isCarouselItem: true, id: displayItem.id }}>
        <planeGeometry args={[ITEM_WIDTH, ITEM_HEIGHT]} />
        <meshBasicMaterial map={texture} transparent={true} />
      </mesh>
    </>
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
  const { gl, camera, raycaster, scene, invalidate, events } = useThree();
  const appContext = useAppContext();

  useEffect(() => {
    const canvasElement = gl?.domElement;
    if (!canvasElement) return;
    if (canvasElement.style.pointerEvents !== 'auto') canvasElement.style.pointerEvents = 'auto';

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
        try { (event.target as HTMLElement)?.setPointerCapture?.(pointerEvent.pointerId); } catch (e) { /* ignore */ }
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
      if (!isDraggingRef.current && (event.type === 'pointerup' && activePointerId === null) && !(event.type.startsWith('touch'))) return;

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
        try { (event.target as HTMLElement)?.releasePointerCapture?.(activePointerId); } catch (e) { /* ignore */ }
      }
      activePointerId = null;

      const wasSignificantDrag = accumulatedDeltaX > Math.sqrt(CLICK_DRAG_THRESHOLD_SQUARED);
      const wasQuickEnoughForClick = dragDuration < CLICK_DURATION_THRESHOLD;
      let clickedItemViaRaycast: DisplayItem | null = null;
      let clickedMeshViaRaycast: THREE.Mesh | null = null;

      if (!wasSignificantDrag && wasQuickEnoughForClick) {
        const rect = canvasElement.getBoundingClientRect();
        const pointerVector = new THREE.Vector2(
          ((clickClientX - rect.left) / rect.width) * 2 - 1,
          -((clickClientY - rect.top) / rect.height) * 2 + 1
        );
        raycaster.setFromCamera(pointerVector, camera);
        const intersects = raycaster.intersectObjects(group.current?.children || [], true);

        if (intersects.length > 0) {
          for (const intersect of intersects) {
            let obj: THREE.Object3D | null = intersect.object;
            while (obj && !(obj.userData?.isCarouselItem)) {
              obj = obj.parent;
            }
            if (obj?.userData?.isCarouselItem && obj instanceof THREE.Mesh) {
              clickedMeshViaRaycast = obj;
              clickedItemViaRaycast = obj.userData.displayItem;
              break;
            }
          }
        }
      }
      
      isDraggingRef.current = false;
      appContext.setIsScrollLockActive(false);

      if (clickedItemViaRaycast && clickedMeshViaRaycast) {
        onItemClick(clickedItemViaRaycast, clickedMeshViaRaycast);
      } else {
        if (autoRotateTimeoutRef.current) clearTimeout(autoRotateTimeoutRef.current);
        if (!appContext.isTODWindowOpen) {
          autoRotateTimeoutRef.current = setTimeout(() => {
            if (!isDraggingRef.current && !appContext.isTODWindowOpen) {
              autoRotateRef.current = true;
            }
          }, AUTO_ROTATE_RESUME_DELAY);
        }
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
      if (isDraggingRef.current) {
        document.body.style.userSelect = '';
        appContext.setIsScrollLockActive(false);
        if(canvasElement.style.cursor === 'grabbing') canvasElement.style.cursor = 'grab';
        if (activePointerId !== null) {
            try { canvasElement.releasePointerCapture(activePointerId); } catch(e) {/*ignore*/}
            activePointerId = null;
        }
      }
    };
  }, [gl, onItemClick, camera, raycaster, scene, invalidate, events, appContext.setIsScrollLockActive, appContext.isTODWindowOpen, autoRotateRef, isDraggingRef, autoRotateTimeoutRef, itemsToDisplay.length]);

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
    // Get the container element once after component mounts.
    containerRef.current = document.getElementById('locker-carousel-canvas-container') as HTMLDivElement;
    const container = containerRef.current;

    if (!container) {
      // console.warn("[Resizer] Canvas container 'locker-carousel-canvas-container' not found on mount.");
      return;
    }

    const handleResize = () => {
      if (containerRef.current) { // Check if ref is still valid
        const width = containerRef.current.offsetWidth;
        const height = containerRef.current.offsetHeight;
        if (width > 0 && height > 0) {
          gl.setSize(width, height);
          if (camera instanceof THREE.PerspectiveCamera) {
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
          }
          // console.log(`[Resizer] Resized canvas to: ${width}x${height}, aspect: ${camera.aspect}`);
        }
      }
    };

    handleResize(); // Initial size set

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      if (containerRef.current) { // Check if ref is still valid before unobserving
        resizeObserver.unobserve(containerRef.current);
      }
    };
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
    getItemById,
    openSpyShop,
    isTODWindowOpen,
    playerSpyName
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
          setPointLightColor(`hsl(${h}, ${s}%, ${l}%)`);
        } else {
          setPointLightColor('hsl(0, 0%, 100%)');
        }
      } else {
        setPointLightColor('hsl(0, 0%, 100%)');
      }
    }
  }, [currentGlobalTheme, themeVersion]);

  const aggregatePlayerItems = useCallback(() => {
    const currentPathLevel = expandedStackPath.length;
    const inventoryArray = Object.entries(playerInventory)
      .map(([key, val]) => ({ invKey: key, invDetails: val, baseDef: getItemById(val.id) }))
      .filter(item => item.baseDef && item.invDetails.quantity > 0) as Array<{ invKey: string; invDetails: PlayerInventoryItem; baseDef: GameItemBase }>;

    const createIndividualDisplayItem = (invItemDetails: PlayerInventoryItem, baseDef: GameItemBase, path: string[], instanceIndex: number): DisplayItem => ({
      id: `${invItemDetails.id}_instance_${instanceIndex}_${path.join('_')}`,
      baseItem: baseDef,
      title: baseDef.title || baseDef.name,
      quantityInStack: 1,
      imageSrc: baseDef.tileImageSrc || baseDef.imageSrc || '/Spi vs Spi icon.png',
      colorVar: ITEM_LEVEL_COLORS_CSS_VARS[baseDef.level] || 'var(--level-1-color)',
      levelForVisuals: baseDef.level,
      instanceCurrentStrength: invItemDetails.currentStrength,
      instanceMaxStrength: baseDef.strength?.max,
      instanceCurrentCharges: invItemDetails.currentCharges,
      instanceMaxCharges: (baseDef as any).maxCharges,
      instanceCurrentUses: invItemDetails.currentUses,
      instanceMaxUses: (baseDef as any).maxUses,
      instanceCurrentAlerts: invItemDetails.currentAlerts,
      instanceMaxAlerts: (baseDef as any).maxAlerts,
      stackType: 'individual',
      itemCategory: baseDef.category,
      itemBaseName: baseDef.name,
      itemLevel: baseDef.level,
      originalPlayerInventoryItemId: invItemDetails.id,
      dataAiHint: baseDef.dataAiHint,
      path: path,
    });

    const createAggregatedStack = (items: Array<{ invKey: string; invDetails: PlayerInventoryItem; baseDef: GameItemBase }>, stackIdPrefix: string, stackTitle: string, stackType: 'category' | 'itemType' | 'itemLevel', path: string[], itemCategoryForStack?: ItemCategory, itemBaseNameForStack?: string): DisplayItem | null => {
      if (items.length === 0) return null;
      let highestLevelItem = items[0].baseDef;
      let totalQuantity = 0;
      let aggCurrentStrength = 0, aggMaxStrength = 0;
      let aggCurrentCharges = 0, aggMaxCharges = 0;

      items.forEach(item => {
        totalQuantity += item.invDetails.quantity;
        if (item.baseDef.level > highestLevelItem.level) highestLevelItem = item.baseDef;
        aggCurrentStrength += (item.invDetails.currentStrength ?? item.baseDef.strength?.current ?? item.baseDef.strength?.max ?? 0) * item.invDetails.quantity;
        aggMaxStrength += (item.baseDef.strength?.max ?? 100) * item.invDetails.quantity;
        aggCurrentCharges += (item.invDetails.currentCharges ?? (item.baseDef as any).currentCharges ?? (item.baseDef as any).maxCharges ?? 0) * item.invDetails.quantity;
        aggMaxCharges += ((item.baseDef as any).maxCharges ?? 100) * item.invDetails.quantity;
      });

      const uniqueIdPart = path.join('_') || stackTitle.replace(/\s+/g, '_');
      return {
        id: `${stackIdPrefix}_${uniqueIdPart}`,
        baseItem: stackType === 'itemLevel' ? highestLevelItem : null,
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
        dataAiHint: highestLevelItem.dataAiHint || stackTitle.toLowerCase().split(' ').slice(0,2).join(' '),
        path: path,
      };
    };

    let focusedItems: DisplayItem[] = [];
    let contextualItems: DisplayItem[] = [];

    if (currentPathLevel === 0) {
      const totalIndividualPhysicalItems = inventoryArray.reduce((sum, item) => sum + item.invDetails.quantity, 0);
      if (totalIndividualPhysicalItems <= INITIAL_CAROUSEL_TARGET_COUNT && totalIndividualPhysicalItems > 0) {
        const itemLevelStacksMap: Record<string, Array<{ invKey: string; invDetails: PlayerInventoryItem; baseDef: GameItemBase }>> = {};
        inventoryArray.forEach(item => {
          if (!itemLevelStacksMap[item.invDetails.id]) itemLevelStacksMap[item.invDetails.id] = [];
          itemLevelStacksMap[item.invDetails.id].push(item);
        });
        Object.values(itemLevelStacksMap).forEach(itemsOfSameId => {
          if (itemsOfSameId.length > 0) {
            const first = itemsOfSameId[0];
            if (first.invDetails.quantity > 1) {
              const stack = createAggregatedStack(itemsOfSameId, 'itemLevel', first.baseDef.title || first.baseDef.name, 'itemLevel', [first.baseDef.category, first.baseDef.name, first.invDetails.id], first.baseDef.category, first.baseDef.name);
              if (stack) focusedItems.push(stack);
            } else {
              focusedItems.push(createIndividualDisplayItem(first.invDetails, first.baseDef, [first.baseDef.category, first.baseDef.name, first.invDetails.id], 0));
            }
          }
        });
      } else if (inventoryArray.length > 0) {
        APP_SHOP_CATEGORIES.slice(0, 6).forEach(catInfo => {
          const itemsInThisCategory = inventoryArray.filter(item => item.baseDef.category === catInfo.name);
          if (itemsInThisCategory.length > 0) {
            const stack = createAggregatedStack(itemsInThisCategory, 'category', catInfo.name, 'category', [catInfo.name as ItemCategory], catInfo.name as ItemCategory);
            if (stack) focusedItems.push(stack);
          }
        });
      }
    } else if (currentPathLevel === 1) {
      const categoryToExpand = expandedStackPath[0] as ItemCategory;
      const itemsInExpandedCategory = inventoryArray.filter(item => item.baseDef.category === categoryToExpand);
      const groupedByBaseName: Record<string, typeof inventoryArray> = {};
      itemsInExpandedCategory.forEach(item => {
        if (!groupedByBaseName[item.baseDef.name]) groupedByBaseName[item.baseDef.name] = [];
        groupedByBaseName[item.baseDef.name].push(item);
      });
      Object.entries(groupedByBaseName).forEach(([baseName, items]) => {
        const stack = createAggregatedStack(items, 'itemType', baseName, 'itemType', [categoryToExpand, baseName], categoryToExpand, baseName);
        if (stack) focusedItems.push(stack);
      });
      APP_SHOP_CATEGORIES.slice(0, 6).forEach(catInfo => {
        if (catInfo.name !== categoryToExpand) {
          const itemsInThisCategory = inventoryArray.filter(item => item.baseDef.category === catInfo.name);
          if (itemsInThisCategory.length > 0) {
            const stack = createAggregatedStack(itemsInThisCategory, 'category', catInfo.name, 'category', [catInfo.name as ItemCategory], catInfo.name as ItemCategory);
            if (stack) contextualItems.push(stack);
          }
        }
      });
    } else if (currentPathLevel === 2) {
      const categoryContext = expandedStackPath[0] as ItemCategory;
      const itemTypeToExpand = expandedStackPath[1];
      const itemsOfExpandedType = inventoryArray.filter(item => item.baseDef.category === categoryContext && item.baseDef.name === itemTypeToExpand);
      itemsOfExpandedType.forEach(item => {
        if (item.invDetails.quantity > 1) {
          const stack = createAggregatedStack([item], 'itemLevel', item.baseDef.title || item.baseDef.name, 'itemLevel', [categoryContext, itemTypeToExpand, item.invDetails.id], categoryContext, itemTypeToExpand);
          if (stack) focusedItems.push(stack);
        } else {
          focusedItems.push(createIndividualDisplayItem(item.invDetails, item.baseDef, [categoryContext, itemTypeToExpand, item.invDetails.id], 0));
        }
      });
      const otherItemTypesInCategory = inventoryArray.filter(item => item.baseDef.category === categoryContext && item.baseDef.name !== itemTypeToExpand);
      const groupedOtherItemTypes: Record<string, typeof inventoryArray> = {};
      otherItemTypesInCategory.forEach(item => {
        if(!groupedOtherItemTypes[item.baseDef.name]) groupedOtherItemTypes[item.baseDef.name] = [];
        groupedOtherItemTypes[item.baseDef.name].push(item);
      });
      Object.entries(groupedOtherItemTypes).forEach(([baseName, items]) => {
        const stack = createAggregatedStack(items, 'itemType', baseName, 'itemType', [categoryContext, baseName], categoryContext, baseName);
        if (stack) contextualItems.push(stack);
      });
      APP_SHOP_CATEGORIES.slice(0, 6).forEach(catInfo => {
        if (catInfo.name !== categoryContext) {
          const itemsInThisCategory = inventoryArray.filter(item => item.baseDef.category === catInfo.name);
          if (itemsInThisCategory.length > 0) {
            const stack = createAggregatedStack(itemsInThisCategory, 'category', catInfo.name, 'category', [catInfo.name as ItemCategory], catInfo.name as ItemCategory);
            if (stack) contextualItems.push(stack);
          }
        }
      });
    } else if (currentPathLevel === 3) {
      const categoryContext = expandedStackPath[0] as ItemCategory;
      const itemTypeContext = expandedStackPath[1];
      const itemLevelIdToExpand = expandedStackPath[2];
      const itemToExpandDetails = inventoryArray.find(item => item.invDetails.id === itemLevelIdToExpand);
      if (itemToExpandDetails) {
        for (let i = 0; i < itemToExpandDetails.invDetails.quantity; i++) {
          focusedItems.push(createIndividualDisplayItem(itemToExpandDetails.invDetails, itemToExpandDetails.baseDef, [...expandedStackPath], i));
        }
      }
      const otherItemLevelsInType = inventoryArray.filter(item => item.baseDef.category === categoryContext && item.baseDef.name === itemTypeContext && item.invDetails.id !== itemLevelIdToExpand);
      otherItemLevelsInType.forEach(item => {
        if (item.invDetails.quantity > 1) {
          const stack = createAggregatedStack([item], 'itemLevel', item.baseDef.title || item.baseDef.name, 'itemLevel', [categoryContext, itemTypeContext, item.invDetails.id], categoryContext, itemTypeContext);
          if (stack) contextualItems.push(stack);
        } else {
          contextualItems.push(createIndividualDisplayItem(item.invDetails, item.baseDef, [categoryContext, itemTypeContext, item.invDetails.id], 0));
        }
      });
      const otherItemTypesInCategory = inventoryArray.filter(item => item.baseDef.category === categoryContext && item.baseDef.name !== itemTypeContext);
      const groupedOtherItemTypes: Record<string, typeof inventoryArray> = {};
      otherItemTypesInCategory.forEach(item => {
        if(!groupedOtherItemTypes[item.baseDef.name]) groupedOtherItemTypes[item.baseDef.name] = [];
        groupedOtherItemTypes[item.baseDef.name].push(item);
      });
      Object.entries(groupedOtherItemTypes).forEach(([baseName, items]) => {
        const stack = createAggregatedStack(items, 'itemType', baseName, 'itemType', [categoryContext, baseName], categoryContext, baseName);
        if (stack) contextualItems.push(stack);
      });
      APP_SHOP_CATEGORIES.slice(0, 6).forEach(catInfo => {
        if (catInfo.name !== categoryContext) {
          const itemsInThisCategory = inventoryArray.filter(item => item.baseDef.category === catInfo.name);
          if (itemsInThisCategory.length > 0) {
            const stack = createAggregatedStack(itemsInThisCategory, 'category', catInfo.name, 'category', [catInfo.name as ItemCategory], catInfo.name as ItemCategory);
            if (stack) contextualItems.push(stack);
          }
        }
      });
    }

    const combined = [...focusedItems, ...contextualItems];
    return combined.sort((a, b) => {
        const typeOrderValue = (type: DisplayItem['stackType']) => ({ 'category': 0, 'itemType': 1, 'itemLevel': 2, 'individual': 3 }[type]);
        if (typeOrderValue(a.stackType) !== typeOrderValue(b.stackType)) {
            return typeOrderValue(a.stackType) - typeOrderValue(b.stackType);
        }
        return a.title.localeCompare(b.title);
    });

  }, [playerInventory, getItemById, expandedStackPath]);

  const carouselDisplayItems = useMemo(aggregatePlayerItems, [aggregatePlayerItems]);

  const { dynamicCarouselRadius, dynamicCameraZ } = useMemo(() => {
    const numItems = carouselDisplayItems.length;
    let radius = 0;
    if (numItems === 0) radius = 0;
    else if (numItems === 1) radius = 0;
    else if (numItems === 2) radius = MIN_RADIUS_FOR_TWO_ITEMS;
    else if (numItems > 2) {
      const circumference = numItems * (ITEM_WIDTH + CARD_SPACING_FACTOR);
      radius = Math.max(MIN_RADIUS_FOR_TWO_ITEMS, circumference / (2 * Math.PI));
    }
    const cameraZ = Math.max(MIN_CAMERA_Z, radius + CAMERA_DISTANCE_FROM_FRONT_CARD);
    return { dynamicCarouselRadius: radius, dynamicCameraZ: cameraZ };
  }, [carouselDisplayItems.length]);

  const handleCarouselItemClick = useCallback((clickedDisplayItem: DisplayItem, mesh: THREE.Mesh) => {
    if (clickedDisplayItem.stackType === 'individual') {
      todOpenedByLockerRef.current = true;
      autoRotateRef.current = false;
      if (autoRotateTimeoutRef.current) clearTimeout(autoRotateTimeoutRef.current);
      openTODWindow(
        clickedDisplayItem.baseItem?.title || clickedDisplayItem.baseItem?.name || "Item Details",
        <div className="font-rajdhani p-4 text-center">
          <h3 className="text-xl font-bold mb-2" style={{ color: clickedDisplayItem.colorVar }}>{clickedDisplayItem.title}</h3>
          <div className="w-32 h-32 mx-auto my-2 rounded bg-black/30 flex items-center justify-center">
            <img
              src={clickedDisplayItem.imageSrc} alt={clickedDisplayItem.title} className="max-w-full max-h-full object-contain"
              data-ai-hint={clickedDisplayItem.dataAiHint || "item icon"}
              onError={(e) => { (e.target as HTMLImageElement).src = '/Spi vs Spi icon.png'; }}
            />
          </div>
          <p className="text-muted-foreground mb-1 text-sm">{clickedDisplayItem.baseItem?.description}</p>
          <p className="text-xs text-muted-foreground/80">Cost: {clickedDisplayItem.baseItem?.cost} ELINT</p>
          <HolographicButton onClick={closeTODWindow} className="mt-4" explicitTheme={currentGlobalTheme}>Close</HolographicButton>
        </div>,
        { showCloseButton: true, explicitTheme: currentGlobalTheme, themeVersion }
      );
    } else {
      setExpandedStackPath(clickedDisplayItem.path);
      // Do NOT stop auto-rotation when a stack is clicked
    }
  }, [openTODWindow, closeTODWindow, currentGlobalTheme, themeVersion, setExpandedStackPath, todOpenedByLockerRef, autoRotateRef, autoRotateTimeoutRef]);

  const handleBackClick = () => {
    setExpandedStackPath(prev => prev.slice(0, -1));
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
      todOpenedByLockerRef.current = false;
    }
  }, [isTODWindowOpen, appContext.isTODWindowOpen]);

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
  }, [expandedStackPath, appContext.isTODWindowOpen]);

  const currentStackTitle = useMemo(() => {
    if (expandedStackPath.length === 0) return playerSpyName ? `${playerSpyName}'s Locker` : "Equipment Locker";
    const lastPathSegment = expandedStackPath[expandedStackPath.length - 1];
    const itemDef = getItemById(lastPathSegment) || getBaseItemByIdFromGameItems(lastPathSegment);
    if (itemDef) return itemDef.title || itemDef.name;
    return lastPathSegment.replace(/_/g, ' ').replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }, [expandedStackPath, getItemById, playerSpyName]);

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
          id="locker-carousel-canvas-container" // Ensure this ID is present for Resizer
          className="w-full flex-grow min-h-0 relative"
          style={{ cursor: 'grab', touchAction: 'none' }}
        >
          {carouselDisplayItems.length > 0 ? (
            <Canvas
              id="locker-carousel-canvas"
              camera={{
                position: [0, 0, dynamicCameraZ], // Use dynamic Z
                fov: 45, // Reduced FOV
              }}
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
          {carouselDisplayItems.length > 0 ? (expandedStackPath.length > 0 ? "Click item for details or stack to navigate. Drag to rotate." : "Drag to rotate. Click stack to expand or item for details.") : ""}
        </p>
      </HolographicPanel>
    </div>
  );
}

