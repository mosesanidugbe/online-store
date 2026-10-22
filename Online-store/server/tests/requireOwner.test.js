import express from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import pool from "../db.js";
import authenticateToken from "../middleware/authMiddleware.js";
import requireOwner from "../middleware/requireOwner.js";

const app = express();

app.use(express.json());

app.get("/owner-only", authenticateToken, requireOwner, async (req, res) => {
  res.status(200).json({ message: "Owner Access granted." });
});

export default app;

test("GET /owner-only - should return 200 for owner", async () => {
  const registerResult = await pool.query(
    "INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id",
    ["testowner", "testowner@example.com", "ownerpasswordhash", "OWNER"],
  );
  const ownerId = registerResult.rows[0].id;

  const token = jwt.sign(
    { id: ownerId, role: "OWNER" },
    process.env.JWT_SECRET,
  );

  const response = await request(app)
    .get("/owner-only")
    .set("Authorization", `Bearer ${token}`);
  expect(response.status).toBe(200);
  expect(response.body.message).toBe("Owner Access granted.");
});
