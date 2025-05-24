waiting_users = []
active_chats = {}

async def try_match_user(user):
    for other in waiting_users:
        if other.interested_in in (user.gender, "Any") and \
           user.interested_in in (other.gender, "Any"):
            waiting_users.remove(other)
            active_chats[user.id] = other.id
            active_chats[other.id] = user.id
            active_chats[user.id + "_ws"] = user.websocket
            active_chats[other.id + "_ws"] = other.websocket
            await other.websocket.send_json({"type": "matched", "partner_id": user.id})
            await user.websocket.send_json({"type": "matched", "partner_id": other.id})
            return True
    return False

async def cleanup(user):
    if user in waiting_users:
        waiting_users.remove(user)
    partner_id = active_chats.pop(user.id, None)
    if partner_id:
        partner_ws = active_chats.pop(partner_id + "_ws", None)
        if partner_ws:
            await partner_ws.send_json({"type": "partner_left"})
        active_chats.pop(partner_id, None)
    active_chats.pop(user.id + "_ws", None)