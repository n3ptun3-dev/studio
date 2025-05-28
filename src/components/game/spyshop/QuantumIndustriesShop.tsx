// src/components/game/spyshop/QuantumIndustriesShop.tsx
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { X, Shield, Drill, Eye, Zap, Waves, Brain, Clock, Key, GitFork, Compass, Wrench, Siren, HardDrive, Wifi, Lock, Cpu, Cloud, Settings, ScrollText } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { StickyHeader } from './StickyHeader'; // Import the StickyHeader component

export function QuantumIndustriesShop() {
  const { closeSpyShop } = useAppContext();
  const [activeTab, setActiveTab] = useState('shop');

  // Create a ref for the main scrollable container
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Render the product grid content
  const renderShopContent = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-8 pr-4">
      {/* Vault Hardware Section */}
      <div className="bg-gradient-to-br from-blue-900/40 to-cyan-900/40 border border-blue-700 rounded-lg p-6 shadow-xl backdrop-blur-sm">
        <h3 className="text-3xl font-bold text-sky-300 mb-4 flex items-center"><Lock className="w-8 h-8 mr-2" /> Vault Hardware</h3>
        <p className="text-gray-300 mb-4">Fortify your vault with our cutting-edge barriers. Strength, resistance, and cost vary by level and type, ensuring robust protection for your ELINT.</p>
        <ul className="space-y-3 text-lg">
          <li><span className="font-semibold text-sky-200">Standard Cypher Lock:</span> Your basic digital barrier. Requires successful code entries based on strength.</li>
          <li><span className="font-semibold text-sky-200">Reinforced Deadbolt:</span> A physical barrier with added resilience. Drills are less effective against it.</li>
          <li><span className="font-semibold text-sky-200">Quantum Entanglement Lock:</span> Non-physical tricky tech that adds extra symbols to sequences.</li>
          <li><span className="font-semibold text-sky-200">Sonic Pulse Lock:</span> Needs specific frequencies. Time allowed for entries is significantly reduced.</li>
          <li><span className="font-semibold text-sky-200">Plasma Conduit Lock:</span> Energy flow defense. Successful entries decrease time for subsequent entries.</li>
          <li><span className="font-semibold text-sky-200">Biometric Seal:</span> Biological key required. Introduces occasional micro-stutters in display.</li>
          <li><span className="font-semibold text-sky-200">Neural Network Lock:</span> Adapts and evolves, increasing symbols displayed.</li>
          <li><span className="font-semibold text-sky-200">Temporal Flux Lock:</span> Warps time around secured data. Its strength increases over time.</li>
        </ul>
      </div>

      {/* Defensive Gadgets Section */}
      <div className="bg-gradient-to-br from-blue-900/40 to-cyan-900/40 border border-blue-700 rounded-lg p-6 shadow-xl backdrop-blur-sm">
        <h3 className="text-3xl font-bold text-sky-300 mb-4 flex items-center"><Shield className="w-8 h-8 mr-2" /> Lock Fortifiers (Defensive Gadgets)</h3>
        <p className="text-gray-300 mb-4">Attach these gadgets to your locks for additional layers of defense and special effects during an infiltration attempt.</p>
        <ul className="space-y-3 text-lg">
          <li><span className="font-semibold text-sky-200">Dummy Node:</span> Negates successful entries equal to its level.</li>
          <li><span className="font-semibold text-sky-200">Adaptive Shield:</span> Increases lock's resistance, requiring more entries.</li>
          <li><span className="font-semibold text-sky-200">Feedback Loop:</span> Damages attacker's tool on failed entry.</li>
          <li><span className="font-semibold text-sky-200">Sonic Dampener:</span> Makes Hydraulic Drills completely ineffective.</li>
          <li><span className="font-semibold text-sky-200">Temporal Anchor:</span> Periodically reverses portions of the sequence.</li>
          <li><span className="font-semibold text-sky-200">Reactive Armor:</span> Explodes outwards when strength reaches zero.</li>
          <li><span className="font-semibold text-sky-200">Neural Feedback Spore:</span> Randomizes the symbol keypad.</li>
          <li><span className="font-semibold text-sky-200">Entanglement Field Inhibitor:</span> Inserts random emojis and resets game on incorrect sequence.</li>
        </ul>
      </div>

      {/* Nexus Gadgets Section */}
      <div className="bg-gradient-to-br from-blue-900/40 to-cyan-900/40 border border-blue-700 rounded-lg p-6 shadow-xl backdrop-blur-sm">
        <h3 className="text-3xl font-bold text-sky-300 mb-4 flex items-center"><Settings className="w-8 h-8 mr-2" /> Nexus Gadgets (Permanent Vault Upgrades)</h3>
        <p className="text-gray-300 mb-4">These permanent upgrades provide passive benefits, making your entire vault a fortress.</p>
        <ul className="space-y-3 text-lg">
          <li><span className="font-semibold text-sky-200">Security Camera:</span> Alerts you to infiltration attempts, providing attacker intel.</li>
          <li><span className="font-semibold text-sky-200">Reinforced Foundation:</span> Increases structural integrity and difficulty of infiltrating the vault.</li>
          <li><span className="font-semibold text-sky-200">Emergency Repair System (ERS):</span> Provides a reserve of strength for your locks.</li>
          <li><span className="font-semibold text-sky-200">Emergency Power Cell (EPC):</span> Single-use boost to defenses, increases minigame difficulty.</li>
        </ul>
      </div>

      {/* Offensive Tools Section */}
      <div className="bg-gradient-to-br from-blue-900/40 to-cyan-900/40 border border-blue-700 rounded-lg p-6 shadow-xl backdrop-blur-sm">
        <h3 className="text-3xl font-bold text-sky-300 mb-4 flex items-center"><Drill className="w-8 h-8 mr-2" /> Offensive Tools</h3>
        <p className="text-gray-300 mb-4">Equip yourself with the best tools to bypass even the most formidable vault defenses.</p>
        <ul className="space-y-3 text-lg">
          <li><span className="font-semibold text-sky-200">Basic Pick:</span> Your standard entry-level tool. Effective against basic locks.</li>
          <li><span className="font-semibold text-sky-200">Hydraulic Drill:</span> Heavy-duty tool, slow but effective against resilient barriers.</li>
          <li><span className="font-semibold text-sky-200">Code Injector:</span> Precision tool, best against logic-based defenses, reduces symbols.</li>
          <li><span className="font-semibold text-sky-200">Sonic Pulser:</span> Frequency-based tool, effective against sound-based defenses.</li>
          <li><span className="font-semibold text-sky-200">Bio-Scanner Override:</span> Bypasses biological security measures.</li>
          <li><span className="font-semibold text-sky-200">Temporal Dephaser:</span> Manipulates time flow, effective against time-based defenses.</li>
          <li><span className="font-semibold text-sky-200">Quantum Dephaser:</span> Disrupts quantum fields, best against quantum-based defenses.</li>
          <li><span className="font-semibold text-sky-200">Universal Key:</span> The master bypass tool, ignores defensive gadgets.</li>
        </ul>
      </div>

      {/* Assault Tech Section */}
      <div className="bg-gradient-to-br from-blue-900/40 to-cyan-900/40 border border-blue-700 rounded-lg p-6 shadow-xl backdrop-blur-sm">
        <h3 className="text-3xl font-bold text-sky-300 mb-4 flex items-center"><Zap className="w-8 h-8 mr-2" /> Assault Tech</h3>
        <p className="text-gray-300 mb-4">Single-use offensive programs to facilitate infiltration and disrupt defender countermeasures.</p>
        <ul className="space-y-3 text-lg">
          <li><span className="font-semibold text-sky-200">System Hack:</span> Reduces lock difficulty by reducing required code entries.</li>
          <li><span className="font-semibold text-sky-200">Stealth Program:</span> Makes attacker harder to detect, reduces code digits.</li>
          <li><span className="font-semibold text-sky-200">Code Scrambler:</span> Interferes with defender's visual interface, randomizing keypad.</li>
          <li><span className="font-semibold text-sky-200">Power Spike:</span> Temporarily disables specific defensive gadgets.</li>
          <li><span className="font-semibold text-sky-200">Seismic Charge:</span> Instantly reduces required code entries for a lock.</li>
        </ul>
      </div>
    </div>
  );

  // Render the About Us content
  const renderAboutUsContent = () => (
    <div className="flex flex-col items-center text-center max-w-4xl mx-auto pb-8 pr-4">
      <h3 className="text-4xl font-bold text-sky-300 mb-6 flex items-center"><Cloud className="w-10 h-10 mr-3" /> About Quantum Industries</h3>
      <p className="text-xl text-gray-300 mb-8 leading-relaxed">
        At Quantum Industries, we don't just engineer security solutions; we redefine the very fabric of digital defense and offense. Born from a vision of a hyper-connected, yet fiercely protected, future, we are the pioneers of ELINT security, pushing the boundaries of what's possible in a world where information is the ultimate currency.
      </p>
      <p className="text-xl text-gray-300 mb-8 leading-relaxed">
        Our dedicated team of quantum physicists, cybernetic engineers, and tactical strategists work tirelessly to develop state-of-the-art Vault Hardware, impenetrable Lock Fortifiers, and revolutionary Nexus Gadgets. From the subtle hum of a Biometric Seal to the mind-bending complexity of a Temporal Flux Lock, our defensive technologies are crafted to withstand the most sophisticated infiltration attempts, ensuring your ELINT remains inviolable.
      </p>
      <p className="text-xl text-gray-300 mb-8 leading-relaxed">
        But security isn't just about defense. It's also about strategic advantage. Our Offensive Tools and Assault Tech are designed for those who dare to breach the seemingly unbreachable. Whether you're wielding a precision Code Injector, a heavy-duty Hydraulic Drill, or deploying a game-changing Seismic Charge, Quantum Industries empowers you to navigate the digital battlefield with unparalleled prowess.
      </p>
      <p className="text-xl text-gray-300 mb-8 leading-relaxed">
        We believe in a future where every piece of data is a fortress, and every agent is a master of their domain. Join the Quantum Industries family, and let's build that future together. Your ELINT, secured. Your mission, empowered.
      </p>
      <p className="text-lg text-sky-400 font-semibold mt-8">
        "Innovation in Security. Excellence in Espionage."
      </p>
    </div>
  );

  return (
    // The main shop container that will now handle its own scrolling
    // Added flex-col and max-h-full to ensure it fills available height and allows scroll
    <div ref={scrollContainerRef} className="w-full h-full max-h-full bg-blue-950 text-white flex flex-col relative overflow-y-auto">

      {/* Sticky Header - pass the ref so it can listen to this container's scroll */}
      <StickyHeader activeTab={activeTab} setActiveTab={setActiveTab} scrollTargetRef={scrollContainerRef} />

      {/* This main title will appear below the sticky header when not scrolled
          Padding added to push content down from the initial header */}
      <div className="relative z-0 text-center pt-8 pb-4">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-4 text-sky-400 drop-shadow-lg [text-shadow:_0_0_20px_var(--tw-colors-sky-500)]">QUANTUM INDUSTRIES</h1>
        <h2 className="text-xl sm:text-2xl md:text-3xl text-gray-300 mb-10 font-light tracking-wide">Official ELINT Heist Spy Shop</h2>

        {/* !!! TEST ANIMATION BOX !!! */}
        {/* Added opacity-50 to test transparency */}
        <div className="w-20 h-20 bg-red-500 mx-auto mt-4 rounded-full flex items-center justify-center text-white font-bold animate-spin-slow opacity-50">
          TEST
        </div>
        {/* !!! END TEST ANIMATION BOX !!! */}

      </div>

      {/* Main content area - flex-grow ensures it takes remaining space */}
      <div className="flex-grow w-full max-w-6xl mx-auto relative z-10 p-8 pt-0">
        {activeTab === 'shop' ? renderShopContent() : renderAboutUsContent()}
      </div>

      {/* Futuristic Background Grids and Blurs */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Removed explicit opacity-50 to let animation control it, and pulse will go to 1 */}
        <div className="absolute inset-0 bg-[size:20px_20px] [background-image:linear-gradient(to_right,rgba(0,128,255,0.2)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,128,255,0.2)_1px,transparent_1px)] animate-pulse-grid"></div>
        {/* Increased base opacity to make animation more visible */}
        <div className="absolute inset-0 bg-gradient-radial from-blue-700/20 to-transparent blur-3xl opacity-99 animate-fade-in-out"></div>
        {/* Increased base opacity for floaters to make them more visible */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl opacity-99 animate-float-one"></div>
        {/* Increased base opacity for floaters to make them more visible */}
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl opacity-99 animate-float-two"></div>
      </div>
    </div>
  );
}