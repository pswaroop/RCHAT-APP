let socket;
let user_id = crypto.randomUUID();
let userInfo = {};

// Show loading message
function showLoadingMessage() {
  document.getElementById("loading").style.display = "block";
  document.getElementById("chatBox").style.display = "none";
}

// Hide loading message
function hideLoadingMessage() {
  document.getElementById("loading").style.display = "none";
  document.getElementById("chatBox").style.display = "block";
}

function registerUser() {
  const gender = document.getElementById("gender").value;
  const interested_in = document.getElementById("interested_in").value;

  userInfo = { gender, interested_in };

  socket = new WebSocket(`ws://${location.host}/ws/${user_id}`);

  socket.onopen = () => {
    socket.send(JSON.stringify({
      type: "register",
      gender,
      interested_in
    }));

    document.getElementById("register").style.display = "none";
    document.getElementById("chat").style.display = "block";
    document.getElementById("chatBox").innerHTML = ""; // Clear chat messages
    showLoadingMessage(); // Show loading message
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log(data);

    if (data.type === "matched") {
      hideLoadingMessage(); // Hide loading message when matched
      appendMessage("System", "Matched with a user!");
    } else if (data.type === "message") {
      appendMessage("Partner", data.text);
    } else if (data.type === "partner_left") {
      appendMessage("System", "Your partner has left the chat.");
    } else if (data.type === "disconnected") {
      appendMessage("System", "Disconnected from chat.");
    }
  };

  socket.onerror = (e) => {
    console.error("WebSocket error", e);
    appendMessage("System", "WebSocket error. Please refresh.");
  };
}

function sendMessage() {
  const msg = document.getElementById("msgInput").value;
  if (msg.trim() === "") return;
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
  document.getElementById("chatBox").innerHTML = ""; // Clear previous chat
  showLoadingMessage(); // Show loading message again
}

function appendMessage(sender, message) {
  const chatBox = document.getElementById("chatBox");
  const newMsg = document.createElement("div");
  newMsg.textContent = `${sender}: ${message}`;
  chatBox.appendChild(newMsg);
  chatBox.scrollTop = chatBox.scrollHeight;
}
