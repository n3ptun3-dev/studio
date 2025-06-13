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
  hasDragged: boolean; // Add this prop
}

function CarouselItem({ itemData, index, totalItems, carouselRadius, onItemClick, hasDragged }: CarouselItemProps) {
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
              console.error('Failed to load fallback texture:', fallbackError);
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
      onClick={() => { // Modify onClick 
        if (!hasDragged) { // Only trigger onClick if no drag occurred 
          onItemClick(itemData, meshRef.current!); 
        } 
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
  const { camera, invalidate } = useThree();

  const groupRotationRef = useRef(0); // Stores the current rotation for continuity

  const [isDragging, setIsDragging] = useState(false); 
  const [previousClientX, setPreviousClientX] = useState(0); 
  const [autoRotate, setAutoRotate] = useState(true); 

  const hasDragged = useRef(false); // Add a ref to track if a drag has occurred 
  const canvasRef = useRef<HTMLCanvasElement>(null); // Add a ref for the canvas element 

  const handleCanvasPointerMove = useCallback((event: PointerEvent) => { 
    if (!isDragging) return; 
    const deltaX = (event.clientX || 0) - previousClientX; 

    if (Math.abs(deltaX) > 1) { // Consider it a drag if moved more than 1 pixel 
      hasDragged.current = true; 
    } 

    if (group.current) { 
      group.current.rotation.y += deltaX * 0.005; 
      groupRotationRef.current = group.current.rotation.y; 
      invalidate(); 
    } 
    setPreviousClientX(event.clientX || 0); 
  }, [isDragging, previousClientX, invalidate, group]); // Added group to dependency array - good practice


  const handleCanvasPointerUp = useCallback(() => { 
    setIsDragging(false); 
    setAutoRotate(true); 
    const canvasElement = document.getElementById('locker-carousel-canvas'); 
    if (canvasElement) canvasElement.style.cursor = 'grab'; 

    // Remove event listeners from the canvas when dragging ends 
    if (canvasRef.current) { 
        canvasRef.current.removeEventListener('pointermove', handleCanvasPointerMove); 
        canvasRef.current.removeEventListener('pointerup', handleCanvasPointerUp); 
    } 

  }, [setIsDragging, setAutoRotate, handleCanvasPointerMove]); // ADDED handleCanvasPointerMove here


  const onPointerDown = useCallback((event: ThreeEvent<PointerEvent>) => { 
    // Keep this on the group to start drag when clicking on an item 
    setIsDragging(true); 
    setAutoRotate(false); 
    setPreviousClientX(event.clientX || 0); 
    hasDragged.current = false; // Reset drag flag on pointer down 
    const canvasElement = document.getElementById('locker-carousel-canvas'); 
    if (canvasElement) canvasElement.style.cursor = 'grabbing'; 

    // Add event listeners to the canvas when dragging starts 
    if (canvasRef.current) { 
        canvasRef.current.addEventListener('pointermove', handleCanvasPointerMove); 
        canvasRef.current.addEventListener('pointerup', handleCanvasPointerUp); 
    } 

  }, [setIsDragging, setAutoRotate, setPreviousClientX, handleCanvasPointerMove, handleCanvasPointerUp]); 


  useEffect(() => { 
    const canvasElement = document.getElementById('locker-carousel-canvas'); 
    if (canvasElement instanceof HTMLCanvasElement) { 
        canvasRef.current = canvasElement; 
    } 

    // Cleanup: remove event listeners when component unmounts 
    return () => { 
        if (canvasRef.current) { 
            canvasRef.current.removeEventListener('pointermove', handleCanvasPointerMove); 
            canvasRef.current.removeEventListener('pointerup', handleCanvasPointerUp); 
        } 
    }; 
  }, [handleCanvasPointerMove, handleCanvasPointerUp]); // ADDED handleCanvasPointerUp here

  useFrame(() => {
    if (group.current && autoRotate && !isDragging) {
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

  return ( 
    <group 
        ref={group} 
        onPointerDown={onPointerDown} // Keep onPointerDown here 
        // Remove other pointer events from the group 
        // onPointerMove={onPointerMove} 
        // onPointerUp={onPointerUp} 
        // onPointerLeave={() => { ... }} 
    > 
      {itemsData.map((item, index) => (
        <CarouselItem 
          key={item.id} 
          itemData={item} 
          index={index} 
          totalItems={itemsData.length} 
          carouselRadius={carouselRadius} 
          onItemClick={onItemClick} // Keep onItemClick prop 
          hasDragged={hasDragged.current} // Pass hasDragged ref value 
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
    overflow: 'hidden',
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
