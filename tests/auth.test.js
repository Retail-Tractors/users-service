const request = require('supertest');
const app = require("../src/app.js");
const prisma = require("../src/config/db.js");

// Tests for authentication-related endpoints
describe("Authentication Endpoints", () => {

  const testUser = {
    name: "Auth Test User",
    email: "auth_test@example.com",
    password: "StrongPass123"
  };

  let jwtToken;

  describe("POST /auth/register", () => {

    it("should register a new user", async () => {
      const res = await request(app)
        .post("/auth/register")
        .send(testUser);

      expect(res.statusCode).toBe(201);
      expect(res.body.data).toHaveProperty("id");
      expect(res.body.data.email).toBe(testUser.email);
      expect(res.body.data).not.toHaveProperty("password");
    });

    it("should fail if email already exists", async () => {
      const res = await request(app)
        .post("/auth/register")
        .send(testUser);

      expect(res.statusCode).toBe(409);
    });

    it("should fail if required fields are missing", async () => {
      const res = await request(app)
        .post("/auth/register")
        .send({ email: "missing@fields.com" });

      expect(res.statusCode).toBe(400);
    });
  });

  describe("POST /auth/login", () => {

    it("should login and return JWT token", async () => {
      const res = await request(app)
        .post("/auth/login")
        .send({
          email: testUser.email,
          password: testUser.password
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("token");

      jwtToken = res.body.token;
    });

    it("should fail with wrong password", async () => {
      const res = await request(app)
        .post("/auth/login")
        .send({
          email: testUser.email,
          password: "WrongPassword"
        });

      expect(res.statusCode).toBe(401);
    });

    it("should fail if email or password is missing", async () => {
      const res = await request(app)
        .post("/auth/login")
        .send({ email: testUser.email });

      expect(res.statusCode).toBe(400);
    });
  });

  describe("POST /auth/forgot-password", () => {

    it("should fail if email is missing", async () => {
      const res = await request(app)
        .post("/auth/forgot-password")
        .send({});

      expect(res.statusCode).toBe(400);
    });

    it("should fail if email format is invalid", async () => {
      const res = await request(app)
        .post("/auth/forgot-password")
        .send({ email: "invalid-email" });

      expect(res.statusCode).toBe(400);
    });

    it("should fail for non-existing user", async () => {
      const res = await request(app)
        .post("/auth/forgot-password")
        .send({ email: "notfound@example.com" });

      expect(res.statusCode).toBe(404);
    });

  });

  describe("POST /auth/reset-password", () => {

    it("should fail if required fields are missing", async () => {
      const res = await request(app)
        .post("/auth/reset-password")
        .send({});

      expect(res.statusCode).toBe(400);
    });

    it("should fail with invalid token", async () => {
      const res = await request(app)
        .post("/auth/reset-password")
        .send({
          email: testUser.email,
          token: "invalid-token",
          newPassword: "NewStrongPass123"
        });

      expect(res.statusCode).toBe(400);
    });

    it("should fail if password is too short", async () => {
      const res = await request(app)
        .post("/auth/reset-password")
        .send({
          email: testUser.email,
          token: "invalid-token",
          newPassword: "123"
        });

      expect(res.statusCode).toBe(400);
    });

  });

  describe("GET /users/auth/verify", () => {

    it("should verify a valid JWT token", async () => {
      const res = await request(app)
        .get("/users/auth/verify")
        .set("Authorization", `Bearer ${jwtToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe("Token is valid.");
    });

    it("should fail without token", async () => {
      const res = await request(app)
        .get("/users/auth/verify");

      expect(res.statusCode).toBe(401);
    });

    it("should fail with invalid token", async () => {
      const res = await request(app)
        .get("/users/auth/verify")
        .set("Authorization", "Bearer invalid.token.here");

      expect(res.statusCode).toBe(403);
    });
  });

  afterAll(async () => {
    // Clean up test user from database
    await prisma.user.deleteMany({
      where: { email: testUser.email }
    });
    await prisma.$disconnect();
  });

});

