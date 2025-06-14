
// src/components/game/spyshop/QuantumIndustries.tsx
"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import NextImage from 'next/image';
import { X, ChevronDown, ChevronUp, ArrowLeft, ShoppingCart, Search } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { AnimatePresence, motion } from 'framer-motion';
import { SHOP_CATEGORIES, ITEM_LEVELS, type ProductCategory, type ItemTile, type SpecificItemData, type ItemLevel } from '@/lib/game-items';
import { cn } from '@/lib/utils';

// Helper components
interface NewStickyHeaderProps {
  activePage: 'products' | 'aboutUs';
  setActivePage: (page: 'products' | 'aboutUs') => void;
  onClose: () => void;
  isSmallHeader: boolean;
}

interface ProductNavProps {
  selectedCategory: ProductCategory | null;
  onSelectCategory: (category: ProductCategory | null) => void;
}

interface LevelSelectorBarProps {
  selectedLevel: ItemLevel;
  onSelectLevel: (level: ItemLevel) => void;
  playerLevel: ItemLevel;
  levelsAvailable: ItemLevel[];
  onBack: () => void;
}

interface ItemDisplayGridProps {
  items: ItemTile[];
  onSelectItem: (itemBaseName: string) => void;
}

interface SpecificItemDetailViewProps {
  itemData: SpecificItemData;
  onBack: () => void;
  onPurchase: (itemId: string) => void;
  selectedLevel: ItemLevel;
  onSelectLevel: (level: ItemLevel) => void;
  playerLevel: ItemLevel;
  levelsAvailableForItem: ItemLevel[];
}

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

// --- Main Shop Component ---
export function QuantumIndustries() {
  const { closeSpyShop, playerInfo } = useAppContext();
  const [activePage, setActivePage] = useState<'products' | 'aboutUs'>('products');
  
  const contentScrollContainerRef = useRef<HTMLDivElement>(null); // Main scroller for products / container for about us
  const aboutUsBackgroundElementRef = useRef<HTMLDivElement>(null); // For the sticky background image
  const aboutUsContentScrollerRef = useRef<HTMLDivElement>(null); // NEW: For scrolling text content of "About Us"

  const [selectedProductCategory, setSelectedProductCategory] = useState<ProductCategory | null>(null);
  const [selectedItemBaseName, setSelectedItemBaseName] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<ItemLevel>(playerInfo?.stats.level as ItemLevel || ITEM_LEVELS[0]);
  const [currentViewItemData, setCurrentViewItemData] = useState<SpecificItemData | null>(null);

  const isSmallHeader = selectedItemBaseName !== null || activePage === 'aboutUs' || !!selectedProductCategory;

  useEffect(() => {
    // Reset selections and scroll positions when activePage or selectedProductCategory changes
    setSelectedItemBaseName(null);
    setCurrentViewItemData(null);
    
    if (contentScrollContainerRef.current) {
      requestAnimationFrame(() => {
        contentScrollContainerRef.current!.scrollTop = 0;
      });
    }
    if (activePage === 'aboutUs' && aboutUsContentScrollerRef.current) {
      requestAnimationFrame(() => {
        aboutUsContentScrollerRef.current!.scrollTop = 0;
      });
    } else if (activePage === 'products' && contentScrollContainerRef.current) {
       requestAnimationFrame(() => {
        contentScrollContainerRef.current!.scrollTop = 0;
      });
    }
  }, [selectedProductCategory, activePage]);


  useEffect(() => {
    if (selectedItemBaseName && selectedProductCategory) {
      let parentItemTile: ItemTile | undefined;
      for (const subCat of selectedProductCategory.itemSubCategories) {
        parentItemTile = subCat.items.find(it => it.name === selectedItemBaseName);
        if (parentItemTile) break;
      }

      if (parentItemTile) {
        const data = parentItemTile.getItemLevelData(selectedLevel);
        setCurrentViewItemData(data || null);
      } else {
        setCurrentViewItemData(null);
      }
    } else {
      setCurrentViewItemData(null);
    }
  }, [selectedItemBaseName, selectedLevel, selectedProductCategory]);

  useEffect(() => {
    const bgElement = aboutUsBackgroundElementRef.current;
    // The scroll source is now explicitly the aboutUsContentScrollerRef for the 'aboutUs' page
    const scrollSourceElement = activePage === 'aboutUs' ? aboutUsContentScrollerRef.current : null;

    if (activePage === 'aboutUs' && bgElement && scrollSourceElement) {
        bgElement.style.backgroundImage = `url('/spyshop/about_page_panodark.jpg')`; // No overlay gradient
        bgElement.style.backgroundRepeat = 'no-repeat';
        bgElement.style.backgroundSize = 'auto 100%'; // Image height matches container, width auto
        bgElement.style.backgroundPositionX = '0%';
        bgElement.style.backgroundPositionY = '50%'; // Vertically center
        // bgElement.style.transition = 'background-position-x 0.05s linear';

        const handleScroll = () => {
            const scrollHeight = scrollSourceElement.scrollHeight - scrollSourceElement.clientHeight;
            if (scrollHeight > 0) {
                const scrollTop = scrollSourceElement.scrollTop;
                const scrollFraction = Math.min(1, Math.max(0, scrollTop / scrollHeight));
                bgElement.style.backgroundPositionX = `${scrollFraction * 100}%`;
            } else {
                bgElement.style.backgroundPositionX = '0%';
            }
        };
        
        requestAnimationFrame(() => { // Ensure initial position is set after layout
            handleScroll();
        });

        scrollSourceElement.addEventListener('scroll', handleScroll, { passive: true });
        
        return () => {
            scrollSourceElement.removeEventListener('scroll', handleScroll);
            if (bgElement) { 
                bgElement.style.backgroundImage = '';
                bgElement.style.backgroundPosition = '';
            }
        };
    } else if (bgElement) { // Cleanup if not 'aboutUs' or elements are missing
        bgElement.style.backgroundImage = '';
        bgElement.style.backgroundPosition = '';
    }
  }, [activePage]);


  const handleSelectProductCategory = (category: ProductCategory | null) => {
    if (category && selectedProductCategory?.id === category.id) {
      setSelectedProductCategory(null);
      setSelectedItemBaseName(null);
      setCurrentViewItemData(null);
    } else {
      setSelectedProductCategory(category);
      setSelectedItemBaseName(null);
      setCurrentViewItemData(null);
    }
  };

  const handleSelectItemTile = (itemBaseName: string) => {
    setSelectedItemBaseName(itemBaseName);
    let itemTile = selectedProductCategory?.itemSubCategories
        .flatMap(sc => sc.items)
        .find(it => it.name === itemBaseName);

    if (!itemTile) {
        for (const cat of SHOP_CATEGORIES) {
            itemTile = cat.itemSubCategories.flatMap(sc => sc.items).find(it => it.name === itemBaseName);
            if (itemTile) break;
        }
    }
    
    const l1Data = itemTile?.getItemLevelData(1);
    setSelectedLevel(l1Data ? l1Data.level : (playerInfo?.stats.level as ItemLevel || ITEM_LEVELS[0]));
  };

  const handleSelectLevel = (level: ItemLevel) => {
    setSelectedLevel(level);
  };

  const handleBackFromItemDetail = () => {
    setSelectedItemBaseName(null);
    setCurrentViewItemData(null);
  };

  const handlePurchase = (itemId: string) => {
    console.log("Purchasing item:", itemId);
  };

  const levelsAvailableForItem = useMemo(() => {
    if (!selectedItemBaseName) return [];
    let itemTile: ItemTile | undefined;
    if (selectedProductCategory) {
        itemTile = selectedProductCategory.itemSubCategories
            .flatMap(sc => sc.items)
            .find(it => it.name === selectedItemBaseName);
    }
    if (!itemTile) {
        for (const cat of SHOP_CATEGORIES) {
            itemTile = cat.itemSubCategories.flatMap(sc => sc.items).find(it => it.name === selectedItemBaseName);
            if (itemTile) break;
        }
    }
    return itemTile ? ITEM_LEVELS.filter(level => !!itemTile?.getItemLevelData(level)) : [];
  }, [selectedItemBaseName, selectedProductCategory]);

  const itemsToDisplayInGrid = selectedProductCategory
    ? selectedProductCategory.itemSubCategories.flatMap(subCat => subCat.items)
    : [];

  const renderProductsPage = () => {
    return (
      <AnimatePresence mode="wait">
        {currentViewItemData ? (
          <motion.div
            key="item-detail-view"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="h-full" // Ensure SpecificItemDetailView can take full height
          >
            <SpecificItemDetailView
              itemData={currentViewItemData}
              onBack={handleBackFromItemDetail}
              onPurchase={handlePurchase}
              selectedLevel={selectedLevel}
              onSelectLevel={handleSelectLevel}
              playerLevel={playerInfo?.stats.level as ItemLevel || ITEM_LEVELS[0]}
              levelsAvailableForItem={levelsAvailableForItem}
            />
          </motion.div>
        ) : selectedProductCategory ? (
          <motion.div
            key="item-grid-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="p-4" 
          >
            <ItemDisplayGrid
              items={itemsToDisplayInGrid}
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
            className="flex flex-col items-center justify-center h-full p-8 text-center"
          >
            <h2 className="text-3xl font-orbitron text-cyan-300 mb-4">Welcome, Agent.</h2>
            <p className="text-slate-300 text-lg max-w-md mx-auto">
              Quantum Industries provides elite tools for the discerning operative.
            </p>
            <br></br>
            <p className="text-slate-300 text-lg max-w-md mx-auto">
              Select a category below to explore our arsenal.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  const renderAboutUsPage = () => {
    // This function now just returns the text content.
    // The background and overlay are handled by parent elements when activePage === 'aboutUs'.
    return (
        <div className="max-w-3xl mx-auto p-6 md:p-10 text-slate-200" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.9), 0 0 5px rgba(0,0,0,0.5)' }}>
            <h2 className="text-4xl font-orbitron text-cyan-300 mb-8 text-center" style={{ textShadow: '0 0 8px rgba(0,255,255,0.7), 0 0 15px rgba(0,255,255,0.3)' }}>About Quantum Industries</h2>
            <p className="text-lg mb-6 leading-relaxed">
            At Quantum Industries, we don't just engineer security solutions; we redefine the very fabric of digital defense and offense. Born from a vision of a hyper-connected, yet fiercely protected, future, we are the pioneers of ELINT security, pushing the boundaries of what's possible in a world where information is the ultimate currency.
            </p>
            <p className="text-lg mb-6 leading-relaxed">
            Our dedicated team of quantum physicists, cybernetic engineers, and tactical strategists aim to develop state-of-the-art Vault Hardware, impenetrable Lock Fortifiers, and revolutionary Nexus Gadgets. From the subtle hum of a Biometric Seal to the mind-bending complexity of a Temporal Flux Lock, our defensive technologies are crafted to withstand the most sophisticated infiltration attempts, ensuring your ELINT remains inviolable.
            </p>
            <p className="text-lg mb-6 leading-relaxed">
            But security isn't just about defense. It's also about strategic advantage. Our Offensive Tools and Assault Tech are designed for those who dare to breach the seemingly unbreachable. Whether you're wielding a precision Code Injector, a heavy-duty Hydraulic Drill, or deploying a game-changing Seismic Charge, Quantum Industries empowers you to navigate the digital battlefield with unparalleled prowess.
            </p>
             <p className="text-lg mb-6 leading-relaxed">
            Our commitment to excellence extends beyond product development. We foster a culture of continuous innovation, ethical conduct, and unwavering support for our operatives. We understand the stakes are high, the shadows deep, and the data invaluable. That's why Quantum Industries is more than a supplier; we are your trusted partner in the clandestine world of ELINT Heist.
            </p>
            <p className="text-lg mb-6 leading-relaxed">
            Explore our catalog, equip yourself with the finest gear, and remember: in the quantum realm, the best defense is a brilliant offense, and the most valuable asset is information meticulously secured or audaciously acquired.
            </p>
            <p className="text-xl text-cyan-400 font-semibold mt-10 text-center font-orbitron" style={{ textShadow: '0 0 8px rgba(0,255,255,0.7), 0 0 15px rgba(0,255,255,0.3)' }}>
            "Innovation in Security. Excellence in Espionage."
            </p>
        </div>
    );
  };


  return (
    <div className="fixed inset-0 z-[99] flex items-center justify-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="w-full h-full max-w-2xl md:max-w-4xl lg:max-w-6xl md:h-[90vh] md:max-h-[800px] bg-slate-950 text-slate-100 flex flex-col shadow-2xl shadow-cyan-500/30 border border-cyan-700/50 relative md:rounded-lg"
      >
        {/* Background patterns for products page (only when activePage is products) */}
        {activePage === 'products' && (
          <>
            <div
              className="absolute inset-0 z-[1] pointer-events-none" 
              style={{
                backgroundImage: "url('/spyshop/bg_quantum_pattern.png')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            />
            <div
              className="absolute inset-0 z-[2] animate-pulse-grid pointer-events-none" 
              style={{
                backgroundImage: "url('/spyshop/hexagons.png')",
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
              }}
            />
            <div className="absolute inset-0 pointer-events-none z-[3] overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-700/5 rounded-full blur-3xl animate-float-one opacity-30"></div>
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-700/5 rounded-full blur-3xl animate-float-two opacity-30"></div>
            </div>
          </>
        )}

        <NewStickyHeader
          activePage={activePage}
          setActivePage={setActivePage}
          onClose={closeSpyShop}
          isSmallHeader={isSmallHeader}
        />
        
        {/* Main scrollable content area */}
        <div ref={contentScrollContainerRef} className="flex-grow overflow-y-auto scrollbar-hide relative z-[10]">
          {/* Conditionally rendered STICKY background for About Us page */}
          {activePage === 'aboutUs' && (
            <div
              ref={aboutUsBackgroundElementRef}
              className="sticky top-0 left-0 w-full h-full z-[1] pointer-events-none"
              // Background image styles applied in useEffect
            />
          )}

          {/* Content area - wrapper for products or the "About Us" text scroller */}
          {activePage === 'aboutUs' ? (
            <div 
              ref={aboutUsContentScrollerRef} 
              className="absolute inset-0 overflow-y-auto scrollbar-hide z-[4]" // Absolute, fills parent, scrolls its own content
            >
              {renderAboutUsPage()}
            </div>
          ) : (
            <div className="relative z-[3]"> {/* Products page content, normal flow */}
              {renderProductsPage()}
            </div>
          )}
        </div>

        {activePage === 'products' && (
          <ProductNav selectedCategory={selectedProductCategory} onSelectCategory={handleSelectProductCategory} />
        )}
      </motion.div>
    </div>
  );
}


// --- Sub-Components ---

const NewStickyHeader: React.FC<NewStickyHeaderProps> = ({ activePage, setActivePage, onClose, isSmallHeader }) => {
  return (
    <div className={cn("sticky top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out bg-slate-900/80 backdrop-blur-md border-b border-cyan-700/50 shadow-lg md:rounded-t-lg")}>
      {isSmallHeader ? (
        <div className="flex justify-between items-center w-full max-w-6xl mx-auto px-4 py-2">
          <div className="relative w-10 h-10 sm:w-12 sm:h-12"> 
            <NextImage src="/spyshop/Quantum Industries Icon.png" alt="QI Icon" layout="fill" objectFit="contain" data-ai-hint="logo quantum small"/>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={() => setActivePage('products')}
              className={`px-3 py-1.5 text-sm sm:text-base font-semibold rounded-md transition-colors duration-200 ${activePage === 'products' ? 'bg-cyan-500 text-slate-900 shadow-md' : 'text-cyan-300 hover:bg-cyan-700/50 hover:text-cyan-100'}`}
            >
              Products
            </button>
            <button
              onClick={() => setActivePage('aboutUs')}
              className={`px-3 py-1.5 text-sm sm:text-base font-semibold rounded-md transition-colors duration-200 ${activePage === 'aboutUs' ? 'bg-cyan-500 text-slate-900 shadow-md' : 'text-cyan-300 hover:bg-cyan-700/50 hover:text-cyan-100'}`}
            >
              About Us
            </button>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 text-cyan-300 hover:text-red-400 hover:bg-red-700/30 rounded-full transition-colors duration-300"
              aria-label="Close Spy Shop"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center w-full max-w-6xl mx-auto px-6">
           <div className="flex justify-between items-center w-full"> 
            <div className="relative w-full h-16 md:h-20 my-2 flex-grow"> 
              <NextImage src="/spyshop/Quantum Industries Logo.png" alt="Quantum Industries Full Logo" layout="fill" objectFit="contain" data-ai-hint="logo quantum full"/>
            </div>
          </div>
          <div className="flex justify-center items-center space-x-4 w-full pb-2"> 
            <button
              onClick={() => setActivePage('products')}
              className={`px-4 py-2 text-base font-semibold rounded-md transition-colors duration-200 ${activePage === 'products' ? 'bg-cyan-500 text-slate-900 shadow-md' : 'text-cyan-300 hover:bg-cyan-700/50 hover:text-cyan-100'}`}
            >
              Products
            </button>
            <button
              onClick={() => setActivePage('aboutUs')}
              className={`px-4 py-2 text-base font-semibold rounded-md transition-colors duration-200 ${activePage === 'aboutUs' ? 'bg-cyan-500 text-slate-900 shadow-md' : 'text-cyan-300 hover:bg-cyan-700/50 hover:text-cyan-100'}`}
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
      )}
    </div>
  );
};


const ProductNav: React.FC<ProductNavProps> = ({ selectedCategory, onSelectCategory }) => {
  return (
    <div className="flex-shrink-0 bg-slate-900/90 backdrop-blur-sm border-t border-cyan-700/50 p-2 shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.1),0_-2px_6px_-2px_rgba(0,0,0,0.1)] z-10 overflow-x-auto scrollbar-hide md:rounded-b-lg">
      <div className="flex space-x-2 justify-start md:justify-center items-center max-w-full mx-auto px-1">
        {SHOP_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat)}
            className={`flex flex-col items-center p-2 rounded-md transition-all duration-200 w-24 h-[70px] justify-center flex-shrink-0
                        ${selectedCategory?.id === cat.id ? 'bg-cyan-600/40 scale-105 ring-1 ring-cyan-400' : 'hover:bg-slate-700/50'}`}
          >
            <div className="relative w-6 h-6 mb-0.5">
              <NextImage src={cat.iconImageSrc} alt={cat.name} layout="fill" objectFit="contain" className="opacity-80 group-hover:opacity-100" data-ai-hint="icon category"/>
            </div>
            <span className={`text-[10px] leading-tight text-center ${selectedCategory?.id === cat.id ? 'text-cyan-300 font-semibold' : 'text-slate-300'}`}>
              {cat.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};


const LevelSelectorBar: React.FC<LevelSelectorBarProps> = ({ selectedLevel, onSelectLevel, playerLevel, levelsAvailable, onBack }) => {
  if (!levelsAvailable || levelsAvailable.length === 0) return null;
  return (
    <div className="sticky top-0 z-20 bg-slate-800/90 backdrop-blur-sm border-b border-cyan-800/40 shadow-sm py-1.5 px-2 flex items-center">
      <button 
        onClick={onBack} 
        className="flex-shrink-0 flex items-center text-sm text-cyan-300 hover:text-cyan-100 bg-slate-700/50 hover:bg-slate-600/70 px-3 py-1.5 rounded-md transition-colors mr-2"
        aria-label="Back to products"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
      </button>
      <div className="flex-grow overflow-x-auto scrollbar-hide">
        <div className="flex space-x-1 justify-start md:justify-center">
          {ITEM_LEVELS.map((level) => {
            const isAvailable = levelsAvailable.includes(level);
            const isPlayerLevel = playerLevel === level;
            return (
              <button
                key={level}
                onClick={() => isAvailable && onSelectLevel(level)}
                disabled={!isAvailable}
                className={`flex-shrink-0 px-3 py-1 text-[11px] font-bold rounded-md transition-all duration-150
                            ${selectedLevel === level && isAvailable ? 'bg-orange-500 text-slate-900 shadow-md scale-105 ring-1 ring-orange-300' :
                            isAvailable && isPlayerLevel ? 'bg-sky-500 text-slate-900 shadow-sm' :
                            isAvailable ? 'bg-slate-700 text-cyan-200 hover:bg-slate-600' : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'}`}
              >
                L{level}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const ItemDisplayGrid: React.FC<ItemDisplayGridProps> = ({ items, onSelectItem }) => {
  if (!items || items.length === 0) {
    return <p className="text-center text-slate-400 mt-10">No items in this category yet, or clear your selection below.</p>;
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
      {items.map((item) => (
        <motion.button
          key={item.id}
          onClick={() => onSelectItem(item.name)}
          className="bg-slate-800/70 border border-slate-700 rounded-lg p-3 text-center hover:border-cyan-500 hover:bg-slate-700/80 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 aspect-[3/4] flex flex-col justify-between items-center shadow-lg"
          whileHover={{ y: -3 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: Math.random() * 0.1 }}
        >
          <div className="w-full h-2/3 relative mb-2">
            <NextImage src={item.tileImageSrc || '/spyshop/tiles/placeholder.png'} alt={item.name} layout="fill" objectFit="contain" className="rounded-sm" data-ai-hint="item icon"/>
          </div>
          <span className="text-xs sm:text-sm font-rajdhani font-semibold text-cyan-200 leading-tight">{item.name}</span>
        </motion.button>
      ))}
    </div>
  );
};


const SpecificItemDetailView: React.FC<SpecificItemDetailViewProps> = ({
  itemData, onBack, onPurchase, selectedLevel, onSelectLevel, playerLevel, levelsAvailableForItem
}) => {
  if (!itemData) return <p className="text-center text-slate-400 p-8">Item details not found.</p>;

  return (
    <div className="h-full flex flex-col relative"> {/* Main container is relative for children */}
      <LevelSelectorBar
        selectedLevel={selectedLevel}
        onSelectLevel={onSelectLevel}
        playerLevel={playerLevel}
        levelsAvailable={levelsAvailableForItem}
        onBack={onBack}
      />
      {/* Scrollable content for item details */}
      <div className="flex-grow overflow-y-auto p-1 sm:p-2 md:p-4 scrollbar-hide">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto pt-4 md:pt-2">
          <div className="flex flex-col items-center">
            <h2 className="text-2xl md:text-3xl font-orbitron text-cyan-300 mb-3 text-center">{itemData.title} <span className="text-orange-400 text-xl">L{itemData.level}</span></h2>
            <motion.div
              className="relative w-full max-w-xs md:max-w-sm aspect-square bg-slate-800/50 border border-slate-700 rounded-lg shadow-xl overflow-hidden mb-4"
            >
              <NextImage src={itemData.imageSrc || 'https://placehold.co/400x400.png'} alt={itemData.title} layout="fill" objectFit="contain" data-ai-hint="item large"/>
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

          <div className="md:pt-2">
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-lg p-4 shadow-lg">
              <h3 className="text-xl font-orbitron text-sky-300 mb-2">Description</h3>
              <p className="text-sm text-slate-300 mb-4 leading-relaxed">{itemData.description}</p>

              <h3 className="text-xl font-orbitron text-sky-300 mb-3">Details</h3>
              {itemData.strength && <ProgressBar label="Strength" value={itemData.strength.current} max={itemData.strength.max} colorClass="bg-red-500" />}
              {itemData.resistance && <ProgressBar label="Resistance" value={itemData.resistance.current} max={itemData.resistance.max} colorClass="bg-blue-500" />}
              {itemData.attackFactor && <ProgressBar label="Attack Factor" value={itemData.attackFactor} max={100} colorClass="bg-yellow-500" />}

              <div className="text-sm space-y-1.5 text-slate-300 mt-3">
                <p><strong className="text-slate-400">Category:</strong> {itemData.category}</p>
                {itemData.itemTypeDetail && <p><strong className="text-slate-400">Type:</strong> {itemData.itemTypeDetail}</p>}
                {itemData.perUseCost && <p><strong className="text-slate-400">Per-Use Cost:</strong> {itemData.perUseCost} ELINT</p>}
                {itemData.functionText && <p><strong className="text-slate-400">Function:</strong> {itemData.functionText}</p>}
                {itemData.keyCrackerInfluence && <p><strong className="text-slate-400">Key Cracker Influence:</strong> {itemData.keyCrackerInfluence}</p>}
                {itemData.minigameEffect && <p><strong className="text-slate-400">Minigame Effect:</strong> {itemData.minigameEffect}</p>}
                {itemData.levelScalingNote && <p><strong className="text-slate-400">Level Scaling:</strong> {itemData.levelScalingNote}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

