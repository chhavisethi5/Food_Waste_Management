from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.core.websockets import ws_manager

router = APIRouter(tags=["websockets"])

@router.websocket("/ws/updates")
async def websocket_updates(websocket: WebSocket):
    """
    WebSocket endpoint for real-time listing creation, reservation, and pickup updates.
    """
    await ws_manager.connect(websocket)
    try:
        while True:
            # Maintain active connection and listen for client pings/messages
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)
