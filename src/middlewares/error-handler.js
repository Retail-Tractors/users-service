const { Prisma } = require("@prisma/client");
const logger = require("../utils/logger");

function errorHandler(err, req, res, next) {
    logger.error(err);
    // error thrown by express.json() middleware when the request body is not valid JSON
    if (err.type === "entity.parse.failed")
      return res.status(400).json({
        error: "Invalid JSON payload! Check if your body data is a valid JSON.",
      });
      
    // Handle Prisma errors  
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      switch (err.code) {
        case "P2002":
          return res.status(409).json({
            error: `Unique constraint failed on the field: ${err.meta.target}`,
          });
        // Add more Prisma error codes as needed
        default:
          return res.status(500).json({ error: "A database error occurred.", details: err.message });
      }
    }
  
    const statusCode = err.statusCode || 500;
    const errorMessage = err.error || err.message || "Internal Server Error";
    return res.status(statusCode).json({ error: errorMessage });
}

module.exports = { errorHandler };