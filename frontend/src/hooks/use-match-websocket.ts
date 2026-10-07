'use client';

import { useEffect, useRef } from 'react';
import { ChatMessage } from '@/types';

export interface SlotUpdatePayload {
  type: 'SLOT_UPDATE';
  matchId: string;
  currentPlayers: number;
  maxPlayers: number;
  status: string;
}

export interface ChatMessagePayload {
  type: 'CHAT_MESSAGE';
  message: ChatMessage;
}

export function useMatchWebSocket(
  matchId?: string,
  callbacks?: {
    onSlotUpdate?: (data: SlotUpdatePayload) => void;
    onChatMessage?: (message: ChatMessage) => void;
  }
) {
  const wsRef = useRef<WebSocket | null>(null);
  const callbacksRef = useRef(callbacks);

  useEffect(() => {
    callbacksRef.current = callbacks;
  });

  useEffect(() => {
    if (!matchId) return;
    const wsBase = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';
    const url = `${wsBase}/matches/${matchId}/slots`;

    let isMounted = true;
    let ws: WebSocket;

    try {
      ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (!isMounted) return;

          if (data.type === 'SLOT_UPDATE' && callbacksRef.current?.onSlotUpdate) {
            callbacksRef.current.onSlotUpdate(data);
          } else if (data.type === 'CHAT_MESSAGE' && callbacksRef.current?.onChatMessage) {
            callbacksRef.current.onChatMessage(data.message);
          }
        } catch {
          // ignore
        }
      };

      ws.onerror = () => {
        // Silently handle if backend is not running
      };
    } catch {
      // ignore
    }

    return () => {
      isMounted = false;
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, [matchId]);
}
