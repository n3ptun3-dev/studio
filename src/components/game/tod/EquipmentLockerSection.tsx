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
  getItemById('universal_key_l8')!,
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
}

function CarouselItem({ itemData, index, totalItems, carouselRadius, onItemClick }: CarouselItemProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const textureLoader = new THREE.TextureLoader();
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (itemData.imageSrc) {
      textureLoader.load(
        itemData.imageSrc,
        // On load callback
        (loadedTexture) => {
          setTexture(loadedTexture);
          // Set userData here after texture loads and meshRef is current
          if (meshRef.current) {
            // Ensure meshRef.current is treated as a THREE.Mesh for TypeScript,
            // then ensure userData is an object before assigning
            const mesh = meshRef.current as THREE.Mesh;
            if (!mesh.userData) {
              mesh.userData = {};
            }
            // Now, assign directly. TypeScript should know userData is an object.
            mesh.userData.name = itemData.name;
            mesh.userData.imageUrl = itemData.imageSrc;
          }
        },
        // On progress callback (optional)
        undefined,
        // On error callback
        (error) => {
          console.error(`Failed to load texture for ${itemData.name}:`, error);
          // Fallback to the generic Spi vs Spi icon
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
              console.error('Failed to load fallback texture:', fallbackError);
            }
          );
        }
      );
    } else {
        // If imageSrc is not defined, load the default fallback icon
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


  // Calculate initial position on the carousel circle
  const angle = (index / totalItems) * Math.PI * 2;
  const x = carouselRadius * Math.sin(angle);
  const z = carouselRadius * Math.cos(angle);

  // Position and make item face the center
  useLayoutEffect(() => {
    if (meshRef.current) {
      meshRef.current.position.set(x, 0, z);
      // Ensure lookAt is called with a new Vector3 to avoid modifying the original
      meshRef.current?.lookAt(new THREE.Vector3(0, 0, 0)); 
      meshRef.current.rotation.y += Math.PI; // Correct for plane orientation if needed
    }
  }, [x, z]);

  return (
    <mesh
      ref={meshRef}
      onClick={() => onItemClick(itemData, meshRef.current)}
      castShadow
      receiveShadow
    >
      <planeGeometry args={[itemWidth, itemHeight]} />
      {texture && <meshBasicMaterial map={texture} side={THREE.DoubleSide} transparent={true} />}
      {!texture && <meshBasicMaterial color="gray" />} {/* Placeholder if texture not loaded */}
    </mesh>
  );
}


// Main Carousel Scene Component
function EquipmentCarousel({ itemsData, onItemClick }: { itemsData: GameItemBase[], onItemClick: (item: GameItemBase, mesh: THREE.Mesh) => void }) {
  const group = useRef<THREE.Group>(null!);
  const { camera, invalidate } = useThree();

  const groupRotationRef = useRef(0); // Stores the current rotation for continuity

  const [isDragging, setIsDragging] = useState(false); // Correctly using useState
  const [previousClientX, setPreviousClientX] = useState(0); // Correctly using useState
  const [autoRotate, setAutoRotate] = useState(true); // Correctly using useState

  // Handle pointer down (mouse/touch start) - using ThreeEvent
  const onPointerDown = useCallback((event: ThreeEvent<PointerEvent>) => {
    // Check if it's a click on an item or on the background
    // If it's a background click, start dragging
    // event.object refers to the Three.js object that was clicked
    if (event.object === group.current) { 
        setIsDragging(true); // Correct way to update state
        setAutoRotate(false); // Correct way to update state
        setPreviousClientX(event.clientX || 0); // Correct way to update state
        const canvasElement = document.getElementById('locker-carousel-canvas');
        if (canvasElement) canvasElement.style.cursor = 'grabbing';
    }
  }, []); // Dependencies are fine here

  // Handle pointer move (mouse/touch move) - using ThreeEvent
  const onPointerMove = useCallback((event: ThreeEvent<PointerEvent>) => {
    if (!isDragging) return;
    const deltaX = (event.clientX || 0) - previousClientX;
    if (group.current) {
      group.current.rotation.y += deltaX * 0.005; // Adjust sensitivity
      groupRotationRef.current = group.current.rotation.y; // Keep the ref updated
      invalidate(); // Request re-render only if dragging
    }
    setPreviousClientX(event.clientX || 0); // Correct way to update state
  }, [isDragging, previousClientX, invalidate]); // Added previousClientX to dependencies

  // Handle pointer up (mouse/touch end) - using ThreeEvent
  const onPointerUp = useCallback((event: ThreeEvent<PointerEvent>) => { 
    setIsDragging(false); // Correct way to update state
    setAutoRotate(true); // Correct way to update state
    const canvasElement = document.getElementById('locker-carousel-canvas');
    if (canvasElement) canvasElement.style.cursor = 'grab';
  }, []); // Dependencies are fine here

  // Animation loop with useFrame
  useFrame(() => {
    if (group.current && autoRotate && !isDragging) {
      group.current.rotation.y += rotationSpeed;
      groupRotationRef.current = group.current.rotation.y; // Keep the ref updated
      invalidate(); // Request re-render only if auto-rotating
    }

    // Determine the currently front-facing item for display title
    let currentFrontItem: THREE.Object3D | null = null; // Explicitly type as THREE.Object3D
    let smallestZ = Infinity;

    if (group.current) {
        group.current.children.forEach(item => {
            // Explicitly cast 'item' to THREE.Object3D here to help TypeScript
            const threeObject = item as THREE.Object3D; 
            const worldPosition = new THREE.Vector3();
            threeObject.getWorldPosition(worldPosition);

            worldPosition.project(camera);

            if (worldPosition.z < smallestZ) {
                smallestZ = worldPosition.z;
                currentFrontItem = threeObject; // Assign the explicitly typed object
            }
        });
    }

    // Update the item name display in the DOM (passed via onItemClick or a direct prop)
    if (currentFrontItem) { 
        // Forcefully assert the type of currentFrontItem and its userData for access
        // This is safe now because we ensure userData exists and has these properties in CarouselItem
        const typedItem = currentFrontItem as THREE.Object3D & { userData: { name?: string; imageUrl?: string } };
        if (typedItem.userData.name) { 
             // You'll need a way to pass this name up to the parent component (EquipmentLockerSection)
             // For now, we'll just log it or you can update a state variable in EquipmentLockerSection
             // via a prop function.
             // console.log("Front Item:", typedItem.userData.name);
        }
    }
  });

  return (
    <group
        ref={group}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={() => { // Ensure dragging stops if pointer leaves the canvas area
            if (isDragging) { 
                setIsDragging(false); // Correct way to update state
                setAutoRotate(true); // Correct way to update state
                const canvasElement = document.getElementById('locker-carousel-canvas');
                if (canvasElement) canvasElement.style.cursor = 'grab';
            }
        }}>
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


export function EquipmentLockerSection({ parallaxOffset }: SectionProps) {
  const { openTODWindow, closeTODWindow } = useAppContext();
  const [selectedItem, setSelectedItem] = useState<GameItemBase | null>(null);

  const handleItemClick = useCallback((item: GameItemBase, mesh: THREE.Mesh) => {
    setSelectedItem(item);
    // Open a TOD window with item details
    openTODWindow(
      item.title || item.name,
      <div className="font-rajdhani p-4 text-center">
        <h3 className="text-xl font-bold mb-2 text-primary">{item.title || item.name}</h3>
        <p className="text-gray-300 mb-2">{item.description}</p>
        <p className="text-sm text-gray-400">Level: {item.level} | Cost: {item.cost} ELINT</p>
        {item.strength && <p className="text-sm text-gray-400">Strength: {item.strength.current}</p>}
        {item.resistance && <p className="text-sm text-gray-400">Resistance: {item.resistance.current}</p>}
        {item.minigameEffect && <p className="text-sm text-gray-400">Effect: {item.minigameEffect}</p>}
        {/* Add more details as needed */}
        <HolographicButton onClick={closeTODWindow} className="mt-4">Close</HolographicButton>
      </div>,
      { showCloseButton: true } // Ensure it has a close button
    );
  }, [openTODWindow, closeTODWindow]);

  // Adjust canvas container styles to be more flexible and responsive
  const canvasContainerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%', // Take full width of parent
    maxWidth: '600px', // Max width for desktop
    height: '400px', // Fixed height for carousel
    margin: '0 auto',
    borderRadius: '1rem',
    overflow: 'hidden',
    boxShadow: '0 0 30px rgba(0, 255, 255, 0.4)',
    cursor: 'grab',
  };

  return (
    <div className="flex flex-col p-3 md:p-4 h-full overflow-hidden space-y-3 md:space-y-4 max-w-4xl mx-auto">
      <div className="flex-none flex items-center justify-center pt-6">
        <h2 className="text-2xl font-orbitron holographic-text">Equipment Locker</h2>
      </div>
      <div className="flex-grow flex flex-col items-center justify-center min-h-0">
        <HolographicPanel className="w-full h-full max-h-[500px] flex flex-col items-center justify-center p-4">
          <h3 className="text-xl font-bold text-emerald-400 mb-4">Your Gear</h3>
          <div id="locker-carousel-container" style={canvasContainerStyle}>
            <Canvas
              id="locker-carousel-canvas" // Ensure unique ID for this canvas
              camera={{ position: [0, 0, carouselRadius * 1.5], fov: 75 }}
              shadows
            >
              {/* No whitespace or newlines between these JSX elements */}
              <><ambientLight intensity={0.7} /><pointLight position={[10, 10, 10]} intensity={0.5} castShadow /><pointLight position={[-10, -10, -10]} intensity={0.3} /><EquipmentCarousel itemsData={MOCK_LOCKER_ITEMS} onItemClick={handleItemClick} /><Resizer /></>
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
    // Initial resize call
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, [camera, gl, container]);

  return null;
}
