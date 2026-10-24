import app from "../server.js";
import pool from "../db.js";
import request from "supertest";

const createSection = ({
  type = "hero_banner",
  title,
  isVisible = true,
  displayOrder = 0,
  settings = {},
}) =>
  pool.query(
    `INSERT INTO storefront_sections
      (type, title, is_visible, display_order, settings)
     VALUES ($1, $2, $3, $4, $5::jsonb)
     RETURNING id`,
    [type, title, isVisible, displayOrder, JSON.stringify(settings)],
  );

test("GET /storefront/sections returns visible sections in display order", async () => {
  await createSection({
    title: "Third section",
    displayOrder: 2,
    settings: { heading: "Third" },
  });
  await createSection({
    title: "First section",
    displayOrder: 0,
    settings: { heading: "First" },
  });
  await createSection({
    title: "Hidden section",
    isVisible: false,
    displayOrder: 1,
  });
  await createSection({
    title: "Second section",
    displayOrder: 1,
    settings: { heading: "Second" },
  });

  const response = await request(app).get("/storefront/sections");

  expect(response.status).toBe(200);
  expect(response.body.sections.map(({ title }) => title)).toEqual([
    "First section",
    "Second section",
    "Third section",
  ]);
  expect(response.body.sections).toEqual([
    expect.objectContaining({
      type: "hero_banner",
      title: "First section",
      display_order: 0,
      settings: { heading: "First" },
    }),
    expect.objectContaining({
      type: "hero_banner",
      title: "Second section",
      display_order: 1,
      settings: { heading: "Second" },
    }),
    expect.objectContaining({
      type: "hero_banner",
      title: "Third section",
      display_order: 2,
      settings: { heading: "Third" },
    }),
  ]);
  expect(response.body.sections.every((section) => !("is_visible" in section))).toBe(
    true,
  );
});

test("GET /storefront/sections returns an empty list when no sections are visible", async () => {
  await createSection({
    title: "Hidden section",
    isVisible: false,
  });

  const response = await request(app).get("/storefront/sections");

  expect(response.status).toBe(200);
  expect(response.body).toEqual({ sections: [] });
});
