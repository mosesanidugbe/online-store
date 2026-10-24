import express from "express";
import pool from "../db.js";

const router = express.Router();

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

export default router;
