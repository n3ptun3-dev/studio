
"use client";
import { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { HolographicPanel, HolographicButton, HolographicInput } from '@/components/game/shared/HolographicPanel';
import { ShieldCheck, ShieldOff, ShieldAlert, Edit3, Lock, Unlock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionProps {
  parallaxOffset: number;
  style?: React.CSSProperties;
}

const MAX_SLOTS = 8; // 4 Lock, 4 Vault-Wide

export function VaultSection({ parallaxOffset, style }: SectionProps) {
  const { faction, playerSpyName } = useAppContext(); // For theming and owner display
  const [vaultTitle, setVaultTitle] = useState("[UNCLASSIFIED]");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(vaultTitle);

  // Placeholder for vault slots and their items
  // In a real app, this would come from player state
  const [slots, setSlots] = useState(Array(MAX_SLOTS).fill(null).map((_, i) => ({
    id: i,
    type: i < 4 ? 'lock' : 'upgrade', // First 4 are locks, next 4 are upgrades
    item: null, // e.g., { name: "Cypher Lock Lvl 3", level: 3, colorVar: "--level-3-color" }
  })));

  const isSecure = slots.some(slot => slot.type === 'lock' && slot.item !== null);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempTitle(e.target.value);
  };

  const saveVaultTitle = () => {
    // TODO: Add offensive word filter
    setVaultTitle(tempTitle);
    setIsEditingTitle(false);
  };

  const centralHexagonColor = faction === 'Cyphers' ? 'hsl(var(--primary-hsl))' : faction === 'Shadows' ? 'hsl(var(--primary-hsl))' : 'hsl(var(--muted-hsl))';

  return (
    <div className="tod-section flex flex-col items-center justify-center p-4 md:p-6 h-full" style={style}>
      <HolographicPanel className="w-full h-full max-w-4xl flex flex-col items-center relative">
        <div className="text-center mb-2 mt-2">
          {isEditingTitle ? (
            <div className="flex items-center gap-2">
              <HolographicInput 
                type="text" 
                value={tempTitle} 
                onChange={handleTitleChange}
                maxLength={30}
                className="text-lg"
              />
              <HolographicButton onClick={saveVaultTitle} className="p-2">Save</HolographicButton>
            </div>
          ) : (
            <div className="flex items-center gap-2 cursor-pointer group" onClick={() => { setTempTitle(vaultTitle); setIsEditingTitle(true); }}>
              <h2 className="text-2xl font-orbitron holographic-text group-hover:text-accent transition-colors">{vaultTitle}</h2>
              <Edit3 className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
            </div>
          )}
           <p className="text-xs text-muted-foreground">Vault Owner: {playerSpyName || "Current User"}</p>
        </div>

        <div className={cn(
            "flex items-center gap-2 my-1 p-1 px-2 rounded-md text-sm font-semibold",
            isSecure ? "bg-green-500/20 text-green-300 border border-green-500" : "bg-red-500/20 text-red-300 border border-red-500"
          )}>
            {isSecure ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
            STATUS: {isSecure ? "SECURE" : "NOT SECURED"}
        </div>
       
        {/* Central Hexagon Core & Slots */}
        <div className="relative flex-grow w-full flex items-center justify-center aspect-square max-h-[70vh] max-w-[70vh]">
          {/* Central Hexagon */}
          <svg viewBox="0 0 100 100" className="absolute w-1/2 h-1/2 animate-spin-slow opacity-70" style={{ animationDuration: '20s'}}>
            <polygon 
              points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" 
              stroke={centralHexagonColor}
              strokeWidth="2" 
              fill="hsla(var(--background-hsl), 0.3)"
              className="icon-glow"
              style={{ filter: `drop-shadow(0 0 5px ${centralHexagonColor})`}}
            />
          </svg>

          {/* Gadget Slots */}
          {slots.map((slot, index) => {
            const angle = (index / MAX_SLOTS) * 360 - 90; // -90 to start at top
            const radius = '38%'; // Adjust as needed for placement around hexagon
            const x = `calc(50% + ${radius} * ${Math.cos(angle * Math.PI / 180)})`;
            const y = `calc(50% + ${radius} * ${Math.sin(angle * Math.PI / 180)})`;
            const itemColor = slot.item ? `hsl(var(${slot.item.colorVar}))` : 'hsl(var(--muted-hsl))';

            return (
              <div
                key={slot.id}
                className="absolute w-16 h-16 md:w-20 md:h-20 rounded-md border-2 cursor-pointer transition-all hover:scale-110 hover:shadow-lg"
                style={{
                  left: x,
                  top: y,
                  transform: 'translate(-50%, -50%)',
                  borderColor: itemColor,
                  boxShadow: slot.item ? `0 0 10px ${itemColor}, inset 0 0 5px ${itemColor}` : `0 0 5px ${itemColor}`,
                  backgroundColor: 'hsla(var(--background-hsl), 0.5)',
                }}
                // onClick={() => handleSlotClick(slot.id)} // TODO: Implement slot interaction
              >
                <div className="w-full h-full flex items-center justify-center">
                  {slot.item ? (
                    <span className="text-xs font-bold" style={{color: itemColor }}>{slot.item.name.substring(0,3)}{slot.item.level}</span>
                  ) : slot.type === 'lock' ? (
                    <Unlock className="w-6 h-6 md:w-8 md:h-8" style={{color: itemColor}}/>
                  ) : (
                     <ShieldOff className="w-6 h-6 md:w-8 md:h-8" style={{color: itemColor}}/>
                  )}
                </div>
                {/* TODO: Add smaller preview for fortifiers if item in slot is a lock and fortified */}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-auto mb-1">Vault Level: X (Display user's vault level)</p>
      </HolographicPanel>
    </div>
  );
}

// Add a CSS animation for slow spin if not already in tailwind.config.js
// @keyframes spin-slow { to { transform: rotate(360deg); } }
// .animate-spin-slow { animation: spin-slow 20s linear infinite; }
// In tailwind.config.ts animations: 'spin-slow': 'spin 20s linear infinite',
// This is already present in the thought process, so I'll assume it will be added to tailwind.config.ts or use existing 'spin' with custom duration.

    