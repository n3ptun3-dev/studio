// src/components/game/inventory/InventoryBrowserInTOD.tsx

import React from 'react';
import { useAppContext, type GameItemBase, type PlayerInventoryItem } from '@/contexts/AppContext'; // Import necessary types and context
import { cn } from '@/lib/utils';

// Define props for this component
interface InventoryBrowserInTODProps {
  // We'll pass the context directly to this component from page.tsx
  context: {
    category: string;
    title: string;
    purpose?: 'equip_lock' | 'equip_nexus' | 'infiltrate_lock';
    onItemSelect?: (item: GameItemBase) => void;
  } | null;
}

// You'll need a way to get full item details from just the ID.
// This `getItemById` would likely be a global helper or come from your game data module.
// For now, let's assume it's imported or defined somewhere accessible.
// import { getItemById } from '@/lib/game-data'; // Example path
const getItemById = (itemId: string): GameItemBase | undefined => {
  // THIS IS A PLACEHOLDER. Replace with your actual game item data.
  const dummyItems: Record<string, GameItemBase> = {
    'pick_l1': { id: 'pick_l1', name: 'Pick L1', description: 'A basic lock pick.', category: 'tool', cost: 100 },
    'cypher_lock_l1': { id: 'cypher_lock_l1', name: 'Cypher Lock L1', description: 'A standard lock.', category: 'lock', maxStrength: 100, cost: 200 },
    'security_camera_l1': { id: 'security_camera_l1', name: 'Security Camera L1', description: 'Detects.', category: 'sensor', maxStrength: 1, cost: 50 },
    'theme_cyphers': { id: 'theme_cyphers', name: 'Cyphers Theme', description: 'Changes UI.', category: 'theme', cost: 0 },
    // Add more of your game items here
  };
  return dummyItems[itemId];
};


export const InventoryBrowserInTOD: React.FC<InventoryBrowserInTODProps> = ({ context }) => {
  // Use useAppContext to get playerInventory and any other necessary game state
  const { playerInventory } = useAppContext();

  if (!context) {
    // This case should ideally not be hit if `page.tsx` handles rendering correctly
    return <div className="text-muted-foreground text-center p-4">No inventory context provided.</div>;
  }

  // Filter items based on the provided category in context
  const filteredItems = Object.values(playerInventory).filter(playerItem => {
    const itemDetails = getItemById(playerItem.id);
    return itemDetails && itemDetails.category === context.category;
  });

  // Render items
  return (
    <div className="h-full flex flex-col p-2">
      <h3 className="text-xl font-bold mb-3 holographic-text">{context.title}</h3>
      {context.purpose && (
        <p className="text-sm text-muted-foreground mb-4">
          Purpose: {context.purpose.replace(/_/g, ' ').toUpperCase()}
        </p>
      )}

      {filteredItems.length > 0 ? (
        <div className="flex-grow overflow-y-auto scrollbar-hide pr-2"> {/* Added pr-2 for scrollbar space */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredItems.map(item => {
              const fullDetails = getItemById(item.id); // Get full details to display name etc.
              if (!fullDetails) return null; // Should not happen if getItemById is robust

              return (
                <div
                  key={item.id}
                  className={cn(
                    "p-3 border border-current rounded-md cursor-pointer",
                    "bg-black/30 hover:bg-black/50 transition-colors duration-200",
                    "flex flex-col justify-between",
                    context.onItemSelect ? "opacity-100 hover:opacity-90" : "opacity-70" // Dim if not selectable
                  )}
                  onClick={() => {
                    if (context.onItemSelect) {
                      context.onItemSelect(fullDetails); // Pass the full item details
                    } else {
                      // Optional: handle default click behavior if no specific callback
                      console.log(`Item clicked: ${fullDetails.name}`);
                    }
                  }}
                >
                  <div>
                    <p className="font-semibold text-lg holographic-text">{fullDetails.name}</p>
                    <p className="text-sm text-muted-foreground italic">{fullDetails.description}</p>
                  </div>
                  <div className="mt-2 text-sm">
                    <p>Quantity: {item.quantity}</p>
                    {item.currentStrength !== undefined && (
                      <p>Strength: {item.currentStrength}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="text-muted-foreground text-center p-4">No items found in this category.</p>
      )}
    </div>
  );
};