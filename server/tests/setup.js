import dotenv from "dotenv";
import { readFile } from "node:fs/promises";

dotenv.config({
  path: ".env.test",
  override: true,
  quiet: true,
});

if (!process.env.DB_NAME?.endsWith("_test")) {
  throw new Error("Tests must use a database whose name ends with _test");
}

const { default: pool } = await import("../db.js");

// Check the database the pool actually connected to. DATABASE_URL takes
// precedence over DB_NAME in db.js, so checking the environment alone
// would not be enough to protect non-test databases.
const { rows } = await pool.query("SELECT current_database() AS name");
if (!rows[0]?.name?.endsWith("_test")) {
  await pool.end();
  throw new Error("Tests connected to a database whose name does not end with _test");
}

// Prepare tables once before the test suite. The schema is safe to apply
// repeatedly because its CREATE TABLE statements use IF NOT EXISTS.
const schema = await readFile(new URL("../db/schema.sql", import.meta.url), "utf8");
await pool.query(schema);

beforeEach(async () => {
  await pool.query(
    "TRUNCATE TABLE storefront_sections, products, users RESTART IDENTITY CASCADE",
  );
});

afterAll(async () => {
  await pool.end();
});
