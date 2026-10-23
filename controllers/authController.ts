import { type Response, type Request } from "express";
import { createUserSchema, loginSchema } from "../schemas/authSchema";
import prisma from "../lib/prisma";
import generateToken from "../lib/jwt";
import bcrypt from "bcrypt";

export const signIn = async (req: Request, res: Response) => {
  try {
    const result = createUserSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({ error: "Invalid input" });
    }

    const { name, email, password } = result.data;

    const existingUser = await prisma.client.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ error: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.client.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    const token = generateToken(user.id);

    res.cookie("jwt_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 1000 * 60 * 60,
      path: "/",
    });

    return res.status(201).json({
      success: "User registered successfully",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch {
    return res.status(500).json({ error: "Failed to sign in user" });
  }
};

export const logIn = async (req: Request, res: Response) => {
  try {
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({ error: "Invalid input" });
    }

    const { email, password } = result.data;

    const user = await prisma.client.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const compareHash = await bcrypt.compare(password, user.password);

    if (!compareHash) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = generateToken(user.id);

    res.cookie("jwt_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 1000 * 60 * 60,
      path: "/",
    });

    return res.status(200).json({
      success: "User logged successfully",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch {
    return res.status(500).json({ error: "Failed to log in" });
  }
};

export const logOut = async (req: Request, res: Response) => {
  try {
    res.clearCookie("jwt_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    return res.status(200).json({ success: "User logged out successfully" });
  } catch {
    return res.status(500).json({ error: "Failed to log user out" });
  }
};

export const signInProfessional = async (req: Request, res: Response) => {
  try {
    const result = createUserSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({ error: "Invalid input" });
    }

    const { name, email, password } = result.data;

    const existingProfessional = await prisma.professional.findUnique({
      where: { email },
    });

    if (existingProfessional) {
      return res.status(409).json({ error: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const professional = await prisma.professional.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    const token = generateToken(professional.id);

    res.cookie("jwt_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 1000 * 60 * 60,
      path: "/",
    });

    return res.status(201).json({
      success: "Professional registered successfully",
      token,
      user: {
        id: professional.id,
        name: professional.name,
        email: professional.email,
      },
    });
  } catch {
    return res.status(500).json({ error: "Failed to sign in user" });
  }
};

export const logInProfessional = async (req: Request, res: Response) => {
  try {
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({ error: "Invalid input" });
    }

    const { email, password } = result.data;

    const professional = await prisma.professional.findUnique({
      where: {
        email,
      },
    });

    if (!professional) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const compareHash = await bcrypt.compare(password, professional.password);

    if (!compareHash) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = generateToken(professional.id);

    res.cookie("jwt_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 1000 * 60 * 60,
      path: "/",
    });

    return res.status(200).json({
      success: "User logged successfully",
      token,
      user: {
        id: professional.id,
        name: professional.name,
        email: professional.email,
      },
    });
  } catch {
    return res.status(500).json({ error: "Failed to log in" });
  }
};

export const logOutProfessional = async (req: Request, res: Response) => {
  try {
    res.clearCookie("jwt_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    return res
      .status(200)
      .json({ success: "Professional logged out successfully" });
  } catch {
    return res.status(500).json({ error: "Failed to log user out" });
  }
};
