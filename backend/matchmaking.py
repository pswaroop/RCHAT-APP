from collections import deque

# Queues for matchmaking
male_queue = deque()
female_queue = deque()
other_queue = deque()

# All active chats
active_chats = {}
waiting_users = []

async def try_match_user(user):
    target_queues = []

    if user.interested_in == "Male":
        target_queues = [male_queue]
    elif user.interested_in == "Female":
        target_queues = [female_queue]
    elif user.interested_in == "Other":
        target_queues = [other_queue]
    elif user.interested_in == "Any":
        target_queues = [male_queue, female_queue, other_queue]

    for queue in target_queues:
        for _ in range(len(queue)):
            other = queue.popleft()
            if other.interested_in in (user.gender, "Any"):
                # Match found
                active_chats[user.id] = other.id
                active_chats[other.id] = user.id
                active_chats[user.id + "_ws"] = user.websocket
                active_chats[other.id + "_ws"] = other.websocket
                await other.websocket.send_json({"type": "matched", "partner_id": user.id})
                await user.websocket.send_json({"type": "matched", "partner_id": other.id})
                return True
            else:
                # Put back if not compatible
                queue.append(other)

    # No match found
    if user.gender == "Male":
        male_queue.append(user)
    elif user.gender == "Female":
        female_queue.append(user)
    else:
        other_queue.append(user)

    return False


async def cleanup(user):
    # Remove from active chats
    partner_id = active_chats.pop(user.id, None)
    active_chats.pop(user.id + "_ws", None)

    if partner_id:
        partner_ws = active_chats.pop(partner_id + "_ws", None)
        active_chats.pop(partner_id, None)
        if partner_ws:
            try:
                await partner_ws.send_json({"type": "partner_left"})
            except:
                pass

    # Remove from queues
    for queue in [male_queue, female_queue, other_queue]:
        try:
            queue.remove(user)
        except ValueError:
            pass
