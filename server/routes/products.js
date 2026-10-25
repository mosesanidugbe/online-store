import express from "express";
import pool from "../db.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, description, price, image_url, category, stock_quantity
       FROM products
       WHERE is_active = TRUE AND is_placeholder = FALSE
       ORDER BY created_at DESC, id DESC`,
    );

    res.status(200).json({ products: result.rows });
  } catch (error) {
    console.error("Failed to retrieve products:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
