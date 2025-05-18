
"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Fingerprint } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HolographicPanel } from '@/components/game/shared/HolographicPanel';
import { useTheme, type Theme } from '@/contexts/ThemeContext';

export function FingerprintScannerScreen() {
  const { setOnboardingStep } = useAppContext();
  const { theme: currentGlobalTheme, themeVersion } = useTheme();
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [accessGranted, setAccessGranted] = useState(false);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const SCAN_DURATION = 1000;

  const startScan = () => {
    if (accessGranted || isScanning) return;
    setIsScanning(true);
    setScanProgress(0);

    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    progressIntervalRef.current = setInterval(() => {
      setScanProgress(prev => {
        const next = prev + 100 / (SCAN_DURATION / 50);
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
    if (accessGranted || !isScanning) return;
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
    }, 1500);
  };

  useEffect(() => {
    return () => {
      if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  return (
    <HolographicPanel
      className="w-full max-w-md text-center p-6 flex flex-col items-center justify-center min-h-[400px] mx-auto"
      explicitTheme={currentGlobalTheme}
      key={`fingerprint-panel-${currentGlobalTheme}-${themeVersion}-${accessGranted}`}
    >
      {accessGranted ? (
        <>
          <h2 className="text-3xl font-orbitron holographic-text text-green-400">Access Granted</h2>
          <p className="text-lg text-muted-foreground mt-2">Initializing Spi Vs Spi TOD...</p>
          <Fingerprint className="w-24 h-24 mx-auto text-green-400 mt-8 icon-glow" />
        </>
      ) : (
        <>
          <h2 className="text-2xl font-orbitron mb-6 holographic-text">Spi Vs Spi: Biometric Authentication</h2>
          <p className="text-muted-foreground mb-8">Press and Hold to Authenticate.</p>
          <div
            className="relative w-48 h-48 mx-auto rounded-full border-2 border-primary flex items-center justify-center cursor-pointer select-none touch-none"
            onMouseDown={startScan}
            onTouchStart={(e) => { e.preventDefault(); startScan(); }}
            onMouseUp={cancelScan}
            onTouchEnd={(e) => { e.preventDefault(); cancelScan(); }}
            onMouseLeave={cancelScan}
          >
            <Fingerprint
              className={cn(
                "w-24 h-24 text-primary transition-colors duration-300 icon-glow",
                isScanning && "text-accent animate-pulse"
              )}
            />
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
                className="text-transparent"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                strokeWidth="2"
              />
              <path
                className={cn("transition-all duration-150", isScanning ? "text-accent" : "text-primary", "icon-glow")}
                strokeDasharray={`${scanProgress}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                strokeWidth="2"
                strokeLinecap="round"
                style={{ transform: 'rotate(-90deg)', transformOrigin: '18px 18px' }}
              />
            </svg>
          </div>
        </>
      )}
    </HolographicPanel>
  );
}
