'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/shared/toast';
import { Match, ChatMessage, User } from '@/types';
import * as chatService from '@/services/chat';
import { useMatchWebSocket } from '@/hooks/use-match-websocket';
import {
  MessageCircle, Send, Crown, Loader2, Lock,
  Eye, Sparkles
} from 'lucide-react';
import { cn, formatTime } from '@/lib/utils';

interface MatchLobbyChatProps {
  match: Match;
  currentUser: User | null;
  isHost: boolean;
  isParticipant: boolean;
  userRole?: 'player' | 'spectator';
  isEnded?: boolean;
}

export function MatchLobbyChat({
  match,
  currentUser,
  isHost,
  isParticipant,
  isEnded = false,
}: MatchLobbyChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const matchHasEnded = Boolean(isEnded || match.isEnded || match.status === 'completed');
  const canChat = (isHost || isParticipant) && !matchHasEnded && currentUser !== null;

  useMatchWebSocket(match.id, {
    onChatMessage: (newMsg) => {
      if (matchHasEnded) return;
      setMessages(prev => {
        if (prev.some(m => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    },
  });

  useEffect(() => {
    if (matchHasEnded) return;

    let isMounted = true;
    async function loadMessages() {
      try {
        const data = await chatService.getMessages(match.id);
        if (isMounted) {
          setMessages(data);
          setLoading(false);
        }
      } catch {
        if (isMounted) setLoading(false);
      }
    }

    loadMessages();
    return () => {
      isMounted = false;
    };
  }, [match.id, matchHasEnded]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || !currentUser || sending || !canChat) return;

    const content = input.trim();
    setInput('');
    setSending(true);

    try {
      const sent = await chatService.sendMessage(match.id, currentUser.id, content);
      setMessages(prev => {
        if (prev.some(m => m.id === sent.id)) return prev;
        return [...prev, sent];
      });
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to send message', 'error');
      setInput(content); // restore on error
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="border rounded-2xl bg-card overflow-hidden shadow-xs">
      {/* Header */}
      <div className="px-4 py-3 bg-muted/30 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Match Lobby Chat</h3>
          {!matchHasEnded ? (
            <span className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium px-2 py-0.5 rounded-full bg-emerald-500/10">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
              <Lock className="w-3 h-3" />
              Closed
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {matchHasEnded ? 'Erased on end' : `${messages.length} messages`}
        </span>
      </div>

      {/* Body */}
      {matchHasEnded ? (
        <div className="p-8 text-center bg-muted/10 space-y-3">
          <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">
              Match Concluded · Chatroom Closed
            </h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto leading-relaxed">
              This event has ended. Following community privacy policy, the match lobby chat is closed and all messages have been automatically erased.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="h-72 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span className="text-xs">Loading lobby chat...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <Sparkles className="w-8 h-8 text-muted-foreground/50 mb-2" />
                <p className="text-xs font-medium text-muted-foreground">
                  No messages yet. Say hello or coordinate gear!
                </p>
              </div>
            ) : (
              messages.map(msg => {
                const isMe = currentUser && msg.userId === currentUser.id;
                const isMsgHost = msg.userId === match.hostId;
                const participant = match.participants?.find(p => p.userId === msg.userId);
                const role = isMsgHost ? 'Host' : participant?.role === 'spectator' ? 'Cheerer' : 'Player';

                return (
                  <div
                    key={msg.id}
                    className={cn('flex flex-col', isMe ? 'items-end' : 'items-start')}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {isMe ? 'You' : msg.user?.name || 'Player'}
                      </span>
                      {isMsgHost ? (
                        <span className="inline-flex items-center text-[10px] text-amber-600 bg-amber-500/10 px-1.5 py-0.2 rounded font-medium">
                          <Crown className="w-2.5 h-2.5 mr-0.5" /> Host
                        </span>
                      ) : role === 'Cheerer' ? (
                        <span className="inline-flex items-center text-[10px] text-blue-600 bg-blue-500/10 px-1.5 py-0.2 rounded font-medium">
                          <Eye className="w-2.5 h-2.5 mr-0.5" /> Spectator
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[10px] text-emerald-600 bg-emerald-500/10 px-1.5 py-0.2 rounded font-medium">
                          Player
                        </span>
                      )}
                      <span>·</span>
                      <span>{formatTime(msg.createdAt)}</span>
                    </div>

                    <div
                      className={cn(
                        'max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed break-words',
                        isMe
                          ? 'bg-primary text-primary-foreground rounded-br-xs'
                          : 'bg-muted text-foreground rounded-bl-xs'
                      )}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Footer / Input */}
          <div className="p-3 border-t bg-background">
            {!currentUser ? (
              <p className="text-xs text-center text-muted-foreground py-1">
                Please log in to participate in the lobby chat.
              </p>
            ) : !isParticipant && !isHost ? (
              <div className="p-2 rounded-lg bg-muted/40 text-center">
                <p className="text-xs text-muted-foreground">
                  Join as an active player or spectator to chat with the lobby.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSend} className="flex gap-2">
                <Input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Coordinate gear, pickup spot, or say hi..."
                  className="text-xs sm:text-sm h-10"
                  disabled={sending}
                  maxLength={500}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="h-10 w-10 flex-shrink-0"
                  disabled={!input.trim() || sending}
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </form>
            )}
          </div>
        </>
      )}
    </div>
  );
}
