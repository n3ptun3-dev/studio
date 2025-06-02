
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { HolographicPanel, HolographicButton, HolographicInput } from '@/components/game/shared/HolographicPanel';
import { RefreshCw, Info, MapPin, AlertTriangle, Gift } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import { useTheme, type Theme } from '@/contexts/ThemeContext';

const NODE_AREA_SCROLL_SPEED = 0.15;

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

const getScannerBackgroundClass = (theme: Theme): string => {
  switch (theme) {
    case 'cyphers':
      return 'cyphers-background';
    case 'shadows':
      return 'shadows-background';
    case 'terminal-green': 
    default:
      return 'observer-background';
  }
};

export function ScannerSection({ parallaxOffset }: SectionProps) {
  const { openTODWindow } = useAppContext(); 
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
    // Reset animation specific states when the theme/key changes, ensuring animation restarts correctly for new bg
    currentPositionXRef.current = 0; 
    lastTime = 0; 

    const animateScroll = (timestamp: number) => {
      if (!nodeDisplayArea) return; 
      if (!lastTime) {
        lastTime = timestamp;
      }
      const deltaTime = timestamp - lastTime;
      lastTime = timestamp;

      currentPositionXRef.current -= NODE_AREA_SCROLL_SPEED * (deltaTime / 16.67); 
      
      // Update backgroundPosition for the parallax effect of the map (first layer)
      // The grid and overlay positions (0 0 for 2nd, 3rd, 4th layers) are static.
      nodeDisplayArea.style.backgroundPosition = `${currentPositionXRef.current}px 0px, 0 0, 0 0, 10px 10px`;

      animationFrameIdRef.current = requestAnimationFrame(animateScroll);
    };
    
    animationFrameIdRef.current = requestAnimationFrame(animateScroll);

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [currentGlobalTheme, themeVersion]); // Re-run effect if theme or version changes

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
  
  const scannerBgClass = getScannerBackgroundClass(currentGlobalTheme);

  return (
    <div className="flex flex-col h-full overflow-hidden p-4 md:p-6">
      <div
        className={cn(
          "flex flex-col flex-grow overflow-hidden rounded-lg",
          "border border-[var(--hologram-panel-border)]", 
          "shadow-[0_0_15px_var(--hologram-glow-color),_inset_0_0_10px_var(--hologram-glow-color)]", 
          "bg-black/70",
          "max-w-4xl",
          "w-full mx-auto"
        )}
      >
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

        <HolographicPanel
          ref={nodeDisplayAreaRef}
          explicitTheme={currentGlobalTheme} 
          key={`node-display-panel-${currentGlobalTheme}-${themeVersion}`} 
          className={cn(
            "flex-grow relative overflow-hidden p-1 m-2 md:m-3 rounded-md map-overlay pad-gloss-effect", 
            scannerBgClass 
          )}
        >
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

          {selectedNode && (
            <HolographicPanel
              explicitTheme={currentGlobalTheme}
              key={`node-details-${currentGlobalTheme}-${themeVersion}-${selectedNode.id}`}
              className={cn(
                "absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80",
                "p-3 md:p-4 z-20 animate-slide-in-bottom font-rajdhani rounded-lg shadow-lg",
                "bg-black/50 backdrop-blur-sm" 
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
                onClick={() => setSelectedNode(null)}
                className="absolute top-1 right-1 !p-1 text-xs !text-muted-foreground hover:!text-foreground !bg-transparent hover:!bg-primary/20"
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

    