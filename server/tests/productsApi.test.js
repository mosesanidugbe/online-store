import app from "../server.js";
import pool from "../db.js";
import request from "supertest";

const createProduct = ({
  name,
  isActive = true,
  isPlaceholder = false,
  category = "Vintage",
}) =>
  pool.query(
    `INSERT INTO products
      (name, description, price, image_url, category, stock_quantity, is_active, is_placeholder)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id`,
    [
      name,
      `Description for ${name}`,
      12000,
      `/images/${name.toLowerCase().replaceAll(" ", "-")}.jpg`,
      category,
      4,
      isActive,
      isPlaceholder,
    ],
  );

test("GET /products returns only active non-placeholder products", async () => {
  await createProduct({ name: "Visible product" });
  await createProduct({ name: "Inactive product", isActive: false });
  await createProduct({ name: "Placeholder product", isPlaceholder: true });
  await createProduct({
    name: "Inactive placeholder",
    isActive: false,
    isPlaceholder: true,
  });

  const response = await request(app).get("/products");

  expect(response.status).toBe(200);
  expect(response.body.products).toHaveLength(1);
  expect(response.body.products[0]).toEqual(
    expect.objectContaining({
      name: "Visible product",
      description: "Description for Visible product",
      price: "12000.00",
      image_url: "/images/visible-product.jpg",
      category: "Vintage",
      stock_quantity: 4,
    }),
  );
  expect(response.body.products[0]).not.toHaveProperty("is_placeholder");
  expect(response.body.products[0]).not.toHaveProperty("is_active");
});

test("GET /products returns an empty list when no eligible products exist", async () => {
  await createProduct({ name: "Inactive product", isActive: false });
  await createProduct({ name: "Placeholder product", isPlaceholder: true });

  const response = await request(app).get("/products");

  expect(response.status).toBe(200);
  expect(response.body).toEqual({ products: [] });
});
