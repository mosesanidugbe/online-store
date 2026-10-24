import pool from "../db.js";
import bcrypt from "bcrypt";

const { OWNER_USERNAME, OWNER_EMAIL, OWNER_PASSWORD } = process.env;

const createOwner = async () => {
  try {
    // Check if the owner already exists
    const existingOwner = await pool.query(
      "SELECT id FROM users WHERE role = 'OWNER' LIMIT 1",
    );

    if (existingOwner.rows.length > 0) {
      console.log("Owner already exists.");
      return;
    }

    // Hash the owner's password
    const hashedPassword = await bcrypt.hash(OWNER_PASSWORD, 10);

    // Create the owner
    await pool.query(
      "INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, 'OWNER')",
      [OWNER_USERNAME, OWNER_EMAIL, hashedPassword],
    );

    console.log("Owner created successfully.");
  } catch (error) {
    console.error("Error creating owner:", error);
  } finally {
    // Close the database connection
    await pool.end();
  }
};

createOwner();

export default createOwner;
