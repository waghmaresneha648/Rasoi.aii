
const express = require("express");
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { message, contextId } = req.body;

    // Check whether the user entered a message
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        error: "Please enter a message."
      });
    }

    const cleanMessage = message.trim();

    // Check whether the question is about nutrition
    const nutritionKeywords =
      /\b(nutrition|nutrient|calorie|calories|vitamin|protein|carbohydrate|carbs|fat|fiber|fibre|mineral|iron|calcium|health benefit|benefits of|nutritional value|how much)\b/i;

    const isNutritionQuestion =
      nutritionKeywords.test(cleanMessage);

    let apiUrl;
    let params;

    if (isNutritionQuestion) {
      // Use Quick Answer for nutrition questions
      params = new URLSearchParams({
        q: cleanMessage
      });

      apiUrl =
        `https://api.spoonacular.com/recipes/quickAnswer?${params.toString()}`;

    } else {
      // Use Food Converse for general food conversations
      params = new URLSearchParams({
        text: cleanMessage
      });

      if (contextId) {
        params.append("contextId", contextId);
      }

      apiUrl =
        `https://api.spoonacular.com/food/converse?${params.toString()}`;
    }

    // Call Spoonacular API
    const apiResponse = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "x-api-key": process.env.SPOONACULAR_API_KEY,
        "Accept": "application/json"
      }
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      console.error("Spoonacular API error:", data);

      return res.status(apiResponse.status).json({
        error: "Spoonacular could not process your message."
      });
    }

    // Prepare response for React
    let reply;
    let media = [];

    if (isNutritionQuestion) {
      reply = data.answer;
      
      if (data.image) {
        media.push({
          type: "image",
          url: data.image
        });
      }
    } else {
      reply = data.answerText;
      media = data.media || [];
    }

    if (!reply) {
      return res.status(502).json({
        error: "The food API returned an empty response. Please try another question."
      });
    }

    res.json({
      reply,
      media,
      type: data.type || "CONVERSATION"
    });

  } catch (error) {
    console.error("Chatbot error:", error);

    res.status(500).json({
      error: "Something went wrong with the chatbot."
    });
  }
});

module.exports = router;
