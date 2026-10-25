import jwt from "jsonwebtoken";
import request from "supertest";
import pool from "../db.js";
import app from "../server.js";

async function createUser(role = "OWNER") {
  const result = await pool.query(
    `INSERT INTO users (username, email, password_hash, role)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [`user_${role.toLowerCase()}`, `${role.toLowerCase()}@example.com`, "test-hash", role],
  );
  return jwt.sign({ id: result.rows[0].id, role }, process.env.JWT_SECRET);
}

const sectionPayload = {
  type: "hero_banner",
  title: "Welcome",
  settings: { heading: "Welcome to our store", description: "Find something special." },
  is_visible: true,
  display_order: 0,
};

test("storefront section management requires authentication and owner role", async () => {
  expect((await request(app).get("/storefront/manage/sections")).status).toBe(401);

  const customerToken = await createUser("CUSTOMER");
  const customer = await request(app)
    .get("/storefront/manage/sections")
    .set("Authorization", `Bearer ${customerToken}`);
  expect(customer.status).toBe(403);

  const ownerToken = await createUser("OWNER");
  const owner = await request(app)
    .get("/storefront/manage/sections")
    .set("Authorization", `Bearer ${ownerToken}`);
  expect(owner.status).toBe(200);
  expect(owner.body).toEqual({ sections: [] });
});

test("owner can create a section and invalid section settings are rejected", async () => {
  const token = await createUser();
  const invalid = await request(app)
    .post("/storefront/sections")
    .set("Authorization", `Bearer ${token}`)
    .send({ ...sectionPayload, type: "unknown_type" });
  expect(invalid.status).toBe(400);

  const invalidSettings = await request(app)
    .post("/storefront/sections")
    .set("Authorization", `Bearer ${token}`)
    .send({ ...sectionPayload, settings: { unsupported_field: "not allowed" } });
  expect(invalidSettings.status).toBe(400);

  const created = await request(app)
    .post("/storefront/sections")
    .set("Authorization", `Bearer ${token}`)
    .send(sectionPayload);
  expect(created.status).toBe(201);
  expect(created.body.section).toEqual(expect.objectContaining({
    type: "hero_banner",
    title: "Welcome",
    settings: sectionPayload.settings,
    is_visible: true,
    display_order: 0,
  }));
});

test("owner can edit content, visibility and order; public endpoint hides invisible sections", async () => {
  const token = await createUser();
  const created = await request(app)
    .post("/storefront/sections")
    .set("Authorization", `Bearer ${token}`)
    .send(sectionPayload);
  const id = created.body.section.id;

  const updated = await request(app)
    .patch(`/storefront/sections/${id}`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      title: "Updated welcome",
      settings: { heading: "Updated heading" },
      is_visible: false,
      display_order: 3,
    });

  expect(updated.status).toBe(200);
  expect(updated.body.section).toEqual(expect.objectContaining({
    title: "Updated welcome",
    settings: { heading: "Updated heading" },
    is_visible: false,
    display_order: 3,
  }));

  const managed = await request(app)
    .get("/storefront/manage/sections")
    .set("Authorization", `Bearer ${token}`);
  expect(managed.body.sections).toHaveLength(1);
  expect(managed.body.sections[0].is_visible).toBe(false);

  const publicSections = await request(app).get("/storefront/sections");
  expect(publicSections.status).toBe(200);
  expect(publicSections.body).toEqual({ sections: [] });
});

test("section update validates fields and reports missing sections", async () => {
  const token = await createUser();
  const badOrder = await request(app)
    .patch("/storefront/sections/1")
    .set("Authorization", `Bearer ${token}`)
    .send({ display_order: -1 });
  expect(badOrder.status).toBe(400);

  const missing = await request(app)
    .patch("/storefront/sections/99999")
    .set("Authorization", `Bearer ${token}`)
    .send({ title: "Missing" });
  expect(missing.status).toBe(404);
});
