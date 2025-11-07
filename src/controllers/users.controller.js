const prisma = require("../config/db"); // Import prisma instance
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendMail } = require("../services/mail-sender");
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRATION = process.env.JWT_EXPIRATION;
const JWT_RESET_SECRET = process.env.JWT_RESET_SECRET;
const JWT_RESET_SECRET_EXPIRATION = process.env.JWT_RESET_SECRET_EXPIRATION;

async function encryptPassword(password) {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
}

async function listUser(req, res, next) {
  try {
    const users = await prisma.user.findMany();
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
    return res.status(200).json({ data: user });
  } catch (error) {
    next(error);
  }
}

async function addUser(req, res, next) {
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
    const user = await prisma.user.create({
      data: {
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        role: "USER",
      },
    });

    return res.status(201).json({ data: user });
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
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 404;
      throw err;
    }
    // At least one updatable field required
    if (!updatedData.name && !updatedData.email) {
      const err = new Error("At least one field (name or email) must be provided");
      err.statusCode = 400;
      throw err;
    }
    // Email uniqueness check and format
    if (updatedData.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: updatedData.email },
      });
      if (emailExists && emailExists.id !== userId) {
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
    const user = await prisma.user.findUnique({ where: { id: userId } });
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
    return res.status(200).json({ data: updatedUser });
  } catch (error) {
    next(error);
  }
}

async function deleteUser(req, res, next) {
  try {
    const userId = parseInt(req.params.id, 10);

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 404;
      throw err;
    }

    await prisma.user.delete({ where: { id: userId } });
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      const err = new Error("Email and password are required");
      err.statusCode = 400;
      throw err;
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      const err = new Error("Invalid email or password");
      err.statusCode = 401;
      throw err;
    }
    const token = jwt.sign({
     id: user.id,
     email: user.email,
     }, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
     res.json({ token });
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

    const resetToken = jwt.sign(
      { id: user.id, email: user.email },
      JWT_RESET_SECRET,
      { expiresIn: JWT_RESET_SECRET_EXPIRATION }
    );

    const expirationMinutes = new Date(Date.now() + JWT_RESET_SECRET_EXPIRATION * 60 * 1000);

    // add token to user record
    await prisma.user.update({
      where: { email },
      data: { resetToken: resetToken, resetTokenExpiration: expirationMinutes },
    });

    console.log(`Password reset email sent to ${user.email}`);

    await sendMail({
      to: user.email.trim(),
      subject: "Reset your Retail Tractors password",
      html: 
      `
        <body style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
          <p>Hello <strong>${user.name}</strong>,</p>

          <p>You requested a password reset for your <strong>Retail Tractors</strong> account.</p>

          <p>Since this project doesn’t have a web frontend, you’ll need to use the API to reset your password manually.</p>

          <p>Here’s your reset token (valid for ${JWT_RESET_SECRET_EXPIRATION} minutes):</p>
          <p style="background-color: #f2f2f2; padding: 10px; display: inline-block; font-family: monospace;">${resetToken}</p>

          <p>To reset your password, make a POST request to:</p>
          <pre style="background-color: #f8f8f8; padding: 10px; border-left: 4px solid #ccc;">
            POST /users/reset-password
            Content-Type: application/json

            {
              "email": "${user.email}",
              "token": "${resetToken}",
              "newPassword": "[Your New Password]"
            }

          </pre>

          <p>If you did not request a password reset, you can safely ignore this email.</p>
          <p>Best regards,<br/>
          <strong>Retail Tractors Team</strong></p>
        </body>
      `
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
    if (!user || user.resetToken !== token || user.resetTokenExpiration.getTime() < Date.now()) {
      const err = new Error("Invalid or expired reset token");
      err.statusCode = 400;
      throw err;
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword, resetToken: null, resetTokenExpiration: null },
    });

    sendMail({
      to: user.email,
      subject: "Your Retail Tractors password has been reset",
      html: 
      `
        <body style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
          <p>Hello <strong>${user.name}</strong>,</p>

          <p>Your password has been successfully reset.</p>

          <p>If you did not request this change, please contact support immediately.</p>

          <p>Best regards,<br/>
          <strong>Retail Tractors Team</strong></p>
        </body>
      `
    });

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    next(error);
  }
}

module.exports = { addUser, editUser, deleteUser, listUser, getUser, login, changeUserRole, forgotPassword, resetPassword };