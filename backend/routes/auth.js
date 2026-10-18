const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcrypt");


// ================= SIGNUP =================
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3)",
      [name, email, hashedPassword]
    );

    res.json({ message: "User created" });

  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});


// ================= LOGIN =================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.json({ message: "User not found" });
    }

    const user = result.rows[0];

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.json({ message: "Wrong password" });
    }

    // ✅ IMPORTANT: send userName also
    res.json({
      message: "Login success",
      userId: user.id,
      userName: user.name
    });

  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

module.exports = router;