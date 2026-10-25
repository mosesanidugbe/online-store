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
  const allowedFields = {
    name: (value) => typeof value === "string" && value.trim().length > 0 && value.trim().length <= 150,
    description: (value) => typeof value === "string" && value.length <= 5000,
    price: (value) => value !== "" && value !== null && value !== undefined && Number.isFinite(Number(value)) && Number(value) >= 0,
    image_url: (value) => typeof value === "string" && value.length <= 2048,
    category: (value) => typeof value === "string" && value.length <= 100,
    is_placeholder: (value) => typeof value === "boolean",
    is_active: (value) => typeof value === "boolean",
  };
  const entries = Object.entries(req.body ?? {});
  if (entries.length === 0 || entries.some(([key, value]) => !Object.hasOwn(allowedFields, key) || !allowedFields[key](value))) {
    return res.status(400).json({ message: "Provide valid product details or boolean status flags. Use the stock endpoint to adjust inventory." });
  }
  const columns = { name: "name", description: "description", price: "price", image_url: "image_url", category: "category", is_placeholder: "is_placeholder", is_active: "is_active" };
  const values = entries.map(([key, value]) => key === "name" || key === "description" || key === "image_url" || key === "category" ? value.trim() : key === "price" ? Number(value) : value);
  const assignments = entries.map(([key], index) => columns[key] + " = $" + (index + 1));
  values.push(productId);
  try {
    const result = await pool.query(
      "UPDATE products SET " + assignments.join(", ") + " WHERE id = $" + values.length + " RETURNING id, name, description, price, image_url, category, stock_quantity, is_placeholder, is_active, created_at",
      values,
    );
    if (result.rows.length === 0) return res.status(404).json({ message: "Product not found" });
    res.status(200).json({ product: result.rows[0] });
  } catch (error) {
    console.error("Failed to update product:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/:id/stock", async (req, res) => {
  const productId = Number(req.params.id);
  const { adjustment, quantity } = req.body ?? {};
  if (!Number.isInteger(productId) || productId < 1) {
    return res.status(400).json({ message: "Product ID must be a positive integer" });
  }
  if (!["add", "set"].includes(adjustment) || !Number.isInteger(Number(quantity)) || Number(quantity) < 0 || quantity === "" || quantity === null || quantity === undefined || (adjustment === "add" && Number(quantity) < 1)) {
    return res.status(400).json({ message: "Provide adjustment as add or set and a valid stock quantity. Add quantity must be at least 1." });
  }
  try {
    const sql = adjustment === "add"
      ? "UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2 RETURNING id, name, description, price, image_url, category, stock_quantity, is_placeholder, is_active, created_at"
      : "UPDATE products SET stock_quantity = $1 WHERE id = $2 RETURNING id, name, description, price, image_url, category, stock_quantity, is_placeholder, is_active, created_at";
    const result = await pool.query(sql, [Number(quantity), productId]);
    if (result.rows.length === 0) return res.status(404).json({ message: "Product not found" });
    res.status(200).json({ product: result.rows[0] });
  } catch (error) {
    console.error("Failed to adjust product stock:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});
router.delete("/:id", async (req, res) => {
  const productId = Number(req.params.id);
  if (!Number.isInteger(productId) || productId < 1) {
    return res.status(400).json({ message: "Product ID must be a positive integer" });
  }

  try {
    const result = await pool.query(
      "DELETE FROM products WHERE id = $1 RETURNING id, name",
      [productId],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json({ message: "Product deleted", product: result.rows[0] });
  } catch (error) {
    console.error("Failed to delete product:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
