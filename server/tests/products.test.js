import pool from "../db.js";

test("stores and retrieves a product with its configured values", async () => {
  const insertResult = await pool.query(
    `INSERT INTO products
      (name, description, price, category, stock_quantity, is_placeholder, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [
      "Development T-Shirt",
      "A sample product for schema testing",
      19.99,
      "Clothing",
      7,
      true,
      false,
    ],
  );

  const productResult = await pool.query(
    "SELECT name, description, price, category, stock_quantity, is_placeholder, is_active FROM products WHERE id = $1",
    [insertResult.rows[0].id],
  );

  expect(productResult.rows).toHaveLength(1);
  expect(productResult.rows[0]).toEqual({
    name: "Development T-Shirt",
    description: "A sample product for schema testing",
    price: "19.99",
    category: "Clothing",
    stock_quantity: 7,
    is_placeholder: true,
    is_active: false,
  });
});

test("applies the expected defaults for a new product", async () => {
  const insertResult = await pool.query(
    "INSERT INTO products (name, price) VALUES ($1, $2) RETURNING id",
    ["Defaulted Product", 5.5],
  );

  const productResult = await pool.query(
    "SELECT stock_quantity, is_placeholder, is_active FROM products WHERE id = $1",
    [insertResult.rows[0].id],
  );

  expect(productResult.rows[0]).toEqual({
    stock_quantity: 0,
    is_placeholder: false,
    is_active: true,
  });
});
