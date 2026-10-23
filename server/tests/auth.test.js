import app from "../server.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../db.js";
import request from "supertest";

const validUser = {
  username: "testuser",
  email: "test@example.com",
  password: "password123",
};

const registerUser = () => request(app).post("/auth/register").send(validUser);

const loginUser = () =>
  request(app).post("/auth/login").send({
    username: validUser.username,
    password: validUser.password,
  });

test("returns 400 for missing credentials", async () => {
  const response = await request(app).post("/auth/login").send({});
  expect(response.status).toBe(400);
  expect(response.body.message).toBe("Username and password are required");
});

test("returns 400 when username is missing", async () => {
  const response = await request(app)
    .post("/auth/login")
    .send({ password: "password" });
  expect(response.status).toBe(400);
  expect(response.body.message).toBe("Username and password are required");
});

test("returns 400 when password is missing", async () => {
  const response = await request(app)
    .post("/auth/login")
    .send({ username: "username" });
  expect(response.status).toBe(400);
  expect(response.body.message).toBe("Username and password are required");
});

test("returns 401 for invalid credentials", async () => {
  const response = await request(app)
    .post("/auth/login")
    .send({ username: "invalid", password: "invalid" });
  expect(response.status).toBe(401);
  expect(response.body.message).toBe("Invalid username or password");
});

test("returns 400 when registration fields are missing", async () => {
  const response = await request(app).post("/auth/register").send({});

  expect(response.status).toBe(400);
  expect(response.body.message).toBe(
    "Username, email and password are required",
  );
});

test("returns 400 for invalid registration data", async () => {
  const response = await request(app).post("/auth/register").send({
    username: "bad username",
    email: "not-an-email",
    password: "short",
  });

  expect(response.status).toBe(400);
  expect(response.body.message).toContain("Username must be");
});

test("registers a user and stores a bcrypt password hash", async () => {
  const response = await registerUser();
  const result = await pool.query(
    "SELECT password_hash FROM users WHERE username = $1",
    [validUser.username],
  );

  expect(response.status).toBe(201);
  const tokenPayload = jwt.verify(response.body.token, process.env.JWT_SECRET);

  expect(response.body.user.username).toBe(validUser.username);
  expect(tokenPayload).toEqual(
    expect.objectContaining({ id: expect.any(Number), role: "CUSTOMER" }),
  );
  expect(result.rows).toHaveLength(1);
  expect(result.rows[0].password_hash).not.toBe(validUser.password);
  await expect(
    bcrypt.compare(validUser.password, result.rows[0].password_hash),
  ).resolves.toBe(true);
});

test("returns 409 for duplicate usernames", async () => {
  await registerUser();

  const response = await request(app)
    .post("/auth/register")
    .send({
      ...validUser,
      email: "different@example.com",
    });

  expect(response.status).toBe(409);
  expect(response.body.message).toBe("Username or email already exists");
});

test("returns 409 for duplicate email addresses", async () => {
  await registerUser();

  const response = await request(app)
    .post("/auth/register")
    .send({
      ...validUser,
      username: "differentuser",
    });

  expect(response.status).toBe(409);
  expect(response.body.message).toBe("Username or email already exists");
});

test("logs in a registered user and returns a valid JWT", async () => {
  await registerUser();

  const response = await loginUser();
  const tokenPayload = jwt.verify(response.body.token, process.env.JWT_SECRET);

  expect(response.status).toBe(200);
  expect(response.body.user.username).toBe(validUser.username);
  expect(tokenPayload).toEqual(
    expect.objectContaining({ id: expect.any(Number), role: "CUSTOMER" }),
  );
});

test("returns 401 for an incorrect password", async () => {
  await registerUser();

  const response = await request(app).post("/auth/login").send({
    username: validUser.username,
    password: "wrong-password",
  });

  expect(response.status).toBe(401);
  expect(response.body.message).toBe("Invalid username or password");
});

test("returns 401 for an account request without a token", async () => {
  const response = await request(app).get("/account");

  expect(response.status).toBe(401);
  expect(response.body.message).toBe("Access token required");
});

test("returns 403 for an account request with an invalid token", async () => {
  const response = await request(app)
    .get("/account")
    .set("Authorization", "Bearer invalid-token");

  expect(response.status).toBe(403);
  expect(response.body.message).toBe("Invalid or expired token");
});

test("returns the authenticated user's account details", async () => {
  await registerUser();
  const loginResponse = await loginUser();

  const response = await request(app)
    .get("/account")
    .set("Authorization", `Bearer ${loginResponse.body.token}`);

  expect(response.status).toBe(200);
  expect(response.body.accountDetails).toEqual({
    username: validUser.username,
    email: validUser.email,
    role: "CUSTOMER",
  });
});
