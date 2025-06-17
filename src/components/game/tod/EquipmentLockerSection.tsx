
// src/components/game/tod/EquipmentLockerSection.tsx
"use client";

import React, { useRef, useState, useEffect, useCallback, useLayoutEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useAppContext, type GameItemBase, type ItemLevel, type ItemCategory } from '@/contexts/AppContext';
import { HolographicPanel, HolographicButton } from '@/components/game/shared/HolographicPanel';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { ITEM_LEVEL_COLORS_CSS_VARS } from '@/lib/constants';
import { ShoppingCart } from 'lucide-react';

interface SectionProps {
  parallaxOffset: number;
}

const itemWidth = 1.2;
const itemHeight = 1.8; // Slightly taller to accommodate more info
const carouselRadius = 3.5;
const rotationSpeed = 0.005;

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

// Simple Progress Bar Component for Cards
const CardProgressBar: React.FC<{ current: number; max: number; label?: string; colorVar: string }> = ({ current, max, label, colorVar }) => {
  const percentage = max > 0 ? (current / max) * 100 : 0;
  return (
    <div className="w-full text-xs mt-1">
      {label && <p className="text-[10px] opacity-80 mb-px text-left">{label}</p>}
      <div className="h-1.5 rounded-full overflow-hidden w-full" style={{ backgroundColor: `hsla(var(--muted-hsl), 0.3)` }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${percentage}%`,
            backgroundColor: colorVar,
          }}
        />
      </div>
      <p className="text-[9px] opacity-70 text-right">{current}/{max}</p>
    </div>
  );
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
  const fallbackImageSrc = '/Spi vs Spi icon.png'; // General fallback

  const angle = (index / totalItems) * Math.PI * 2;
  const x = carouselRadius * Math.sin(angle);
  const z = carouselRadius * Math.cos(angle);

  useLayoutEffect(() => {
    if (meshRef.current) {
      meshRef.current.position.set(x, 0, z);
      meshRef.current.lookAt(new THREE.Vector3(0, 0, 0));
      meshRef.current.rotation.y += Math.PI;
      meshRef.current.userData = { itemData }; // Store itemData for click handling
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

  // Conditional content rendering
  let detailContent = null;
  const strengthVal = itemData.strength?.current ?? 0;
  const maxStrengthVal = itemData.strength?.max ?? 100;

  switch (itemData.category) {
    case 'Hardware':
      detailContent = <CardProgressBar current={strengthVal} max={maxStrengthVal} label="Strength" colorVar={itemColorCssVar} />;
      break;
    case 'Lock Fortifiers':
      if (itemData.type === 'Rechargeable') {
        detailContent = <CardProgressBar current={strengthVal} max={maxStrengthVal} label="Recharges" colorVar={itemColorCssVar} />;
      } else {
        detailContent = <p className="text-xs text-center font-semibold p-1 rounded bg-muted/50" style={{color: itemColorCssVar}}>Single Use</p>;
      }
      break;
    case 'Nexus Upgrades':
      if (itemData.name.includes('Security Camera')) {
        const maxAlerts = parseInt(itemData.rechargeCapacity?.split(' ')[0] || '0') || maxStrengthVal;
        detailContent = <CardProgressBar current={strengthVal} max={maxAlerts} label="Alerts Left" colorVar={itemColorCssVar} />;
      } else if (itemData.name.includes('Emergency Repair System')) {
        detailContent = <CardProgressBar current={strengthVal} max={maxStrengthVal} label="ERS Strength" colorVar={itemColorCssVar} />;
      } else if (itemData.name.includes('Reinforced Foundation')) {
        detailContent = <p className="text-xs text-center font-semibold p-1 rounded bg-muted/50" style={{color: itemColorCssVar}}>Permanent</p>;
      } else if (itemData.name.includes('Emergency Power Cell')) {
        detailContent = <CardProgressBar current={strengthVal} max={maxStrengthVal} label="EPC Strength" colorVar={itemColorCssVar} />;
      }
      break;
    case 'Infiltration Gear':
      if (itemData.name === 'Pick' && itemData.level === 1) {
        detailContent = <p className="text-xs text-center font-semibold p-1 rounded bg-muted/50" style={{color: itemColorCssVar}}>Basic Tool</p>;
      } else if (itemData.type === 'Rechargeable') {
        detailContent = <CardProgressBar current={strengthVal} max={maxStrengthVal} label="Uses Left" colorVar={itemColorCssVar} />;
      } else if (itemData.type === 'One-Time Use' || itemData.type === 'Consumable') {
        detailContent = <p className="text-xs text-center font-semibold p-1 rounded bg-muted/50" style={{color: itemColorCssVar}}>Single Use</p>;
      }
      break;
    case 'Assault Tech':
      detailContent = <p className="text-xs text-center font-semibold p-1 rounded bg-muted/50" style={{color: itemColorCssVar}}>Single Use</p>;
      break;
    case 'Aesthetic Schemes':
      // No progress bar, just image and title
      break;
    default:
      if (itemData.strength) {
        detailContent = <CardProgressBar current={strengthVal} max={maxStrengthVal} label="Status" colorVar={itemColorCssVar} />;
      }
  }


  return (
    <mesh ref={meshRef} onClick={handleMeshClick} userData={{ itemData }}>
      <planeGeometry args={[itemWidth, itemHeight]} />
      <meshBasicMaterial transparent opacity={0} /> {/* Plane is invisible */}
      <Html
        center
        transform
        prepend
        occlude="blending"
        style={{ pointerEvents: 'none', width: `${itemWidth * 100}px`, height: `${itemHeight * 100}px` }}
      >
        <div
          className={cn(
            "w-full h-full rounded-lg border-2 flex flex-col items-center justify-start overflow-hidden shadow-lg",
            cardBgClass
          )}
          style={{
            borderColor: itemColorCssVar,
            fontFamily: 'var(--font-rajdhani)',
            color: `hsl(var(--foreground-hsl))`,
            boxShadow: `0 0 10px ${itemColorCssVar}`,
          }}
        >
          <div className="w-full h-3/5 relative flex-shrink-0 bg-black/20">
            <img
              src={itemData.imageSrc || fallbackImageSrc}
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
          <div className="w-full p-2 flex flex-col justify-between flex-grow min-h-0">
            <p className="text-sm font-semibold text-center leading-tight mb-1 truncate" style={{ color: itemColorCssVar }}>
              {itemData.title || itemData.name} L{itemData.level}
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

function EquipmentCarousel({ itemsData, onItemClick }: { itemsData: GameItemBase[], onItemClick: (item: GameItemBase, mesh: THREE.Mesh) => void }) {
  const group = useRef<THREE.Group>(null!);
  const { camera, invalidate, gl } = useThree();
  const appContext = useAppContext();

  const isDraggingRef = useRef(false);
  const autoRotateRef = useRef(true);
  const previousPointerXRef = useRef(0);
  const pointerDownTimeRef = useRef(0);
  const groupRotationYRef = useRef(group.current ? group.current.rotation.y : 0);
  const accumulatedDeltaXRef = useRef(0); // To differentiate clicks from drags

  const handleDragStart = useCallback((event: PointerEvent | TouchEvent) => {
    let currentX = 0;
    const isTouchEvent = 'touches' in event;

    if (isTouchEvent) {
      currentX = (event as TouchEvent).touches[0].clientX;
      if (event.cancelable) event.preventDefault();
    } else {
      if ((event as PointerEvent).button !== 0) return;
      currentX = (event as PointerEvent).clientX;
    }

    isDraggingRef.current = true;
    autoRotateRef.current = false;
    appContext.setIsScrollLockActive(true);
    previousPointerXRef.current = currentX;
    accumulatedDeltaXRef.current = 0;
    pointerDownTimeRef.current = performance.now();

    const canvasElement = gl.domElement.parentElement;
    if (canvasElement) canvasElement.style.cursor = 'grabbing';

    if (isTouchEvent) {
      window.addEventListener('touchmove', handleDragMove, { passive: false });
      window.addEventListener('touchend', handleDragEnd, { passive: false });
    } else {
      window.addEventListener('pointermove', handleDragMove, { passive: false });
      window.addEventListener('pointerup', handleDragEnd, { passive: false });
    }
  }, [gl, appContext.setIsScrollLockActive, invalidate]); // Removed handleDragMove, handleDragEnd

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
    groupRotationYRef.current += deltaX * 0.005;
    accumulatedDeltaXRef.current += Math.abs(deltaX);
    previousPointerXRef.current = currentX;
    invalidate();
  }, [invalidate]);

  const handleDragEnd = useCallback((event: PointerEvent | TouchEvent) => {
    if (!isDraggingRef.current) return; // Ensure drag was actually started
    isDraggingRef.current = false;
    appContext.setIsScrollLockActive(false);
    
    const dragDuration = performance.now() - pointerDownTimeRef.current;

    // Re-enable auto-rotation only if it was a significant drag, not a quick click
    if (dragDuration > 200 || accumulatedDeltaXRef.current > 10) {
      setTimeout(() => {
        if (!isDraggingRef.current) {
          autoRotateRef.current = true;
        }
      }, 500);
    }


    const canvasElement = gl.domElement.parentElement;
    if (canvasElement) canvasElement.style.cursor = 'grab';

    window.removeEventListener('touchmove', handleDragMove);
    window.removeEventListener('touchend', handleDragEnd);
    window.removeEventListener('pointermove', handleDragMove);
    window.removeEventListener('pointerup', handleDragEnd);
  }, [appContext.setIsScrollLockActive, handleDragMove]); // Added handleDragMove dependency as it's called from window listeners


  useEffect(() => {
    const domElement = gl.domElement;
    domElement.style.touchAction = 'none';

    const currentHandleDragStart = handleDragStart; // Capture current ref for cleanup

    domElement.addEventListener('pointerdown', currentHandleDragStart as EventListener);
    domElement.addEventListener('touchstart', currentHandleDragStart as EventListener, { passive: false });

    return () => {
      domElement.removeEventListener('pointerdown', currentHandleDragStart as EventListener);
      domElement.removeEventListener('touchstart', currentHandleDragStart as EventListener);
      // Ensure window event listeners are also cleaned up, though they are added/removed in dragStart/End
      window.removeEventListener('pointermove', handleDragMove);
      window.removeEventListener('pointerup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
      if (domElement.parentElement) domElement.parentElement.style.cursor = 'default';
    };
  }, [gl, handleDragStart, handleDragMove, handleDragEnd]); // Added handleDragMove, handleDragEnd

  useFrame((state, delta) => {
    if (group.current) {
      if (autoRotateRef.current && !isDraggingRef.current) {
        groupRotationYRef.current += rotationSpeed * delta * 60;
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

// Resizer Component
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
        handleResize(); // Initial call
        const resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(container);
        window.addEventListener('resize', handleResize);
        return () => {
          if (container) resizeObserver.unobserve(container);
          window.removeEventListener('resize', handleResize);
        };
    }
  }, [camera, gl, container]); // container is now stable due to useMemo
  return null;
});
Resizer.displayName = 'Resizer';


export function EquipmentLockerSection({ parallaxOffset }: SectionProps) {
  const appContext = useAppContext();
  const { 
    openTODWindow, 
    closeTODWindow, 
    playerInventory, 
    getItemById,
    openSpyShop // Get openSpyShop from context
  } = appContext;
  const [selectedItem3D, setSelectedItem3D] = useState<GameItemBase | null>(null);
  const { theme: currentGlobalTheme, themeVersion } = useTheme(); // Get theme for HolographicButton

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
    setSelectedItem3D(item); // Update state, though it's not directly used for this modal
    const itemLevelForColor = item.level || 1;
    const itemColorCssVar = ITEM_LEVEL_COLORS_CSS_VARS[itemLevelForColor as ItemLevel] || 'var(--muted-color)';
    const fallbackImageSrc = '/Spi vs Spi icon.png'; // General fallback

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
      </div>, // Comma here is crucial
      { 
        showCloseButton: true, 
        explicitTheme: currentGlobalTheme, 
        themeVersion: themeVersion
      }
    );
  }, [openTODWindow, closeTODWindow, currentGlobalTheme, themeVersion, setSelectedItem3D]);


  return (
    <div className="flex flex-col items-center justify-center p-4 md:p-6 h-full max-w-4xl mx-auto">
      <HolographicPanel
        id="equipment-locker-section"
        className="w-full h-full flex flex-col items-center p-2 md:p-4 overflow-hidden" // Keep overflow-hidden for panel itself
        explicitTheme={currentGlobalTheme} 
      >
        <div className="flex-shrink-0 w-full flex items-center justify-between my-2 md:my-3 px-2">
          <h2 className="text-xl md:text-2xl font-orbitron holographic-text text-center flex-grow">Equipment Locker</h2>
          <HolographicButton
            onClick={openSpyShop} // Use openSpyShop from context
            className="!p-2" // Ensure padding is small for icon button
            aria-label="Open Spy Shop"
            explicitTheme={currentGlobalTheme} // Pass theme
          >
            <ShoppingCart className="w-5 h-5 icon-glow" />
          </HolographicButton>
        </div>
        
        {/* Container for the Canvas - ensure it allows touch actions for R3F */}
        <div 
          id="locker-carousel-canvas-container"
          className="w-full flex-grow min-h-0 relative touch-auto" // touch-auto might be default, ensure R3F handles touch
          style={{ cursor: 'grab', touchAction: 'none' }} // touchAction: 'none' for R3F to handle gestures
        >
          {carouselItemsData.length > 0 ? (
            <Canvas
              id="locker-carousel-canvas"
              camera={{ position: [0, 0.5, carouselRadius * 2.25], fov: 60 }} // Adjusted camera distance
              shadows
              gl={{ antialias: true, alpha: true }}
              style={{ background: 'transparent' }} // Make canvas background transparent
              onCreated={({ gl }) => {
                gl.setClearColor(0x000000, 0); // Set clear color to transparent
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
