
const express = require("express");
const router = express.Router();

const BASE_URL = "https://api.spoonacular.com";

// Make a request to Spoonacular
async function spoonacularRequest(endpoint, params = {}) {
  const url = new URL(`${BASE_URL}${endpoint}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.append(key, value);
    }
  });

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "x-api-key": process.env.SPOONACULAR_API_KEY,
      Accept: "application/json"
    }
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Spoonacular API error:", data);
    throw new Error(
      data.message || `Spoonacular returned status ${response.status}`
    );
  }

  return data;
}

// Identify specific nutrition questions
function isSpecificNutritionQuestion(message) {
  return /\b(how much|how many|calories|protein|fiber|fibre|vitamin|iron|calcium|carbohydrates|carbs|fat)\b/i.test(message);
}

// Identify broader ingredient information questions
function isIngredientInfoQuestion(message) {
  return /\b(health benefits|benefits of|nutrients in|nutrients found|nutritional value|nutrition in|what nutrients|vitamins in)\b/i.test(message);
}

// Identify recipe suggestion questions
function isRecipeQuestion(message) {
  return /\b(what can i make|what should i make|recipe|recipes|dishes|cook|cooking|prepare|breakfast|lunch|dinner)\b/i.test(message);
}

// Extract ingredient names from a message
function extractIngredient(message, type) {
  let ingredient = "";

  if (type === "recipe") {
    const match = message.match(
      /\b(?:with|using|from|containing)\s+(.+?)(?:\?|$)/i
    );

    ingredient = match ? match[1] : "";
  } else {
    const match = message.match(
      /\b(?:benefits of|nutrients in|nutrients found in|found in|nutrition in|nutritional value of|vitamins in|about)\s+(.+?)(?:\?|$)/i
    );

    ingredient = match ? match[1] : "";
  }

  return ingredient
    .replace(/^(eating|consuming|having)\s+/i, "")
    .replace(/[?.!,]/g, " ")
    .replace(/\b(please|tell me|the|a|an)\b/gi, "")
    .trim();
}

// Find an ingredient in Spoonacular
async function searchIngredient(name) {
  const data = await spoonacularRequest(
    "/food/ingredients/search",
    {
      query: name,
      number: 1
    }
  );

  if (!data.results || data.results.length === 0) {
    return null;
  }

  return data.results[0];
}

// Get ingredient nutritional information

async function getIngredientInformation(ingredient) {
  const data = await spoonacularRequest(
    `/food/ingredients/${ingredient.id}/information`,
    {
      amount: 100,
      unit: "grams"
    }
  );

  const nutrients = data.nutrition?.nutrients || [];

  // Remove nutrients with zero or unavailable amounts.
  const usefulNutrients = nutrients
    .filter((nutrient) => {
      return (
        typeof nutrient.amount === "number" &&
        nutrient.amount > 0
      );
    })
    .slice(0, 8);

  const ingredientName = data.name || ingredient.name;

  let reply = `Nutritional information for ${ingredientName} (per 100 grams):\n\n`;

  if (usefulNutrients.length > 0) {
    usefulNutrients.forEach((nutrient) => {
      reply += `• ${nutrient.name}: ${nutrient.amount} ${nutrient.unit}\n`;
    });
  } else {
    reply += "Detailed nutrient information is not available for this ingredient.";
  }

  return {
    reply,
    media: data.image
      ? [{
          type: "image",
          url: `https://img.spoonacular.com/ingredients_100x100/${data.image}`
        }]
      : [],
    type: "INGREDIENT_INFO",
    ingredient: ingredientName
  };
}


// Find recipes using ingredients
async function findRecipesByIngredients(ingredients) {
  const data = await spoonacularRequest(
    "/recipes/findByIngredients",
    {
      ingredients,
      number: 5,
      ranking: 1,
      ignorePantry: true
    }
  );

  if (!Array.isArray(data) || data.length === 0) {
    return {
      reply: "I couldn't find recipes using those ingredients. Try another ingredient.",
      recipes: [],
      media: [],
      type: "RECIPES"
    };
  }

  const recipes = data.map((recipe) => ({
    id: recipe.id,
    title: recipe.title,
    image: recipe.image,
    usedIngredients: recipe.usedIngredients || [],
    missedIngredients: recipe.missedIngredients || []
  }));

  let reply = "Here are some recipes you can try:\n\n";

  recipes.forEach((recipe, index) => {
    reply += `${index + 1}. ${recipe.title}\n`;
    reply += `Ingredients you have: ${
      recipe.usedIngredients.map(item => item.name).join(", ") || "Not specified"
    }\n`;
    reply += `Ingredients missing: ${
      recipe.missedIngredients.map(item => item.name).join(", ") || "None"
    }\n\n`;
  });

  return {
    reply,
    recipes,
    media: [],
    type: "RECIPES"
  };
}

// Chatbot route
router.post("/", async (req, res) => {
  try {
    const { message, contextId } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        error: "Please enter a message."
      });
    }

    if (!process.env.SPOONACULAR_API_KEY) {
      return res.status(500).json({
        error: "Spoonacular API key is not configured."
      });
    }

    const cleanMessage = message.trim();

    console.log("CHAT MESSAGE:", cleanMessage);

    // 1. Specific nutrition questions
    
    
if (isSpecificNutritionQuestion(cleanMessage)) {
  const data = await spoonacularRequest(
    "/recipes/quickAnswer",
    { q: cleanMessage }
  );
console.log("SPOONACULAR QUICK ANSWER:", data.answer);
  if (!data.answer) {
    return res.json({
      reply: "I couldn't find nutritional information for that question.",
      media: [],
      type: "NUTRITION"
    });
  }

  // Extract useful nutrition details from Spoonacular's response.
  const answerMatch = data.answer.match(
    /There are\s+([\d.]+)\s*([a-zµμ]+)\s+of\s+(.+?)\s+in\s+([\d.]+)\s*grams.*?about\s+([\d.]+)%\s+of your daily needs of\s+(.+?)(?:\.|$)/i
  );

  let formattedAnswer = data.answer;

  if (answerMatch) {
    const amount = answerMatch[1];
    const unit = answerMatch[2];
    const nutrient = answerMatch[3].trim();
    const quantity = answerMatch[4];
    const percentage = answerMatch[5];

    // Get the ingredient name from the user's question.
    const ingredientMatch = cleanMessage.match(
      /\bof\s+(.+?)(?:\?|$)/i
    );

    const ingredient = ingredientMatch
      ? ingredientMatch[1].trim()
      : "this ingredient";

    formattedAnswer =
      `${ingredient.charAt(0).toUpperCase() + ingredient.slice(1)} contains ${amount} ${unit} of ${nutrient.toLowerCase()} per ${quantity} grams. ` +
      `This provides approximately ${percentage}% of your daily ${nutrient.toLowerCase()} needs.`;
  }

  return res.json({
    reply: formattedAnswer,
    media: data.image
      ? [{ type: "image", url: data.image }]
      : [],
    type: "NUTRITION"
  });
}

     

    // 2. Recipe suggestions
    if (isRecipeQuestion(cleanMessage)) {
      const ingredients = extractIngredient(cleanMessage, "recipe");

      if (ingredients) {
        const result = await findRecipesByIngredients(ingredients);
        return res.json(result);
      }
    }

    // 3. General ingredient and nutrition information
    if (isIngredientInfoQuestion(cleanMessage)) {
      const ingredientName = extractIngredient(
        cleanMessage,
        "info"
      );

      if (ingredientName) {
        const ingredient = await searchIngredient(ingredientName);

        if (ingredient) {
          const result = await getIngredientInformation(ingredient);
          return res.json(result);
        }

        return res.json({
          reply: `I couldn't find information about ${ingredientName}. Please try another ingredient.`,
          media: [],
          type: "INGREDIENT_INFO"
        });
      }
    }

    // 4. General food conversation
    const params = { text: cleanMessage };

    if (contextId) {
      params.contextId = contextId;
    }

    const data = await spoonacularRequest(
      "/food/converse",
      params
    );

    const reply = data.answerText;

    if (!reply) {
      return res.status(502).json({
        error: "The food API returned an empty response. Please try another question."
      });
    }

    return res.json({
      reply,
      media: data.media || [],
      type: data.type || "CONVERSATION",
      contextId: data.contextId || contextId || null
    });

  } catch (error) {
    console.error("Chatbot error:", error);

    return res.status(500).json({
      error: "Something went wrong with the chatbot. Please try again."
    });
  }
});

module.exports = router;
