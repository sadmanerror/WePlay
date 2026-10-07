'use client';

import { ChatMessage } from '@/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ChatBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
}

export function ChatBubble({ message, isOwn }: ChatBubbleProps) {
  const initials = message.user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2);

  return (
    <div className={cn('flex gap-2 mb-3', isOwn && 'flex-row-reverse')}>
      {!isOwn && (
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarFallback className="text-xs bg-primary/10 text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
      )}
      <div className={cn('max-w-[75%]', isOwn && 'items-end')}>
        {!isOwn && (
          <p className="text-xs text-muted-foreground mb-1 ml-1">
            {message.user.name}
          </p>
        )}
        <div
          className={cn(
            'rounded-2xl px-3 py-2 text-sm',
            isOwn
              ? 'bg-primary text-primary-foreground rounded-br-sm'
              : 'bg-muted rounded-bl-sm'
          )}
        >
          {message.content}
        </div>
        <p
          className={cn(
            'text-[10px] text-muted-foreground mt-1',
            isOwn ? 'text-right mr-1' : 'ml-1'
          )}
        >
          {format(new Date(message.createdAt), 'h:mm a')}
        </p>
      </div>
    </div>
  );
}
