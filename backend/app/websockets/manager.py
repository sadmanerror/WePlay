from typing import Dict, List, Set, Any
from fastapi import WebSocket
import json


class ConnectionManager:
    def __init__(self):
        # match_id -> set of active WebSockets
        self.match_subscribers: Dict[str, Set[WebSocket]] = {}
        # global subscribers for map-level slot changes
        self.global_subscribers: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket, match_id: str = None):
        await websocket.accept()
        if match_id:
            if match_id not in self.match_subscribers:
                self.match_subscribers[match_id] = set()
            self.match_subscribers[match_id].add(websocket)
        else:
            self.global_subscribers.add(websocket)

    def disconnect(self, websocket: WebSocket, match_id: str = None):
        if match_id and match_id in self.match_subscribers:
            self.match_subscribers[match_id].discard(websocket)
            if not self.match_subscribers[match_id]:
                del self.match_subscribers[match_id]
        else:
            self.global_subscribers.discard(websocket)

    async def broadcast_to_match(self, match_id: str, message: dict):
        if match_id in self.match_subscribers:
            dead_sockets = set()
            payload = json.dumps(message)
            for ws in self.match_subscribers[match_id]:
                try:
                    await ws.send_text(payload)
                except Exception:
                    dead_sockets.add(ws)
            for ws in dead_sockets:
                self.match_subscribers[match_id].discard(ws)

    async def broadcast_slot_update(self, match_id: str, current_players: int, max_players: int, status: str):
        payload = {
            "type": "SLOT_UPDATE",
            "matchId": match_id,
            "currentPlayers": current_players,
            "maxPlayers": max_players,
            "status": status,
        }
        await self.broadcast_to_match(match_id, payload)

        # Also notify global subscribers
        dead_globals = set()
        text_payload = json.dumps(payload)
        for ws in self.global_subscribers:
            try:
                await ws.send_text(text_payload)
            except Exception:
                dead_globals.add(ws)
        for ws in dead_globals:
            self.global_subscribers.discard(ws)


ws_manager = ConnectionManager()
