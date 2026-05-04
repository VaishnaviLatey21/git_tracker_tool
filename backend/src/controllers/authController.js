const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const sendOTPEmail = require("../utils/sendVerificationEmail");


const prisma = new PrismaClient();

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS);

// REGISTER (role-based)
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // 1. Validate role
    if (!["CONVENOR", "STUDENT"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // 2. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // 4. Generate 6-digit OTP & expiry
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 5. Create new user (unverified until OTP validation)
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        emailOTP: otp,
        otpExpiry: new Date(Date.now() + 10 * 60 * 1000), // 10 mins
      },
    });

    await sendOTPEmail(email, otp);
    res.status(201).json({
      message:
        "Registered successfully. Please verify OTP sent to your email within 10 minutes.",
    });
  } catch (error) {
    res.status(500).json({ message: "Registration failed. Email not sent." });
  }
};

// ADMIN REGISTER (separate route + secret key gate)
exports.adminRegister = async (req, res) => {
  try {
    const { name, email, password, adminKey } = req.body;

    if (!name || !email || !password || !adminKey) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!process.env.ADMIN_SIGNUP_KEY) {
      return res
        .status(500)
        .json({ message: "Admin signup is not configured on server" });
    }

    if (adminKey !== process.env.ADMIN_SIGNUP_KEY) {
      return res.status(403).json({ message: "Invalid admin signup key" });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "ADMIN",
        isVerified: true,
        emailOTP: null,
        otpExpiry: null,
      },
    });

    return res.status(201).json({
      message: "Admin account created successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res.status(401).json({
        message: "Please verify your email before logging in",
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN,
      }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    console.log("otp:", otp)
    console.log("email:", email)

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.emailOTP) {
      return res.status(400).json({ message: "Invalid request or User not found" });
    }

    if (user.emailOTP !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (new Date() > user.otpExpiry) {
      return res.status(400).json({ message: "OTP expired" });
    }

    await prisma.user.update({
      where: { email },
      data: {
        isVerified: true,
        emailOTP: null,
        otpExpiry: null,
      },
    });

    res.json({ message: "Email verified successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
