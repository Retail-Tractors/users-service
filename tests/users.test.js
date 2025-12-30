const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/config/db");

describe("Users CRUD endpoints", () => {

  const userData = {
    name: "Normal User",
    email: "user_test@example.com",
    password: "StrongPass123"
  };

  const adminData = {
    name: "Admin User",
    email: "admin_test@example.com",
    password: "StrongPass123"
  };

  let userToken;
  let adminToken;
  let userId;
  let adminId;

  beforeAll(async () => {
    // Clean slate
    await prisma.user.deleteMany({
      where: {
        email: { in: [userData.email, adminData.email] }
      }
    });

    // Create normal user
    const userRes = await request(app)
      .post("/auth/register")
      .send(userData);
    userId = userRes.body.data.id;

    // Create admin user
    const adminRes = await request(app)
      .post("/auth/register")
      .send(adminData);
    adminId = adminRes.body.data.id;

    // Promote admin user
    await prisma.user.update({
      where: { id: adminId },
      data: { role: "ADMIN" }
    });

    // Login both
    const userLogin = await request(app)
      .post("/auth/login")
      .send({ email: userData.email, password: userData.password });

    userToken = userLogin.body.token;

    const adminLogin = await request(app)
      .post("/auth/login")
      .send({ email: adminData.email, password: adminData.password });

    adminToken = adminLogin.body.token;
  });

  describe("GET /users", () => {

    it("should allow admin to list users", async () => {
      const res = await request(app)
        .get("/users")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("should forbid non-admin users", async () => {
      const res = await request(app)
        .get("/users")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.statusCode).toBe(403);
    });

    it("should fail without token", async () => {
      const res = await request(app)
        .get("/users");

      expect(res.statusCode).toBe(401);
    });
  });

  describe("GET /users/:id", () => {

    it("should allow user to access their own profile", async () => {
      const res = await request(app)
        .get(`/users/${userId}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.id).toBe(userId);
    });

    it("should forbid user from accessing another user", async () => {
      const res = await request(app)
        .get(`/users/${adminId}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.statusCode).toBe(403);
    });

    it("should fail if user does not exist", async () => {
      const res = await request(app)
        .get("/users/999999")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
    });
  });

  describe("PUT /users/:id", () => {

    it("should allow user to edit their own profile", async () => {
      const res = await request(app)
        .put(`/users/${userId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          name: "Updated Name",
          email: "updated_user@example.com"
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.name).toBe("Updated Name");
    });

    it("should forbid editing another user", async () => {
      const res = await request(app)
        .put(`/users/${adminId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ name: "Hack Attempt" });

      expect(res.statusCode).toBe(403);
    });

    it("should fail with invalid email", async () => {
      const res = await request(app)
        .put(`/users/${userId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ email: "invalid-email" });

      expect(res.statusCode).toBe(400);
    });
  });

  describe("PATCH /users/:id/role", () => {

    it("should forbid non-admin role change", async () => {
      const res = await request(app)
        .patch(`/users/${adminId}/role`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ role: "USER" });

      expect(res.statusCode).toBe(403);
    });

    it("should allow admin to change user role", async () => {
      const res = await request(app)
        .patch(`/users/${userId}/role`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ role: "ADMIN" });

      expect(res.statusCode).toBe(200);
    });

    it("should allow admin to revert user role", async () => {
      const res = await request(app)
        .patch(`/users/${userId}/role`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ role: "USER" });
      expect(res.statusCode).toBe(200);
    });

    it("should fail with invalid role", async () => {
      const res = await request(app)
        .patch(`/users/${userId}/role`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ role: "INVALID" });

      expect(res.statusCode).toBe(400);
    });
  });

  describe("DELETE /users/:id", () => {

    it("should forbid non-admin deletion", async () => {
      const res = await request(app)
        .delete(`/users/${adminId}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.statusCode).toBe(403);
    });

    it("should allow admin to delete a user", async () => {
      const res = await request(app)
        .delete(`/users/${userId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(204);
    });

    it("should fail deleting non-existing user", async () => {
      const res = await request(app)
        .delete(`/users/999999`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: { in: [userData.email, adminData.email, "updated_user@example.com"] }
      }
    });
    await prisma.$disconnect();
  });

});
