const env = require("dotenv");
env.config({ path: "./.env" });
const app = require("./src/app.js");
const logger = require("./src/utils/logger.js");

const PORT = process.env.PORT;

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});
