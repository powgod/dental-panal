// assets/js/chatbot.js

const uid = localStorage.getItem("uid");
if (!uid) {
  Toast.error("User not logged in");
  window.location.href = "index.html"; // or redirect to login
}

const chatContainer = document.getElementById("chatContainer");
const userInput = document.getElementById("userInput");
userInput.addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    sendMessage();
  }
});

// Get current user UID
const db = firebase.database();
const userChatRef = firebase.database().ref("chats/" + uid);

// Append a message to the chat box
function appendMessage(content, type) {
  const msg = document.createElement("div");
  msg.classList.add("message", type);
  msg.textContent = content;
  chatContainer.appendChild(msg);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Load previous messages from Firebase
userChatRef.on("child_added", (snapshot) => {
  const message = snapshot.val();
  appendMessage(message.content, message.role === "user" ? "user" : "bot");
});

// Send message to API and save it to Firebase
async function sendMessage() {
  const input = userInput.value.trim();
  if (!input) return;

  userInput.value = "";

  // Save user message to Firebase
  userChatRef.push({
    role: "user",
    content: input,
    timestamp: Date.now(),
  });

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Bearer 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",
        },
        body: JSON.stringify({
          model: "openai/gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are a helpful dental assistant." },
            { role: "user", content: input },
          ],
        }),
      }
    );

    const data = await response.json();

    if (data.error) {
      appendMessage("❌ Error: " + data.error.message, "bot");
      return;
    }

    const reply = data.choices[0].message.content.trim();

    // Save bot reply to Firebase
    userChatRef.push({
      role: "bot",
      content: reply,
      timestamp: Date.now(),
    });
  } catch (err) {
    appendMessage("❌ No response from AI: " + err.message, "bot");
    console.error(err);
  }
}

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    firebase
      .auth()
      .signOut()
      .then(() => {
        window.location.href = "index.html"; // Adjust if your login page has a different name
      })
      .catch((error) => {
        console.error("Logout failed:", error);
      });
  });
}

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    const uid = user.uid;
    localStorage.setItem("uid", uid); // optional
    const db = firebase.database();
    const userChatRef = firebase.database().ref("chats/" + uid);

    // ⬇️ Put all your app logic here (form, events, listeners, etc.)
  } else {
    // Not logged in → redirect
    window.location.href = "index.html";
  }
});
