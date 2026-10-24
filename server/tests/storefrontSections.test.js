import pool from "../db.js";

test("stores and retrieves a configured storefront section", async () => {
  const insertResult = await pool.query(
    `INSERT INTO storefront_sections
      (type, title, is_visible, display_order, settings)
     VALUES ($1, $2, $3, $4, $5::jsonb)
     RETURNING id`,
    [
      "hero_banner",
      "Summer collection",
      true,
      1,
      JSON.stringify({
        heading: "Find your next favourite",
        image_url: "/images/campaign.jpg",
        cta_label: "Shop now",
        cta_href: "/products",
      }),
    ],
  );

  const result = await pool.query(
    `SELECT type, title, is_visible, display_order, settings
     FROM storefront_sections
     WHERE id = $1`,
    [insertResult.rows[0].id],
  );

  expect(result.rows).toHaveLength(1);
  expect(result.rows[0]).toEqual({
    type: "hero_banner",
    title: "Summer collection",
    is_visible: true,
    display_order: 1,
    settings: {
      heading: "Find your next favourite",
      image_url: "/images/campaign.jpg",
      cta_label: "Shop now",
      cta_href: "/products",
    },
  });
});

test("applies defaults to a new storefront section", async () => {
  const result = await pool.query(
    `INSERT INTO storefront_sections (type, title)
     VALUES ($1, $2)
     RETURNING is_visible, display_order, settings`,
    ["featured_products", "Featured products"],
  );

  expect(result.rows[0]).toEqual({
    is_visible: true,
    display_order: 0,
    settings: {},
  });
});

test("rejects unsupported section types", async () => {
  await expect(
    pool.query(
      "INSERT INTO storefront_sections (type, title) VALUES ($1, $2)",
      ["custom_component", "Custom component"],
    ),
  ).rejects.toMatchObject({ code: "23514" });
});

test("rejects negative display order", async () => {
  await expect(
    pool.query(
      `INSERT INTO storefront_sections (type, title, display_order)
       VALUES ($1, $2, $3)`,
      ["category_grid", "Categories", -1],
    ),
  ).rejects.toMatchObject({ code: "23514" });
});

test("rejects settings that are not a JSON object", async () => {
  await expect(
    pool.query(
      `INSERT INTO storefront_sections (type, title, settings)
       VALUES ($1, $2, $3::jsonb)`,
      ["hero_banner", "Invalid settings", JSON.stringify(["not", "an", "object"])],
    ),
  ).rejects.toMatchObject({ code: "23514" });
});
