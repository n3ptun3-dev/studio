
// src/components/game/tod/EquipmentLockerSection.tsx
"use client";

import React, { useRef, useState, useEffect, useCallback, useLayoutEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei'; // OrbitControls and PerspectiveCamera removed as they are not actively used
import * as THREE from 'three';
import { useAppContext, type GameItemBase, type ItemLevel } from '@/contexts/AppContext';
import { HolographicPanel, HolographicButton } from '@/components/game/shared/HolographicPanel';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { ITEM_LEVEL_COLORS_CSS_VARS } from '@/lib/constants'; // For card borders

interface SectionProps {
  parallaxOffset: number;
}

const itemWidth = 1.2;
const itemHeight = 1.6;
const carouselRadius = 3.5;
const rotationSpeed = 0.005; // Auto-rotation speed

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

interface CarouselItemProps {
  itemData: GameItemBase;
  index: number;
  totalItems: number;
  carouselRadius: number;
  onItemClick: (item: GameItemBase, mesh: THREE.Mesh) => void;
}

function CarouselItem({ itemData, index, totalItems, carouselRadius, onItemClick }: CarouselItemProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const { theme: currentGlobalTheme } = useTheme();

  const angle = (index / totalItems) * Math.PI * 2;
  const x = carouselRadius * Math.sin(angle);
  const z = carouselRadius * Math.cos(angle);

  useLayoutEffect(() => {
    if (meshRef.current) {
      meshRef.current.position.set(x, 0, z);
      meshRef.current.lookAt(new THREE.Vector3(0, 0, 0));
      meshRef.current.rotation.y += Math.PI;
      meshRef.current.userData = { itemData };
    }
  }, [x, z, itemData]);

  const handleMeshClick = () => {
    if (meshRef.current) {
      onItemClick(itemData, meshRef.current);
    }
  };

  const itemLevelForColor = itemData.level || 1;
  const itemColorCssVar = ITEM_LEVEL_COLORS_CSS_VARS[itemLevelForColor as ItemLevel] || 'var(--muted-color)';
  const cardBgClass = LEVEL_TO_BG_CLASS[itemLevelForColor as ItemLevel] || 'bg-muted/30';

  const fallbackImageSrc = '/Spi vs Spi icon.png'; // Define placeholder

  return (
    <mesh ref={meshRef} onClick={handleMeshClick} userData={{ itemData }}>
      <planeGeometry args={[itemWidth, itemHeight]} />
      {/* Make the 3D plane itself fully transparent */}
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
            "w-full h-full rounded-lg border-2 flex flex-col items-center justify-start overflow-hidden shadow-lg p-2",
            cardBgClass
          )}
          style={{
            borderColor: itemColorCssVar,
            fontFamily: 'var(--font-rajdhani)',
            color: `hsl(var(--foreground-hsl))`,
            boxShadow: `0 0 10px ${itemColorCssVar}`,
          }}
        >
          <div className="w-full h-2/5 relative mb-1 flex-shrink-0">
            <img
              src={itemData.imageSrc || fallbackImageSrc}
              alt={itemData.title || itemData.name}
              className="w-full h-full object-contain rounded-sm"
              data-ai-hint={itemData.dataAiHint || "item icon"}
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                if (target.src !== fallbackImageSrc) { // Prevent loop if fallback itself fails
                  target.src = fallbackImageSrc;
                  target.onerror = null; // Prevent future error triggers for this element if placeholder also fails
                }
              }}
            />
          </div>
          <p className="text-sm font-semibold text-center leading-tight mb-1" style={{ color: itemColorCssVar }}>
            {itemData.title || itemData.name} L{itemData.level}
          </p>
          <div className="w-full text-xs space-y-0.5 overflow-y-auto scrollbar-hide flex-grow">
            {itemData.strength && (
              <div className="w-full">
                <p className="text-[10px] opacity-80 mb-px">Strength:</p>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: `hsla(var(--muted-hsl), 0.3)`}}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(itemData.strength.current / itemData.strength.max) * 100}%`,
                      backgroundColor: itemColorCssVar,
                    }}
                  />
                </div>
              </div>
            )}
            {itemData.resistance && (
              <div className="w-full mt-1">
                <p className="text-[10px] opacity-80 mb-px">Resistance:</p>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: `hsla(var(--muted-hsl), 0.3)`}}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(itemData.resistance.current / itemData.resistance.max) * 100}%`,
                      backgroundColor: itemColorCssVar,
                    }}
                  />
                </div>
              </div>
            )}
            {itemData.attackFactor !== undefined && (
              <p className="text-[10px] opacity-80 mt-1">Attack: {itemData.attackFactor}</p>
            )}
             <p className="text-[10px] leading-snug opacity-70 mt-1 text-center max-h-[3.3em] overflow-hidden">
              {itemData.description}
            </p>
          </div>
        </div>
      </Html>
    </mesh>
  );
}

function EquipmentCarousel({ itemsData, onItemClick }: { itemsData: GameItemBase[], onItemClick: (item: GameItemBase, mesh: THREE.Mesh) => void }) {
  const group = useRef<THREE.Group>(null!);
  const { camera, invalidate, gl } = useThree();
  const { setIsScrollLockActive } = useAppContext();

  const isDraggingRef = useRef(false);
  const autoRotateRef = useRef(true);
  const previousPointerXRef = useRef(0);
  const pointerDownTimeRef = useRef(0);
  const activeListenerTypeRef = useRef<'pointer' | 'touch' | null>(null);
  const groupRotationYRef = useRef(0);

  const handlePointerMove = useCallback((event: PointerEvent | TouchEvent) => {
    if (!isDraggingRef.current) return;
    // Check if it's a TouchEvent and prevent default only for touch to avoid console warnings on passive listeners
    if ('touches' in event) {
        event.preventDefault();
    }

    let currentX = 0;
    if (activeListenerTypeRef.current === 'touch') {
      currentX = (event as TouchEvent).touches[0].clientX;
    } else {
      currentX = (event as PointerEvent).clientX;
    }

    const deltaX = currentX - previousPointerXRef.current;
    if (group.current) {
      groupRotationYRef.current += deltaX * 0.005;
      invalidate();
    }
    previousPointerXRef.current = currentX;
  }, [invalidate]);

  const handlePointerUp = useCallback((event: PointerEvent | TouchEvent) => {
    if (!isDraggingRef.current) return;

    isDraggingRef.current = false;
    autoRotateRef.current = true;
    setIsScrollLockActive(false);

    const canvasElement = gl.domElement.parentElement;
    if (canvasElement) canvasElement.style.cursor = 'grab';

    if (activeListenerTypeRef.current === 'touch') {
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    } else if (activeListenerTypeRef.current === 'pointer') {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    }
    activeListenerTypeRef.current = null;

  }, [gl.domElement, setIsScrollLockActive, handlePointerMove]);


  const handlePointerDown = useCallback((event: PointerEvent | TouchEvent) => {
    let currentX = 0;
    let isTouchEvent = 'touches' in event;

    if (isTouchEvent) {
      currentX = (event as TouchEvent).touches[0].clientX;
      // For touch events, explicitly set passive: false if you intend to preventDefault
      // However, modern browsers might still warn if the initial listener wasn't {passive: false}
    } else {
      if ((event as PointerEvent).button !== 0) return;
      currentX = (event as PointerEvent).clientX;
    }

    isDraggingRef.current = true;
    autoRotateRef.current = false;
    setIsScrollLockActive(true);
    previousPointerXRef.current = currentX;
    pointerDownTimeRef.current = performance.now();

    const canvasElement = gl.domElement.parentElement;
    if (canvasElement) canvasElement.style.cursor = 'grabbing';

    if (isTouchEvent) {
      window.addEventListener('touchmove', handlePointerMove, { passive: false });
      window.addEventListener('touchend', handlePointerUp, { passive: false });
      activeListenerTypeRef.current = 'touch';
    } else {
      window.addEventListener('pointermove', handlePointerMove, { passive: false }); // Standard pointer events are not passive by default
      window.addEventListener('pointerup', handlePointerUp, { passive: false });
      activeListenerTypeRef.current = 'pointer';
    }
  }, [gl.domElement, setIsScrollLockActive, handlePointerMove, handlePointerUp]);

  useEffect(() => {
    const domElement = gl.domElement;
    // Add 'pointerdown' for mouse
    domElement.addEventListener('pointerdown', handlePointerDown as EventListener);
    // Add 'touchstart' for touch, ensuring passive is false if preventDefault will be called
    domElement.addEventListener('touchstart', handlePointerDown as EventListener, { passive: false });

    return () => {
      domElement.removeEventListener('pointerdown', handlePointerDown as EventListener);
      domElement.removeEventListener('touchstart', handlePointerDown as EventListener);

      if (activeListenerTypeRef.current === 'touch') {
        window.removeEventListener('touchmove', handlePointerMove);
        window.removeEventListener('touchend', handlePointerUp);
      } else if (activeListenerTypeRef.current === 'pointer') {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      }
    };
  }, [gl.domElement, handlePointerDown, handlePointerMove, handlePointerUp]);


  useFrame(() => {
    if (group.current) {
      if (autoRotateRef.current && !isDraggingRef.current) {
        groupRotationYRef.current += rotationSpeed;
      }
      group.current.rotation.y = groupRotationYRef.current;

      group.current.children.forEach(child => {
        if (child instanceof THREE.Mesh) {
          const itemWorldPosition = new THREE.Vector3();
          child.getWorldPosition(itemWorldPosition);
          const lookAtPosition = new THREE.Vector3(camera.position.x, itemWorldPosition.y, camera.position.z);
          child.lookAt(lookAtPosition);
        }
      });
      invalidate();
    }
  });

  return (
    <group ref={group} rotation={[0, groupRotationYRef.current, 0]}>
      {itemsData.map((item, index) => (
        <CarouselItem
          key={item.id}
          itemData={item}
          index={index}
          totalItems={itemsData.length}
          carouselRadius={carouselRadius}
          onItemClick={onItemClick}
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
        window.addEventListener('resize', handleResize);
        return () => {
          if (container) resizeObserver.unobserve(container); // Check container again before unobserving
          window.removeEventListener('resize', handleResize);
        };
    }
  }, [camera, gl, container]);
  return null;
});
Resizer.displayName = 'Resizer';

export function EquipmentLockerSection({ parallaxOffset }: SectionProps) {
  const { openTODWindow, closeTODWindow, playerInventory, getItemById, appContext } = useAppContext(); // Removed unused appContext
  const [selectedItem3D, setSelectedItem3D] = useState<GameItemBase | null>(null);
  const { theme: currentGlobalTheme, themeVersion } = useTheme();

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
    setSelectedItem3D(item);
    const itemLevelForColor = item.level || 1;
    const itemColorCssVar = ITEM_LEVEL_COLORS_CSS_VARS[itemLevelForColor as ItemLevel] || 'var(--muted-color)';
    const fallbackImageSrc = '/Spi vs Spi icon.png';

    openTODWindow(
      item.title || item.name,
      <div className="font-rajdhani p-4 text-center">
        <h3 className="text-xl font-bold mb-2" style={{color: itemColorCssVar }}>{item.title || item.name} L{item.level}</h3>
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
      { showCloseButton: true, explicitTheme: currentGlobalTheme, themeVersion }
    );
  }, [openTODWindow, closeTODWindow, currentGlobalTheme, themeVersion]);


  return (
    <div className="flex flex-col items-center justify-center p-4 md:p-6 h-full max-w-4xl mx-auto">
      <HolographicPanel
        id="equipment-locker-section-panel"
        className="w-full h-full flex flex-col items-center p-2 md:p-4 overflow-hidden"
        explicitTheme={currentGlobalTheme} 
      >
        <h2 className="text-xl md:text-2xl font-orbitron my-2 md:my-3 holographic-text text-center flex-shrink-0">Equipment Locker</h2>
        
        <div 
          id="locker-carousel-canvas-container"
          className="w-full flex-grow min-h-0 relative touch-auto"
          style={{ cursor: 'grab' }}
        >
          {carouselItemsData.length > 0 ? (
            <Canvas
              id="locker-carousel-canvas"
              camera={{ position: [0, 0.5, carouselRadius * 1.75], fov: 60 }}
              shadows
              gl={{ antialias: true, alpha: true }}
              style={{ background: 'transparent' }}
              onCreated={({ gl }) => {
                gl.setClearColor(0x000000, 0);
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
      </HolographicPanel>
    </div>
  );
}


    