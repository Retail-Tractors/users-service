const swaggerAutoGen = require("swagger-autogen")();

const doc = {
  info: {
    version: "1.0.0",
    title: "Retail Tractors users-service API",
    description: "API documentation for the Retail Tractors users-service.",
  },

  host: "localhost:3003",
  basePath: "/users",
  schemes: ["http"],
  consumes: ["application/json"],
  produces: ["application/json"],

  securityDefinitions: {
    BearerAuth: {
      type: "apiKey",
      name: "Authorization",
      in: "header",
      description: "Insert token as: Bearer <token>",
    },
  },

  tags: [
    {
      name: "Users",
      description: "Operations related to user management",
    },
    {
      name: "Auth",
      description: "Authentication & password recovery endpoints",
    },
  ],

  definitions: {
    User: {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      role: "USER",
    },

    CreateUserRequest: {
      name: "John Doe",
      email: "john@example.com",
      password: "1234",
    },

    LoginRequest: {
      email: "john@example.com",
      password: "1234",
    },

    LoginResponse: {
      token: "jwt.token.here",
    },

    ForgotPasswordRequest: {
      email: "john@example.com",
    },

    ResetPasswordRequest: {
      email: "john@example.com",
      token: "reset-token-here",
      newPassword: "1234",
    },

    UpdateUserRequest: {
      name: "Updated Name",
      email: "updated@example.com",
    },

    ChangeRoleRequest: {
      role: "ADMIN",
    },

    ErrorResponse: {
      error: "Something went wrong",
    },
  },
};

const outputFile = "./swagger-output.json";
const endpointsFiles = ["./src/routes/users.routes.js"];

swaggerAutoGen(outputFile, endpointsFiles, doc);