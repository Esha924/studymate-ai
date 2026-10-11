
const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const chatMessages = document.getElementById("chatMessages");
const sendButton = document.getElementById("sendButton");
const clearButton = document.getElementById("clearButton");
const statusMessage = document.getElementById("statusMessage");

let history = [];
let isWaiting = false;

function addMessage(role, text) {
    const message = document.createElement("div");
    message.className = role === "user"
        ? "message user-message"
        : "message assistant-message";

    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.textContent = role === "user" ? "Y" : "S";

    const bubble = document.createElement("div");
    bubble.className = "bubble";

    // Display plain text safely rather than interpreting AI output as HTML.
    text.split("\n").forEach((line) => {
        const paragraph = document.createElement("p");
        paragraph.textContent = line || "\u00a0";
        bubble.appendChild(paragraph);
    });

    message.appendChild(avatar);
    message.appendChild(bubble);
    chatMessages.appendChild(message);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return message;
}

function setWaiting(waiting) {
    isWaiting = waiting;
    sendButton.disabled = waiting;
    messageInput.disabled = waiting;
    sendButton.querySelector("span").textContent =
        waiting ? "Thinking..." : "Send";
}

async function sendMessage(text) {
    const message = text.trim();

    if (!message || isWaiting) {
        return;
    }

    addMessage("user", message);
    messageInput.value = "";
    statusMessage.textContent = "Generating an AI response...";
    setWaiting(true);

    const typingMessage = addMessage("assistant", "Thinking through your question...");

    try {
        const response = await fetch("/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: message,
                history: history
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "The request could not be completed.");
        }

        typingMessage.querySelector(".bubble").textContent = data.answer;

        history.push(
            { role: "user", content: message },
            { role: "assistant", content: data.answer }
        );

        history = history.slice(-20);
        statusMessage.textContent = "AI response generated · Please verify important facts";
    } catch (error) {
        typingMessage.querySelector(".bubble").textContent =
            "Sorry, I couldn't get a response. Please check that the app is running and the AI API is configured, then try again.";
        statusMessage.textContent = "Response unavailable";
        console.error("StudyMate request failed:", error);
    } finally {
        setWaiting(false);
        messageInput.focus();
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

chatForm.addEventListener("submit", (event) => {
    event.preventDefault();
    sendMessage(messageInput.value);
});

document.querySelectorAll("[data-prompt]").forEach((button) => {
    button.addEventListener("click", () => {
        sendMessage(button.dataset.prompt);
    });
});

clearButton.addEventListener("click", () => {
    if (isWaiting) {
        return;
    }

    history = [];
    chatMessages.replaceChildren();

    const welcome = document.createElement("div");
    welcome.className = "message assistant-message";

    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.textContent = "S";

    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.textContent = "Conversation cleared. What would you like to learn next?";

    welcome.append(avatar, bubble);
    chatMessages.appendChild(welcome);

    statusMessage.textContent = "Conversation cleared";
    messageInput.focus();
});
