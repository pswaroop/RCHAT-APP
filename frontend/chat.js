let socket;
let user_id = crypto.randomUUID();
let userInfo = {};

function registerUser() {
  const gender = document.getElementById("gender").value;
  const interested_in = document.getElementById("interested_in").value;

  userInfo = { gender, interested_in };

  socket = new WebSocket(`ws://${location.host}/ws/${user_id}`);

  socket.onopen = () => {
    socket.send(JSON.stringify({
      type: "register",
      gender: gender,
      interested_in: interested_in
    }));
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "matched") {
      document.getElementById("register").style.display = "none";
      document.getElementById("chat").style.display = "block";
      appendMessage("System", "Matched with a user!");
    } else if (data.type === "message") {
      appendMessage("Partner", data.text);
    } else if (data.type === "partner_left") {
      appendMessage("System", "Your partner has left the chat.");
    } else if (data.type === "disconnected") {
      appendMessage("System", "Disconnected from chat.");
    }
  };
}

function sendMessage() {
  const msg = document.getElementById("msgInput").value;
  appendMessage("You", msg);
  socket.send(JSON.stringify({
    type: "message",
    text: msg
  }));
  document.getElementById("msgInput").value = "";
}

function disconnectChat() {
  socket.send(JSON.stringify({ type: "disconnect" }));
}

function reconnectChat() {
  socket.send(JSON.stringify({
    type: "reconnect",
    gender: userInfo.gender,
    interested_in: userInfo.interested_in
  }));
}

function appendMessage(sender, message) {
  const chatBox = document.getElementById("chatBox");
  const newMsg = document.createElement("div");
  newMsg.textContent = `${sender}: ${message}`;
  chatBox.appendChild(newMsg);
  chatBox.scrollTop = chatBox.scrollHeight;
}
