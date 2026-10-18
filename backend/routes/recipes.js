const express = require("express");
const router = express.Router();
const pool = require("../db");


// ================= ADD RECIPE =================
router.post("/add", async (req, res) => {

  try {

    const {
      title,
      keyword,
      ingredients,
      instructions
    } = req.body;

    await pool.query(
      `
      INSERT INTO recipes
      (title, keyword, ingredients, instructions)
      VALUES ($1, $2, $3, $4)
      `,
      [
        title,
        keyword,
        ingredients,
        instructions
      ]
    );

    res.json({
      message: "Recipe added successfully 🍲"
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: err.message
    });

  }

});


// ================= SEARCH =================
router.get("/search/:query", async (req, res) => {

  try {

    const query = req.params.query;

    const result = await pool.query(
      `
      SELECT * FROM recipes
      WHERE
      LOWER(title) LIKE LOWER($1)
      OR LOWER(keyword) LIKE LOWER($1)
      `,
      [`%${query}%`]
    );

    res.json(result.rows);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: err.message
    });

  }

});


// ================= GET ALL =================
router.get("/all", async (req, res) => {

  try {

    const result =
      await pool.query(
        "SELECT * FROM recipes"
      );

    res.json(result.rows);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: err.message
    });

  }

});


module.exports = router;