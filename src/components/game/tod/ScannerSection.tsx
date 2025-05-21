
"use client";

import { HolographicButton, HolographicPanel } from '@/components/game/shared/HolographicPanel';
import { RefreshCw, MapPin, AlertTriangle, Gift, Info } from 'lucide-react';
import { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';


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
  const { openTODWindow, faction } = useAppContext();
  const { theme: currentGlobalTheme } = useTheme();
  const [nodes, setNodes] = useState<NetworkNode[]>(generateNodes());
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
    switch(type) {
      case 'vault': return <MapPin className="w-full h-full text-primary group-hover:text-accent icon-glow" />;
      case 'highPriority': return <AlertTriangle className="w-full h-full text-destructive group-hover:text-accent animate-pulse icon-glow" />;
      case 'droppedItem': return <Gift className="w-full h-full text-yellow-400 group-hover:text-accent animate-ping icon-glow" />;
      default: return <MapPin className="w-full h-full text-muted-foreground" />;
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden p-4 md:p-6">
      {/* Main Scanner Content Area - Uses direct opaque background for testing */}
      <div className={cn(
        "flex flex-col flex-grow overflow-hidden rounded-lg border", // Basic structure + rounding + border
        "bg-neutral-900 border-neutral-700" // Opaque test background and border
        // "pad-gloss-effect" // Temporarily removed
      )}>
        {/* Title Area */}
        <div className="flex-none mb-4 flex items-center justify-between p-3 md:p-4">
          <h2 className="text-2xl font-orbitron holographic-text">Network Scanner</h2>
          <div className="flex items-center space-x-2">
            <HolographicButton 
              onClick={() => openTODWindow("Scanner Intel", <p className="font-rajdhani text-muted-foreground">The Network Scanner pings the local digital vicinity for active vaults, high-priority ELINT transfers, and dropped item caches. Use Team Codes to claim dropped items for your faction.</p>, {showCloseButton: true}, currentGlobalTheme)} 
              size="icon" 
              className="!p-2"
              explicitTheme={currentGlobalTheme}
            >
              <Info className="w-5 h-5 icon-glow" />
            </HolographicButton>
            <HolographicButton 
              onClick={refreshScanner} 
              disabled={isLoading} 
              className="!p-2"
              size="icon"
              explicitTheme={currentGlobalTheme}
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </HolographicButton>
          </div>
        </div>

        {/* Node Display Area - Uses direct opaque background and border for testing */}
        <div 
          className={cn(
            "flex-grow relative overflow-hidden p-1 m-2 md:m-3 rounded-md border", // Added margin and its own border/rounding
            "bg-neutral-800 border-neutral-700" // Opaque test background and border
          )}
          // Removed inline style with radial-gradient for this test
        >
          {/* Stylized Network Map Background (simplified for test) */}
          <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: `
                radial-gradient(hsl(var(--primary-hsl)) 0.5px, transparent 0.5px),
                radial-gradient(hsl(var(--primary-hsl)) 0.5px, transparent 0.5px)
              `,
              backgroundSize: '15px 15px',
              backgroundPosition: '0 0, 7.5px 7.5px',
            }}></div>
          
          {/* Connecting Lines */}
          {nodes.map((node, i) => 
            i < nodes.length -1 && ( 
              <svg key={`line-${i}`} className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
                <line 
                  x1={`${node.position.x}%`} y1={`${node.position.y}%`} 
                  x2={`${nodes[i+1].position.x}%`} y2={`${nodes[i+1].position.y}%`} 
                  stroke="hsl(var(--primary-hsl) / 0.2)" strokeWidth="0.5" strokeDasharray="3 2" />
              </svg>
            )
          )}

          {/* Nodes */}
          {nodes.map(node => (
            <div
              key={node.id}
              className="absolute w-10 h-10 md:w-12 md:h-12 p-1 rounded-full border-2 border-transparent hover:border-accent cursor-pointer group transition-all"
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

          {/* Selected Node Details Overlay - Uses direct opaque background and border for testing */}
          {selectedNode && (
            <div 
              className={cn(
                "absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80",
                "p-3 md:p-4 z-20 animate-slide-in-bottom font-rajdhani rounded-lg border shadow-lg",
                "bg-neutral-950 border-neutral-700" // Opaque test background and border
                // "backdrop-blur-sm" // Temporarily removed
              )}
              // Using div instead of HolographicPanel for this test
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
                  <HolographicButton className="w-full mt-3 border-destructive text-destructive hover:bg-destructive hover:text-background" explicitTheme={currentGlobalTheme}>
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
                className="absolute top-1 right-1 !p-1 text-xs hover:bg-primary/20"
                explicitTheme={currentGlobalTheme}
               >
                Close
               </HolographicButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
