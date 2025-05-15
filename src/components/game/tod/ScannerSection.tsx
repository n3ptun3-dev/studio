
"use client";

import { HolographicPanel, HolographicButton } from '@/components/game/shared/HolographicPanel';
import { RefreshCw, MapPin, AlertTriangle, Gift, Info } from 'lucide-react';
import { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';


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
  const { openTODWindow } = useAppContext();
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
    // New outer wrapper div, providing the p-4 md:p-6 OUTSIDE the border
    <div className="flex flex-col h-full overflow-hidden p-4 md:p-6">
      {/* This div is the main bordered panel, using holographic-panel class which includes its own p-4 md:p-6 */}
      <div className="holographic-panel flex flex-col flex-grow overflow-hidden">
        {/* Title Area - Blends into the section panel */}
        <div className="flex-none mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-orbitron holographic-text">Network Scanner</h2>
          <div className="flex items-center">
            <HolographicButton onClick={refreshScanner} disabled={isLoading} className="p-2">
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="ml-2 hidden sm:inline">Ping Network</span>
            </HolographicButton>
            <HolographicButton 
              onClick={() => openTODWindow("Scanner Intel", <p className="font-rajdhani text-muted-foreground">The Network Scanner pings the local digital vicinity for active vaults, high-priority ELINT transfers, and dropped item caches. Use Team Codes to claim dropped items for your faction.</p>)} 
              variant="ghost" 
              size="icon" 
              className="!p-1 ml-2"
            >
              <Info className="w-5 h-5 icon-glow" />
            </HolographicButton>
          </div>
        </div>

        {/* Node Display Area - This IS a HolographicPanel component for layering effect, with reduced padding */}
        <HolographicPanel className="flex-grow relative overflow-hidden p-1">
          {/* Stylized Network Map Background */}
          <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: `
                radial-gradient(hsl(var(--primary-hsl)) 1px, transparent 1px),
                radial-gradient(hsl(var(--primary-hsl)) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 10px 10px',
            }}></div>
          
          {/* Connecting Lines */}
          {nodes.map((node, i) => 
            i < nodes.length -1 && ( // Ensure we don't try to connect the last node to a non-existent next one
              <svg key={`line-${i}`} className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
                <line 
                  x1={`${node.position.x}%`} y1={`${node.position.y}%`} 
                  x2={`${nodes[i+1].position.x}%`} y2={`${nodes[i+1].position.y}%`} 
                  stroke="hsl(var(--primary-hsl) / 0.3)" strokeWidth="1" strokeDasharray="4 2" />
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

          {/* Selected Node Details Overlay */}
          {selectedNode && (
            <HolographicPanel 
              className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 p-4 z-20 animate-slide-in-bottom font-rajdhani"
            >
              <h3 className="text-lg font-orbitron mb-2 holographic-text">{selectedNode.title}</h3>
              {selectedNode.type === 'vault' && (
                <>
                  <p className="text-sm text-muted-foreground">Owner: {selectedNode.owner}</p>
                  <p className="text-sm text-muted-foreground">Team: {selectedNode.team}</p>
                  <p className="text-sm text-muted-foreground">Level: {selectedNode.level}</p>
                  <HolographicButton className="w-full mt-3">View Vault</HolographicButton>
                </>
              )}
              {selectedNode.type === 'highPriority' && (
                <>
                  <p className="text-sm text-destructive animate-pulse">PRIORITY INTERCEPT</p>
                  <p className="text-sm text-muted-foreground">Source: {selectedNode.owner}</p>
                  <p className="text-sm text-muted-foreground">Team: {selectedNode.team}</p>
                  <p className="text-sm text-muted-foreground">ELINT Transfer: {selectedNode.elintAmount}</p>
                  <HolographicButton className="w-full mt-3 border-destructive text-destructive hover:bg-destructive hover:text-background">
                    Initiate Counter Hack
                  </HolographicButton>
                </>
              )}
              {selectedNode.type === 'droppedItem' && (
                <>
                  <p className="text-sm text-yellow-400">Dropped Item Detected</p>
                  <input type="text" placeholder="Enter Team Code" className="holographic-input w-full my-2 text-sm" />
                  <HolographicButton className="w-full mt-1">Claim Item</HolographicButton>
                </>
              )}
               <HolographicButton variant="ghost" onClick={() => setSelectedNode(null)} className="absolute top-1 right-1 !p-1 text-xs hover:bg-primary/20">Close</HolographicButton>
            </HolographicPanel>
          )}
        </HolographicPanel>
      </div>
    </div>
  );
}

