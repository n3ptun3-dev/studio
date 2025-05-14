
"use client";

import { useEffect, useRef } from 'react';
import { useAppContext, type GameMessage } from '@/contexts/AppContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface MessageFeedProps {
  filter?: 'hq' | 'alerts' | 'system'; // Optional filter
}

export function MessageFeed({ filter }: MessageFeedProps) {
  const { messages } = useAppContext(); // Daily team code is handled by ControlCenterSection directly
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simple auto-scroll to bottom for new messages
    if (scrollAreaRef.current) {
       const { scrollHeight, clientHeight } = scrollAreaRef.current;
       scrollAreaRef.current.scrollTop = scrollHeight - clientHeight;
    }
  }, [messages]);

  const getMessageColor = (type: GameMessage['type']) => {
    switch (type) {
      case 'hq': return 'text-cyan-400';
      case 'system': return 'text-primary';
      case 'notification': return 'text-green-400';
      case 'error': return 'text-destructive';
      case 'lore': return 'text-purple-400';
      case 'alert': return 'text-yellow-400'; // Added alert color
      default: return 'text-foreground';
    }
  };

  const filteredMessages = messages.filter(msg => {
    if (!filter) return true; // No filter, show all (excluding pinned here, as they are separate)
    return msg.type === filter;
  }).filter(m => !m.isPinned); // Pinned messages are handled separately or not at all if this feed is specific

  const displayedMessages = [...filteredMessages]; // Pinned messages handled above this feed if needed

  return (
    <ScrollArea className="h-full w-full p-1">
      <div ref={scrollAreaRef} className="space-y-2 p-3">
        {displayedMessages.map((msg) => (
          <div key={msg.id} className={cn("text-sm font-rajdhani p-2 rounded-md", msg.isPinned && "bg-primary/10 border border-primary/30")}>
            <p className={cn(getMessageColor(msg.type), "leading-tight")}>
              <span className="font-semibold">
                [{msg.type.toUpperCase()}] {msg.type === 'hq' ? "HQ: " : msg.sender ? `${msg.sender}: ` : ""}
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
        {displayedMessages.length === 0 && (
          <p className="text-center text-muted-foreground font-rajdhani">No messages in this category.</p>
        )}
      </div>
    </ScrollArea>
  );
}
