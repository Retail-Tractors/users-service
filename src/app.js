const express = require("express");
const app = express();
app.use(express.json());
const logger = require("./utils/logger.js");
const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("../swagger-output.json");
const { errorHandler } = require("./middlewares/error-handler");

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));

app.use("/.well-known/jwks.json", require("./routes/jwks.routes"));

app.use("/users", require("./routes/users.routes"));

app.use((req, res, next) => {
  logger.warn(`404 Not Found: ${req.originalUrl}`);
  const err = new Error("Endpoint not found....");
  err.statusCode = 404;
  next(err);
});

app.use(errorHandler);
module.exports = app;
