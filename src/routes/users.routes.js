const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middlewares/auth");
const usersController = require("../controllers/users.controller");
const authController = require("../controllers/auth.controller");
const { authorizeRole } = require("../middlewares/check-role.js");

router.get("/",
  /*
    #swagger.tags = ['Users']
    #swagger.description = 'List all users (admin only).'
    #swagger.security = [{ BearerAuth: [] }]

    #swagger.responses[200] = {
      description: 'List of users returned successfully.',
      schema: [{ id: 1, name: 'John Doe', email: 'john@example.com', role: 'USER' }]
    }

    #swagger.responses[401] = { description: 'Missing or invalid token.' }
    #swagger.responses[403] = { description: 'User does not have ADMIN role.' }
  */
  authenticateToken,
  authorizeRole("ADMIN"),
  usersController.listUser
);

router.post("/register",
  /*
    #swagger.tags = ['Auth']
    #swagger.description = 'Register a new user.'

    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: {
        name: "John Doe",
        email: "john@example.com",
        password: "1234"
      }
    }

    #swagger.responses[201] = {
      description: 'User created successfully.',
      schema: { data: { id: 1, name: "John", email: "john@example.com", role: "USER" } }
    }

    #swagger.responses[400] = { description: 'Missing fields, weak password, or invalid email.' }
    #swagger.responses[409] = { description: 'Email already exists.' }
  */
  authController.register
);

router.post("/login",
  /*
    #swagger.tags = ['Auth']
    #swagger.description = 'Login a user and retrieve JWT token.'

    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: { email: "john@example.com", password: "1234" }
    }

    #swagger.responses[200] = {
      description: 'JWT token returned.',
      schema: { token: "jwt.token.here" }
    }

    #swagger.responses[400] = { description: 'Missing email or password.' }
    #swagger.responses[401] = { description: 'Invalid credentials.' }
  */
  authController.login
);

router.post("/forgot-password",
  /*
    #swagger.tags = ['Auth']
    #swagger.description = 'Request a password reset token via email.'

    #swagger.parameters['body'] = {
      in: 'body',
      schema: { email: "john@example.com" }
    }

    #swagger.responses[200] = { description: 'Password reset email sent.' }
    #swagger.responses[400] = { description: 'Invalid or missing email.' }
    #swagger.responses[404] = { description: 'User not found.' }
  */
  authController.forgotPassword
);

router.post("/reset-password",
  /*
    #swagger.tags = ['Auth']
    #swagger.description = 'Reset a user password with the provided reset token.'

    #swagger.parameters['body'] = {
      in: 'body',
      schema: {
        email: "john@example.com",
        token: "resetTokenHere",
        newPassword: "newPass123"
      }
    }

    #swagger.responses[200] = { description: 'Password reset successfully.' }
    #swagger.responses[400] = { description: 'Invalid token, expired token, or weak password.' }
    #swagger.responses[404] = { description: 'User not found.' }
  */
  authController.resetPassword
);

router.get("/:id",
  /*
    #swagger.tags = ['Users']
    #swagger.security = [{ BearerAuth: [] }]
    #swagger.description = 'Retrieve a single user by ID (user can only access their own profile).'

    #swagger.parameters['id'] = {
      in: 'path',
      required: true,
      type: 'integer'
    }

    #swagger.responses[200] = {
      description: 'User retrieved.',
      schema: { data: { id: 1, name: "John", email: "john@example.com" } }
    }

    #swagger.responses[401] = { description: 'Missing or invalid token.' }
    #swagger.responses[403] = { description: 'User trying to access another user\'s account.' }
    #swagger.responses[404] = { description: 'User not found.' }
  */
  authenticateToken,
  usersController.getUser
);

router.put("/:id",
  /*
    #swagger.tags = ['Users']
    #swagger.security = [{ BearerAuth: [] }]
    #swagger.description = 'Edit user profile (name/email only).'

    #swagger.parameters['id'] = { in: 'path', required: true }
    #swagger.parameters['body'] = {
      in: 'body',
      schema: {
        name: "New name",
        email: "newemail@example.com"
      }
    }

    #swagger.responses[200] = {
      description: 'User updated.',
      schema: { data: { id: 1, name: "New name", email: "newemail@example.com" } }
    }

    #swagger.responses[400] = { description: 'Invalid email or missing fields.' }
    #swagger.responses[401] = { description: 'Missing token.' }
    #swagger.responses[403] = { description: 'Not authorized to edit this user.' }
    #swagger.responses[404] = { description: 'User not found.' }
    #swagger.responses[409] = { description: 'Email already exists.' }
  */
  authenticateToken,
  usersController.editUser
);

router.patch("/:id/role",
  /*
    #swagger.tags = ['Users']
    #swagger.security = [{ BearerAuth: [] }]
    #swagger.description = 'Update a user role (admin only).'

    #swagger.parameters['id'] = { in: 'path', required: true }
    #swagger.parameters['body'] = {
      in: 'body',
      schema: { role: "ADMIN" }
    }

    #swagger.responses[200] = { description: 'Role updated successfully.' }
    #swagger.responses[400] = { description: 'Invalid or missing role.' }
    #swagger.responses[401] = { description: 'Missing/invalid token.' }
    #swagger.responses[403] = { description: 'User does not have ADMIN role.' }
    #swagger.responses[404] = { description: 'User not found.' }
  */
  authenticateToken,
  authorizeRole("ADMIN"),
  usersController.changeUserRole
);

router.delete("/:id",
  /*
    #swagger.tags = ['Users']
    #swagger.security = [{ BearerAuth: [] }]
    #swagger.description = 'Delete a user (admin only).'

    #swagger.parameters['id'] = { in: 'path', required: true }

    #swagger.responses[204] = { description: 'User deleted successfully.' }
    #swagger.responses[401] = { description: 'Invalid or missing token.' }
    #swagger.responses[403] = { description: 'User must be ADMIN.' }
    #swagger.responses[404] = { description: 'User not found.' }
  */
  authenticateToken,
  authorizeRole("ADMIN"),
  usersController.deleteUser
);

// Endpoint to verify jwt tokens at /auth/verify, used in nginx auth_request
router.get("/auth/verify",
  /*
    #swagger.tags = ['Auth']
    #swagger.description = 'Verify JWT token validity.'
    #swagger.security = [{ BearerAuth: [] }]

    #swagger.responses[200] = { description: 'Token is valid.' }
    #swagger.responses[401] = { description: 'Missing or invalid token.' }
  */
  authenticateToken,
  (req, res) => {
    res.status(200).json({ message: "Token is valid." });
  }
);

module.exports = router;
