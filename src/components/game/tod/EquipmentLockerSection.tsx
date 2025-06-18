
// src/components/game/tod/EquipmentLockerSection.tsx
"use client";

import React, { useRef, useState, useEffect, useCallback, useLayoutEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useAppContext, type GameItemBase, type ItemLevel, type ItemCategory } from '@/contexts/AppContext';
import { HolographicButton } from '@/components/game/shared/HolographicPanel';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { ITEM_LEVEL_COLORS_CSS_VARS } from '@/lib/constants';
import { ShoppingCart } from 'lucide-react';

interface SectionProps {
  parallaxOffset: number;
}

const itemWidth = 1;
const itemHeight = 1.8;
const carouselRadius = 3.5;
const rotationSpeed = 0.0035; // Auto-rotation speed
const CLICK_DRAG_THRESHOLD = 10; // Pixels - increased threshold a bit
const CLICK_DURATION_THRESHOLD = 250; // Milliseconds - increased threshold a bit

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

const CardProgressBar: React.FC<{ current: number; max: number; label?: string; colorVar: string }> = ({ current, max, label, colorVar }) => {
  const percentage = max > 0 ? Math.min(100, Math.max(0, (current / max) * 100)) : 0;
  return (
    <div className="w-full text-xs mt-1 px-1">
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
};

interface CarouselItemProps {
  itemData: GameItemBase;
  index: number;
  totalItems: number;
  carouselRadius: number;
}

function CarouselItem({ itemData, index, totalItems, carouselRadius }: CarouselItemProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const fallbackImageSrc = '/Spi vs Spi icon.png'; // Ensure this path is correct in your public folder
  const actualImageSrc = itemData.imageSrc || fallbackImageSrc;

  const angle = (index / totalItems) * Math.PI * 2;
  const x = carouselRadius * Math.sin(angle);
  const z = carouselRadius * Math.cos(angle);

  useLayoutEffect(() => {
    if (meshRef.current) {
      meshRef.current.position.set(x, 0, z);
      meshRef.current.lookAt(new THREE.Vector3(0, 0, 0));
      meshRef.current.rotation.y += Math.PI; // Make them face outwards
      meshRef.current.userData = { itemData, isCarouselItem: true, id: itemData.id }; // Add id for debugging
    }
  }, [x, z, itemData]);

  const itemLevelForColor = itemData.level || 1;
  const itemColorCssVar = ITEM_LEVEL_COLORS_CSS_VARS[itemLevelForColor as ItemLevel] || 'var(--muted-color)';
  const cardBgClass = LEVEL_TO_BG_CLASS[itemLevelForColor as ItemLevel] || 'bg-muted/30';

  let detailContent = null;
  const strengthVal = itemData.strength?.current ?? 0;
  const maxStrengthVal = itemData.strength?.max ?? 100;

  switch (itemData.category) {
    case 'Hardware': // Locks
      detailContent = <CardProgressBar current={strengthVal} max={maxStrengthVal} label="Strength" colorVar={itemColorCssVar} />;
      break;
    case 'Lock Fortifiers':
      if (itemData.type === 'Rechargeable') {
        const currentCharges = itemData.currentCharges ?? itemData.strength?.current ?? 0;
        const maxCharges = itemData.maxCharges ?? itemData.strength?.max ?? 100;
        detailContent = <CardProgressBar current={currentCharges} max={maxCharges} label="Recharges" colorVar={itemColorCssVar} />;
      } else {
        detailContent = <p className="text-[9px] text-center font-semibold p-0.5 rounded bg-black/30 mt-1 mx-1" style={{color: itemColorCssVar}}>Single Use</p>;
      }
      break;
    case 'Nexus Upgrades':
      if (itemData.name === 'Security Camera') {
        const currentAlerts = itemData.currentAlerts ?? itemData.level;
        const maxAlerts = itemData.maxAlerts ?? itemData.level;
        detailContent = <CardProgressBar current={currentAlerts} max={maxAlerts} label="Alerts" colorVar={itemColorCssVar} />;
      } else if (itemData.name === 'Emergency Repair System (ERS)') {
        detailContent = <CardProgressBar current={strengthVal} max={maxStrengthVal} label="ERS Strength" colorVar={itemColorCssVar} />;
      } else if (itemData.name.includes('Reinforced Foundation')) {
        detailContent = <p className="text-[9px] text-center font-semibold p-0.5 rounded bg-black/30 mt-1 mx-1" style={{color: itemColorCssVar}}>Permanent</p>;
      } else if (itemData.name.includes('Emergency Power Cell (EPC)')) {
         detailContent = <CardProgressBar current={strengthVal} max={maxStrengthVal} label="EPC Strength" colorVar={itemColorCssVar} />;
      }
      break;
    case 'Infiltration Gear':
      if (itemData.name === 'Pick' && itemData.level === 1) {
        detailContent = <p className="text-[9px] text-center font-semibold p-0.5 rounded bg-black/30 mt-1 mx-1" style={{color: itemColorCssVar}}>Basic Tool</p>;
      } else if (itemData.type === 'Rechargeable') {
        const currentUses = itemData.currentUses ?? itemData.strength?.current ?? 0;
        const maxUses = itemData.maxUses ?? itemData.strength?.max ?? 100;
        detailContent = <CardProgressBar current={currentUses} max={maxUses} label="Uses Left" colorVar={itemColorCssVar} />;
      } else if (itemData.type === 'One-Time Use' || itemData.type === 'Consumable') {
        detailContent = <p className="text-[9px] text-center font-semibold p-0.5 rounded bg-black/30 mt-1 mx-1" style={{color: itemColorCssVar}}>Single Use</p>;
      }
      break;
    case 'Assault Tech':
      detailContent = <p className="text-[9px] text-center font-semibold p-0.5 rounded bg-black/30 mt-1 mx-1" style={{color: itemColorCssVar}}>Single Use</p>;
      break;
    case 'Aesthetic Schemes':
      // No specific detail content for schemes, just image and title
      break;
    default:
      if (itemData.strength) {
        detailContent = <CardProgressBar current={strengthVal} max={maxStrengthVal} label="Status" colorVar={itemColorCssVar} />;
      }
  }

  return (
    <mesh ref={meshRef} userData={{ itemData, isCarouselItem: true, id: itemData.id }}>
      <planeGeometry args={[itemWidth, itemHeight]} />
      <meshBasicMaterial transparent opacity={0} /> {/* Plane is invisible */}
      <Html
        center
        transform
        prepend
        occlude="blending" // occlude only if it helps with performance, can be demanding
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
          <div className="w-full h-3/5 relative flex-shrink-0 bg-black/10"> {/* Image container takes top part */}
            <img
              src={actualImageSrc} // Uses state that handles error
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
          <div className="w-full p-1.5 flex flex-col justify-between flex-grow min-h-0"> {/* Info area takes remaining space */}
            <p className="text-[10px] font-semibold text-center leading-tight mb-0.5 truncate" style={{ color: itemColorCssVar }}>
              {itemData.title || itemData.name} {/* Removed extra L{item.level} */}
            </p>
            <div className="w-full text-xs space-y-0.5 overflow-y-auto scrollbar-hide flex-grow">
              {detailContent}
            </div>
          </div>
        </div>
      </Html>
    </mesh>
  );
}


interface EquipmentCarouselProps {
  itemsData: GameItemBase[];
  onItemClick: (item: GameItemBase, mesh: THREE.Mesh) => void;
}

function EquipmentCarousel({ itemsData, onItemClick }: EquipmentCarouselProps) {
  const group = useRef<THREE.Group>(null!);
  const { camera, gl, raycaster, invalidate, scene } = useThree(); // Added scene
  const appContext = useAppContext();

  const isDraggingRef = useRef(false);
  const autoRotateRef = useRef(true);
  const previousPointerXRef = useRef(0);
  const pointerDownTimeRef = useRef(0);
  const groupRotationYRef = useRef(group.current ? group.current.rotation.y : 0);
  const accumulatedDeltaXRef = useRef(0);
  const pointerCoords = useRef(new THREE.Vector2());

  const handleDragStart = useCallback((event: PointerEvent | TouchEvent) => {
    console.log("[Carousel] Drag Start. Event type:", event.type);
    let currentX = 0;
    const isTouchEvent = 'touches' in event;

    if (isTouchEvent) {
      currentX = (event as TouchEvent).touches[0].clientX;
      if (event.cancelable) event.preventDefault();
    } else {
      if ((event as PointerEvent).button !== 0) return;
      currentX = (event as PointerEvent).clientX;
      (event.target as HTMLElement).setPointerCapture((event as PointerEvent).pointerId);
    }

    isDraggingRef.current = true;
    autoRotateRef.current = false;
    appContext.setIsScrollLockActive(true);
    previousPointerXRef.current = currentX;
    accumulatedDeltaXRef.current = 0;
    pointerDownTimeRef.current = performance.now();
    document.body.style.userSelect = 'none'; // Prevent text selection
    console.log("[Carousel] Drag Start - Initial X:", currentX, "Dragging:", isDraggingRef.current);

    if (isTouchEvent) {
      window.addEventListener('touchmove', handleDragMove, { passive: false });
      window.addEventListener('touchend', handleDragEnd, { passive: false });
    } else {
      window.addEventListener('pointermove', handleDragMove, { passive: false });
      window.addEventListener('pointerup', handleDragEnd, { passive: false });
    }
  }, [gl, appContext, invalidate]); // Removed handleDragMove, handleDragEnd from deps

  const handleDragMove = useCallback((event: PointerEvent | TouchEvent) => {
    if (!isDraggingRef.current) return;
    if (event.cancelable) event.preventDefault();

    let currentX = 0;
    if ('touches' in event) {
      currentX = (event as TouchEvent).touches[0].clientX;
    } else {
      currentX = (event as PointerEvent).clientX;
    }

    const deltaX = currentX - previousPointerXRef.current;
    groupRotationYRef.current += deltaX * 0.005; // Adjust sensitivity
    accumulatedDeltaXRef.current += Math.abs(deltaX);
    previousPointerXRef.current = currentX;
    // console.log("[Carousel] Drag Move - Delta X:", deltaX, "Accumulated:", accumulatedDeltaXRef.current);
    invalidate(); 
  }, [invalidate]);

  const handleDragEnd = useCallback((event: PointerEvent | TouchEvent) => {
    console.log("[Carousel] Drag End. Accumulated X:", accumulatedDeltaXRef.current, "Duration:", performance.now() - pointerDownTimeRef.current);
    document.body.style.userSelect = ''; // Re-enable text selection

    if ('pointerId' in event && (event.target as HTMLElement).releasePointerCapture) {
        (event.target as HTMLElement).releasePointerCapture((event as PointerEvent).pointerId);
    }
    
    const wasDragging = isDraggingRef.current; // Capture before reset
    isDraggingRef.current = false;
    appContext.setIsScrollLockActive(false);
    const dragDuration = performance.now() - pointerDownTimeRef.current;

    if (wasDragging && accumulatedDeltaXRef.current < CLICK_DRAG_THRESHOLD && dragDuration < CLICK_DURATION_THRESHOLD) {
      console.log("[Carousel] Click detected.");
      let clickX, clickY;
      const rect = gl.domElement.getBoundingClientRect();

      if ('changedTouches' in event && (event as TouchEvent).changedTouches.length > 0) {
        clickX = (event as TouchEvent).changedTouches[0].clientX;
        clickY = (event as TouchEvent).changedTouches[0].clientY;
      } else if ('clientX' in event) {
        clickX = (event as PointerEvent).clientX;
        clickY = (event as PointerEvent).clientY;
      } else {
        console.log("[Carousel] Click End: Not enough info for click detection from event.");
        return; 
      }
      
      pointerCoords.current.x = ((clickX - rect.left) / rect.width) * 2 - 1;
      pointerCoords.current.y = -((clickY - rect.top) / rect.height) * 2 + 1;
      console.log("[Carousel] Click Coords (NDC):", pointerCoords.current.x, pointerCoords.current.y);
      
      raycaster.setFromCamera(pointerCoords.current, camera);
      const intersects = raycaster.intersectObjects(group.current.children, true); // Intersect with children of the group
      console.log("[Carousel] Raycaster intersects:", intersects.length, intersects.map(i => i.object.userData?.id || i.object.name));


      if (intersects.length > 0) {
        let clickedMesh = intersects[0].object;
        // Traverse up to find the mesh with userData.isCarouselItem
        while (clickedMesh.parent && clickedMesh.parent !== scene && !clickedMesh.userData?.isCarouselItem) {
           clickedMesh = clickedMesh.parent as THREE.Mesh; // Cast needed, ensure it's a Mesh
        }

        if (clickedMesh.userData?.isCarouselItem && clickedMesh.userData.itemData && clickedMesh instanceof THREE.Mesh) {
          console.log("[Carousel] Clicked on item:", clickedMesh.userData.itemData.name);
          onItemClick(clickedMesh.userData.itemData, clickedMesh);
        } else {
          console.log("[Carousel] Intersected object not a valid carousel item or data missing.", clickedMesh.userData);
        }
      } else {
        console.log("[Carousel] No intersection with carousel items.");
      }
    } else if (wasDragging) {
      // It was a drag, re-enable auto-rotation after a delay
      console.log("[Carousel] Drag detected, enabling auto-rotate soon.");
      setTimeout(() => {
        if (!isDraggingRef.current) { 
          autoRotateRef.current = true;
        }
      }, 500);
    }

    // Cleanup window event listeners
    window.removeEventListener('touchmove', handleDragMove);
    window.removeEventListener('touchend', handleDragEnd);
    window.removeEventListener('pointermove', handleDragMove);
    window.removeEventListener('pointerup', handleDragEnd);
  }, [gl, appContext, camera, raycaster, onItemClick, scene, handleDragMove]); // Added scene and handleDragMove

  useEffect(() => {
    const domElement = gl.domElement;
    if (!domElement) return;
    
    console.log("[Carousel] Attaching event listeners to canvas.");
    // Capture current versions of handlers for stable removal
    const currentHandleDragStart = handleDragStart;

    // Listen on the canvas itself
    domElement.addEventListener('pointerdown', currentHandleDragStart as EventListener);
    domElement.addEventListener('touchstart', currentHandleDragStart as EventListener, { passive: false });

    return () => {
      console.log("[Carousel] Cleaning up event listeners from canvas.");
      domElement.removeEventListener('pointerdown', currentHandleDragStart as EventListener);
      domElement.removeEventListener('touchstart', currentHandleDragStart as EventListener);
      
      window.removeEventListener('pointermove', handleDragMove);
      window.removeEventListener('pointerup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [gl, handleDragStart, handleDragMove, handleDragEnd]); // Stable handlers

  useFrame((state, delta) => {
    if (group.current) {
      if (autoRotateRef.current && !isDraggingRef.current) {
        groupRotationYRef.current += rotationSpeed * delta * 60; 
      }
      group.current.rotation.y = groupRotationYRef.current;

      // Cards should already face outwards due to initial rotation logic.
      // If using lookAt here, ensure it's correct for items on a carousel.
      // They should lookAt the center of the carousel (0,0,0 in group's local space)
      // but their Y rotation needs to be adjusted by PI if they were initially facing inwards.
      // The current logic in CarouselItem (lookAt(0,0,0) then rotation.y += Math.PI) should handle this.
      invalidate(); 
    }
  });

  return (
    <group ref={group} rotation={[0, groupRotationYRef.current, 0]}>
      {itemsData.map((item, index) => (
        <CarouselItem
          key={item.id || `item-${index}`} // Use item.id if available, fallback to index
          itemData={item}
          index={index}
          totalItems={itemsData.length}
          carouselRadius={carouselRadius}
        />
      ))}
    </group>
  );
}

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
        // window.addEventListener('resize', handleResize); // ResizeObserver is usually enough for element resize
        return () => {
          if (container) resizeObserver.unobserve(container);
          // window.removeEventListener('resize', handleResize);
        };
    }
  }, [camera, gl, container]);
  return null;
});
Resizer.displayName = 'Resizer';


export function EquipmentLockerSection({ parallaxOffset }: SectionProps) {
  const appContext = useAppContext();
  const { 
    openTODWindow, 
    closeTODWindow, 
    playerInventory, 
    getItemById, // Use getItemById from context
    openSpyShop // Use openSpyShop from context
  } = appContext;

  const { theme: currentGlobalTheme, themeVersion } = useTheme();

  const carouselItemsData = useMemo(() => {
    if (typeof playerInventory !== 'object' || playerInventory === null || typeof getItemById !== 'function') {
      return [];
    }
    const inventoryItems = Object.values(playerInventory) as { id: string; quantity: number }[];
    return inventoryItems
      .filter(item => item.quantity > 0)
      .map(item => getItemById(item.id)) // Use context's getItemById
      .filter((item): item is GameItemBase => item !== undefined && item !== null);
  }, [playerInventory, getItemById]);

  const handleItemClick3D = useCallback((item: GameItemBase, mesh: THREE.Mesh) => {
    console.log("[LockerSection] handleItemClick3D triggered for item:", item.name);
    const itemLevelForColor = item.level || 1;
    const itemColorCssVar = ITEM_LEVEL_COLORS_CSS_VARS[itemLevelForColor as ItemLevel] || 'var(--muted-color)';
    const fallbackImageSrc = '/Spi vs Spi icon.png';

    openTODWindow(
      item.title || item.name,
      <div className="font-rajdhani p-4 text-center">
        <h3 className="text-xl font-bold mb-2" style={{color: itemColorCssVar }}>{item.title || item.name}</h3> {/* No extra L{item.level} here */}
        <div className="w-32 h-32 mx-auto my-2 rounded bg-black/30 flex items-center justify-center">
          <img 
            src={item.imageSrc || fallbackImageSrc} 
            alt={item.title || item.name} 
            className="max-w-full max-h-full object-contain" 
            data-ai-hint={item.dataAiHint || "item icon"} // Corrected: was itemData.dataAiHint
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
        themeVersion: themeVersion 
      }
    );
  }, [openTODWindow, closeTODWindow, currentGlobalTheme, themeVersion]);


  return (
    <div className="flex flex-col items-center justify-center p-4 md:p-6 h-full max-w-4xl mx-auto">
      <div
        className="w-full h-full flex flex-col items-center p-2 md:p-4 overflow-hidden rounded-lg border border-[var(--hologram-panel-border)] shadow-[0_0_15px_var(--hologram-glow-color),_inset_0_0_10px_var(--hologram-glow-color)] bg-black/70"
      >
        <div className="flex-shrink-0 w-full flex items-center justify-between my-2 md:my-3 px-2">
          <h2 className="text-xl md:text-2xl font-orbitron holographic-text text-center flex-grow">Equipment Locker</h2>
          <HolographicButton
            onClick={openSpyShop} // Use openSpyShop from context
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
          style={{ cursor: 'grab', touchAction: 'none' }} // Style for the entire canvas area
        >
          {carouselItemsData.length > 0 ? (
            <Canvas
              id="locker-carousel-canvas" // Keep for potential direct targeting if needed elsewhere
              camera={{ position: [0, 0.5, carouselRadius * 2.25], fov: 60 }}
              shadows
              gl={{ antialias: true, alpha: true }}
              style={{ background: 'transparent' }} // Canvas itself is transparent
              onCreated={({ gl }) => {
                gl.setClearColor(0x000000, 0); // Ensure R3F clear color is also transparent
              }}
            >
              <ambientLight intensity={1.5} />
              <directionalLight position={[5, 5, 5]} intensity={1} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
              <pointLight position={[-5, -5, -10]} intensity={0.5} color={`hsl(${currentGlobalTheme === 'cyphers' ? 'var(--primary-hsl)' : currentGlobalTheme === 'shadows' ? 'var(--primary-hsl)' : 'var(--accent-hsl)'})`} />
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
      </div>
    </div>
  );
}
