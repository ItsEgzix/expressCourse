import express from "express";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

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

export default userRouter;
