const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const authRoutes =
  require("./routes/auth");

const recipeRoutes =
  require("./routes/recipes");

const app = express();

app.use(cors());

app.use(bodyParser.json());


// ✅ ROUTES
app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/recipes",
  recipeRoutes
);


// ✅ TEST
app.get("/", (req, res) => {

  res.send(
    "Rasoi Backend Running 🍲"
  );

});


const PORT = 5000;

app.listen(PORT, () => {

  console.log(
    `Server running on port ${PORT}`
  );

});