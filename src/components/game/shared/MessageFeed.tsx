
"use client";

import { useEffect, useRef } from 'react';
import { useAppContext, type GameMessage } from '@/contexts/AppContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export function MessageFeed() {
  const { messages, dailyTeamCode } = useAppContext();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive (optional)
    // if (scrollAreaRef.current) {
    //   scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    // }
  }, [messages]);

  const getMessageColor = (type: GameMessage['type']) => {
    switch (type) {
      case 'hq': return 'text-cyan-400';
      case 'system': return 'text-primary';
      case 'notification': return 'text-green-400';
      case 'error': return 'text-destructive';
      case 'lore': return 'text-purple-400';
      default: return 'text-foreground';
    }
  };

  const dailyCodeMessage: GameMessage = {
    id: 'daily-code-pinned',
    text: `Daily Team Code: ${dailyTeamCode}`,
    type: 'system',
    timestamp: new Date(), // Will be effectively "now"
    isPinned: true,
  };

  const displayedMessages = [
    dailyCodeMessage,
    ...messages.filter(m => !m.isPinned) 
  ];


  return (
    <ScrollArea className="h-full w-full p-1 holographic-panel bg-opacity-20 border-opacity-30">
      <div ref={scrollAreaRef} className="space-y-2 p-3">
        {displayedMessages.map((msg) => (
          <div key={msg.id} className={cn("text-sm font-rajdhani p-2 rounded-md", msg.isPinned && "bg-primary/10 border border-primary/30")}>
            <p className={cn(getMessageColor(msg.type), "leading-tight")}>
              <span className="font-semibold">
                [{msg.type.toUpperCase()}] {msg.type === 'hq' ? "HQ: " : ""}
              </span>
              {msg.text}
            </p>
            {!msg.isPinned && (
              <p className="text-xs text-muted-foreground/70 text-right">
                {formatDistanceToNow(msg.timestamp, { addSuffix: true })}
              </p>
            )}
          </div>
        ))}
        {messages.length === 0 && !dailyTeamCode && (
          <p className="text-center text-muted-foreground font-rajdhani">No messages yet.</p>
        )}
      </div>
    </ScrollArea>
  );
}

    