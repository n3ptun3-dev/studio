// src/components/game/tod/EquipmentLockerSection.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppContext } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { HolographicPanel, HolographicButton, HolographicInput } from '@/components/game/shared/HolographicPanel';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getItemById, ALL_ITEMS_BY_CATEGORY, type ItemCategory, GameItemBase, HardwareItem, LockFortifierItem, EntryToolItem, NexusUpgradeItem, AestheticSchemeItem, ItemLevel } from '@/lib/game-items'; // Adjust path as needed
import { ChevronLeft, ShoppingCart, ArrowRight, Zap, CheckCircle, XCircle, Power, Fingerprint as FingerprintIcon, LogIn, UserCircle, Search } from 'lucide-react';
import { ITEM_LEVEL_COLORS_CSS_VARS } from '@/lib/constants'; // Adjust path

// Helper: Define max strength/charges for items if not explicit in game-items.ts
const getItemMaxStrength = (item: GameItemBase): number | undefined => {
  if ('strength' in item && typeof item.strength === 'number') return item.strength; // Hardware, LockFortifier
  if (item.category === 'Entry Tools' && (item as EntryToolItem).maxCharges) return (item as EntryToolItem).maxCharges;
  if (item.category === 'Nexus Upgrades' && (item as NexusUpgradeItem).processingPowerBoost) return (item as NexusUpgradeItem).processingPowerBoost; // Example, adjust as needed
  if (item.category === 'Aesthetic Schemes') return undefined;
  return undefined;
};

// Main EquipmentLockerSection component
export function EquipmentLockerSection({ parallaxOffset }: { parallaxOffset: number }) {
  const { theme } = useTheme();
  const { openSpyShop, openTODWindow, closeTODWindow, setOnboardingStep } = useAppContext();
  const [mainView, setMainView] = useState<'locker' | 'shop'>('locker'); // 'locker' for equipment locker, 'shop' for the new shop experience
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | 'all'>('all');
  const [selectedItem, setSelectedItem] = useState<GameItemBase | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'owned' | 'available'>('owned'); // For owned vs. available items

  // Placeholder for owned items (replace with actual player inventory)
  const [ownedItems, setOwnedItems] = useState<GameItemBase[]>([
    getItemById('entry_tool_alpha'),
    getItemById('hardware_beta'),
    getItemById('lock_fortifier_gamma'),
    getItemById('nexus_upgrade_delta'),
    getItemById('aesthetic_scheme_a'),
    getItemById('aesthetic_scheme_b'),
  ].filter(Boolean) as GameItemBase[]); // Filter out nulls and assert type

  const filteredItems = useMemo(() => {
    const itemsToFilter = activeTab === 'owned' ? ownedItems : Object.values(ALL_ITEMS_BY_CATEGORY).flat();
    return itemsToFilter
      .filter(item => selectedCategory === 'all' || item.category === selectedCategory)
      .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [selectedCategory, searchTerm, ownedItems, activeTab]);

  const handleItemClick = useCallback((item: GameItemBase) => {
    setSelectedItem(item);
  }, []);

  const handleBackToCategory = useCallback(() => {
    setSelectedItem(null);
    setSearchTerm(''); // Clear search when going back
  }, []);

  const handleBackToLocker = useCallback(() => {
    setMainView('locker');
    setSelectedCategory('all');
    setSelectedItem(null);
    setSearchTerm('');
  }, []);

  const LockerContent = useCallback(() => {
    const itemCategories: ItemCategory[] = [
      'Hardware',
      'Lock Fortifiers',
      'Entry Tools',
      'Infiltration Gear',
      'Nexus Upgrades',
      'Assault Tech',
      'Aesthetic Schemes',
    ];
    return (
      <>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-primary-foreground">Equipment Locker</h3>
          <HolographicButton
            onClick={openSpyShop}
            className="text-xs px-3 py-1"
          >
            <ShoppingCart className="w-4 h-4 mr-1" /> Spy Shop
          </HolographicButton>
        </div>

        <div className="flex space-x-2 mb-4">
          <HolographicButton onClick={() => setActiveTab('owned')} variant={activeTab === 'owned' ? 'default' : 'ghost'}>Owned</HolographicButton>
          <HolographicButton onClick={() => setActiveTab('available')} variant={activeTab === 'available' ? 'default' : 'ghost'}>Available</HolographicButton>
        </div>

        <div className="mb-4">
          <HolographicInput
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
            icon={<Search className="w-4 h-4 text-muted-foreground" />}
          />
        </div>

        <div className="flex space-x-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
          <HolographicButton onClick={() => setSelectedCategory('all')} variant={selectedCategory === 'all' ? 'default' : 'ghost'} className="flex-shrink-0">All</HolographicButton>
          {itemCategories.map(category => (
            <HolographicButton key={category} onClick={() => setSelectedCategory(category)} variant={selectedCategory === category ? 'default' : 'ghost'} className="flex-shrink-0">
              {category}
            </HolographicButton>
          ))}
        </div>

        <ScrollArea className="flex-grow w-full border border-primary/20 rounded-md p-2 mb-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filteredItems.length > 0 ? (
              filteredItems.map(item => {
                const itemColorVar = ITEM_LEVEL_COLORS_CSS_VARS[item.level as ItemLevel] || '--foreground';
                const itemColor = `hsl(var(${itemColorVar}))`;
                return (
                  <motion.div
                    key={item.id}
                    className="relative p-2 border border-primary/20 rounded-md flex flex-col items-center justify-between text-center overflow-hidden cursor-pointer hover:border-primary transition-colors"
                    onClick={() => handleItemClick(item)}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      boxShadow: `0 0 8px -2px ${itemColor}`,
                      background: `linear-gradient(135deg, hsla(var(--card-hsl), 0.8), hsla(var(--card-hsl), 0.6))`
                    }}
                  >
                    <div
                      className="absolute inset-0 z-0 opacity-10"
                      style={{
                        backgroundImage: `url(${item.imageSrc})`,
                        backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center',
                        filter: 'grayscale(100%) brightness(0.5)',
                      }}
                    />
                    <div className="relative z-10 flex flex-col items-center flex-grow w-full">
                      <p className="font-bold text-sm mb-1" style={{ color: itemColor }}>{item.name}</p>
                      <img src={item.imageSrc} alt={item.name} className="w-12 h-12 md:w-16 md:h-16 object-contain mb-2" />
                      <p className="text-xs text-muted-foreground">{item.category}</p>
                      <div className="text-xs text-primary-foreground font-semibold mt-auto pt-1">
                        Level: {item.level}
                      </div>
                      <p className="text-sm font-bold text-sky-400 mt-1">{item.cost ? `$${item.cost}` : 'N/A'}</p>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <p className="col-span-full text-center text-muted-foreground">No items found.</p>
            )}
          </div>
        </ScrollArea>
      </>
    );
  }, [selectedCategory, searchTerm, filteredItems, handleItemClick, activeTab, openSpyShop, ownedItems]);


  const ShopContent = useCallback(() => {
    // This is currently unused, as the new shop is a global overlay.
    // However, if you intended to have a shop *within* the Equipment Locker,
    // this is where its content would go.
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-lg text-primary-foreground">
          The Spy Shop is now a global overlay accessible via its button!
        </p>
        <HolographicButton onClick={handleBackToLocker} className="mt-4">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Locker
        </HolographicButton>
      </div>
    );
  }, [handleBackToLocker]);

  // The item detail view
  const ItemDetailView = useCallback(() => {
    if (!selectedItem) return null; // Should not happen if rendered conditionally

    const itemColorVar = ITEM_LEVEL_COLORS_CSS_VARS[selectedItem.level as ItemLevel] || '--foreground';
    const itemColor = `hsl(var(${itemColorVar}))`;
    const itemMaxStrength = getItemMaxStrength(selectedItem);

    return (
      <div className="relative p-4 rounded-xl flex flex-col items-center justify-between text-center overflow-hidden h-full">
        <HolographicButton
          onClick={handleBackToCategory}
          className="absolute top-4 left-4 p-2 z-10"
          variant="ghost"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Back
        </HolographicButton>

        <div className="flex flex-col items-center flex-grow mt-8"> {/* Adjusted margin for button */}
          <h3 className="text-2xl font-bold mb-2" style={{ color: itemColor }}>{selectedItem.name}</h3>
          <p className="text-sm text-muted-foreground mb-4">{selectedItem.category}</p>
          <img src={selectedItem.imageSrc} alt={selectedItem.name} className="w-32 h-32 object-contain mb-4" />
          <p className="text-base text-slate-300 mb-4 px-4">{selectedItem.description}</p>
        </div>

        <div className="w-full mt-auto">
          {itemMaxStrength !== undefined && (
            <div className="mb-4">
              <h4 className="font-semibold text-sm text-sky-400 mb-1">
                {selectedItem.category === 'Entry Tools' ? 'Charges:' : 'Strength:'}
              </h4>
              {/* This is a placeholder for actual item strength/charges */}
              <Progress value={50} className="w-full h-2" style={{ '--progress-color': itemColor } as React.CSSProperties} />
              <p className="text-xs text-muted-foreground mt-1">
                {/* Example: 50/100 */}
                {(selectedItem as any).strength || (selectedItem as any).charges || 50}/{itemMaxStrength}
              </p>
            </div>
          )}

          <div className="text-xs space-y-1 border-t border-slate-700 pt-2 mt-2 text-slate-300">
            <h4 className="font-semibold text-sm text-sky-400">Specifications:</h4>
            {Object.entries(selectedItem).map(([key, value]) => {
              if (['id', 'name', 'description', 'cost', 'scarcity', 'category', 'imageSrc', 'colorVar', 'level'].includes(key) || typeof value === 'object') return null;
              return <p key={key}><span className="font-medium capitalize text-slate-400">{key.replace(/([A-Z])/g, ' $1')}:</span> {String(value)}</p>;
            })}
          </div>
        </div>
      </div>
    );
  }, [selectedItem, handleBackToCategory]); // Dependencies for ItemDetailView


  return (
    // Outer div for padding, mimicking VaultSection's outer container
    <div className="p-4 w-full max-w-4xl mx-auto h-full flex flex-col relative"> {/* ADDED THIS WRAPPER */}
      <HolographicPanel
        className={cn(
          "w-full h-full flex flex-col relative overflow-hidden", // REMOVED max-w-4xl from here
          mainView === 'shop' && isShopAuthenticated && "!p-0 !border-none !shadow-none !bg-transparent" // Remove panel styles for shop main view
        )}
        explicitTheme={mainView === 'locker' ? theme : undefined}
      >
        {/* AnimatePresence for the main views (Locker vs. Item Detail) */}
        <AnimatePresence mode="wait">
          {selectedItem ? (
            <motion.div
              key="item-detail" // Key changes only when switching from Locker to Item Detail
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '-100%', opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="absolute inset-0 bg-background/90 z-10 rounded-md" // No p-4 here, it's on the ItemDetailView's root
            >
              <ItemDetailView />
            </motion.div>
          ) : (
            <motion.div
              key="locker-content" // Key changes only when switching from Item Detail to Locker
              initial={{ x: '-100%', opacity: 0 }} // Locker slides in from left
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }} // Locker slides out to right
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="absolute inset-0 flex flex-col" // No padding here, it's on LockerContent's internal structure
            >
              <LockerContent />
            </motion.div>
          )}
        </AnimatePresence>
      </HolographicPanel>
    </div>
  );
}