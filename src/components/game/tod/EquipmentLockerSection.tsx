// src/components/game/tod/EquipmentLockerSection.tsx
"use client";

import React, { useRef, useState, useEffect, useCallback, useLayoutEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls, PerspectiveCamera } from '@react-three/drei'; // Added Html
import * as THREE from 'three';
import { useAppContext } from '@/contexts/AppContext';
import { HolographicPanel, HolographicButton } from '@/components/game/shared/HolographicPanel';
import { cn } from '@/lib/utils';
import type { GameItemBase, ItemLevel } from '@/lib/game-items'; // GameItemBase needed for itemData
import { useTheme } from '@/contexts/ThemeContext'; // For theming the HTML card

interface SectionProps {
  parallaxOffset: number;
}

const itemWidth = 1.8; // Slightly wider for content
const itemHeight = 2.4; // Taller for content
const carouselRadius = 3.5;
const rotationSpeed = 0.0025;

interface CarouselItemProps {
  itemData: GameItemBase;
  index: number;
  totalItems: number;
  carouselRadius: number;
  onItemClick: (item: GameItemBase, mesh: THREE.Mesh) => void;
}

function CarouselItem({ itemData, index, totalItems, carouselRadius, onItemClick }: CarouselItemProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const textureLoader = useMemo(() => new THREE.TextureLoader(), []);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const { theme: currentGlobalTheme } = useTheme();

  useEffect(() => {
    const imageToLoad = itemData.imageSrc || '/Spi vs Spi icon.png'; // Use fallback
    textureLoader.load(
      imageToLoad,
      (loadedTexture) => {
        setTexture(loadedTexture);
        if (meshRef.current) {
          meshRef.current.userData = meshRef.current.userData || {};
          meshRef.current.userData.itemData = itemData; // Store full itemData
        }
      },
      undefined,
      (error) => {
        console.error(`CarouselItem: Failed to load texture for ${itemData.name} from ${imageToLoad}:`, error);
        // Attempt to load a generic fallback if primary fallback also fails (though unlikely if /Spi vs Spi icon.png exists)
        textureLoader.load('/Spi vs Spi icon.png', setTexture, undefined, () => {
          console.error('Failed to load absolute fallback texture /Spi vs Spi icon.png');
        });
      }
    );
  }, [itemData, textureLoader]); // Depend on itemData to reload if item changes

  const angle = (index / totalItems) * Math.PI * 2;
  const x = carouselRadius * Math.sin(angle);
  const z = carouselRadius * Math.cos(angle);

  useLayoutEffect(() => {
    if (meshRef.current) {
      meshRef.current.position.set(x, 0, z);
      meshRef.current.lookAt(new THREE.Vector3(0, 0, 0));
      meshRef.current.rotation.y += Math.PI;
    }
  }, [x, z]);

  const handleMeshClick = () => {
    if (meshRef.current) {
      onItemClick(itemData, meshRef.current);
    }
  };

  // Determine card background color based on current theme
  const getCardBgColor = () => {
    switch (currentGlobalTheme) {
      case 'cyphers':
        return 'rgba(10, 25, 47, 0.8)'; // Dark blue, semi-transparent
      case 'shadows':
        return 'rgba(40, 10, 10, 0.8)'; // Dark red, semi-transparent
      case 'terminal-green':
      default:
        return 'rgba(5, 25, 10, 0.8)'; // Dark green, semi-transparent
    }
  };
  
  const getCardTextColor = () => {
     switch (currentGlobalTheme) {
      case 'cyphers':
        return 'hsl(200, 100%, 90%)'; 
      case 'shadows':
        return 'hsl(0, 0%, 90%)';
      case 'terminal-green':
      default:
        return 'hsl(130, 80%, 70%)'; 
    }
  };

  const getProgressBarBgColor = () => {
    switch (currentGlobalTheme) {
      case 'cyphers': return 'rgba(30, 70, 130, 0.5)';
      case 'shadows': return 'rgba(130, 30, 30, 0.5)';
      default: return 'rgba(30, 130, 70, 0.5)';
    }
  }

  const getProgressBarFillColor = () => {
    switch (currentGlobalTheme) {
      case 'cyphers': return 'hsl(204, 100%, 50%)'; // Primary Blue
      case 'shadows': return 'hsl(0, 100%, 40%)';   // Primary Red
      default: return 'hsl(130, 70%, 45%)';      // Primary Green
    }
  }


  return (
    <mesh ref={meshRef} onClick={handleMeshClick} userData={{ itemData }}>
      <planeGeometry args={[itemWidth, itemHeight]} />
      {texture ? (
        <meshBasicMaterial map={texture} transparent />
      ) : (
        <meshBasicMaterial color="rgba(50,50,50,0.5)" transparent /> // Placeholder material
      )}
      <Html center transform prepend occlude="blending" style={{ pointerEvents: 'none', width: `${itemWidth*100}px`, height: `${itemHeight*100}px`}}>
        <div style={{
          width: '100%',
          height: '100%',
          backgroundColor: getCardBgColor(),
          color: getCardTextColor(),
          border: `1px solid ${getProgressBarFillColor()}`,
          borderRadius: '10px',
          padding: '15px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          fontFamily: 'var(--font-rajdhani)',
          overflow: 'hidden',
          boxShadow: `0 0 15px ${getProgressBarFillColor()}`
        }}>
          <img 
            src={itemData.imageSrc || '/Spi vs Spi icon.png'} 
            alt={itemData.title || itemData.name} 
            style={{ width: '60%', maxHeight: '40%', objectFit: 'contain', marginBottom: '10px', borderRadius:'5px' }} 
            data-ai-hint={itemData.dataAiHint || "item icon"}
            />
          <p style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold', textAlign: 'center', color: `hsl(var(--primary-hsl))` }}>
            {itemData.title || itemData.name} L{itemData.level}
          </p>
          
          {itemData.strength && (
            <div style={{ width: '90%', marginBottom: '5px' }}>
              <p style={{ fontSize: '12px', margin: '0 0 2px 0', opacity: 0.8 }}>Strength:</p>
              <div style={{ height: '8px', backgroundColor: getProgressBarBgColor(), borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${(itemData.strength.current / itemData.strength.max) * 100}%`, height: '100%', backgroundColor: getProgressBarFillColor(), borderRadius: '4px' }}></div>
              </div>
            </div>
          )}
          {itemData.resistance && (
             <div style={{ width: '90%', marginBottom: '5px' }}>
              <p style={{ fontSize: '12px', margin: '0 0 2px 0', opacity: 0.8 }}>Resistance:</p>
              <div style={{ height: '8px', backgroundColor: getProgressBarBgColor(), borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${(itemData.resistance.current / itemData.resistance.max) * 100}%`, height: '100%', backgroundColor: getProgressBarFillColor(), borderRadius: '4px' }}></div>
              </div>
            </div>
          )}
          {itemData.attackFactor && (
            <p style={{ fontSize: '12px', margin: '2px 0', opacity: 0.8 }}>Attack: {itemData.attackFactor}</p>
          )}
          <p style={{ fontSize: '11px', margin: '5px 0 0 0', opacity: 0.7, textAlign:'center', maxHeight: '2.2em', lineHeight: '1.1em', overflow:'hidden', textOverflow:'ellipsis' }}>
            {itemData.description}
          </p>
        </div>
      </Html>
    </mesh>
  );
}

function EquipmentCarousel({ itemsData, onItemClick }: { itemsData: GameItemBase[], onItemClick: (item: GameItemBase, mesh: THREE.Mesh) => void }) {
  const group = useRef<THREE.Group>(null!);
  const { camera, invalidate, gl } = useThree();
  const [isDragging, setIsDragging] = useState(false);
  const [previousClientX, setPreviousClientX] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const { setIsScrollLockActive } = useAppContext(); // For main TOD scroll lock

  const isDraggingRef = useRef(isDragging);
  const autoRotateRef = useRef(autoRotate);
  const previousClientXRef = useRef(previousClientX);
  const pointerDownTimeRef = useRef(0);
  const activeListenerTypeRef = useRef<'pointer' | 'touch' | null>(null);
  const groupRotationYRef = useRef(0); // To track group's Y rotation

  useEffect(() => { isDraggingRef.current = isDragging; }, [isDragging]);
  useEffect(() => { autoRotateRef.current = autoRotate; }, [autoRotate]);
  useEffect(() => { previousClientXRef.current = previousClientX; }, [previousClientX]);
  
  const handlePointerMove = useCallback((event: PointerEvent | TouchEvent) => {
    if (!isDraggingRef.current) return;
    event.preventDefault(); // Prevent page scroll
    event.stopPropagation();

    let currentX = 0;
    if (event.type === 'touchmove') {
        currentX = (event as TouchEvent).touches[0].clientX;
    } else {
        currentX = (event as PointerEvent).clientX;
    }

    const deltaX = currentX - previousClientXRef.current;
    if (group.current) {
      group.current.rotation.y += deltaX * 0.005;
      groupRotationYRef.current = group.current.rotation.y; // Update ref
      invalidate();
    }
    previousClientXRef.current = currentX;
  }, [invalidate]);

  const handlePointerUp = useCallback((event: PointerEvent | TouchEvent) => {
    setIsDragging(false);
    setAutoRotate(true);
    setIsScrollLockActive(false); // Release TOD scroll lock

    const canvasElement = gl.domElement.parentElement; // Assuming canvas is inside a div
    if (canvasElement) canvasElement.style.cursor = 'grab';

    if (activeListenerTypeRef.current === 'touch') {
        window.removeEventListener('touchmove', handlePointerMove as EventListener);
        window.removeEventListener('touchend', handlePointerUp as EventListener);
    } else if (activeListenerTypeRef.current === 'pointer') {
        window.removeEventListener('pointermove', handlePointerMove as EventListener);
        window.removeEventListener('pointerup', handlePointerUp as EventListener);
    }
    activeListenerTypeRef.current = null;

    const dragDuration = performance.now() - pointerDownTimeRef.current;
    if (dragDuration < 200 && Math.abs( (event as PointerEvent).clientX - previousClientXRef.current) < 5) {
        // This was likely a click, R3F's onClick on mesh will handle it
    }
  }, [gl.domElement, handlePointerMove, setIsScrollLockActive]);


  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    event.preventDefault(); // Prevent default actions like text selection or page scroll
    event.stopPropagation();

    let currentX = 0;
    let isTouchEvent = false;
    if ('touches' in event.nativeEvent) { // Touch event
        isTouchEvent = true;
        currentX = event.nativeEvent.touches[0].clientX;
    } else { // Pointer event (mouse)
        currentX = event.nativeEvent.clientX;
        if ((event.nativeEvent as PointerEvent).button !== 0) return; // Only left mouse button
    }

    setIsDragging(true);
    setAutoRotate(false);
    setIsScrollLockActive(true); // Activate TOD scroll lock
    setPreviousClientX(currentX);
    pointerDownTimeRef.current = performance.now();

    const canvasElement = gl.domElement.parentElement;
    if (canvasElement) canvasElement.style.cursor = 'grabbing';

    if (isTouchEvent) {
        window.addEventListener('touchmove', handlePointerMove as EventListener, { passive: false });
        window.addEventListener('touchend', handlePointerUp as EventListener, { passive: false });
        activeListenerTypeRef.current = 'touch';
    } else {
        window.addEventListener('pointermove', handlePointerMove as EventListener, { passive: false });
        window.addEventListener('pointerup', handlePointerUp as EventListener, { passive: false });
        activeListenerTypeRef.current = 'pointer';
    }
  }, [gl.domElement, handlePointerMove, handlePointerUp, setIsScrollLockActive]);

  useFrame(() => {
    if (group.current && autoRotateRef.current && !isDraggingRef.current) {
      group.current.rotation.y += rotationSpeed;
      groupRotationYRef.current = group.current.rotation.y;
      invalidate();
    }
    // Make items always face the camera if rotating the group
    if (group.current) {
        group.current.children.forEach(child => {
            child.lookAt(camera.position);
             // Adjust rotation if items are planes to make their front face the camera
            if (child instanceof THREE.Mesh && child.geometry instanceof THREE.PlaneGeometry) {
                // Original lookAt makes them face origin. We want them to face camera from origin.
                // So, their initial orientation (when group rotation is 0) is important.
                // This keeps them facing outwards from the carousel center, and then the whole group rotates.
                // The useLayoutEffect in CarouselItem already handles individual item orientation.
            }
        });
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
  const container = useMemo(() => document.getElementById('locker-carousel-canvas-container'), []);

  useEffect(() => {
    const handleResize = () => {
      if (container) {
        const width = container.offsetWidth;
        const height = container.offsetHeight;
        gl.setSize(width, height);
        if (camera instanceof THREE.PerspectiveCamera) {
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
        }
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial resize
    return () => window.removeEventListener('resize', handleResize);
  }, [camera, gl, container]);
  return null;
});
Resizer.displayName = 'Resizer';

export function EquipmentLockerSection({ parallaxOffset }: SectionProps) {
  const { openTODWindow, closeTODWindow, playerInventory, getItemById } = useAppContext();
  const [selectedItem3D, setSelectedItem3D] = useState<GameItemBase | null>(null);
  const { theme: currentGlobalTheme } = useTheme();

  const carouselItemsData = useMemo(() => {
    if (typeof playerInventory !== 'object' || playerInventory === null || typeof getItemById !== 'function') {
      return [];
    }
    const inventoryItems = Object.values(playerInventory) as { id: string; quantity: number }[];
    return inventoryItems
      .filter(item => item.quantity > 0)
      .map(item => getItemById(item.id))
      .filter((item): item is GameItemBase => item !== undefined);
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

  const { handlePointerDown } = useThree(state => ({ // Get handlePointerDown from useThree's state for EquipmentCarousel
    handlePointerDown: state.events.onPointerDown // This is a placeholder. EquipmentCarousel needs its own pointer down handling.
  }));


  return (
    <div className="flex flex-col items-center justify-center p-4 md:p-6 h-full max-w-4xl mx-auto">
      <HolographicPanel
        id="equipment-locker-section-panel"
        className="w-full h-full flex flex-col items-center justify-center p-2 md:p-4 overflow-hidden"
        explicitTheme={currentGlobalTheme}
      >
        <h2 className="text-xl md:text-2xl font-orbitron my-2 md:my-3 holographic-text text-center flex-shrink-0">Equipment Locker</h2>
        
        <div 
          id="locker-carousel-canvas-container" // Used by Resizer and for pointer events
          className="w-full flex-grow min-h-0 relative touch-none" // touch-none to prevent browser default touch actions
          style={{ cursor: 'grab' }}
          onPointerDown={(e) => { // Attach pointer down directly to the container
            const carousel = document.getElementById('locker-carousel-canvas-container');
            if (carousel && carousel.contains(e.target as Node)) {
                // This event is for the EquipmentCarousel's internal drag logic
                // We need to find a way to call EquipmentCarousel's handlePointerDown or simulate it.
                // For now, this is a simplified interaction. The actual drag logic is inside EquipmentCarousel.
            }
          }}
        >
          {carouselItemsData.length > 0 ? (
            <Canvas
              id="locker-carousel-canvas" // Keep this ID if specific styling targets it
              camera={{ position: [0, 0.5, carouselRadius * 2], fov: 50 }} // Adjusted camera
              shadows
              gl={{ antialias: true, alpha: true }} // Ensure alpha for transparency
              style={{ background: 'transparent' }}
              onCreated={({ gl }) => {
                gl.setClearColor(0x000000, 0); // Transparent background for canvas
              }}
            >
              <ambientLight intensity={1.2} />
              <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
              <pointLight position={[-5, -5, -5]} intensity={0.3} />
              <EquipmentCarousel itemsData={carouselItemsData} onItemClick={handleItemClick3D} />
              <Resizer />
              {/* <OrbitControls enableZoom={false} enablePan={false} minPolarAngle={Math.PI / 2.2} maxPolarAngle={Math.PI / 2.2} /> */}
            </Canvas>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <p className="holographic-text text-lg">Locker Empty</p>
              <p className="text-muted-foreground text-sm">Visit the Spy Shop or Check In with HQ.</p>
            </div>
          )}
        </div>
         <p className="text-center text-xs text-muted-foreground mt-2 flex-shrink-0 px-2">
            {carouselItemsData.length > 0 ? "Click and drag or use arrow keys (L/R) to navigate. Click item for details." : ""}
          </p>
      </HolographicPanel>
    </div>
  );
}
