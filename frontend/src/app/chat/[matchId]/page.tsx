'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChatBubble } from '@/components/chat/chat-bubble';
import { ChatInput } from '@/components/chat/chat-input';
import { useAuthStore } from '@/stores/auth-store';
import { useToast } from '@/components/shared/toast';
import { Match, ChatMessage } from '@/types';
import * as matchService from '@/services/matches';
import * as chatService from '@/services/chat';
import { getSportEmoji } from '@/lib/utils';
import { ArrowLeft, Users, ShieldAlert, Loader2, Sparkles } from 'lucide-react';

export default function MatchChatPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.matchId as string;
  const { user } = useAuthStore();
  const { showToast } = useToast();

  const [match, setMatch] = useState<Match | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [matchData, chatMessages] = await Promise.all([
          matchService.getMatchById(matchId),
          chatService.getMessages(matchId),
        ]);
        setMatch(matchData);
        setMessages(chatMessages);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load lobby');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [matchId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const isConfirmed = match?.participants?.some(
    p => p.userId === user?.id && p.status === 'confirmed'
  ) || match?.hostId === user?.id;

  const handleSend = async (content: string) => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      const newMsg = await chatService.sendMessage(matchId, user.id, content);
      setMessages(prev => [...prev, newMsg]);
    } catch {
      showToast('Failed to send message', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
        <p className="text-sm text-muted-foreground">Loading lobby chat...</p>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="max-w-md mx-auto p-8 text-center">
        <ShieldAlert className="w-12 h-12 text-destructive mx-auto mb-3" />
        <h2 className="text-lg font-bold">Lobby not available</h2>
        <p className="text-sm text-muted-foreground mb-4">{error || 'Match not found.'}</p>
        <Button onClick={() => router.push('/')}>Return to Map</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px-56px)] lg:h-[calc(100vh-64px)] max-w-3xl mx-auto border-x bg-background">
      {/* Top Header */}
      <div className="flex items-center justify-between p-3.5 border-b bg-card">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/matches/${matchId}`)}
            className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base">{getSportEmoji(match.sportId)}</span>
              <h1 className="text-sm font-semibold truncate max-w-[200px] sm:max-w-md">
                {match.title}
              </h1>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="w-3 h-3" />
              {match.currentPlayers}/{match.maxPlayers} confirmed players · Lobby Chat
            </p>
          </div>
        </div>

        <Badge variant="outline" className="text-xs capitalize">
          {match.status}
        </Badge>
      </div>

      {/* Access Gate notice if not a confirmed participant */}
      {!isConfirmed && (
        <div className="p-3 bg-amber-500/10 border-b border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-center justify-between">
          <span>You are viewing in preview mode. Join this match as a player or spectator to send messages.</span>
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-7 ml-2"
            onClick={() => router.push(`/matches/${matchId}`)}
          >
            View Match
          </Button>
        </div>
      )}

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <div className="text-center py-4">
          <Badge variant="secondary" className="text-[11px] font-normal py-1">
            🔒 Only confirmed players and spectators can chat here
          </Badge>
        </div>

        {messages.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>No messages yet.</p>
            <p className="text-xs mt-1">Break the ice! Discuss jerseys, rides, or positions.</p>
          </div>
        ) : (
          messages.map(msg => (
            <ChatBubble
              key={msg.id}
              message={msg}
              isOwn={user ? msg.userId === user.id : false}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="border-t bg-card">
        <ChatInput
          onSend={handleSend}
          disabled={!isConfirmed}
          placeholder={
            isConfirmed
              ? 'Type a message to the squad...'
              : 'Join the match to participate in the chat'
          }
        />
      </div>
    </div>
  );
}
