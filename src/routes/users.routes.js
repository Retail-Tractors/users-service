const express = require("express");
const router = express.Router();
const { authenticateToken, checkUserIDMatch } = require("../middlewares/auth");
const usersController = require("../controllers/users.controller");
const { authorizeRole } = require("../middlewares/check-role.js");

router.get("/", authenticateToken, authorizeRole("admin"), usersController.listUser);
router.post("/register", usersController.addUser);
router.post("/login", usersController.login);
router.post("/forgot-password", usersController.forgotPassword);
router.post("/reset-password", usersController.resetPassword);
router.get("/:id", authenticateToken, checkUserIDMatch, usersController.getUser);
router.put("/:id", authenticateToken, checkUserIDMatch, usersController.editUser);
router.delete("/:id", authenticateToken, authorizeRole("admin"), usersController.deleteUser);
router.patch("/:id/role", authenticateToken, authorizeRole("admin"), usersController.changeUserRole);

module.exports = router;