import express from "express";
import pool from "../db.js";
import authenticateToken from "../middleware/authMiddleware.js";
import requireOwner from "../middleware/requireOwner.js";

const router = express.Router();
router.use(authenticateToken, requireOwner);

function validateProduct(body) {
  const { name, description = "", price, image_url = "", category = "", stock_quantity = 0, is_placeholder = true, is_active = true } = body ?? {};
  if (typeof name !== "string" || !name.trim() || name.trim().length > 150) return "Name is required and must be 150 characters or fewer";
  if (typeof description !== "string" || description.length > 5000) return "Description must be 5000 characters or fewer";
  if (price === "" || price === null || price === undefined || !Number.isFinite(Number(price)) || Number(price) < 0) return "Price must be a non-negative number";
  if (typeof image_url !== "string" || image_url.length > 2048) return "Image URL must be 2048 characters or fewer";
  if (typeof category !== "string" || category.length > 100) return "Category must be 100 characters or fewer";
  if (!Number.isInteger(Number(stock_quantity)) || Number(stock_quantity) < 0) return "Stock quantity must be a non-negative integer";
  if (typeof is_placeholder !== "boolean" || typeof is_active !== "boolean") return "Product flags must be booleans";
  return null;
}

router.get("/", async (_req, res) => {
  try {
    const result = await pool.query("SELECT id, name, description, price, image_url, category, stock_quantity, is_placeholder, is_active, created_at FROM products ORDER BY created_at DESC, id DESC");
    res.status(200).json({ products: result.rows });
  } catch (error) {
    console.error("Failed to retrieve managed products:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", async (req, res) => {
  const validationError = validateProduct(req.body);
  if (validationError) return res.status(400).json({ message: validationError });
  const { name, description = "", price, image_url = "", category = "", stock_quantity = 0, is_placeholder = true, is_active = true } = req.body;
  try {
    const result = await pool.query("INSERT INTO products (name, description, price, image_url, category, stock_quantity, is_placeholder, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, name, description, price, image_url, category, stock_quantity, is_placeholder, is_active, created_at", [name.trim(), description.trim(), Number(price), image_url.trim(), category.trim(), Number(stock_quantity), is_placeholder, is_active]);
    res.status(201).json({ product: result.rows[0] });
  } catch (error) {
    console.error("Failed to create product:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

router.patch("/:id", async (req, res) => {
  const productId = Number(req.params.id);
  if (!Number.isInteger(productId) || productId < 1) {
    return res.status(400).json({ message: "Product ID must be a positive integer" });
  }
  const keys = Object.keys(req.body ?? {});
  if (keys.length === 0 || keys.some((key) => !["is_placeholder", "is_active"].includes(key)) ||
      keys.some((key) => typeof req.body[key] !== "boolean")) {
    return res.status(400).json({ message: "Provide is_placeholder and/or is_active as boolean values" });
  }

  try {
    const result = await pool.query(
      "UPDATE products SET is_placeholder = COALESCE($1, is_placeholder), is_active = COALESCE($2, is_active) WHERE id = $3 RETURNING id, name, description, price, image_url, category, stock_quantity, is_placeholder, is_active, created_at",
      [req.body.is_placeholder ?? null, req.body.is_active ?? null, productId],
    );
    if (result.rows.length === 0) return res.status(404).json({ message: "Product not found" });
    res.status(200).json({ product: result.rows[0] });
  } catch (error) {
    console.error("Failed to update product status:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
