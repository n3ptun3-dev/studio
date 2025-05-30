// src/components/game/tod/VaultSection.tsx

"use client";
import { useState } from 'react';
import { useAppContext, type GameItemBase, type ItemCategory, type VaultSlot } from '@/contexts/AppContext';
import { HolographicPanel, HolographicButton, HolographicInput } from '@/components/game/shared/HolographicPanel';
import { ShieldCheck, ShieldOff, ShieldAlert, Edit3, Lock, Unlock, Sigma } from 'lucide-react'; // Added Sigma for ELINT
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext'; // Import useTheme

interface SectionProps {
  parallaxOffset: number;
}

const MAX_LOCK_SLOTS = 4;
const MAX_UPGRADE_SLOTS = 4;

export function VaultSection({ parallaxOffset }: SectionProps) {
  const { 
    faction, 
    playerSpyName, 
    openInventoryTOD, 
    closeInventoryTOD, 
    playerVault, // Get playerVault from context
    deployItemToVault, // Get deployItemToVault from context
    playerStats 
  } = useAppContext();
  const { theme: currentGlobalTheme } = useTheme(); // Get current theme

  const [vaultTitle, setVaultTitle] = useState(playerSpyName ? `${playerSpyName}'s Vault` : "[UNCLASSIFIED]");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(vaultTitle);

  // Vault slots are now derived from AppContext.playerVault
  const lockSlots = playerVault.filter(slot => slot.type === 'lock').slice(0, MAX_LOCK_SLOTS);
  const upgradeSlots = playerVault.filter(slot => slot.type === 'upgrade').slice(0, MAX_UPGRADE_SLOTS);

  // Ensure we always have the correct number of visual slots, even if playerVault has fewer
  const displayLockSlots: VaultSlot[] = Array(MAX_LOCK_SLOTS).fill(null).map((_, i) => {
    return lockSlots[i] || { id: `lock_slot_${i}`, type: 'lock', item: null };
  });
  const displayUpgradeSlots: VaultSlot[] = Array(MAX_UPGRADE_SLOTS).fill(null).map((_, i) => {
    return upgradeSlots[i] || { id: `upgrade_slot_${i}`, type: 'upgrade', item: null };
  });


  const isSecure = displayLockSlots.some(slot => slot.item !== null);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempTitle(e.target.value);
  };

  const saveVaultTitle = () => {
    setVaultTitle(tempTitle);
    setIsEditingTitle(false);
    // TODO: Persist vaultTitle with player data if this feature is desired long-term
  };

  const handleSlotClick = (slot: VaultSlot) => {
    let categoryToOpen: ItemCategory | undefined;
    let todTitle = '';
    let purpose: 'equip_lock' | 'equip_nexus' | undefined;

    if (slot.type === 'lock') {
      categoryToOpen = 'Hardware'; 
      todTitle = `Equip Lock Slot ${parseInt(slot.id.split('_')[2]) + 1}`;
      purpose = 'equip_lock';
    } else if (slot.type === 'upgrade') {
      categoryToOpen = 'Nexus Upgrades';
      todTitle = `Equip Vault Upgrade Slot ${parseInt(slot.id.split('_')[2]) + 1}`;
      purpose = 'equip_nexus';
    }

    if (categoryToOpen) {
      openInventoryTOD({
        category: categoryToOpen,
        title: todTitle,
        purpose: purpose,
        onItemSelect: async (item: GameItemBase) => {
          console.log(`Agent ${playerSpyName} selected ${item.name} for ${slot.type} slot ${slot.id}`);
          await deployItemToVault(slot.id, item.id);
          closeInventoryTOD();
        }
      });
    } else {
      console.warn(`No inventory category defined for slot type: ${slot.type}`);
    }
  };

  const handleClearSlot = async (slotId: string) => {
    await deployItemToVault(slotId, null); // Pass null to clear the item
  };

  const centralHexagonColor = faction === 'Cyphers' ? 'hsl(var(--primary-hsl))' : faction === 'Shadows' ? 'hsl(var(--primary-hsl))' : 'hsl(var(--muted-hsl))';

  return (
    <div className="flex flex-col items-center justify-center p-4 md:p-6 h-full">
      <HolographicPanel 
        className="w-full h-full max-w-4xl flex flex-col items-center relative"
        explicitTheme={currentGlobalTheme} // Ensure panel is themed
      >
        <div className="text-center mb-2 mt-2">
          {isEditingTitle ? (
            <div className="flex items-center gap-2">
              <HolographicInput
                type="text"
                value={tempTitle}
                onChange={handleTitleChange}
                maxLength={30}
                className="text-lg"
                explicitTheme={currentGlobalTheme}
              />
              <HolographicButton onClick={saveVaultTitle} className="p-2" explicitTheme={currentGlobalTheme}>Save</HolographicButton>
            </div>
          ) : (
            <div className="flex items-center gap-2 cursor-pointer group" onClick={() => { setTempTitle(vaultTitle); setIsEditingTitle(true); }}>
              <h2 className="text-2xl font-orbitron holographic-text group-hover:text-accent transition-colors">{vaultTitle}</h2>
              <Edit3 className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors icon-glow" />
            </div>
          )}
           <p className="text-xs text-muted-foreground">Owner: {playerSpyName || "Current User"}</p>
        </div>

        <div className={cn(
            "flex items-center gap-2 my-1 p-1 px-2 rounded-md text-sm font-semibold",
            isSecure ? "bg-green-500/20 text-green-300 border border-green-500" : "bg-red-500/20 text-red-300 border border-red-500"
          )}>
            {isSecure ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
            STATUS: {isSecure ? "SECURE" : "NOT SECURED"}
        </div>

        {/* Central Hexagon Core & Slots & ELINT Display */}
        <div className="relative flex-grow w-full flex items-center justify-center aspect-square max-h-[70vh] max-w-[70vh]">
          {/* Central Hexagon */}
          <svg viewBox="0 0 100 100" className="absolute w-1/2 h-1/2 animate-spin-slow opacity-70" style={{ animationDuration: '20s'}}>
            <polygon
              points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5"
              stroke={centralHexagonColor}
              strokeWidth="2"
              fill="hsla(var(--background-hsl), 0.3)" // Use theme background with opacity
              className="icon-glow" // Assuming icon-glow uses current color for drop shadow
              style={{ filter: `drop-shadow(0 0 5px ${centralHexagonColor})`}}
            />
          </svg>
          
          {/* ELINT Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
            <Sigma className="w-8 h-8 md:w-10 md:h-10 text-primary icon-glow opacity-60 mb-1" />
            <p className="text-3xl md:text-4xl font-digital7 font-bold holographic-text text-primary leading-none">
              {playerStats.elintReserves.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground font-rajdhani uppercase tracking-wider">ELINT</p>
          </div>


          {/* Combined Slots Logic */}
          {[...displayLockSlots, ...displayUpgradeSlots].map((slot, index) => {
            const totalSlots = MAX_LOCK_SLOTS + MAX_UPGRADE_SLOTS;
            const angle = (index / totalSlots) * 360 - 90; // -90 to start at top
            const radius = '38%'; 
            const x = `calc(50% + ${radius} * ${Math.cos(angle * Math.PI / 180)})`;
            const y = `calc(50% + ${radius} * ${Math.sin(angle * Math.PI / 180)})`;
            
            const itemDetails = slot.item ? getItemById(slot.item.id) : null;
            const itemColor = itemDetails ? `hsl(var(${itemDetails.colorVar}))` : 'hsl(var(--muted-hsl))';
            const canClear = slot.item !== null;

            return (
              <div
                key={slot.id}
                className={cn(
                  "absolute w-16 h-16 md:w-20 md:h-20 rounded-md border-2 cursor-pointer transition-all hover:scale-110 hover:shadow-lg",
                  "flex flex-col items-center justify-center text-center" // For item name and clear button
                )}
                style={{
                  left: x,
                  top: y,
                  transform: 'translate(-50%, -50%)',
                  borderColor: itemColor,
                  boxShadow: slot.item ? `0 0 10px ${itemColor}, inset 0 0 5px ${itemColor}` : `0 0 5px ${itemColor}`,
                  backgroundColor: `hsla(var(--card-hsl), 0.7)`, 
                }}
                onClick={() => handleSlotClick(slot)}
              >
                {slot.item && itemDetails ? (
                  <>
                    <img src={itemDetails.imageSrc || '/placeholder-icon.png'} alt={itemDetails.name} className="w-8 h-8 md:w-10 md:h-10 object-contain mb-0.5" />
                    <p className="text-[10px] leading-tight font-semibold" style={{ color: itemColor }}>
                      {itemDetails.name.substring(0,10)}{itemDetails.name.length > 10 ? '...' : ''} L{itemDetails.level}
                    </p>
                    {/* Clear button - only if item is equipped */}
                    <HolographicButton
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent slot click from firing
                            handleClearSlot(slot.id);
                        }}
                        className="!p-0.5 !text-[8px] !h-auto !absolute -top-1 -right-1 !bg-destructive/70 hover:!bg-destructive !border-destructive"
                        explicitTheme={currentGlobalTheme}
                        title={`Remove ${itemDetails.name}`}
                    >
                        X
                    </HolographicButton>
                  </>
                ) : slot.type === 'lock' ? (
                  <Unlock className="w-6 h-6 md:w-8 md:h-8 icon-glow" style={{color: itemColor}}/>
                ) : (
                  <ShieldOff className="w-6 h-6 md:w-8 md:h-8 icon-glow" style={{color: itemColor}}/>
                )}
              </div>
            );
          })}
        </div>
        {/* Removed the "Vault Level: X" text from here */}
      </HolographicPanel>
    </div>
  );
}
