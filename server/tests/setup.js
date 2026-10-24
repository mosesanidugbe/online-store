import dotenv from "dotenv";

dotenv.config({
  path: ".env.test",
  override: true,
  quiet: true,
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
