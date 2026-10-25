import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../server.js";
import pool from "../db.js";

async function createOwner(role = "OWNER") {
  const result = await pool.query(
    "INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id",
    [`${role.toLowerCase()}-user`, `${role.toLowerCase()}@example.test`, "test-hash", role],
  );
  return jwt.sign({ id: result.rows[0].id }, process.env.JWT_SECRET);
}

test("product management requires an authenticated owner", async () => {
  expect((await request(app).get("/manage/products")).status).toBe(401);
  const customerToken = await createOwner("CUSTOMER");
  expect((await request(app).get("/manage/products").set("Authorization", `Bearer ${customerToken}`)).status).toBe(403);
});

test("owner can create a placeholder product and list it", async () => {
  const token = await createOwner();
  const response = await request(app).post("/manage/products").set("Authorization", `Bearer ${token}`).send({
    name: "Test Vintage Jacket", description: "A sample product", price: 45.5,
    image_url: "/images/jacket.jpg", category: "Jackets", stock_quantity: 3,
    is_placeholder: true, is_active: true,
  });
  expect(response.status).toBe(201);
  expect(response.body.product).toEqual(expect.objectContaining({
    name: "Test Vintage Jacket", description: "A sample product", price: "45.50",
    image_url: "/images/jacket.jpg", category: "Jackets", stock_quantity: 3,
    is_placeholder: true, is_active: true,
  }));
  const list = await request(app).get("/manage/products").set("Authorization", `Bearer ${token}`);
  expect(list.status).toBe(200);
  expect(list.body.products).toHaveLength(1);
  expect(list.body.products[0].name).toBe("Test Vintage Jacket");
});

test("owner product creation rejects invalid price and stock", async () => {
  const token = await createOwner();
  const base = { name: "Invalid Product", price: 10, stock_quantity: 0 };
  expect((await request(app).post("/manage/products").set("Authorization", `Bearer ${token}`).send({ ...base, price: -1 })).status).toBe(400);
  expect((await request(app).post("/manage/products").set("Authorization", `Bearer ${token}`).send({ ...base, stock_quantity: -1 })).status).toBe(400);
});
