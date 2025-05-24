
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { HolographicPanel } from '@/components/game/shared/HolographicPanel'; // Keep for Node Display & Details
import { RefreshCw, Info, MapPin, AlertTriangle, Gift } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import { useTheme, type Theme } from '@/contexts/ThemeContext';

const NODE_AREA_SCROLL_SPEED = 0.15; // Adjusted scroll speed

interface SectionProps {
  parallaxOffset: number;
}

interface NetworkNode {
  id: string;
  type: 'vault' | 'highPriority' | 'droppedItem';
  title: string;
  level?: number;
  owner?: string;
  team?: string; 
  elintAmount?: number;
  position: { x: number; y: number }; 
}

const generateNodes = (count = 15): NetworkNode[] => {
  const nodes: NetworkNode[] = [];
  const types: NetworkNode['type'][] = ['vault', 'highPriority', 'droppedItem'];
  for (let i = 0; i < count; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    nodes.push({
      id: `node-${i}`,
      type,
      title: type === 'droppedItem' ? "Unknown Signal" : `Target ${String.fromCharCode(65 + i)}`,
      level: type === 'vault' ? Math.floor(Math.random() * 8) + 1 : undefined,
      owner: type !== 'droppedItem' ? `Agent${Math.floor(Math.random() * 1000)}` : undefined,
      team: type !== 'droppedItem' ? (Math.random() > 0.5 ? "Cyphers" : "Shadows") : undefined,
      elintAmount: type === 'highPriority' ? Math.floor(Math.random() * 5000) + 1000 : undefined,
      position: {
        x: Math.random() * 80 + 10, 
        y: Math.random() * 70 + 15  
      },
    });
  }
  return nodes;
};

export function ScannerSection({ parallaxOffset }: SectionProps) {
  const { openTODWindow, faction: currentAppContextFaction } = useAppContext();
  const { theme: currentGlobalTheme, themeVersion } = useTheme();
  const [nodes, setNodes] = useState<NetworkNode[]>(() => generateNodes());
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const nodeDisplayAreaRef = useRef<HTMLDivElement>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const currentPositionXRef = useRef(0);

  useEffect(() => {
    const nodeDisplayArea = nodeDisplayAreaRef.current;
    if (!nodeDisplayArea) return;

    let lastTime = 0;
    const animateScroll = (timestamp: number) => {
      if (!lastTime) {
        lastTime = timestamp;
      }
      const deltaTime = timestamp - lastTime;
      lastTime = timestamp;

      currentPositionXRef.current -= NODE_AREA_SCROLL_SPEED * (deltaTime / 16.67); // Normalize speed
      
      let mapImageFilename = "World Map Green.jpg"; // Default for terminal-green or unknown
      if (currentGlobalTheme === 'cyphers') {
        mapImageFilename = "World Map Blue.jpg";
      } else if (currentGlobalTheme === 'shadows') {
        mapImageFilename = "World Map Red.jpg";
      }
      // Note: Observer theme uses terminal-green, so green map is fine.

      nodeDisplayArea.style.backgroundImage = `
        radial-gradient(hsl(var(--foreground-hsl)/0.9) 0.5px, transparent 0.5px),
        url('/backgrounds/${mapImageFilename}')
      `;
      nodeDisplayArea.style.backgroundSize = `15px 15px, auto 100%`;
      nodeDisplayArea.style.backgroundPosition = `0 0, ${currentPositionXRef.current}px 0`;
      nodeDisplayArea.style.backgroundRepeat = 'repeat, repeat-x';

      animationFrameIdRef.current = requestAnimationFrame(animateScroll);
    };

    animationFrameIdRef.current = requestAnimationFrame(animateScroll);

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [currentGlobalTheme]); // Re-run if theme changes to update map image and dot color

  const refreshScanner = () => {
    setIsLoading(true);
    setSelectedNode(null); 
    setTimeout(() => {
      setNodes(generateNodes());
      setIsLoading(false);
    }, 1000); 
  };

  const handleNodeClick = (node: NetworkNode) => {
    setSelectedNode(node);
  };

  const getNodeIcon = (type: NetworkNode['type']) => {
    switch (type) {
      case 'vault': return <MapPin className="w-full h-full text-primary group-hover:text-accent icon-glow" />;
      case 'highPriority': return <AlertTriangle className="w-full h-full text-destructive group-hover:text-accent animate-pulse icon-glow" />;
      case 'droppedItem': return <Gift className="w-full h-full text-yellow-400 group-hover:text-accent animate-ping icon-glow" />;
      default: return <MapPin className="w-full h-full text-muted-foreground" />;
    }
  };
  
  const handleScannerInfoClick = () => {
    openTODWindow(
      "Scanner Intel",
      <div className="font-rajdhani text-muted-foreground space-y-2 p-2">
        <p>The Scanner pings the local digital vicinity for active targets:</p>
        <ul className="list-disc list-inside space-y-1">
          <li><MapPin className="inline w-4 h-4 mr-1 text-primary" /> Secure Vaults: Indicates other agents' ELINT storage.</li>
          <li><AlertTriangle className="inline w-4 h-4 mr-1 text-destructive" /> High-Priority Transfers: Time-sensitive ELINT movements.</li>
          <li><Gift className="inline w-4 h-4 mr-1 text-yellow-400" /> Dropped Items: Caches of equipment or ELINT.</li>
        </ul>
      </div>,
      { showCloseButton: true }
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden p-4 md:p-6">
      {/* Main content area with custom holographic-like border and specific background */}
      <div
        className={cn(
          "flex flex-col flex-grow overflow-hidden rounded-lg",
          "bg-black/70", // The desired dark translucent background
          "border border-[var(--hologram-panel-border)]", // Themed border
          "shadow-[0_0_15px_var(--hologram-glow-color),_inset_0_0_10px_var(--hologram-glow-color)]" // Themed glow
        )}
      >
        {/* Title Area */}
        <div className="flex-none flex items-center justify-between p-3 md:p-4">
          <h2 className="text-2xl font-orbitron holographic-text">Scanner</h2>
          <div className="flex items-center space-x-2">
            <HolographicButton
              onClick={handleScannerInfoClick}
              className="!p-2" 
              explicitTheme={currentGlobalTheme}
              aria-label="Scanner Information"
            >
              <Info className="w-5 h-5 icon-glow" />
            </HolographicButton>
            <HolographicButton
              onClick={refreshScanner}
              disabled={isLoading}
              className="!p-2"
              explicitTheme={currentGlobalTheme}
              aria-label="Refresh Scanner"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''} icon-glow`} />
            </HolographicButton>
          </div>
        </div>

        {/* Node Display Area - This IS a HolographicPanel for its own styling */}
        <HolographicPanel
          ref={nodeDisplayAreaRef}
          explicitTheme={currentGlobalTheme} // So its internal border/glow uses the theme
          key={`node-display-panel-${currentGlobalTheme}-${themeVersion}`} // Force re-render on theme change
          className={cn(
            "flex-grow relative overflow-hidden p-1 m-2 md:m-3 rounded-md map-overlay"
            // Its background is now the scrolling map + dot grid + map-overlay tint
            // Its border and glow will come from its holographic-panel nature + explicitTheme
          )}
          // The style prop for background image is managed by the useEffect hook
        >
          {/* Connecting Lines */}
          {nodes.map((node, i) =>
            i < nodes.length - 1 && (
              <svg key={`line-${i}`} className="absolute inset-0 w-full h-full z-[10]" style={{ pointerEvents: 'none' }}>
                <line
                  x1={`${node.position.x}%`} y1={`${node.position.y}%`}
                  x2={`${nodes[i + 1].position.x}%`} y2={`${nodes[i + 1].position.y}%`}
                  stroke="hsl(var(--primary-hsl) / 0.5)" strokeWidth="1" strokeDasharray="4 2" />
              </svg>
            )
          )}

          {/* Nodes */}
          {nodes.map(node => (
            <div
              key={node.id}
              className="absolute w-10 h-10 md:w-12 md:h-12 p-1 rounded-full border-2 border-transparent hover:border-accent cursor-pointer group transition-all z-[10]"
              style={{
                left: `${node.position.x}%`,
                top: `${node.position.y}%`,
                transform: 'translate(-50%, -50%)',
                borderColor: selectedNode?.id === node.id ? 'hsl(var(--accent-hsl))' : 'transparent',
                boxShadow: selectedNode?.id === node.id ? '0 0 15px hsl(var(--accent-hsl)), inset 0 0 8px hsl(var(--accent-hsl))' : 'none',
              }}
              onClick={() => handleNodeClick(node)}
              title={node.title}
            >
              {getNodeIcon(node.type)}
            </div>
          ))}

          {/* Selected Node Details Overlay */}
          {selectedNode && (
            <HolographicPanel
              explicitTheme={currentGlobalTheme}
              key={`node-details-${currentGlobalTheme}-${themeVersion}-${selectedNode.id}`}
              className={cn(
                "absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80",
                "p-3 md:p-4 z-20 animate-slide-in-bottom font-rajdhani rounded-lg shadow-lg",
                "bg-black/40 backdrop-blur-sm" // Darker overlay for details window
              )}
            >
              <h3 className="text-lg font-orbitron mb-2 holographic-text">{selectedNode.title}</h3>
              {selectedNode.type === 'vault' && (
                <>
                  <p className="text-sm text-muted-foreground">Owner: {selectedNode.owner}</p>
                  <p className="text-sm text-muted-foreground">Team: {selectedNode.team}</p>
                  <p className="text-sm text-muted-foreground">Level: {selectedNode.level}</p>
                  <HolographicButton className="w-full mt-3" explicitTheme={currentGlobalTheme}>View Vault</HolographicButton>
                </>
              )}
              {selectedNode.type === 'highPriority' && (
                <>
                  <p className="text-sm text-destructive animate-pulse">PRIORITY INTERCEPT</p>
                  <p className="text-sm text-muted-foreground">Source: {selectedNode.owner}</p>
                  <p className="text-sm text-muted-foreground">Team: {selectedNode.team}</p>
                  <p className="text-sm text-muted-foreground">ELINT Transfer: {selectedNode.elintAmount}</p>
                  <HolographicButton
                    className="w-full mt-3 !border-destructive !text-destructive hover:!bg-destructive hover:!text-destructive-foreground"
                    explicitTheme={currentGlobalTheme}
                  >
                    Initiate Counter Hack
                  </HolographicButton>
                </>
              )}
              {selectedNode.type === 'droppedItem' && (
                <>
                  <p className="text-sm text-yellow-400">Dropped Item Detected</p>
                  <HolographicInput type="text" placeholder="Enter Team Code" className="w-full my-2 text-sm" explicitTheme={currentGlobalTheme} />
                  <HolographicButton className="w-full mt-1" explicitTheme={currentGlobalTheme}>Claim Item</HolographicButton>
                </>
              )}
              <HolographicButton
                variant="ghost"
                onClick={() => setSelectedNode(null)}
                className="absolute top-1 right-1 !p-1 text-xs hover:!bg-primary/20 !text-muted-foreground hover:!text-foreground"
                explicitTheme={currentGlobalTheme}
              >
                Close
              </HolographicButton>
            </HolographicPanel>
          )}
        </HolographicPanel>
      </div>
    </div>
  );
}
