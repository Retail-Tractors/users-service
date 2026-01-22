const prisma = require("../config/db"); // Import prisma instance
const bcrypt = require("bcrypt");
const jose = require("jose");
const { getJwtKeyMaterial } = require("../utils/jwt-keys");
const { publishEmailEvent } = require("../rabbitmq/publisher");

const JWT_EXPIRATION = process.env.JWT_EXPIRATION;
const JWT_RESET_SECRET = process.env.JWT_RESET_SECRET;
const JWT_RESET_SECRET_EXPIRATION = process.env.JWT_RESET_SECRET_EXPIRATION;

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      const err = new Error("Email and password are required");
      err.statusCode = 400;
      throw err;
    }
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, password: true },
    });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      const err = new Error("Invalid email or password");
      err.statusCode = 401;
      throw err;
    }

    const { privateKey, kid } = await getJwtKeyMaterial();

    const token = await new jose.SignJWT({
      email: user.email,
      name: user.name,
    })
      .setSubject(user.id.toString())
      .setProtectedHeader({ alg: "RS256", kid: `${kid}` })
      .setExpirationTime(JWT_EXPIRATION)
      .setIssuedAt()
      .setAudience("retail-tractors-users")
      .setIssuer("retail-tractors-users-service")
      .sign(privateKey);

    res.json({ token });
  } catch (error) {
    next(error);
  }
}

async function encryptPassword(password) {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
}

async function register(req, res, next) {
  try {
    const newUser = req.body;
    // Check required fields
    if (newUser.role) {
      const err = new Error("Role cannot be set during registration");
      err.statusCode = 400;
      throw err;
    }
    if (!newUser.name || !newUser.email) {
      const err = new Error("Name and email are required");
      err.statusCode = 400;
      throw err;
    }
    if (!newUser.password || newUser.password.length < 4) {
      const err = new Error("Password must be at least 4 characters long");
      err.statusCode = 400;
      throw err;
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(newUser.email)) {
      const err = new Error("Invalid email format");
      err.statusCode = 400;
      throw err;
    }
    // Encrypt password
    newUser.password = await encryptPassword(newUser.password);
    // Create user
    try {
      const user = await prisma.user.create({
        data: {
          name: newUser.name,
          email: newUser.email,
          password: newUser.password,
          role: "USER",
        },
      });
      return res.status(201).json({
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      if (error.code === "P2002") {
        const err = new Error("Email already exists");
        err.statusCode = 409;
        throw err;
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
}

async function forgotPassword(req, res, next) {
  try {
    let { email } = req.body;
    if (!email) {
      const err = new Error("Email is required");
      err.statusCode = 400;
      throw err;
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      const err = new Error("Invalid email format");
      err.statusCode = 400;
      throw err;
    }
    email = email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 404;
      throw err;
    }

    const resetToken = await new jose.SignJWT({
      id: user.id,
      email: user.email,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(`${JWT_RESET_SECRET_EXPIRATION}m`)
      .setIssuedAt()
      .setAudience("retail-tractors-users")
      .setIssuer("retail-tractors-users-service")
      .sign(new TextEncoder().encode(JWT_RESET_SECRET));

    const expirationMinutes = new Date(
      Date.now() + JWT_RESET_SECRET_EXPIRATION * 60 * 1000,
    );

    // add token to user record
    await prisma.user.update({
      where: { email },
      data: { resetToken: resetToken, resetTokenExpiration: expirationMinutes },
    });

    await publishEmailEvent({
      type: "USER_PASSWORD_RESET_REQUESTED",
      to: user.email,
      subject: "Reset your Retail Tractors password",
      message: `Your reset token is: ${resetToken}`,
    });

    res.status(200).json({ message: "Password reset email sent" });
  } catch (error) {
    next(error);
  }
}

async function resetPassword(req, res, next) {
  try {
    let { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword) {
      const err = new Error("Email, token, and new password are required");
      err.statusCode = 400;
      throw err;
    }
    email = email.toLowerCase();
    if (newPassword.length < 4) {
      const err = new Error("Password must be at least 4 characters long");
      err.statusCode = 400;
      throw err;
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (
      !user ||
      user.resetToken !== token ||
      user.resetTokenExpiration.getTime() < Date.now()
    ) {
      const err = new Error("Invalid or expired reset token");
      err.statusCode = 400;
      throw err;
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiration: null,
      },
    });

    await publishEmailEvent({
      type: "USER_PASSWORD_RESET_COMPLETED",
      to: user.email,
      subject: "Your Retail Tractors password has been reset",
      message: "Your password has been successfully reset.",
    });

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    next(error);
  }
}

module.exports = { register, login, forgotPassword, resetPassword };
