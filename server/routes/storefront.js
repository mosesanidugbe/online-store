import express from "express";
import pool from "../db.js";
import authenticateToken from "../middleware/authMiddleware.js";

const router = express.Router();
const editableTypes = new Set(["hero_banner", "featured_products"]);
const settingKeys = {
  hero_banner: new Set([
    "heading",
    "description",
    "image_url",
    "cta_label",
    "cta_href",
  ]),
  featured_products: new Set([
    "heading",
    "description",
    "limit",
    "max_products",
    "product_ids",
  ]),
};

function validateSettings(type, settings) {
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
    return "Settings must be an object";
  }

  const allowedKeys = settingKeys[type];
  for (const [key, value] of Object.entries(settings)) {
    if (!allowedKeys.has(key)) {
      return `Unsupported setting: ${key}`;
    }
    if (["heading", "description", "image_url", "cta_label", "cta_href"].includes(key)) {
      if (typeof value !== "string") return `${key} must be a string`;
      if (value.length > (key === "description" ? 2000 : 500)) {
        return `${key} is too long`;
      }
    }
    if (key === "image_url" || key === "cta_href") {
      if (value && !value.startsWith("/") && !/^https?:\/\//i.test(value)) {
        return `${key} must be a relative path or an HTTP(S) URL`;
      }
    }
    if (key === "limit" || key === "max_products") {
      if (!Number.isInteger(value) || value < 1 || value > 12) {
        return `${key} must be an integer from 1 to 12`;
      }
    }
    if (key === "product_ids") {
      if (!Array.isArray(value) || value.length > 50 ||
          value.some((id) => !Number.isInteger(id) || id < 1)) {
        return "product_ids must be an array of up to 50 positive integers";
      }
    }
  }

  return null;
}

function validateTitle(title) {
  return typeof title === "string" && title.trim().length > 0 && title.trim().length <= 150;
}

function validateDisplayOrder(value) {
  return Number.isInteger(value) && value >= 0;
}

function requireOwner(req, res, next) {
  if (req.user?.role !== "OWNER") {
    return res.status(403).json({ message: "Owner access required" });
  }
  next();
}

router.get("/sections", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, type, title, display_order, settings
       FROM storefront_sections
       WHERE is_visible = TRUE
       ORDER BY display_order ASC, id ASC`,
    );

    res.status(200).json({ sections: result.rows });
  } catch (error) {
    console.error("Failed to retrieve storefront sections:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/manage/sections", authenticateToken, requireOwner, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, type, title, is_visible, display_order, settings
       FROM storefront_sections
       ORDER BY display_order ASC, id ASC`,
    );
    res.status(200).json({ sections: result.rows });
  } catch (error) {
    console.error("Failed to retrieve manageable storefront sections:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/sections", authenticateToken, requireOwner, async (req, res) => {
  const { type, title, settings = {}, is_visible = true, display_order = 0 } = req.body ?? {};
  if (!editableTypes.has(type)) {
    return res.status(400).json({ message: "Type must be hero_banner or featured_products" });
  }
  if (!validateTitle(title)) {
    return res.status(400).json({ message: "Title is required and must be 150 characters or fewer" });
  }
  if (typeof is_visible !== "boolean") {
    return res.status(400).json({ message: "is_visible must be a boolean" });
  }
  if (!validateDisplayOrder(display_order)) {
    return res.status(400).json({ message: "display_order must be a non-negative integer" });
  }
  const settingsError = validateSettings(type, settings);
  if (settingsError) return res.status(400).json({ message: settingsError });

  try {
    const result = await pool.query(
      `INSERT INTO storefront_sections (type, title, settings, is_visible, display_order)
       VALUES ($1, $2, $3::jsonb, $4, $5)
       RETURNING id, type, title, settings, is_visible, display_order`,
      [type, title.trim(), JSON.stringify(settings), is_visible, display_order],
    );
    res.status(201).json({ section: result.rows[0] });
  } catch (error) {
    console.error("Failed to create storefront section:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

router.patch("/sections/:id", authenticateToken, requireOwner, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ message: "Section id must be a positive integer" });
  }

  const { title, settings, is_visible, display_order } = req.body ?? {};
  if (title !== undefined && !validateTitle(title)) {
    return res.status(400).json({ message: "Title is required and must be 150 characters or fewer" });
  }
  if (is_visible !== undefined && typeof is_visible !== "boolean") {
    return res.status(400).json({ message: "is_visible must be a boolean" });
  }
  if (display_order !== undefined && !validateDisplayOrder(display_order)) {
    return res.status(400).json({ message: "display_order must be a non-negative integer" });
  }
  if (title === undefined && settings === undefined && is_visible === undefined && display_order === undefined) {
    return res.status(400).json({ message: "At least one section field is required" });
  }

  try {
    const current = await pool.query(
      "SELECT id, type FROM storefront_sections WHERE id = $1",
      [id],
    );
    if (current.rowCount === 0) {
      return res.status(404).json({ message: "Storefront section not found" });
    }
    if (settings !== undefined) {
      const settingsError = validateSettings(current.rows[0].type, settings);
      if (settingsError) return res.status(400).json({ message: settingsError });
    }

    const updates = [];
    const values = [];
    const add = (column, value, cast = "") => {
      values.push(value);
      updates.push(`${column} = $${values.length}${cast}`);
    };
    if (title !== undefined) add("title", title.trim());
    if (settings !== undefined) add("settings", JSON.stringify(settings), "::jsonb");
    if (is_visible !== undefined) add("is_visible", is_visible);
    if (display_order !== undefined) add("display_order", display_order);
    values.push(id);

    const result = await pool.query(
      `UPDATE storefront_sections SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${values.length}
       RETURNING id, type, title, settings, is_visible, display_order`,
      values,
    );
    res.status(200).json({ section: result.rows[0] });
  } catch (error) {
    console.error("Failed to update storefront section:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
