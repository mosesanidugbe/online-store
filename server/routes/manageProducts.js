import express from "express";
import pool from "../db.js";
import authenticateToken from "../middleware/authMiddleware.js";
import requireOwner from "../middleware/requireOwner.js";

const router = express.Router();
router.use(authenticateToken, requireOwner);

router.get("/", async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, description, price, image_url, category, stock_quantity,
              is_placeholder, is_active, created_at
       FROM products ORDER BY created_at DESC, id DESC`,
    );
    res.status(200).json({ products: result.rows });
  } catch (error) {
    console.error("Failed to retrieve managed products:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
