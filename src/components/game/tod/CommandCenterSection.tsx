
"use client";
// This file is effectively replaced by AgentSection.tsx and ControlCenterSection.tsx
// It can be deleted or kept for reference during refactoring.
// For now, I will clear its content to avoid conflicts if it's still imported somewhere.

// import { useState, useEffect, useRef } from 'react';
// import { useAppContext } from '@/contexts/AppContext';
// import { HolographicPanel, HolographicButton } from '@/components/game/shared/HolographicPanel';
// import { Progress } from "@/components/ui/progress";
// import { Button } from "@/components/ui/button";
// import { Settings, MessageSquare, User, BookOpen, Briefcase, Zap, Info, Wifi, CheckCircle, Fingerprint } from 'lucide-react';
// import { MessageFeed } from '@/components/game/shared/MessageFeed';
// import { ScrollArea } from '@/components/ui/scroll-area';
// import { cn } from '@/lib/utils';

interface SectionProps {
  parallaxOffset: number;
}

export function CommandCenterSection({ parallaxOffset }: SectionProps) {
  return (
    <div className="flex flex-col items-center justify-center p-4 md:p-6 h-full overflow-hidden">
      <p className="holographic-text text-xl">Old Command Center (Content Moved)</p>
      <p className="text-muted-foreground text-sm">
        This section's functionality has been split into Agent and Control Center sections.
      </p>
    </div>
  );
}
