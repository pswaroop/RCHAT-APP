from fastapi import WebSocket, WebSocketDisconnect
from .models import UserSession
from .matchmaking import try_match_user, cleanup, waiting_users, active_chats

async def websocket_handler(websocket: WebSocket, user_id: str):
    await websocket.accept()
    user = UserSession(id=user_id, websocket=websocket)
    try:
        while True:
            data = await websocket.receive_json()
            print(f"Received from {user_id}: {data}")

            if data["type"] == "register":
                user.gender = data["gender"]
                user.interested_in = data["interested_in"]
                matched = await try_match_user(user)
                if not matched:
                    waiting_users.append(user)

            elif data["type"] == "message":
                partner_id = active_chats.get(user_id)
                if partner_id and partner_id in active_chats:
                    partner_ws = active_chats[partner_id + "_ws"]
                    await partner_ws.send_json({
                        "type": "message",
                        "from": user_id,
                        "text": data["text"]
                    })

            elif data["type"] == "disconnect":
                await cleanup(user)
                await websocket.send_json({"type": "disconnected"})

            elif data["type"] == "reconnect":
                await cleanup(user)
                matched = await try_match_user(user)
                if not matched:
                    waiting_users.append(user)

    except WebSocketDisconnect:
        await cleanup(user)
        print(f"{user_id} disconnected")

    except Exception as e:
        print(f"Error in WebSocket for {user_id}: {e}")
        await cleanup(user)
