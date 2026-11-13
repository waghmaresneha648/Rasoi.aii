
import React, { useState, useRef } from "react";
import "./Chatbot.css";

function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hello! Welcome to Rasoi.ai! 🍲 I'm here to help with food, recipes, and nutrition. What would you like to know?"
    }
  ]);

  // Keep the same conversation ID for follow-up questions.
  const contextId = useRef(`rasoi-${Date.now()}`);

  const sendMessage = async () => {
    const cleanMessage = message.trim();

    if (!cleanMessage || loading) return;

    setMessages((previous) => [
      ...previous,
      { sender: "user", text: cleanMessage }
    ]);

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: cleanMessage,
          contextId: contextId.current
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to get a response.");
      }

      setMessages((previous) => [
        ...previous,
        {
          sender: "bot",
          text: data.reply || "Sorry, I couldn't find an answer.",
          media: data.media || []
        }
      ]);
    } catch (error) {
      console.error("Chatbot error:", error);

      setMessages((previous) => [
        ...previous,
        {
          sender: "bot",
          text: "Sorry! I'm having trouble connecting right now. Please try again."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="rasoi-chatbot">

      {/* Floating Chat Button */}
      <button
        className="chatbot-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open or close chatbot"
      >
        {isOpen ? "✕" : "💬"}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chatbot-window">

          <div className="chatbot-header">
            <div>
              <h3>Rasoi.ai Assistant 🍲</h3>
              <span>Your food companion</span>
            </div>

            <button
              className="chatbot-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close chatbot"
            >
              ✕
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((item, index) => (
              <div
                key={index}
                className={`chat-message ${item.sender}`}
              >
                <div className="message-bubble">
                  {item.text}

                  {item.media &&
                    item.media.map((mediaItem, mediaIndex) => (
                      mediaItem.url && (
                        <img
                          key={mediaIndex}
                          src={mediaItem.url}
                          alt="Food information"
                          className="chatbot-image"
                        />
                      )
                    ))
                  }
                </div>
              </div>
            ))}

            {loading && (
              <div className="chat-message bot">
                <div className="message-bubble typing">
                  Thinking...
                </div>
              </div>
            )}
          </div>

          <div className="chatbot-input-area">
            <input
              type="text"
              placeholder="Ask me something about food..."
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />

            <button
              onClick={sendMessage}
              disabled={!message.trim() || loading}
            >
              Send
            </button>
          </div>

        </div>
      )}
    </div>
  );
}

export default Chatbot;
