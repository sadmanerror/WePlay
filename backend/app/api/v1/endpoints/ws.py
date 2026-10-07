from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.websockets.manager import ws_manager

router = APIRouter()


@router.websocket("/matches/{match_id}/slots")
async def websocket_match_slots(websocket: WebSocket, match_id: str):
    await ws_manager.connect(websocket, match_id=match_id)
    try:
        while True:
            # Keep connection alive, listen for ping/pong
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, match_id=match_id)


@router.websocket("/matches")
async def websocket_global_matches(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
