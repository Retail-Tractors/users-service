const prisma = require("../config/db"); // Import prisma instance
const logger = require("../utils/logger");

async function listUser(req, res, next) {
  try {
    const users = await prisma.user.findMany({select: { id: true, name: true, email: true, role: true }});
    return res.status(200).json(users);
  } catch (error) {
    next(error);
  }
}

async function getUser(req, res, next) {
  try {
    const userId = parseInt(req.params.id, 10);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 404;
      throw err;
    }

    if (parseInt(req.user.sub) !== userId && req.user.role !== "ADMIN") {
        return res.status(403).json({ error: "Access forbidden: insufficient privileges." });
    }

    return res.status(200).json({ data: user });
  } catch (error) {
    next(error);
  }
}

async function editUser(req, res, next) {
  try {
    const userId = parseInt(req.params.id, 10);
    const updatedData = req.body;

    // Check if user is trying to change role
    if (updatedData.role) {
      const err = new Error("Role cannot be changed via this endpoint");
      err.statusCode = 400;
      throw err;
    }
    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true } });
    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 404;
      throw err;
    }

    if (parseInt(req.user.sub) !== userId && req.user.role !== "ADMIN") {
        return res.status(403).json({ error: "Access forbidden: insufficient privileges." });
    }

    // At least one updatable field required
    if (!updatedData.name && !updatedData.email) {
      const err = new Error("At least one field (name or email) must be provided");
      err.statusCode = 400;
      throw err;
    }
    // Email uniqueness check and format
    if (updatedData.email) {
      if ((updatedData.email==user.email) && emailExists.id !== userId) {
        const err = new Error("Email already exists");
        err.statusCode = 409;
        throw err;
      }
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(updatedData.email)) {
        const err = new Error("Invalid email format");
        err.statusCode = 400;
        throw err;
      }
    }

    // Prepare Prisma update data
    const prismaData = {};
    if (updatedData.name) prismaData.name = updatedData.name;
    if (updatedData.email) prismaData.email = updatedData.email;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: prismaData,
    });
    
    logger.info(`User updated: ${userId} by user: ${parseInt(req.user.sub)}`);
    return res.status(200).json({ data: updatedUser });
  } catch (error) {
    next(error);
  }
}

async function changeUserRole(req, res, next) {
  try {
    const userId = parseInt(req.params.id, 10);
    const { role } = req.body;
    if (!role) {
      const err = new Error("Role is required");
      err.statusCode = 400;
      throw err;
    }
    if (!["USER", "ADMIN"].includes(role.toUpperCase())) {
      const err = new Error("Invalid role, must be USER or ADMIN");
      err.statusCode = 400;
      throw err;
    }
    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 404;
      throw err;
    }
    // Update role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: role.toUpperCase() },
    });
    logger.info(`User role changed: ${userId} to ${role.toUpperCase()}\n by admin: ${parseInt(req.user.sub)}`);
    return res.status(200).json({ data: updatedUser });
  } catch (error) {
    next(error);
  }
}

async function deleteUser(req, res, next) {
  try {
    const userId = parseInt(req.params.id, 10);

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 404;
      throw err;
    }

    await prisma.user.delete({ where: { id: userId } });
    logger.info(`User deleted: ${userId} by admin: ${parseInt(req.user.sub)}`);
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
}

module.exports = { editUser, deleteUser, listUser, getUser, changeUserRole };