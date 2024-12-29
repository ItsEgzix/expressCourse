import express from "express";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const userRouter = express.Router();
userRouter.use(express.json()); // Correct middleware for parsing JSON bodies
const prisma = new PrismaClient();

userRouter.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const trimmedEmail = email.trim();

    // Check if the user already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email: trimmedEmail,
      },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists with this email: try login",
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    await prisma.user.create({
      data: {
        email: trimmedEmail,
        password: hashedPassword,
      },
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
    });
  } catch (error) {
    console.error("Error during user registration:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred during registration. Please try again later.",
    });
  }
});

//login
userRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const trimmedEmail = email.trim();

    const user = await prisma.user.findUnique({
      where: {
        email: trimmedEmail,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
      },
      process.env.SECRET,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token: token,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

//validation
userRouter.get("/auth", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "Token is not provided",
    });
  }

  const token = authHeader.split(" ")[1];

  const { id } = jwt.verify(token, process.env.SECRET);

  const user = await prisma.user.findUnique({
    where: { id: id },
  });

  delete user.password;

  res.send({
    success: true,
    message: "User authenticated successfully",
    user,
  });
});

export default userRouter;
