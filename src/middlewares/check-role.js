const prisma = require("../config/db.js");
// Middleware to check if the user has the required role
function authorizeRole(role) {
  return async (req, res, next) => {
    try {
      const userId = parseInt(req.user.sub);
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });
      if (!user) {
        let error = new Error("User not found.");
        error.statusCode = 404;
        throw error;
      }
      const userRole = user.role.toUpperCase();
      const requiredRole = role.toUpperCase();
      if (userRole !== requiredRole) {
        let error = new Error("Access forbidden: insufficient privileges.");
        error.statusCode = 403;
        throw error;
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
module.exports = { authorizeRole };    
