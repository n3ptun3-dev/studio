// src/components/game/spyshop/QuantumIndustriesRedesignedShop.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { X, ChevronDown, ChevronUp, ArrowLeft, ShoppingCart, Search } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { AnimatePresence, motion } from 'framer-motion';
import { SHOP_CATEGORIES, ITEM_LEVELS, type ProductCategory, type ItemSubCategory, type ItemTile, type SpecificItemData, type ItemLevel } from '@/lib/game-items';

// Helper components (to be defined below or in separate files)
interface NewStickyHeaderProps {
  activePage: 'products' | 'aboutUs';
  setActivePage: (page: 'products' | 'aboutUs') => void;
  onClose: () => void;
  isScrolled: boolean;
}

interface ProductNavProps {
  selectedCategory: ProductCategory | null;
  onSelectCategory: (category: ProductCategory) => void;
}

interface ItemSubCategoryBarProps {
  subCategories: ItemSubCategory[];
  selectedSubCategory: ItemSubCategory | null;
  onSelectSubCategory: (subCategory: ItemSubCategory) => void;
}

interface LevelSelectorBarProps {
  selectedLevel: ItemLevel;
  onSelectLevel: (level: ItemLevel) => void;
  playerLevel: ItemLevel; // Assuming you can get this
  levelsAvailable: ItemLevel[];
}

interface ItemDisplayGridProps {
  items: ItemTile[];
  onSelectItem: (itemBaseName: string) => void;
}

interface SpecificItemDetailViewProps {
  itemData: SpecificItemData;
  onBack: () => void;
  onPurchase: (itemId: string) => void;
}


// --- Main Shop Component ---
export function QuantumIndustriesRedesignedShop() {
  const { closeSpyShop, playerInfo } = useAppContext(); // Assuming playerInfo might have playerLevel
  const [activePage, setActivePage] = useState<'products' | 'aboutUs'>('products');
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Product Page State
  const [selectedProductCategory, setSelectedProductCategory] = useState<ProductCategory | null>(null);
  const [selectedItemSubCategory, setSelectedItemSubCategory] = useState<ItemSubCategory | null>(null);
  const [selectedItemBaseName, setSelectedItemBaseName] = useState<string | null>(null); // e.g., "Standard Cypher Lock"
  const [selectedLevel, setSelectedLevel] = useState<ItemLevel>(playerInfo?.level || ITEM_LEVELS[0]); // Default to player level or L1
  
  const [currentViewItemData, setCurrentViewItemData] = useState<SpecificItemData | null>(null);

  useEffect(() => {
    const mainScrollArea = scrollContainerRef.current;
    if (!mainScrollArea) return;

    const handleScroll = () => {
      setIsScrolled(mainScrollArea.scrollTop > 50);
    };
    mainScrollArea.addEventListener('scroll', handleScroll);
    return () => mainScrollArea.removeEventListener('scroll', handleScroll);
  }, []);

  // Reset selections when category changes
  useEffect(() => {
    setSelectedItemSubCategory(null);
    setSelectedItemBaseName(null);
    setCurrentViewItemData(null);
    if (selectedProductCategory && selectedProductCategory.itemSubCategories.length > 0) {
        // Auto-select first sub-category
        setSelectedItemSubCategory(selectedProductCategory.itemSubCategories[0]);
    }
  }, [selectedProductCategory]);

  // Reset item and level when sub-category changes
  useEffect(() => {
    setSelectedItemBaseName(null);
    setCurrentViewItemData(null);
  }, [selectedItemSubCategory]);
  
  // Fetch and set item data when base name or level changes
  useEffect(() => {
    if (selectedItemBaseName && selectedItemSubCategory) {
      const parentItemTile = selectedItemSubCategory.items.find(it => it.name === selectedItemBaseName);
      if (parentItemTile) {
        const data = parentItemTile.getItemLevelData(selectedLevel);
        setCurrentViewItemData(data || null);
      } else {
        setCurrentViewItemData(null);
      }
    } else {
      setCurrentViewItemData(null);
    }
  }, [selectedItemBaseName, selectedLevel, selectedItemSubCategory]);

  const handleSelectProductCategory = (category: ProductCategory) => {
    setSelectedProductCategory(category);
  };

  const handleSelectItemSubCategory = (subCategory: ItemSubCategory) => {
    setSelectedItemSubCategory(subCategory);
  };

  const handleSelectItemTile = (itemBaseName: string) => {
    setSelectedItemBaseName(itemBaseName);
    // Optional: Reset to player level or lowest available if not already on specific item view
    // setSelectedLevel(playerInfo?.level || ITEM_LEVELS[0]);
  };
  
  const handleSelectLevel = (level: ItemLevel) => {
    setSelectedLevel(level);
  };

  const handleBackFromItemDetail = () => {
    setSelectedItemBaseName(null); // This will hide SpecificItemDetailView
    setCurrentViewItemData(null);
  };

  const handlePurchase = (itemId: string) => {
    console.log("Purchasing item:", itemId);
    // Add to cart logic or direct purchase
  };

  // Determine levels available for the currently selected item base name
  const levelsAvailableForItem = selectedItemBaseName && selectedItemSubCategory
    ? selectedItemSubCategory.items.find(it => it.name === selectedItemBaseName)?.getItemLevelData('L1') ? ITEM_LEVELS : [] // Simplification, real logic would check specific item's available levels
    : [];


  const renderProductsPage = () => {
    return (
      <div className="flex flex-col h-full">
        {/* Info Area - Scrollable */}
        <div className="flex-grow relative overflow-hidden"> {/* This div is important for AnimatePresence child */}
          <div
            ref={scrollContainerRef}
            className={`flex-grow overflow-y-auto pb-24 relative scrollbar-hide ${
              currentViewItemData ? 'pt-[calc(var(--sub-header-height,46px)+var(--level-bar-height,38px)+40px)]' :
              selectedItemSubCategory ? 'pt-[calc(var(--sub-header-height,46px)+30px)]' :
              'pt-4' // Default padding when no sub-bars are visible
            }`}> {/* pb-24 for bottom nav */}
            {/* Conditional Content */}
            <AnimatePresence mode="wait">
              {currentViewItemData ? (
                  <motion.div
                      key="item-detail-view"
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ duration: 0.3 }}
                    >
                      <SpecificItemDetailView
                          itemData={currentViewItemData}
                          onBack={handleBackFromItemDetail}
                          onPurchase={handlePurchase}
                      />
                  </motion.div>
              ) : selectedItemSubCategory ? (
                  <motion.div
                      key="item-grid-view"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className=""
                    >
                      <ItemDisplayGrid
                          items={selectedItemSubCategory.items}
                          onSelectItem={handleSelectItemTile}
                      />
                  </motion.div>
              ) : (
                  <motion.div
                      key="welcome-view"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex flex-col items-center justify-center h-full p-8 text-center relative"
                  >
                      <div className="absolute inset-0 z-0 opacity-10">
                          <Image src="/spyshop/Quantum Industries Icon.png" alt="Quantum Industries Icon" layout="fill" objectFit="contain" data-ai-hint="logo abstract" />
                      </div>
                      <div className="relative z-10">
                          <h2 className="text-3xl font-orbitron text-cyan-300 mb-4">Welcome, Agent.</h2>
                          <p className="text-slate-300 text-lg max-w-md mx-auto">
                              Quantum Industries provides elite tools for the discerning operative. Please select a product category below to explore our arsenal.
                          </p>
                      </div>
                  </motion.div>
              )}
            </AnimatePresence>
        </div>
  </div>
        <ProductNav selectedCategory={selectedProductCategory} onSelectCategory={handleSelectProductCategory} />
    </div>
    );
  };

  const renderAboutUsPage = () => {
    return (
      <div ref={scrollContainerRef} className="flex-grow overflow-y-auto p-6 md:p-10 text-slate-300 relative scrollbar-hide">
          <div className="absolute inset-0 z-0 opacity-5">
              <Image src="/spyshop/Quantum Industries Logo.png" alt="Quantum Industries Logo" layout="fill" objectFit="contain" objectPosition="center" data-ai-hint="logo text" />
          </div>
          <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-4xl font-orbitron text-cyan-300 mb-8 text-center">About Quantum Industries</h2>
              <p className="text-lg mb-6 leading-relaxed">
                  At Quantum Industries, we don't just engineer security solutions; we redefine the very fabric of digital defense and offense. Born from a vision of a hyper-connected, yet fiercely protected, future, we are the pioneers of ELINT security, pushing the boundaries of what's possible in a world where information is the ultimate currency.
              </p>
              <p className="text-lg mb-6 leading-relaxed">
                  Our dedicated team of quantum physicists, cybernetic engineers, and tactical strategists work tirelessly to develop state-of-the-art Vault Hardware, impenetrable Lock Fortifiers, and revolutionary Nexus Gadgets. From the subtle hum of a Biometric Seal to the mind-bending complexity of a Temporal Flux Lock, our defensive technologies are crafted to withstand the most sophisticated infiltration attempts, ensuring your ELINT remains inviolable.
              </p>
              <p className="text-lg mb-6 leading-relaxed">
                  But security isn't just about defense. It's also about strategic advantage. Our Offensive Tools and Assault Tech are designed for those who dare to breach the seemingly unbreachable. Whether you're wielding a precision Code Injector, a heavy-duty Hydraulic Drill, or deploying a game-changing Seismic Charge, Quantum Industries empowers you to navigate the digital battlefield with unparalleled prowess.
              </p>
              <p className="text-xl text-cyan-400 font-semibold mt-10 text-center font-orbitron">
                  "Innovation in Security. Excellence in Espionage."
              </p>
          </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[99] flex items-center justify-center bg-black/80 backdrop-blur-md">
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full h-full max-w-2xl md:max-w-4xl lg:max-w-6xl md:h-[90vh] md:max-h-[800px] bg-slate-950 text-slate-100 flex flex-col shadow-2xl shadow-cyan-500/30 md:rounded-lg overflow-hidden border border-cyan-700/50 relative"
            style={{
                backgroundImage: "url('/path/to/your/bg_quantum_pattern.png')", // Optional: Add your subtle background pattern here
                backgroundSize: 'cover',
            }}
        >
            {/* Sticky Header */}
            <NewStickyHeader activePage={activePage} setActivePage={setActivePage} onClose={closeSpyShop} isScrolled={isScrolled} />
            
            {/* Item SubCategory Bar (Horizontally scrolling, below header) */}
            {activePage === 'products' && selectedProductCategory && selectedItemSubCategory && (
                 <ItemSubCategoryBar
                    subCategories={selectedProductCategory.itemSubCategories}
                    selectedSubCategory={selectedItemSubCategory}
                    onSelectSubCategory={handleSelectItemSubCategory}
                />
            )}

            {/* Level Selector Bar (Horizontally scrolling, below item type bar) */}
            {activePage === 'products' && selectedItemBaseName && currentViewItemData && (
                 <LevelSelectorBar
                    selectedLevel={selectedLevel}
                    onSelectLevel={handleSelectLevel}
                    playerLevel={playerInfo?.level || ITEM_LEVELS[0]}
                    levelsAvailable={levelsAvailableForItem}
                />
            )}

            {/* Page Content */}
            {activePage === 'products' ? renderProductsPage() : renderAboutUsPage()}

             {/* Optional: Futuristic background elements like in your globals.css */}
            <div className="absolute inset-0 pointer-events-none z-[-1] overflow-hidden">
                <div className="absolute inset-0 bg-[size:30px_30px] [background-image:linear-gradient(to_right,rgba(0,128,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,128,255,0.03)_1px,transparent_1px)] animate-pulse-grid opacity-50"></div>
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-700/5 rounded-full blur-3xl animate-float-one opacity-30"></div>
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-700/5 rounded-full blur-3xl animate-float-two opacity-30"></div>
            </div>
        </motion.div>
    </div>
  );
}


// --- Sub-Components (Ideally in separate files) ---

const NewStickyHeader: React.FC<NewStickyHeaderProps> = ({ activePage, setActivePage, onClose, isScrolled }) => {
  return (
    <div className={`sticky top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out bg-slate-900/80 backdrop-blur-md border-b border-cyan-700/50 shadow-lg
                    ${isScrolled ? 'py-2 px-4' : 'py-4 px-6'}`}>
      <div className="flex justify-between items-center w-full max-w-6xl mx-auto">
        <div className={`flex items-center transition-all duration-300 ${isScrolled ? 'space-x-2' : 'space-x-3'}`}>
          <div className={`relative ${isScrolled ? 'w-8 h-8' : 'w-10 h-10 md:w-12 md:h-12'}`}>
            <Image src="/spyshop/Quantum Industries Icon Logo.png" alt="QI Logo" layout="fill" objectFit="contain" data-ai-hint="logo quantum" />
          </div>
          {!isScrolled && <span className="font-orbitron text-xl md:text-2xl text-cyan-300 hidden sm:inline">QUANTUM INDUSTRIES</span>}
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Page Tabs */}
          <button
            onClick={() => setActivePage('products')}
            className={`px-3 py-1.5 text-sm sm:text-base font-semibold rounded-md transition-colors duration-200
                        ${activePage === 'products' ? 'bg-cyan-500 text-slate-900 shadow-md' : 'text-cyan-300 hover:bg-cyan-700/50 hover:text-cyan-100'}`}
          >
            Products
          </button>
          <button
            onClick={() => setActivePage('aboutUs')}
            className={`px-3 py-1.5 text-sm sm:text-base font-semibold rounded-md transition-colors duration-200
                        ${activePage === 'aboutUs' ? 'bg-cyan-500 text-slate-900 shadow-md' : 'text-cyan-300 hover:bg-cyan-700/50 hover:text-cyan-100'}`}
          >
            About Us
          </button>
           <button
            onClick={onClose}
            className="p-2 text-cyan-300 hover:text-red-400 hover:bg-red-700/30 rounded-full transition-colors duration-300"
            aria-label="Close Spy Shop"
          >
            <X className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
        </div>
      </div>
    </div>
  );
};

const ProductNav: React.FC<ProductNavProps> = ({ selectedCategory, onSelectCategory }) => {
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-sm border-t border-cyan-700/50 p-3 shadow-top-lg">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {SHOP_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat)}
            className={`flex flex-col items-center p-2 rounded-md transition-all duration-200 w-28 h-20 justify-center
                        ${selectedCategory?.id === cat.id ? 'bg-cyan-600/30 scale-105 ring-1 ring-cyan-400' : 'hover:bg-slate-700/50'}`}
          >
            <Image src={cat.iconImageSrc} alt={cat.name} width={cat.id === 'aestheticSchemes' ? 28 : 24} height={cat.id === 'aestheticSchemes' ? 28 : 24} className="mb-1 opacity-80 group-hover:opacity-100" data-ai-hint="icon category" />
            <span className={`text-xs text-center ${selectedCategory?.id === cat.id ? 'text-cyan-300 font-semibold' : 'text-slate-300'}`}>
              {cat.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

const ItemSubCategoryBar: React.FC<ItemSubCategoryBarProps> = ({ subCategories, selectedSubCategory, onSelectSubCategory }) => {
  if (!subCategories || subCategories.length === 0) return null;
  return (
    <div className="sticky top-[calc(var(--header-height,60px)+1px)] z-40 bg-slate-900/70 backdrop-blur-sm border-b border-cyan-800/30 shadow-md overflow-hidden" style={{ height: 'var(--sub-header-height, 46px)' }}> {/* Adjust top based on header height */}
      <div className="flex space-x-1 p-2 overflow-x-auto scrollbar-hide justify-center">
        {subCategories.map((sc) => (
          <button
            key={sc.name}
            onClick={() => onSelectSubCategory(sc)}
            className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors
                        ${selectedSubCategory?.name === sc.name ? 'bg-cyan-500 text-slate-900 shadow' : 'text-cyan-200 hover:bg-cyan-700/40'}`}
          >
            {sc.name}
          </button>
        ))}
      </div>
    </div>
  );
};

const LevelSelectorBar: React.FC<LevelSelectorBarProps> = ({ selectedLevel, onSelectLevel, playerLevel, levelsAvailable }) => {
    if (!levelsAvailable || levelsAvailable.length === 0) return null;
  return (
    <div className="sticky top-[calc(var(--header-height,60px)+var(--sub-header-height,46px)+2px)] z-30 bg-slate-800/80 backdrop-blur-sm border-b border-cyan-800/40 shadow-sm overflow-hidden" style={{ height: 'var(--level-bar-height, 38px)' }}> {/* Adjust top */}
      <div className="flex space-x-1 p-1.5 overflow-x-auto scrollbar-hide justify-center">
        {ITEM_LEVELS.map((level) => {
          const isAvailable = levelsAvailable.includes(level);
          return (
            <button
              key={level}
              onClick={() => isAvailable && onSelectLevel(level)}
              disabled={!isAvailable}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all
                          ${selectedLevel === level && isAvailable ? 'bg-orange-500 text-slate-900 shadow-md scale-105' : 
                           isAvailable && playerLevel === level ? 'bg-sky-500 text-slate-900' :
                           isAvailable ? 'bg-slate-700 text-cyan-200 hover:bg-slate-600' : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'}`}
            >
              {level}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const ItemDisplayGrid: React.FC<ItemDisplayGridProps> = ({ items, onSelectItem }) => {
  if (!items || items.length === 0) {
    return <p className="text-center text-slate-400 mt-10">No items in this category yet.</p>;
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 p-4">
      {items.map((item) => (
        <motion.button
          key={item.id}
          onClick={() => onSelectItem(item.name)}
          className="bg-slate-800/70 border border-slate-700 rounded-lg p-3 text-center hover:border-cyan-500 hover:bg-slate-700/80 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 aspect-[3/4] flex flex-col justify-between items-center shadow-lg"
          whileHover={{ y: -3 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: Math.random() * 0.2 }}
        >
          <div className="w-full h-2/3 relative mb-2">
            <Image src={item.tileImageSrc || '/spyshop/tiles/placeholder.png'} alt={item.name} layout="fill" objectFit="contain" className="rounded-sm" data-ai-hint="item icon" />
          </div>
          <span className="text-xs sm:text-sm font-rajdhani font-semibold text-cyan-200 leading-tight">{item.name}</span>
        </motion.button>
      ))}
    </div>
  );
};

// ProgressBar Component
const ProgressBar: React.FC<{ label: string; value: number; max: number; colorClass?: string }> = ({ label, value, max, colorClass = "bg-green-500" }) => (
    <div className="mb-2">
        <div className="flex justify-between text-xs text-slate-400 mb-0.5">
            <span>{label}</span>
            <span>{value} / {max}</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2.5 overflow-hidden">
            <div className={`${colorClass} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${(value / max) * 100}%` }}></div>
        </div>
    </div>
);


const SpecificItemDetailView: React.FC<SpecificItemDetailViewProps> = ({ itemData, onBack, onPurchase }) => {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  if (!itemData) return <p className="text-center text-slate-400 p-8">Item details not found.</p>;

  return (
    <div className="p-4 md:p-6 min-h-[calc(100vh-var(--header-height)-var(--sub-header-height)-var(--level-bar-height)-var(--bottom-nav-height)-2rem)]"> {/* Adjust min-h calculation */}
      <button onClick={onBack} className="absolute top-4 left-4 md:top-6 md:left-6 z-20 flex items-center text-sm text-cyan-300 hover:text-cyan-100 bg-slate-800/50 hover:bg-slate-700/70 px-3 py-1.5 rounded-md transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
        {/* Left Column: Image & Primary Info */}
        <div className="flex flex-col items-center">
          <h2 className="text-2xl md:text-3xl font-orbitron text-cyan-300 mb-3 text-center md:mt-8">{itemData.title}</h2>
          <motion.div
            className="relative w-full max-w-xs md:max-w-sm aspect-square bg-slate-800/50 border border-slate-700 rounded-lg shadow-xl overflow-hidden cursor-pointer mb-4"
            onClick={() => setIsImageModalOpen(true)}
            whileHover={{ scale: 1.03 }}
          >
            <Image src={itemData.imageSrc || '/spyshop/items/placeholder_large.png'} alt={itemData.title} layout="fill" objectFit="contain" data-ai-hint="item large" />
            <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                <Search className="w-12 h-12 text-white/70"/>
            </div>
          </motion.div>
          
          <div className="text-center w-full max-w-xs md:max-w-sm">
            <p className="text-3xl font-semibold text-orange-400 mb-1">{itemData.cost} <span className="text-xl text-slate-400">ELINT</span></p>
            <button 
                onClick={() => onPurchase(itemData.id)}
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold py-2.5 px-4 rounded-md transition-colors duration-200 flex items-center justify-center text-lg shadow-md hover:shadow-lg"
            >
                <ShoppingCart className="w-5 h-5 mr-2" /> Purchase
            </button>
            <p className="text-xs text-slate-500 mt-1">Scarcity: <span className="font-medium text-slate-400">{itemData.scarcity}</span></p>
          </div>
        </div>

        {/* Right Column: Details & Description */}
        <div className="md:pt-10">
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-lg p-4 shadow-lg">
                <h3 className="text-xl font-orbitron text-sky-300 mb-2">Description</h3>
                <p className="text-sm text-slate-300 mb-4 leading-relaxed">{itemData.description}</p>

                <h3 className="text-xl font-orbitron text-sky-300 mb-3">Details</h3>
                {itemData.strength && <ProgressBar label="Strength" value={itemData.strength.current} max={itemData.strength.max} colorClass="bg-red-500" />}
                {itemData.resistance && <ProgressBar label="Resistance" value={itemData.resistance.current} max={itemData.resistance.max} colorClass="bg-blue-500" />}

                <div className="text-sm space-y-1.5 text-slate-300">
                    <p><strong className="text-slate-400">Type:</strong> {itemData.itemTypeDetail}</p>
                    {itemData.perUseCost && <p><strong className="text-slate-400">Per-Use Cost:</strong> {itemData.perUseCost}</p>}
                    <p><strong className="text-slate-400">Function:</strong> {itemData.functionText}</p>
                    {itemData.keyCrackerInfluence && <p><strong className="text-slate-400">Key Cracker Influence:</strong> {itemData.keyCrackerInfluence}</p>}
                </div>
            </div>
        </div>
      </div>

        {/* Image Modal */}
        <AnimatePresence>
        {isImageModalOpen && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={() => setIsImageModalOpen(false)}
            >
            <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
                className="relative max-w-3xl max-h-[80vh]"
                onClick={(e) => e.stopPropagation()} // Prevents modal close on image click
            >
                <Image src={itemData.imageSrc || '/spyshop/items/placeholder_large.png'} alt={itemData.title} width={800} height={800} objectFit="contain" className="rounded-lg shadow-2xl" data-ai-hint="item closeup" />
                <button onClick={() => setIsImageModalOpen(false)} className="absolute -top-3 -right-3 bg-slate-800 text-white rounded-full p-1.5 shadow-lg hover:bg-red-500 transition-colors">
                    <X className="w-5 h-5"/>
                </button>
            </motion.div>
            </motion.div>
        )}
        </AnimatePresence>
    </div>
  );
};
