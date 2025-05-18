
"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Fingerprint } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HolographicPanel } from '@/components/game/shared/HolographicPanel';
import { useTheme } from '@/contexts/ThemeContext';

export function FingerprintScannerScreen() {
  const { setOnboardingStep, faction } = useAppContext();
  const { theme: currentGlobalTheme, themeVersion } = useTheme();
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [accessGranted, setAccessGranted] = useState(false);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const SCAN_DURATION = 1000; // ms

  const startScan = () => {
    if (accessGranted || isScanning) return;
    setIsScanning(true);
    setScanProgress(0);

    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    progressIntervalRef.current = setInterval(() => {
      setScanProgress(prev => {
        const next = prev + 100 / (SCAN_DURATION / 50); // Progress in 50ms intervals
        if (next >= 100) {
          clearInterval(progressIntervalRef.current!);
          return 100;
        }
        return next;
      });
    }, 50);

    if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
    scanTimeoutRef.current = setTimeout(() => {
      handleScanSuccess();
    }, SCAN_DURATION);
  };

  const cancelScan = () => {
    if (accessGranted || !isScanning) return; // Only cancel if actively scanning and not yet granted
    setIsScanning(false);
    setScanProgress(0);
    if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
  };

  const handleScanSuccess = () => {
    setIsScanning(false);
    setAccessGranted(true);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    setTimeout(() => {
      setOnboardingStep('tod');
    }, 1500); // Wait a bit after "Access Granted" before moving to TOD
  };

  useEffect(() => {
    // Cleanup timeouts and intervals if component unmounts
    return () => {
      if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  return (
    <HolographicPanel
      className="w-full max-w-md text-center p-6 flex flex-col items-center flex-grow h-0 overflow-hidden"
      explicitTheme={currentGlobalTheme}
      key={`fingerprint-panel-${currentGlobalTheme}-${themeVersion}-${accessGranted}`} // Re-key on accessGranted for state change
    >
      {accessGranted ? (
        // Access Granted State
        <div className="flex flex-col items-center justify-center flex-grow w-full">
          <div className="flex-grow flex flex-col justify-center items-center"> {/* This div centers the text content */}
            <h2 className="text-3xl font-orbitron holographic-text text-green-400">Access Granted</h2>
            <p className="text-lg text-muted-foreground mt-2">Initializing Spi Vs Spi TOD...</p>
          </div>
          <Fingerprint className="w-24 h-24 mx-auto text-green-400 mt-auto mb-4 icon-glow" /> {/* Pushed to bottom, mb-4 for spacing */}
        </div>
      ) : (
        // Scanning State
        <div className="flex flex-col items-center justify-center flex-grow w-full">
           <div className="flex-grow flex flex-col justify-center items-center"> {/* This div centers the text content */}
            <h2 className="text-2xl font-orbitron mb-6 holographic-text">Spi Vs Spi: Biometric Authentication</h2>
            <p className="text-muted-foreground mb-8">Press and Hold to Authenticate.</p>
          </div>
          <div
            className="relative w-48 h-48 mx-auto rounded-full border-2 border-primary flex items-center justify-center cursor-pointer select-none touch-none mt-auto mb-4" // Pushed to bottom, mb-4
            onMouseDown={startScan}
            onTouchStart={(e) => { e.preventDefault(); startScan(); }}
            onMouseUp={cancelScan}
            onTouchEnd={(e) => { e.preventDefault(); cancelScan(); }}
            onMouseLeave={cancelScan} // Cancel if mouse leaves while pressed
          >
            <Fingerprint
              className={cn(
                "w-24 h-24 text-primary transition-colors duration-300 icon-glow",
                isScanning && "text-accent animate-pulse"
              )}
            />
            {/* Progress Ring & Scanline Effect */}
            {isScanning && (
              <div className="absolute inset-0 overflow-hidden rounded-full">
                <div
                  className="absolute top-0 left-0 h-full w-full bg-primary opacity-30 animate-holographic-scan"
                  style={{ transform: `translateY(${-100 + scanProgress}%)` }}
                />
              </div>
            )}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 36 36">
              <path
                className="text-transparent" // Underlying circle track
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                strokeWidth="2"
              />
              <path
                className={cn("transition-all duration-150", isScanning ? "text-accent" : "text-primary", "icon-glow")} // Progress arc
                strokeDasharray={`${scanProgress}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                strokeWidth="2"
                strokeLinecap="round"
                style={{ transform: 'rotate(-90deg)', transformOrigin: '18px 18px' }}
              />
            </svg>
          </div>
        </div>
      )}
    </HolographicPanel>
  );
}

    