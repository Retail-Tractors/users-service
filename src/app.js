const express = require("express");
const app = express();
app.use(express.json());
// const swaggerUi = require("swagger-ui-express");
// const swaggerFile = require("./swagger-output.json");
const env = require("dotenv");
env.config({ path: "../.env" });
const { errorHandler } = require("./middlewares/error-handler");

app.use("/users", require("./routes/users.routes"));

app.use((req, res, next) => {
  const err = new Error("Endpoint not found....");
  err.statusCode = 404;
  next(err);
});

app.use(errorHandler);

app.listen(3003, () => console.log("Users service running on port 3003"));
// app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));
