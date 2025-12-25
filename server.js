const env = require("dotenv");
const envFile = process.env.NODE_ENV === "dev" ? ".env.dev" : ".env";
env.config({ path: envFile, override: true });

const app = require("./src/app.js");
const logger = require("./src/utils/logger.js");

const PORT = process.env.PORT;

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT} (env: ${process.env.NODE_ENV || 'default'})`);
});
