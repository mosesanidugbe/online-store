import pool from "../db.js";

export default async function requireOwner(req, res, next) {
  try {
    const userId = req.user.id;
    const result = await pool.query("SELECT role FROM users WHERE id = $1", [
      userId,
    ]);
    if (result.rows.length === 0 || result.rows[0].role !== "OWNER") {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  } catch (error) {
    console.error("Error in requireOwner middleware:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
