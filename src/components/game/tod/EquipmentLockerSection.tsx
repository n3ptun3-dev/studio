
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

const itemWidth = 1;
const itemHeight = 1.8;
const carouselRadius = 3.5;
const rotationSpeed = 0.0035;
const CLICK_DRAG_THRESHOLD_SQUARED = 10 * 10; 
const CLICK_DURATION_THRESHOLD = 250; 

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

function CarouselItem({ itemData, index, totalItems, carouselRadius }: CarouselItemProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const fallbackImageSrc = '/Spi vs Spi icon.png'; 
  const actualImageSrc = itemData.imageSrc || fallbackImageSrc;

  const angle = (index / totalItems) * Math.PI * 2;
  const x = carouselRadius * Math.sin(angle);
  const z = carouselRadius * Math.cos(angle);

  useLayoutEffect(() => {
    if (meshRef.current) {
      meshRef.current.position.set(x, 0, z);
      meshRef.current.lookAt(new THREE.Vector3(0, 0, 0));
      meshRef.current.rotation.y += Math.PI;
      meshRef.current.userData = { itemData, isCarouselItem: true, id: itemData.id };
    }
  }, [x, z, itemData]);

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
        const currentCharges = itemData.currentCharges ?? strengthCurrent;
        const maxCharges = itemData.maxCharges ?? strengthMax;
        detailContent = <CardProgressBar label="Recharges" current={currentCharges} max={maxCharges} colorVar={itemColorCssVar} />;
      } else {
        detailContent = <p className="text-[9px] text-center font-semibold p-0.5 rounded bg-black/30 mt-auto mx-1" style={{color: itemColorCssVar}}>Single Use</p>;
      }
      break;
    case 'Nexus Upgrades':
      if (itemData.name === 'Security Camera') {
        const currentAlerts = itemData.currentAlerts ?? itemData.level; 
        const maxAlerts = itemData.maxAlerts ?? itemData.level;
        detailContent = <CardProgressBar label="Alerts" current={currentAlerts} max={maxAlerts} colorVar={itemColorCssVar} />;
      } else if (itemData.name === 'Emergency Repair System (ERS)') {
        detailContent = <CardProgressBar label="ERS Strength" current={strengthCurrent} max={strengthMax} colorVar={itemColorCssVar} />;
      } else if (itemData.name === 'Emergency Power Cell (EPC)') {
        detailContent = <CardProgressBar label="EPC Strength" current={strengthCurrent} max={strengthMax} colorVar={itemColorCssVar} />;
      } else if (itemData.name?.includes('Reinforced Foundation')) {
         detailContent = <p className="text-[9px] text-center font-semibold p-0.5 rounded bg-black/30 mt-auto mx-1" style={{color: itemColorCssVar}}>Permanent</p>;
      }
      break;
    case 'Infiltration Gear':
      if (itemData.name === 'Pick' && itemData.level === 1) {
        detailContent = <p className="text-[9px] text-center font-semibold p-0.5 rounded bg-black/30 mt-auto mx-1" style={{color: itemColorCssVar}}>Basic Tool</p>;
      } else if (itemData.type === 'Rechargeable') {
        const currentUses = itemData.currentUses ?? strengthCurrent;
        const maxUses = itemData.maxUses ?? strengthMax;
        detailContent = <CardProgressBar label="Uses Left" current={currentUses} max={maxUses} colorVar={itemColorCssVar} />;
      } else if (itemData.type === 'One-Time Use' || itemData.type === 'Consumable') {
        detailContent = <p className="text-[9px] text-center font-semibold p-0.5 rounded bg-black/30 mt-auto mx-1" style={{color: itemColorCssVar}}>Single Use</p>;
      }
      break;
    case 'Assault Tech':
      detailContent = <p className="text-[9px] text-center font-semibold p-0.5 rounded bg-black/30 mt-auto mx-1" style={{color: itemColorCssVar}}>Single Use</p>;
      break;
    default:
      if (itemData.strength) {
        detailContent = <CardProgressBar label="Status" current={strengthCurrent} max={strengthMax} colorVar={itemColorCssVar} />;
      }
  }
  
  return (
    <mesh ref={meshRef} userData={{ itemData, isCarouselItem: true, id: itemData.id }}>
      <planeGeometry args={[itemWidth, itemHeight]} />
      <meshBasicMaterial transparent opacity={0} />
      <Html
        center
        transform
        prepend
        occlude="blending"
        style={{ pointerEvents: 'none', width: `${itemWidth * 100}px`, height: `${itemHeight * 100}px` }}
      >
        <div
          className={cn(
            "w-full h-full rounded-lg border-2 flex flex-col items-center justify-start overflow-hidden",
            cardBgClass
          )}
          style={{
            borderColor: itemColorCssVar,
            fontFamily: 'var(--font-rajdhani)',
            color: `hsl(var(--foreground-hsl))`,
            boxShadow: `0 0 8px ${itemColorCssVar}`,
          }}
        >
          <div className="w-full h-3/5 relative flex-shrink-0 bg-black/20">
            <img
              src={actualImageSrc}
              alt={itemData.title || itemData.name}
              className="w-full h-full object-contain"
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
            <p className="text-[10px] font-semibold text-center leading-tight mb-0.5 truncate" style={{ color: itemColorCssVar }}>
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
}
CarouselItem.displayName = 'CarouselItem';

interface EquipmentCarouselProps {
  itemsData: GameItemBase[];
  onItemClick: (item: GameItemBase, mesh: THREE.Mesh) => void;
}

const EquipmentCarousel = React.memo(function EquipmentCarousel({ itemsData, onItemClick }: EquipmentCarouselProps) {
  const group = useRef<THREE.Group>(null!);
  const { gl, camera, raycaster, scene, invalidate } = useThree();
  const appContext = useAppContext();

  const isDraggingRef = useRef(false);
  const autoRotateRef = useRef(true);
  const previousPointerXRef = useRef(0);
  const pointerDownTimeRef = useRef(0);
  const pointerDownCoords = useRef({ x: 0, y: 0 });
  const groupRotationYRef = useRef(group.current ? group.current.rotation.y : 0);
  const accumulatedDeltaXRef = useRef(0);
  const activePointerIdRef = useRef<number | null>(null);

  const handlePointerDownInternal = useCallback((event: PointerEvent | TouchEvent) => {
    console.log("[Carousel] Drag Start. Event type:", event.type);
    if (event.type === 'touchstart' && event.cancelable) {
        event.preventDefault();
    }

    let clientX = 0, clientY = 0;

    if ('touches' in event) {
        clientX = (event as TouchEvent).touches[0].clientX;
        clientY = (event as TouchEvent).touches[0].clientY;
    } else {
        if ((event as PointerEvent).button !== 0) return;
        clientX = (event as PointerEvent).clientX;
        clientY = (event as PointerEvent).clientY;
        activePointerIdRef.current = (event as PointerEvent).pointerId;
        gl?.domElement?.setPointerCapture(activePointerIdRef.current);
    }

    isDraggingRef.current = true;
    autoRotateRef.current = false;
    appContext.setIsScrollLockActive(true);
    previousPointerXRef.current = clientX;
    pointerDownCoords.current = { x: clientX, y: clientY };
    accumulatedDeltaXRef.current = 0;
    pointerDownTimeRef.current = performance.now();
    if(gl?.domElement) gl.domElement.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';

    window.addEventListener('pointermove', handlePointerMoveInternal);
    window.addEventListener('pointerup', handlePointerUpInternal);
    window.addEventListener('touchmove', handlePointerMoveInternal, { passive: false });
    window.addEventListener('touchend', handlePointerUpInternal);
  }, [gl, appContext.setIsScrollLockActive, invalidate]);

  const handlePointerMoveInternal = useCallback((event: PointerEvent | TouchEvent) => {
    if (!isDraggingRef.current) return;
    if (event.type === 'touchmove' && event.cancelable) {
      event.preventDefault();
    }

    let currentX = 0;
    if ('touches' in event) {
        currentX = (event as TouchEvent).touches[0].clientX;
    } else {
        if (activePointerIdRef.current !== null && (event as PointerEvent).pointerId !== activePointerIdRef.current) return;
        currentX = (event as PointerEvent).clientX;
    }

    const deltaX = currentX - previousPointerXRef.current;
    groupRotationYRef.current += deltaX * 0.005;
    accumulatedDeltaXRef.current += Math.abs(deltaX);
    previousPointerXRef.current = currentX;
    console.log(`[Carousel] Drag Move - DeltaX: ${deltaX.toFixed(2)}, New RotationY: ${groupRotationYRef.current.toFixed(2)}`);
    invalidate();
  }, [invalidate]);

  const handlePointerUpInternal = useCallback((event: PointerEvent | TouchEvent) => {
    console.log("[Carousel] Drag End. Event type:", event.type);
    if (!isDraggingRef.current && (event.type === 'pointerup' && activePointerIdRef.current === null)) return;
    if (event.type === 'pointerup' && activePointerIdRef.current !== null && (event as PointerEvent).pointerId !== activePointerIdRef.current) return;

    const dragDuration = performance.now() - pointerDownTimeRef.current;
    let currentX = 0, currentY = 0;

    if ('changedTouches' in event && (event as TouchEvent).changedTouches.length > 0) {
        currentX = (event as TouchEvent).changedTouches[0].clientX;
        currentY = (event as TouchEvent).changedTouches[0].clientY;
    } else if ('clientX' in event) {
        currentX = (event as PointerEvent).clientX;
        currentY = (event as PointerEvent).clientY;
    }
    
    if(gl?.domElement) gl.domElement.style.cursor = 'grab';
    document.body.style.userSelect = '';

    if (event.type === 'pointerup' && activePointerIdRef.current !== null) {
        gl?.domElement?.releasePointerCapture(activePointerIdRef.current);
    }
    activePointerIdRef.current = null;
    
    const wasActuallyDragging = accumulatedDeltaXRef.current > Math.sqrt(CLICK_DRAG_THRESHOLD_SQUARED);
    isDraggingRef.current = false;
    appContext.setIsScrollLockActive(false);

    if (!wasActuallyDragging && dragDuration < CLICK_DURATION_THRESHOLD) {
        const rect = gl.domElement.getBoundingClientRect();
        const clickPointer = new THREE.Vector2();
        clickPointer.x = ((currentX - rect.left) / rect.width) * 2 - 1;
        clickPointer.y = -((currentY - rect.top) / rect.height) * 2 + 1;
        console.log(`[Carousel] Click detected. Canvas Coords: (${clickPointer.x.toFixed(2)}, ${clickPointer.y.toFixed(2)})`);

        raycaster.setFromCamera(clickPointer, camera);
        const intersects = raycaster.intersectObjects(group.current?.children || [], true);
        console.log(`[Carousel] Raycaster INTERSECTED count: ${intersects.length}`);

        if (intersects.length > 0) {
            let clickedMesh = intersects[0].object as THREE.Mesh;
            while (clickedMesh.parent && clickedMesh.parent !== scene && !clickedMesh.userData?.isCarouselItem) {
                clickedMesh = clickedMesh.parent as THREE.Mesh;
            }
            if (clickedMesh.userData?.isCarouselItem && clickedMesh.userData.itemData && clickedMesh instanceof THREE.Mesh) {
                console.log(`[Carousel] Clicked Item: ${clickedMesh.userData.itemData?.name || 'Unknown'}`);
                onItemClick(clickedMesh.userData.itemData, clickedMesh);
            } else {
                console.log("[Carousel] Clicked, but no valid item data found on mesh or parents.");
            }
        } else {
            console.log("[Carousel] Clicked, but raycaster found no intersections with carousel items.");
        }
    }
    
    setTimeout(() => {
        if (!isDraggingRef.current) autoRotateRef.current = true;
    }, 500);

    window.removeEventListener('pointermove', handlePointerMoveInternal);
    window.removeEventListener('pointerup', handlePointerUpInternal);
    window.removeEventListener('touchmove', handlePointerMoveInternal);
    window.removeEventListener('touchend', handlePointerUpInternal);
  }, [gl, appContext.setIsScrollLockActive, camera, raycaster, onItemClick, scene, invalidate]);

  useEffect(() => {
    const domElement = gl?.domElement;
    console.log("[Carousel] Main Effect: Attempting to attach event listeners. Canvas DOM element:", domElement);
    if (!domElement) {
        console.log("[Carousel] Main Effect: Canvas DOM element not available for listeners.");
        return;
    }
    
    console.log("[Carousel] Main Effect: Attaching 'pointerdown' and 'touchstart' listeners to canvas.");
    domElement.addEventListener('pointerdown', handlePointerDownInternal);
    domElement.addEventListener('touchstart', handlePointerDownInternal, { passive: false });

    return () => {
        console.log("[Carousel] Main Effect: Cleaning up 'pointerdown' and 'touchstart' listeners from canvas.");
        domElement.removeEventListener('pointerdown', handlePointerDownInternal);
        domElement.removeEventListener('touchstart', handlePointerDownInternal);
        
        window.removeEventListener('pointermove', handlePointerMoveInternal);
        window.removeEventListener('pointerup', handlePointerUpInternal);
        window.removeEventListener('touchmove', handlePointerMoveInternal);
        window.removeEventListener('touchend', handlePointerUpInternal);
        
        if (isDraggingRef.current) {
            document.body.style.userSelect = '';
            appContext.setIsScrollLockActive(false);
            if (domElement.style.cursor === 'grabbing') domElement.style.cursor = 'grab';
            if (activePointerIdRef.current !== null) {
                 domElement.releasePointerCapture(activePointerIdRef.current);
                 activePointerIdRef.current = null;
            }
        }
    };
  }, [gl, handlePointerDownInternal, handlePointerMoveInternal, handlePointerUpInternal, appContext.setIsScrollLockActive]);

  useFrame((state, delta) => {
    if (group.current) {
      if (autoRotateRef.current && !isDraggingRef.current) {
        groupRotationYRef.current += rotationSpeed * delta * 60;
      }
      group.current.rotation.y = groupRotationYRef.current;
    }
  });

  return (
    <group ref={group} rotation={[0, groupRotationYRef.current, 0]}>
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

const Resizer = React.memo(() => {
  const { camera, gl } = useThree();
  const container = useMemo(() => typeof document !== 'undefined' ? document.getElementById('locker-carousel-canvas-container') : null, []);

  useEffect(() => {
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
  }, [camera, gl, container]);
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
    openSpyShop
  } = appContext;

  const { theme: currentGlobalTheme, themeVersion } = useTheme();
  const [pointLightColor, setPointLightColor] = useState('hsl(0, 0%, 100%)'); // Default to white

  useEffect(() => {
    if (typeof window !== 'undefined') {
      let hslVar = '--accent-hsl'; // Default for terminal-green or others
      if (currentGlobalTheme === 'cyphers' || currentGlobalTheme === 'shadows') {
        hslVar = '--primary-hsl';
      }
      const computedHSL = getComputedStyle(document.documentElement).getPropertyValue(hslVar).trim();
      if (computedHSL) {
        setPointLightColor(`hsl(${computedHSL})`);
      }
    }
  }, [currentGlobalTheme, themeVersion]);


  const carouselItemsData = useMemo(() => {
    if (typeof playerInventory !== 'object' || playerInventory === null || typeof getItemById !== 'function') {
      return [];
    }
    const inventoryItems = Object.values(playerInventory) as { id: string; quantity: number }[];
    return inventoryItems
      .filter(item => item.quantity > 0)
      .map(item => getItemById(item.id))
      .filter((item): item is GameItemBase => item !== undefined && item !== null);
  }, [playerInventory, getItemById]);

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
              camera={{ position: [0, 0.5, carouselRadius * 2.25], fov: 60 }}
              shadows
              gl={{ antialias: true, alpha: true, preserveDrawingBuffer: false }}
              style={{ background: 'transparent', pointerEvents: 'auto' }}
              onCreated={({ gl: canvasGl }) => {
                canvasGl.setClearColor(0x000000, 0);
                console.log("[Canvas] Created");
              }}
            >
              <ambientLight intensity={1.5} />
              <directionalLight position={[5, 5, 5]} intensity={1} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
              <pointLight position={[-5, -5, -10]} intensity={0.5} color={pointLightColor} />
              <pointLight position={[0, 10, 0]} intensity={0.3} />
              <EquipmentCarousel itemsData={carouselItemsData} onItemClick={handleItemClick3D} />
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
