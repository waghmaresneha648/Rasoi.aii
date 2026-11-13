
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const authRoutes = require("./routes/auth");
const recipeRoutes = require("./routes/recipes");
const chatRoutes = require("./routes/chatRoutes");

const app = express();

app.use(cors());
app.use(bodyParser.json());

// AUTH ROUTES
app.use("/api/auth", authRoutes);

// RECIPE ROUTES
app.use("/api/recipes", recipeRoutes);

// CHATBOT ROUTE
app.use("/api/chat", chatRoutes);

// TEST ROUTE
app.get("/", (req, res) => {
  res.send("Rasoi Backend Running 🍲");
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
