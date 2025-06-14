// src/components/game/tod/EquipmentLockerSection.tsx
// This file likely contains the logic for displaying and interacting with a 3D carousel
// of equipment in the player's locker.

"use client";

import React, { useRef, useState, useEffect, useCallback, useLayoutEffect } from 'react';
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useAppContext } from '@/contexts/AppContext';
import { HolographicPanel, HolographicButton } from '@/components/game/shared/HolographicPanel';
import { cn } from '@/lib/utils';
import { ITEM_LEVEL_COLORS_CSS_VARS } from '@/lib/constants'; // Assuming this is needed for item colors
import { getItemById, type GameItemBase, type ItemLevel } from '@/lib/game-items'; // For item data

interface SectionProps {
  parallaxOffset: number;
}

// Placeholder for your item data (adapt from your game-items.ts or directly import items)
// This should match the structure of what you intend to display in the carousel.
const MOCK_LOCKER_ITEMS: GameItemBase[] = [
  // Example items - replace with actual data from your game-items.ts
  getItemById('pick_l1')!, // Assuming pick_l1 exists and is level 1
  getItemById('hydraulic_drill_l2')!,
  getItemById('code_injector_l3')!,
  getItemById('sonic_pulser_l4')!,
  getItemById('biometric_seal_l5')!, // Locks can also be displayed here if relevant
  getItemById('temporal_dephaser_l6')!,
  getItemById('quantum_dephaser_l7')!,
].filter(Boolean); // Filter out any undefined if getItemById fails

const itemWidth = 1.5;
const itemHeight = 1.5;
const carouselRadius = 3.5; // Adjust as needed for spacing
const rotationSpeed = 0.0025; // Autoscroll speed

// A component to render individual carousel items
interface CarouselItemProps {
  itemData: GameItemBase;
  index: number;
  totalItems: number;
  carouselRadius: number;
  onItemClick: (item: GameItemBase, mesh: THREE.Mesh) => void;
  // hasDragged prop is removed as per instructions
}

function CarouselItem({ itemData, index, totalItems, carouselRadius, onItemClick }: CarouselItemProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const textureLoader = new THREE.TextureLoader();
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (itemData.imageSrc) {
      textureLoader.load(
        itemData.imageSrc,
        (loadedTexture) => {
          setTexture(loadedTexture);
          if (meshRef.current) {
            // Ensure userData exists or create it
            meshRef.current.userData = meshRef.current.userData || {};
            // Assign the data
            meshRef.current.userData.itemData = itemData;
          }
        },
        undefined,
        (error) => {
          console.error(`Failed to load texture for ${itemData.name}:`, error);
          textureLoader.load(
            '/Spi vs Spi icon.png',
            (fallbackTexture) => {
              setTexture(fallbackTexture);
              if (meshRef.current) {
                const mesh = meshRef.current as THREE.Mesh;
                if (!mesh.userData) {
                  mesh.userData = {};
                }
                mesh.userData.name = `${itemData.name} (Fallback)`;
                mesh.userData.imageUrl = '/Spi vs Spi icon.png';
              }
            },
            undefined,
            (fallbackError) => {
              console.error('Failed to load fallback texture (no imageSrc provided):', fallbackError);
            }
          );
        }
      );
    } else {
        textureLoader.load(
          '/Spi vs Spi icon.png',
          (fallbackTexture) => {
            setTexture(fallbackTexture);
            if (meshRef.current) {
              const mesh = meshRef.current as THREE.Mesh;
              if (!mesh.userData) {
                mesh.userData = {};
              }
              mesh.userData.name = `${itemData.name} (No Image)`;
              mesh.userData.imageUrl = '/Spi vs Spi icon.png';
            }
          },
          undefined,
          (fallbackError) => {
            console.error('Failed to load fallback texture (no imageSrc provided):', fallbackError);
          }
        );
    }
  }, [itemData.imageSrc, textureLoader, itemData.name]);

  const angle = (index / totalItems) * Math.PI * 2;
  const x = carouselRadius * Math.sin(angle);
  const z = carouselRadius * Math.cos(angle);

  useLayoutEffect(() => {
    if (meshRef.current) {
      meshRef.current.position.set(x, 0, z);
      meshRef.current?.lookAt(new THREE.Vector3(0, 0, 0)); 
      meshRef.current.rotation.y += Math.PI; 
    }
  }, [x, z]);

  return (
    <mesh
      ref={meshRef}
      onClick={(event) => { // Keep event parameter
        // No drag check here, relying on parent's pointerup to stop propagation for drags
        console.log("CarouselItem onClick: Triggered");
        onItemClick(itemData, meshRef.current!); // Always call onItemClick

      }}
      castShadow 
      receiveShadow 
    >
      <planeGeometry args={[itemWidth, itemHeight]} />
      {texture ? (
        <meshBasicMaterial map={texture} />
      ) : (
        <meshBasicMaterial color="grey" />
      )}
    </mesh>
  );

}


// Main Carousel Scene Component
function EquipmentCarousel({ itemsData, onItemClick }: { itemsData: GameItemBase[], onItemClick: (item: GameItemBase, mesh: THREE.Mesh) => void }) {
  const group = useRef<THREE.Group>(null!);
  const { camera, invalidate, gl } = useThree();

  const groupRotationRef = useRef(0); // Stores the current rotation for continuity

  // Create refs for state variables to avoid stale closures
  const isDraggingRef = useRef(false);
  const previousClientXRef = useRef(0);
  const autoRotateRef = useRef(true);
  const pointerDownTimeRef = useRef(0); // Ref to store pointerdown timestamp

  // Create a ref for the Raycaster
  const raycaster = useRef(new THREE.Raycaster());
  // Create a ref for the mouse position (will store normalized device coordinates)
  const mouse = useRef(new THREE.Vector2());
  // Ref to track which type of listeners were added
  const activeListenerTypeRef = useRef<'pointer' | 'touch' | null>(null);


  // Keep state variables for rendering and other effects
  const [isDragging, setIsDragging] = useState(false);
  const [previousClientX, setPreviousClientX] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);

  // Get the scroll lock state from AppContext
  const { isScrollLockActive, setIsScrollLockActive } = useAppContext();

  const hasDragged = useRef(false); // Add a ref to track if a drag has occurred 

  // handleCanvasPointerMove uses refs (for both mouse and touch)
  // Accept PointerEvent or TouchEvent
  const handleCanvasPointerMove = useCallback((event: PointerEvent | TouchEvent) => {
    // Use the correct clientX based on event type
    let clientX = 0;
    if (event.type === 'touchmove') { // Check if it's a TouchEvent specifically
        const touchEvent = event as TouchEvent;
        if (touchEvent.touches && touchEvent.touches.length > 0) {
            clientX = touchEvent.touches[0].clientX || 0;
        } else {
            console.warn("touchmove event with no touches found");
            return; // Exit if no touch points found
        }
    } else { // Handle PointerEvent (mouse or other pointer types)
        const pointerEvent = event as PointerEvent;
        clientX = pointerEvent.clientX || 0;
    }


    console.log("handleCanvasPointerMove triggered (window)", { clientX, isDragging: isDraggingRef.current, eventType: event.type });
    if (!isDraggingRef.current) { // Use ref
        console.log("handleCanvasPointerMove (window): Not dragging, returning");
        return;
    }

    // Prevent default touch behaviors that might trigger scrolling
    // Keep preventDefault here for touch events
    // Only prevent default if cancelable and it's a touch event
    if (event.cancelable) { // Only prevent default if cancelable
        event.preventDefault();
    }
    event.stopPropagation(); // Stop propagation


    const deltaX = clientX - previousClientXRef.current; // Use ref
    console.log("handleCanvasPointerMove (window): deltaX", deltaX);

    if (Math.abs(deltaX) > 1) {
        hasDragged.current = true;
        console.log("handleCanvasPointerMove (window): hasDragged set to true");
    }

    if (group.current) {
      console.log("handleCanvasPointerMove (window): Updating rotation");
      group.current.rotation.y += deltaX * 0.005;
      groupRotationRef.current = group.current.rotation.y;
      invalidate();
      console.log("handleCanvasPointerMove (window): New rotation", group.current.rotation.y);
    } else {
        console.log("handleCanvasPointerMove (window): group.current is null");
    }
    previousClientXRef.current = clientX; // Update ref immediately
    console.log("handleCanvasPointerMove (window): previousClientX updated (ref)", previousClientXRef.current);
  }, [invalidate, group]); // Dependencies only include values that don't cause staleness


  // handleCanvasPointerUp uses refs and refined drag detection (for both mouse and touch)
  // Accept PointerEvent or TouchEvent
  const handleCanvasPointerUp = useCallback((event: PointerEvent | TouchEvent) => { // Accept both PointerEvent and TouchEvent
    console.log("handleCanvasPointerUp triggered (window)", { eventType: event.type });

    // Refined drag detection: check distance moved and time elapsed
    // Use the correct clientX based on event type for the final position
    let finalClientX = 0;
    let clientY = 0; // Also need clientY for raycasting
    if (event.type === 'touchend' || event.type === 'touchcancel') { // Check if it's a TouchendEvent specifically
        const touchEvent = event as TouchEvent;
        // Use changedTouches for the end position in touchend
        if (touchEvent.changedTouches && touchEvent.changedTouches.length > 0) {
            finalClientX = touchEvent.changedTouches[0].clientX || 0;
            clientY = touchEvent.changedTouches[0].clientY || 0;
        } else {
            console.warn("touchend event with no changedTouches found");
            // If no changedTouches, use the last known position from previousClientXRef
            finalClientX = previousClientXRef.current;
            // We don't have a reliable final Y for raycasting in this case
            // This might affect click detection in the edges, but is a fallback
            clientY = 0; // Fallback Y
        }
    } else { // Handle PointerEvent (mouse or other pointer types)
        const pointerEvent = event as PointerEvent;
        finalClientX = pointerEvent.clientX || 0;
        clientY = pointerEvent.clientY || 0;
    }


    const dragDistance = Math.abs(finalClientX - previousClientXRef.current); // Use ref for start, finalClientX for end
    const dragDuration = performance.now() - pointerDownTimeRef.current;

    const isClick = dragDistance < 10 && dragDuration < 300; // Adjusted thresholds


    setIsDragging(false);
    isDraggingRef.current = false; // Update ref immediately
    setAutoRotate(true);
    autoRotateRef.current = true; // Update ref immediately;

    // Release scroll lock
    setIsScrollLockActive(false);


    const canvasElement = document.getElementById('locker-carousel-canvas');
    if (canvasElement) canvasElement.style.cursor = 'grab';


    // Remove event listeners from the window (remove both pointer and touch based on activeListenerTypeRef)
    if (activeListenerTypeRef.current === 'touch') {
        console.log("handleCanvasPointerUp (window): Removing touchmove and touchend listeners from window");
        window.removeEventListener('touchmove', handleCanvasPointerMove as EventListener);
        window.removeEventListener('touchend', handleCanvasPointerUp as EventListener);
    } else if (activeListenerTypeRef.current === 'pointer') {
        console.log("handleCanvasPointerUp (window): Removing pointermove and pointerup listeners from window");
        window.removeEventListener('pointermove', handleCanvasPointerMove as EventListener);
        window.removeEventListener('pointerup', handleCanvasPointerUp as EventListener);
    }
    activeListenerTypeRef.current = null; // Reset the active listener type


    // If it was a click, manually trigger onItemClick
    if (isClick) {
        console.log("handleCanvasPointerUp (window): Detected click, attempting to trigger onItemClick via raycast");

        // Perform raycast at the click position
        const canvasBounds = gl.domElement.getBoundingClientRect();
        mouse.current.x = ((finalClientX - canvasBounds.left) / canvasBounds.width) * 2 - 1;
        mouse.current.y = -((clientY - canvasBounds.top) / canvasBounds.height) * 2 + 1;

        raycaster.current.setFromCamera(mouse.current, camera);

        // Find intersected objects in the group (CarouselItems)
        const intersects = raycaster.current.intersectObjects(group.current ? group.current.children : []);

        if (intersects.length > 0) {
            // Find the closest intersected mesh that is a CarouselItem
            const intersectedMesh = intersects.find(intersect =>
                intersect.object instanceof THREE.Mesh && intersect.object.userData && intersect.object.userData.itemData
            )?.object as THREE.Mesh | undefined;

            if (intersectedMesh && intersectedMesh.userData && intersectedMesh.userData.itemData) {
                console.log("handleCanvasPointerUp (window): Intersected with item", intersectedMesh.userData.itemData.name);
                // Trigger the onItemClick callback with the item data
                onItemClick(intersectedMesh.userData.itemData, intersectedMesh);
            } else {
                console.log("handleCanvasPointerUp (window): Intersected with mesh, but not a CarouselItem or missing itemData");
            }
        } else {
            console.log("handleCanvasPointerUp (window): No intersection detected at click position");
        }


    } else {
        // It was a drag, prevent any potential R3F click event from firing
        console.log("handleCanvasPointerUp (window): Detected drag, stopping propagation");
        event.stopPropagation();
        if (event.nativeEvent && typeof event.nativeEvent.stopImmediatePropagation === 'function') {
            event.nativeEvent.stopImmediatePropagation();
        }
    }


  }, [setIsDragging, setAutoRotate, handleCanvasPointerMove, setIsScrollLockActive, onItemClick, camera, gl, group, raycaster, mouse]); // Added dependencies for raycasting


  // New handleCanvasPointerDown for the canvas (for both mouse and touch)
  // Accept PointerEvent or TouchEvent
  const handleCanvasPointerDown = useCallback((event: PointerEvent | TouchEvent) => { // Accept both PointerEvent and TouchEvent
    // Determine clientX based on event type
    let clientX = 0;
    let isTouchEvent = false;
    if (event.type === 'touchstart') { // Check if it's a TouchEvent specifically
        isTouchEvent = true;
        const touchEvent = event as TouchEvent;
        if (touchEvent.touches && touchEvent.touches.length > 0) {
            clientX = touchEvent.touches[0].clientX || 0;
        } else {
            console.warn("touchstart event with no touches found");
            return; // Exit if no touch points found on touchstart
        }
    } else { // Handle PointerEvent (mouse or other pointer types)
        const pointerEvent = event as PointerEvent;
        clientX = pointerEvent.clientX || 0;
        // Check if it's a primary button click for mouse events
        if (pointerEvent.button !== 0 && pointerEvent.pointerType === 'mouse') {
            return; // Ignore non-left mouse clicks
        }
    }


    console.log("handleCanvasPointerDown triggered (canvas)", { clientX, eventType: event.type, pointerType: (event as PointerEvent).pointerType });


    // Update state and refs
    setIsDragging(true);
    isDraggingRef.current = true; // Update ref immediately
    setAutoRotate(false);
    autoRotateRef.current = false; // Update ref immediately

    // Activate scroll lock
    setIsScrollLockActive(true);

    setPreviousClientX(clientX); // Use the determined clientX
    previousClientXRef.current = clientX; // Update ref immediately


    hasDragged.current = false; // Reset drag flag

    pointerDownTimeRef.current = performance.now(); // Record timestamp


    const canvasElement = document.getElementById('locker-carousel-canvas');
    if (canvasElement) {
      canvasElement.style.cursor = 'grabbing';
      console.log("handleCanvasPointerDown (canvas): Cursor set to grabbing");
    } else {
      console.log("handleCanvasPointerDown (canvas): Canvas element not found for cursor change");
    }


    // Add event listeners to the window based on the event type
    if(isTouchEvent) {
        console.log("handleCanvasPointerDown (canvas): Adding touchmove and touchend listeners to window");
        window.addEventListener('touchmove', handleCanvasPointerMove as EventListener); // Use handleCanvasPointerMove for touchmove
        window.addEventListener('touchend', handleCanvasPointerUp as EventListener); // Use handleCanvasPointerUp for touchend
        activeListenerTypeRef.current = 'touch'; // Set active listener type
    } else {
        console.log("handleCanvasPointerDown (canvas): Adding pointermove and pointerup listeners to window");
        window.addEventListener('pointermove', handleCanvasPointerMove as EventListener);
        window.addEventListener('pointerup', handleCanvasPointerUp as EventListener);
        activeListenerTypeRef.current = 'pointer'; // Set active listener type
    }


    // Prevent default to avoid potential conflicts with other events, especially on mobile
    // Prevent default if cancelable
    if (event.cancelable) {
        event.preventDefault();
    }
    event.stopPropagation(); // Stop propagation for pointerdown/touchstart on the canvas container


  }, [setIsDragging, setAutoRotate, setPreviousClientX, handleCanvasPointerMove, handleCanvasPointerUp, setIsScrollLockActive]); // Dependencies include state setters and handlers


  useFrame(() => {
    // Use refs for autoRotate and isDragging in useFrame
    if (group.current && autoRotateRef.current && !isDraggingRef.current) {
      group.current.rotation.y += rotationSpeed;
      groupRotationRef.current = group.current.rotation.y;
      invalidate();
    }

    let currentFrontItem: THREE.Object3D | null = null; 
    let smallestZ = Infinity;

    if (group.current) {
        group.current.children.forEach(item => {
            const threeObject = item as THREE.Object3D; 
            const worldPosition = new THREE.Vector3();
            threeObject.getWorldPosition(worldPosition);

            worldPosition.project(camera);

            if (worldPosition.z < smallestZ) {
                smallestZ = worldPosition.z;
                currentFrontItem = threeObject; 
            }
        });
    }

    if (currentFrontItem) { 
        const typedItem = currentFrontItem as THREE.Object3D & { userData: { name?: string; imageUrl?: string } };
        if (typedItem.userData.name) { 
        }
    }
  });


  // Effect to attach/remove pointerdown and touchstart listener on the canvas container (div)
  useEffect(() => {
      const canvasElement = document.getElementById('locker-carousel-canvas');
      console.log("useEffect (canvas pointerdown/touchstart): Looking for canvas with id 'locker-carousel-canvas'", canvasElement);
      if (canvasElement instanceof HTMLDivElement) { // It's the div container
          console.log("useEffect (canvas pointerdown/touchstart): Found canvas container, adding listeners");
          // Add listeners to the div container
          canvasElement.addEventListener('pointerdown', handleCanvasPointerDown as EventListener);
          canvasElement.addEventListener('touchstart', handleCanvasPointerDown as EventListener); // Add touchstart here


      } else {
          console.log("useEffect (canvas pointerdown/touchstart): Canvas container not found or not a DivElement");
      }


      // Cleanup: remove listeners
      return () => {
          console.log("useEffect cleanup (canvas pointerdown/touchstart): Removing listeners from canvas container");
          if (canvasElement instanceof HTMLDivElement) {
              canvasElement.removeEventListener('pointerdown', handleCanvasPointerDown as EventListener);
              canvasElement.removeEventListener('touchstart', handleCanvasPointerDown as EventListener); // Remove touchstart here
          }
      };
  }, [handleCanvasPointerDown]); // Dependency includes the handler


  return (
    <group
        ref={group}
        // Remove onPointerDown from the group
        // onPointerDown={onPointerDown}
    >
      {itemsData.map((item, index) => (
        <CarouselItem
          key={item.id}
          itemData={item}
          index={index}
          totalItems={itemsData.length}
          carouselRadius={carouselRadius}
          onItemClick={onItemClick} // Keep onItemClick prop
        />
      ))}
    </group>
  );
}


export function EquipmentLockerSection({ parallaxOffset }: SectionProps) {
  const { openTODWindow, closeTODWindow } = useAppContext();
  const [selectedItem, setSelectedItem] = useState<GameItemBase | null>(null);

  const handleItemClick = useCallback((item: GameItemBase, mesh: THREE.Mesh) => {
    setSelectedItem(item);
    openTODWindow(
      item.title || item.name,
      <div className="font-rajdhani p-4 text-center">
        <h3 className="text-xl font-bold mb-2 text-primary">{item.title || item.name}</h3>
        <p className="text-gray-300 mb-2">{item.description}</p>
        <p className="text-sm text-gray-400">Level: {item.level} | Cost: {item.cost} ELINT</p>
        {item.strength && <p className="text-sm text-gray-400">Strength: {item.strength.current}</p>}
        {item.resistance && <p className="text-sm text-gray-400">Resistance: {item.resistance.current}</p>}
        {item.minigameEffect && <p className="text-sm text-gray-400">Effect: {item.minigameEffect}</p>}
        <HolographicButton onClick={closeTODWindow} className="mt-4">Close</HolographicButton>
      </div>,
      { showCloseButton: true } 
    );
  }, [openTODWindow, closeTODWindow]);

  const canvasContainerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%', 
    maxWidth: '600px', 
    height: '400px', 
    margin: '0 auto',
    borderRadius: '1rem',
    boxShadow: '0 0 30px rgba(0, 255, 255, 0.4)',
    cursor: 'grab',
  };


  return (
    <div className="flex flex-col p-3 md:p-4 h-full overflow-hidden space-y-3 md:space-y-4 max-w-4xl mx-auto">
      <div className="flex-none flex items-center justify-center pt-6">
        <h2 className="text-2xl font-orbitron holographic-text" 
        >Equipment Locker</h2> 
      </div>

      <div className="flex-grow flex flex-col items-center justify-center min-h-0">
        <HolographicPanel className="w-full h-full max-h-[500px] flex flex-col items-center justify-center p-4">
          <h3 className="text-xl font-bold text-emerald-400 mb-4">Your Gear</h3>
          
          <div id="locker-carousel-container" style={canvasContainerStyle}>
            <Canvas
              id="locker-carousel-canvas" 
              camera={{ position: [0, 0, carouselRadius * 1.5], fov: 75 }}
              shadows
            >
              <><ambientLight intensity={0.7} />
                <pointLight position={[10, 10, 10]} intensity={0.5} castShadow />
                {/* UNCOMMENTED: EquipmentCarousel to test its effect */}
 <EquipmentCarousel itemsData={MOCK_LOCKER_ITEMS} onItemClick={handleItemClick} />

                {/* Remaining components are still commented out */}
                {/* <pointLight position={[-10, -10, -10]} intensity={0.3} /> */}
                 <Resizer /> 
                {/* <OrbitControls enableZoom={false} enablePan={false} enableRotate={true} /> */}
              </>
            </Canvas>
          </div>

          <p className="text-center text-gray-300 mt-4">
            Drag the carousel to view your formidable arsenal. Click an item for details!
          </p>
        </HolographicPanel>
      </div>
    </div>
  );
}

// Resizer component re-added
function Resizer() {
  const { camera, gl } = useThree();
  const container = document.getElementById('locker-carousel-container');

  useEffect(() => {
    const handleResize = () => {
      if (container) {
        const width = container.offsetWidth;
        const height = container.offsetHeight;

        gl.setSize(width, height);
        (camera as THREE.PerspectiveCamera).aspect = width / height;
        (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, [camera, gl, container]);

  return null;
}
