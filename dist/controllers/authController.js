"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logOutProfessional = exports.logInProfessional = exports.signInProfessional = exports.logOut = exports.logIn = exports.signIn = void 0;
const authSchema_1 = require("../schemas/authSchema");
const prisma_1 = __importDefault(require("../lib/prisma"));
const jwt_1 = __importDefault(require("../lib/jwt"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const signIn = async (req, res) => {
    try {
        const result = authSchema_1.createUserSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({ error: "Invalid input" });
        }
        const { name, email, password } = result.data;
        const existingUser = await prisma_1.default.client.findUnique({
            where: { email },
        });
        if (existingUser) {
            return res.status(409).json({ error: "Email already in use" });
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const user = await prisma_1.default.client.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        });
        const token = (0, jwt_1.default)(user.id);
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
    }
    catch {
        return res.status(500).json({ error: "Failed to sign in user" });
    }
};
exports.signIn = signIn;
const logIn = async (req, res) => {
    try {
        const result = authSchema_1.loginSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({ error: "Invalid input" });
        }
        const { email, password } = result.data;
        const user = await prisma_1.default.client.findUnique({
            where: {
                email,
            },
        });
        if (!user) {
            return res.status(401).json({ error: "Invalid email or password" });
        }
        const compareHash = await bcrypt_1.default.compare(password, user.password);
        if (!compareHash) {
            return res.status(401).json({ error: "Invalid email or password" });
        }
        const token = (0, jwt_1.default)(user.id);
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
    }
    catch {
        return res.status(500).json({ error: "Failed to log in" });
    }
};
exports.logIn = logIn;
const logOut = async (req, res) => {
    try {
        res.clearCookie("jwt_token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
        });
        return res.status(200).json({ success: "User logged out successfully" });
    }
    catch {
        return res.status(500).json({ error: "Failed to log user out" });
    }
};
exports.logOut = logOut;
const signInProfessional = async (req, res) => {
    try {
        const result = authSchema_1.createUserSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({ error: "Invalid input" });
        }
        const { name, email, password } = result.data;
        const existingProfessional = await prisma_1.default.professional.findUnique({
            where: { email },
        });
        if (existingProfessional) {
            return res.status(409).json({ error: "Email already in use" });
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const professional = await prisma_1.default.professional.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        });
        const token = (0, jwt_1.default)(professional.id);
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
    }
    catch {
        return res.status(500).json({ error: "Failed to sign in user" });
    }
};
exports.signInProfessional = signInProfessional;
const logInProfessional = async (req, res) => {
    try {
        const result = authSchema_1.loginSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({ error: "Invalid input" });
        }
        const { email, password } = result.data;
        const professional = await prisma_1.default.professional.findUnique({
            where: {
                email,
            },
        });
        if (!professional) {
            return res.status(401).json({ error: "Invalid email or password" });
        }
        const compareHash = await bcrypt_1.default.compare(password, professional.password);
        if (!compareHash) {
            return res.status(401).json({ error: "Invalid email or password" });
        }
        const token = (0, jwt_1.default)(professional.id);
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
    }
    catch {
        return res.status(500).json({ error: "Failed to log in" });
    }
};
exports.logInProfessional = logInProfessional;
const logOutProfessional = async (req, res) => {
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
    }
    catch {
        return res.status(500).json({ error: "Failed to log user out" });
    }
};
exports.logOutProfessional = logOutProfessional;
