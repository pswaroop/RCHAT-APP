from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from .models import UserSession
from .matchmaking import try_match_user, cleanup, waiting_users, active_chats
import uuid
import asyncio

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="frontend"), name="static")

@app.get("/")
async def root():
    with open("frontend/index.html") as f:
        return HTMLResponse(f.read())

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await websocket.accept()
    user = UserSession(id=user_id, websocket=websocket)
    try:
        while True:
            data = await websocket.receive_json()
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
                    await partner_ws.send_json({"type": "message", "from": user_id, "text": data["text"]})
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