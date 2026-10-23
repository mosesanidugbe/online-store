import dotenv from "dotenv";
import path from "node:path";

dotenv.config({
  path: path.resolve(process.cwd(), ".env.test"),
  override: true,
});

if (!process.env.DB_NAME?.endsWith("_test")) {
  throw new Error("Tests must use a database whose name ends with _test");
}

const { default: pool } = await import("../db.js");

beforeEach(async () => {
  await pool.query("TRUNCATE TABLE users RESTART IDENTITY CASCADE");
});

afterAll(async () => {
  await pool.end();
});
