const pino = require("pino");
const logger = pino({
  transport: {
    target: "pino-pretty",
    options: { colorize: true },
  },
});
logger.info("Logger initialized");
module.exports = logger;