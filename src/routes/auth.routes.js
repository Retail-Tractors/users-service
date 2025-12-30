const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");

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

module.exports = router;