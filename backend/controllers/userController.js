const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");


// ======================================================
// CREATE USER
// ======================================================

const createUser = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required"
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      email: email.toLowerCase().trim()
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists"
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: role || "sales",
      phone: phone?.trim() || ""
    });

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error("Create user error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};


// ======================================================
// PUBLIC SIGNUP
// ======================================================

const signupUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required"
      });
    }

    // Password validation
    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters"
      });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check existing user
    const existingUser = await User.findOne({
      email: normalizedEmail
    });

    if (existingUser) {
      return res.status(400).json({
        message: "An account with this email already exists"
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    /*
      Public signup se user hamesha "sales" role mein create hoga.

      User request se admin/manager role nahi le sakta.
    */
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "sales",
      phone: phone?.trim() || ""
    });

    res.status(201).json({
      message: "Account created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error("Signup error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};


// ======================================================
// LOGIN USER
// ======================================================

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    // Find user
    const user = await User.findOne({
      email: email.toLowerCase().trim()
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    // Check active status
    if (!user.isActive) {
      return res.status(403).json({
        message:
          "Your account is inactive. Please contact administrator."
      });
    }

    // Compare password
    const isPasswordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordMatch) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d"
      }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};


// ======================================================
// FORGOT PASSWORD
// ======================================================

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email || !email.trim()) {
      return res.status(400).json({
        message: "Email is required"
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user
    const user = await User.findOne({
      email: normalizedEmail
    });

    /*
      Security:
      User exists ya nahi, dono cases mein same response.
    */

    if (!user) {
      return res.status(200).json({
        message:
          "If an account with this email exists, a password reset link has been generated."
      });
    }

    // Generate random token
    const resetToken = crypto
      .randomBytes(32)
      .toString("hex");

    // Hash token before storing in DB
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Save hashed token
    user.resetPasswordToken = hashedToken;

    // Token valid for 15 minutes
    user.resetPasswordExpires =
      Date.now() + 15 * 60 * 1000;

    await user.save();

    /*
      DEVELOPMENT ONLY

      Production mein ye URL email ke through
      user ko bheja jayega.
    */

    const resetUrl =
      `http://localhost:5173/reset-password/${resetToken}`;

    res.status(200).json({
      message:
        "If an account with this email exists, a password reset link has been generated.",

      // Development testing only
      resetUrl
    });

  } catch (error) {
    console.error("Forgot password error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};


// ======================================================
// RESET PASSWORD
// ======================================================

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Validate token
    if (!token) {
      return res.status(400).json({
        message: "Reset token is required"
      });
    }

    // Validate password
    if (!password) {
      return res.status(400).json({
        message: "Password is required"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters"
      });
    }

    // Hash received token
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: {
        $gt: Date.now()
      }
    });

    // Invalid / expired token
    if (!user) {
      return res.status(400).json({
        message: "Reset token is invalid or has expired"
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    // Update password
    user.password = hashedPassword;

    // Remove reset token
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    res.status(200).json({
      message:
        "Password reset successful. You can now login with your new password."
    });

  } catch (error) {
    console.error("Reset password error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};


// ======================================================
// GET ALL USERS
// ======================================================

const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Users fetched successfully",
      count: users.length,
      users
    });

  } catch (error) {
    console.error("Get users error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};


// ======================================================
// GET SINGLE USER
// ======================================================

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    res.status(200).json({
      message: "User fetched successfully",
      user
    });

  } catch (error) {
    console.error("Get user error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};


// ======================================================
// UPDATE USER
// ======================================================

const updateUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      phone
    } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    // Update name
    if (name !== undefined) {
      user.name = name.trim();
    }

    // Update phone
    if (phone !== undefined) {
      user.phone = phone.trim();
    }

    // Update role
    if (role !== undefined) {
      user.role = role;
    }

    // Update email
    if (email !== undefined) {
      const normalizedEmail =
        email.toLowerCase().trim();

      const existingUser = await User.findOne({
        email: normalizedEmail,
        _id: {
          $ne: req.params.id
        }
      });

      if (existingUser) {
        return res.status(400).json({
          message: "Email already in use"
        });
      }

      user.email = normalizedEmail;
    }

    // Update password
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({
          message:
            "Password must be at least 6 characters"
        });
      }

      user.password = await bcrypt.hash(
        password,
        10
      );
    }

    await user.save();

    res.status(200).json({
      message: "User updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        isActive: user.isActive,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error("Update user error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};


// ======================================================
// ACTIVATE / DEACTIVATE USER
// ======================================================

const updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        message: "isActive must be true or false"
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    // Prevent admin from deactivating himself
    if (
      req.user.id === user._id.toString() &&
      isActive === false
    ) {
      return res.status(400).json({
        message:
          "You cannot deactivate your own account"
      });
    }

    user.isActive = isActive;

    await user.save();

    res.status(200).json({
      message: isActive
        ? "User activated successfully"
        : "User deactivated successfully",

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });

  } catch (error) {
    console.error("Update user status error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};


// ======================================================
// DELETE USER
// ======================================================

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    // Prevent admin from deleting himself
    if (
      req.user.id === user._id.toString()
    ) {
      return res.status(400).json({
        message:
          "You cannot delete your own account"
      });
    }

    await User.findByIdAndDelete(
      req.params.id
    );

    res.status(200).json({
      message: "User deleted successfully"
    });

  } catch (error) {
    console.error("Delete user error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};


// ======================================================
// EXPORTS
// ======================================================

module.exports = {
  createUser,
  signupUser,
  loginUser,
  forgotPassword,
  resetPassword,
  getUsers,
  getUserById,
  updateUser,
  updateUserStatus,
  deleteUser
};