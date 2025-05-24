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

// Setup Enter key event listener after input is visible
function setupEnterKeyListener() {
  const input = document.getElementById("msgInput");
  if (input) {
    input.addEventListener("keydown", function handler(event) {
      if (event.key === "Enter") {
        event.preventDefault();
        sendMessage();
      }
    }, { once: true }); // Ensures the handler is only added once
  }
}

// Show chat UI and bind input listener
function showChatUI() {
  document.getElementById("register").style.display = "none";
  document.getElementById("chat").style.display = "block";
  document.getElementById("chatBox").innerHTML = "";
  showLoadingMessage();
  setTimeout(() => {
    setupEnterKeyListener();
    document.getElementById("msgInput").focus(); // Focus input
  }, 100); // Small delay ensures DOM is painted
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

    showChatUI();
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log(data);

    if (data.type === "matched") {
      hideLoadingMessage();
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
  const msgInput = document.getElementById("msgInput");
  const msg = msgInput.value;
  if (msg.trim() === "") return;
  appendMessage("You", msg);
  socket.send(JSON.stringify({
    type: "message",
    text: msg
  }));
  msgInput.value = "";
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
  document.getElementById("chatBox").innerHTML = "";
  showLoadingMessage();
}

function appendMessage(sender, message) {
  const chatBox = document.getElementById("chatBox");
  const newMsg = document.createElement("div");
  newMsg.textContent = `${sender}: ${message}`;
  chatBox.appendChild(newMsg);
  chatBox.scrollTop = chatBox.scrollHeight;
}
