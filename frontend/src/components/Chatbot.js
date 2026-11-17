
import React, { useState, useRef, useEffect } from "react";
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

  // Maintain the conversation context for follow-up questions.
  const contextId = useRef(`rasoi-${Date.now()}`);

  // Automatically scroll to the latest message.
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  }, [messages, loading]);

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
      const response = await fetch(
        "http://localhost:5000/api/chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            message: cleanMessage,
            contextId: contextId.current
          })
        }
      );

      // Safely read the API response.
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Unable to get a response."
        );
      }

      // Use the returned context ID when available.
      if (data.contextId) {
        contextId.current = data.contextId;
      }

      setMessages((previous) => [
        ...previous,
        {
          sender: "bot",
          text: data.reply || "Sorry, I couldn't find an answer.",
          media: Array.isArray(data.media) ? data.media : [],
          recipes: Array.isArray(data.recipes) ? data.recipes : [],
          type: data.type || "CONVERSATION"
        }
      ]);

    } catch (error) {
      console.error("Chatbot error:", error);

      let errorMessage =
        "Sorry! I'm having trouble connecting right now. Please try again.";

      if (!navigator.onLine) {
        errorMessage =
          "You seem to be offline. Please check your internet connection.";
      } else if (error.message) {
        errorMessage =
          "Sorry! I couldn't process that request. Please try again.";
      }

      setMessages((previous) => [
        ...previous,
        {
          sender: "bot",
          text: errorMessage
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

  // Get ingredient names safely.
  const getIngredientNames = (ingredients) => {
    if (!Array.isArray(ingredients)) return [];

    return ingredients.map((ingredient) =>
      typeof ingredient === "string"
        ? ingredient
        : ingredient.name || ingredient.original || ""
    ).filter(Boolean);
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

                  {/* Readable chatbot text */}
                  <div className="message-text">
                    {item.text}
                  </div>

                  {/* Ingredient and food images */}
                  {item.media?.length > 0 && (
                    <div className="chatbot-media">
                      {item.media.map((mediaItem, mediaIndex) => (
                        mediaItem.url && (
                          <img
                            key={mediaIndex}
                            src={mediaItem.url}
                            alt="Food or ingredient"
                            className="chatbot-image"
                            loading="lazy"
                            onError={(event) => {
                              event.target.style.display = "none";
                            }}
                          />
                        )
                      ))}
                    </div>
                  )}

                  {/* Recipe suggestion cards */}
                  {item.recipes?.length > 0 && (
                    <div className="chatbot-recipes">

                      <h4>🍽️ Recipe Suggestions</h4>

                      {item.recipes.map((recipe, recipeIndex) => (
                        <div
                          className="chatbot-recipe-card"
                          key={recipe.id || recipeIndex}
                        >

                          {recipe.image && (
                            <img
                              src={recipe.image}
                              alt={recipe.title || "Recipe"}
                              className="recipe-card-image"
                              loading="lazy"
                              onError={(event) => {
                                event.target.style.display = "none";
                              }}
                            />
                          )}

                          <div className="recipe-card-content">

                            <h5>{recipe.title || recipe.name}</h5>

                            {getIngredientNames(
                              recipe.usedIngredients
                            ).length > 0 && (
                              <div>
                                <strong>Available ingredients:</strong>
                                <p>
                                  {getIngredientNames(
                                    recipe.usedIngredients
                                  ).join(", ")}
                                </p>
                              </div>
                            )}

                            {getIngredientNames(
                              recipe.missedIngredients
                            ).length > 0 && (
                              <div>
                                <strong>Additional ingredients:</strong>
                                <p>
                                  {getIngredientNames(
                                    recipe.missedIngredients
                                  ).join(", ")}
                                </p>
                              </div>
                            )}

                          </div>
                        </div>
                      ))}

                    </div>
                  )}

                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {loading && (
              <div className="chat-message bot">
                <div className="message-bubble typing">
                  Thinking...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />

          </div>

          {/* Chat Input */}
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
