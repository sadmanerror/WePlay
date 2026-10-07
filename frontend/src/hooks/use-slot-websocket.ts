'use client';

import { useEffect, useRef } from 'react';

interface SlotUpdateMessage {
  type: string;
  matchId: string;
  currentPlayers: number;
  maxPlayers: number;
  status: string;
}

export function useSlotWebSocket(
  matchId?: string,
  onUpdate?: (data: SlotUpdateMessage) => void
) {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const wsBase = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';
    const url = matchId ? `${wsBase}/matches/${matchId}/slots` : `${wsBase}/matches`;

    let isMounted = true;
    let ws: WebSocket;

    try {
      ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'SLOT_UPDATE' && isMounted && onUpdate) {
            onUpdate(data);
          }
        } catch {
          // ignore non-json
        }
      };

      ws.onerror = () => {
        // Silently handle if backend is not running
      };
    } catch {
      // ignore connection failure in mock mode
    }

    return () => {
      isMounted = false;
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, [matchId, onUpdate]);
}
