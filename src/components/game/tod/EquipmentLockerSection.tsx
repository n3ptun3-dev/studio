// src/components/game/tod/EquipmentLockerSection.tsx
"use client";

import React, { useRef, useState, useEffect, useCallback, useLayoutEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useAppContext, type GameItemBase, type ItemLevel } from '@/contexts/AppContext'; // GameItemBase needed for itemData
import { HolographicPanel, HolographicButton } from '@/components/game/shared/HolographicPanel';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

interface SectionProps {
  parallaxOffset: number;
}

const itemWidth = 1.2;
const itemHeight = 1.6;
const carouselRadius = 3.5;
const rotationSpeed = 0.005; // Auto-rotation speed

// For card background colors based on item level (Tailwind classes)
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

  // Position calculation
  const angle = (index / totalItems) * Math.PI * 2;
  const x = carouselRadius * Math.sin(angle);
  const z = carouselRadius * Math.cos(angle);

  useLayoutEffect(() => {
    if (meshRef.current) {
      meshRef.current.position.set(x, 0, z);
      meshRef.current.lookAt(new THREE.Vector3(0, 0, 0)); // Look at carousel center
      meshRef.current.rotation.y += Math.PI; // Orient front towards center
      meshRef.current.userData = { itemData }; // Store item data on the mesh
    }
  }, [x, z, itemData]);

  const handleMeshClick = () => {
    if (meshRef.current) {
      onItemClick(itemData, meshRef.current);
    }
  };

  const itemLevelForColor = itemData.level || 1;
  const itemColorCssVar = `var(--level-${itemLevelForColor}-color)`;
  const cardBgClass = LEVEL_TO_BG_CLASS[itemLevelForColor as ItemLevel] || 'bg-muted/30';

  return (
    <mesh ref={meshRef} onClick={handleMeshClick} userData={{ itemData }}>
      <planeGeometry args={[itemWidth, itemHeight]} />
      {/* The 3D plane is now just a semi-transparent backdrop or click target. Image is in HTML. */}
      <meshBasicMaterial
        color={itemColorCssVar} // Use the item's level color for the plane's base
        transparent
        opacity={0.1} // Make the plane itself very subtle if HTML provides main bg
      />
      <Html
        center
        transform
        prepend
        occlude="blending" // occlude only if other meshes are in front, "blending" for correct Html transparency
        style={{ pointerEvents: 'none', width: `${itemWidth * 100}px`, height: `${itemHeight * 100}px` }}
      >
        <div
          className={cn(
            "w-full h-full rounded-lg border-2 flex flex-col items-center justify-start overflow-hidden shadow-lg p-2",
            cardBgClass // Themed background with opacity
          )}
          style={{
            borderColor: itemColorCssVar, // Themed border color
            fontFamily: 'var(--font-rajdhani)',
            color: `hsl(var(--foreground-hsl))`, // Use theme's foreground
            boxShadow: `0 0 10px ${itemColorCssVar}`,
          }}
        >
          <div className="w-full h-2/5 relative mb-1 flex-shrink-0">
            <img
              src={itemData.imageSrc || '/Spi vs Spi icon.png'}
              alt={itemData.title || itemData.name}
              className="w-full h-full object-contain rounded-sm"
              data-ai-hint={itemData.dataAiHint || "item icon"}
            />
          </div>
          <p className="text-sm font-semibold text-center leading-tight mb-1" style={{ color: `hsl(var(--primary-hsl))` }}>
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
  const { setIsScrollLockActive } = useAppContext(); // Get from AppContext

  // Refs for managing drag state and interaction
  const isDraggingRef = useRef(false);
  const autoRotateRef = useRef(true);
  const previousPointerXRef = useRef(0);
  const pointerDownTimeRef = useRef(0);
  const activeListenerTypeRef = useRef<'pointer' | 'touch' | null>(null);
  const groupRotationYRef = useRef(0); // To store rotation and apply it declaratively

  const handlePointerDown = useCallback((event: PointerEvent | TouchEvent) => {
    // Prevent R3F's default event system if we handle it for drag
    // event.stopPropagation(); // Only stop if it's truly a drag initiation on the canvas

    let currentX = 0;
    let isTouchEvent = 'touches' in event;

    if (isTouchEvent) {
      currentX = (event as TouchEvent).touches[0].clientX;
    } else {
      if ((event as PointerEvent).button !== 0) return; // Only left mouse button
      currentX = (event as PointerEvent).clientX;
    }

    isDraggingRef.current = true;
    autoRotateRef.current = false;
    setIsScrollLockActive(true); // Lock main TOD scroll
    previousPointerXRef.current = currentX;
    pointerDownTimeRef.current = performance.now();

    const canvasElement = gl.domElement.parentElement;
    if (canvasElement) canvasElement.style.cursor = 'grabbing';

    if (isTouchEvent) {
      window.addEventListener('touchmove', handlePointerMove, { passive: false });
      window.addEventListener('touchend', handlePointerUp, { passive: false });
      activeListenerTypeRef.current = 'touch';
    } else {
      window.addEventListener('pointermove', handlePointerMove, { passive: false });
      window.addEventListener('pointerup', handlePointerUp, { passive: false });
      activeListenerTypeRef.current = 'pointer';
    }
  }, [gl.domElement, setIsScrollLockActive]); // Removed internal handlePointerMove/Up

  const handlePointerMove = useCallback((event: PointerEvent | TouchEvent) => {
    if (!isDraggingRef.current) return;
    event.preventDefault(); // Prevent page scroll during drag

    let currentX = 0;
    if (activeListenerTypeRef.current === 'touch') {
      currentX = (event as TouchEvent).touches[0].clientX;
    } else {
      currentX = (event as PointerEvent).clientX;
    }

    const deltaX = currentX - previousPointerXRef.current;
    if (group.current) {
      // Update the ref, the useFrame loop will apply it
      groupRotationYRef.current += deltaX * 0.005; // Adjust sensitivity as needed
      invalidate(); // Request a re-render
    }
    previousPointerXRef.current = currentX;
  }, [invalidate]);

  const handlePointerUp = useCallback((event: PointerEvent | TouchEvent) => {
    if (!isDraggingRef.current) return; // Ensure this only runs if a drag was active

    isDraggingRef.current = false;
    autoRotateRef.current = true;
    setIsScrollLockActive(false); // Unlock main TOD scroll

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

    // Simple click detection (if drag was very short)
    // R3F's onClick on individual mesh should handle item clicks.
    // This logic here is more about distinguishing drag from click on the canvas background.
    const dragDuration = performance.now() - pointerDownTimeRef.current;
    const clientXUp = 'changedTouches' in event ? (event as TouchEvent).changedTouches[0].clientX : (event as PointerEvent).clientX;
    if (dragDuration < 200 && Math.abs(clientXUp - previousPointerXRef.current) < 5) {
      // Likely a click on the background, not a drag.
      // If an item was clicked, its own onClick would fire.
    }
  }, [gl.domElement, setIsScrollLockActive]); // Removed internal handlePointerMove


  // Effect to add/remove listeners for dragging on the canvas itself
  useEffect(() => {
    const domElement = gl.domElement;
    domElement.addEventListener('pointerdown', handlePointerDown as EventListener);
    domElement.addEventListener('touchstart', handlePointerDown as EventListener, { passive: false }); // For touch devices

    return () => {
      domElement.removeEventListener('pointerdown', handlePointerDown as EventListener);
      domElement.removeEventListener('touchstart', handlePointerDown as EventListener);

      // Clean up global listeners if component unmounts while dragging
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
      group.current.rotation.y = groupRotationYRef.current; // Apply rotation from ref

      // Make items face the camera
      group.current.children.forEach(child => {
        if (child instanceof THREE.Mesh) {
          // Calculate direction from item to camera
          const itemWorldPosition = new THREE.Vector3();
          child.getWorldPosition(itemWorldPosition);
          
          const lookAtPosition = new THREE.Vector3(camera.position.x, itemWorldPosition.y, camera.position.z);
          child.lookAt(lookAtPosition);
          // If using planes and they are "backwards", might need:
          // child.rotation.y += Math.PI; // Ensure front of plane faces camera
        }
      });
      invalidate();
    }
  });

  return (
    // The group itself doesn't need pointer event handlers if gl.domElement handles drag initiation
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
  const container = useMemo(() => document.getElementById('locker-carousel-canvas-container'), []);

  useEffect(() => {
    const handleResize = () => {
      if (container) {
        const width = container.offsetWidth;
        const height = container.offsetHeight;
        if (width > 0 && height > 0) { // Ensure dimensions are valid
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
        window.addEventListener('resize', handleResize); // Fallback for general window resize
        return () => {
          resizeObserver.unobserve(container);
          window.removeEventListener('resize', handleResize);
        };
    }
  }, [camera, gl, container]);
  return null;
});
Resizer.displayName = 'Resizer';

export function EquipmentLockerSection({ parallaxOffset }: SectionProps) {
  const { openTODWindow, closeTODWindow, playerInventory, getItemById, appContext } = useAppContext();
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
    openTODWindow(
      item.title || item.name,
      <div className="font-rajdhani p-4 text-center">
        <h3 className="text-xl font-bold mb-2" style={{color: `hsl(var(--primary-hsl))`}}>{item.title || item.name} L{item.level}</h3>
        <div className="w-32 h-32 mx-auto my-2 rounded bg-black/30 flex items-center justify-center">
          <img src={item.imageSrc || '/Spi vs Spi icon.png'} alt={item.title || item.name} className="max-w-full max-h-full object-contain" data-ai-hint={item.dataAiHint || "item icon"}/>
        </div>
        <p className="text-muted-foreground mb-1 text-sm">{item.description}</p>
        <p className="text-xs text-muted-foreground/80">Cost: {item.cost} ELINT</p>
        {item.strength && <p className="text-xs text-muted-foreground/80">Strength: {item.strength.current}/{item.strength.max}</p>}
        {item.resistance && <p className="text-xs text-muted-foreground/80">Resistance: {item.resistance.current}/{item.resistance.max}</p>}
        <HolographicButton onClick={closeTODWindow} className="mt-4" explicitTheme={currentGlobalTheme}>Close</HolographicButton>
      </div>,
      { showCloseButton: true, explicitTheme: currentGlobalTheme }
    );
  }, [openTODWindow, closeTODWindow, currentGlobalTheme]);


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
          className="w-full flex-grow min-h-0 relative touch-auto" // Changed touch-none to touch-auto
          style={{ cursor: 'grab' }}
        >
          {carouselItemsData.length > 0 ? (
            <Canvas
              id="locker-carousel-canvas"
              camera={{ position: [0, 0.5, carouselRadius * 1.75], fov: 60 }} // Adjusted camera for better view
              shadows
              gl={{ antialias: true, alpha: true }}
              style={{ background: 'transparent' }} // Ensure canvas itself is transparent
              onCreated={({ gl }) => {
                gl.setClearColor(0x000000, 0); // Explicitly set clear color to transparent
              }}
            >
              <ambientLight intensity={1.5} /> {/* Slightly increased ambient light */}
              <directionalLight position={[5, 5, 5]} intensity={1} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
              <pointLight position={[-5, -5, -10]} intensity={0.5} color="hsl(var(--primary-hsl))" />
              <pointLight position={[0, 10, 0]} intensity={0.3} />

              <EquipmentCarousel itemsData={carouselItemsData} onItemClick={handleItemClick3D} />
              <Resizer />
              {/* OrbitControls can be added for debugging, but remove for final product if not needed */}
              {/* <OrbitControls enableZoom={true} enablePan={true} /> */}
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
