
"use client";

import { HolographicPanel } from '@/components/game/shared/HolographicPanel';

interface SectionProps {
  parallaxOffset: number;
  // style?: React.CSSProperties; // Removed as it's no longer needed for root transform
}

export function SpyShopSection({ parallaxOffset }: SectionProps) {
  // TODO: Implement Spy Shop UI to open from within the Equipment Locker section
  // Categories: Vault Hardware, Lock Fortifiers, Entry Tools, Infiltration Gear, Nexus Upgrades, Assault Tech, Aesthetic Schemes
  // Item display: previews, details, level/quantity selectors, purchase button
  // Aesthetic Schemes selection to change TOD theme

  return (
    <div className="flex items-center justify-center p-4 md:p-6 h-full">
      <HolographicPanel className="w-full h-full max-w-4xl flex flex-col items-center justify-center">
        <h2 className="text-4xl font-orbitron mb-8 holographic-text">Spy Shop</h2>
        <p className="text-muted-foreground">Under Development</p>
        <p className="text-center mt-4 text-sm">
          Purchase Vault Hardware, Lock Fortifiers, Entry Tools, Infiltration Gear, Nexus Upgrades, Assault Tech, and customize your TOD with Aesthetic Schemes.
        </p>
      </HolographicPanel>
    </div>
  );
}
