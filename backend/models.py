from pydantic import BaseModel
from fastapi import WebSocket
from typing import Optional

class UserSession(BaseModel):
    id: str
    websocket: WebSocket
    gender: Optional[str] = None
    interested_in: Optional[str] = None