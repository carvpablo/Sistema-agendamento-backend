"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("../lib/prisma"));
const validateProfessional = async (req, res, next) => {
    try {
        if (!req.user) {
            return res
                .status(401)
                .json({ error: "Unauthorized: user not authenticated" });
        }
        const { id } = req.user;
        const professional = await prisma_1.default.professional.findFirst({
            where: {
                id,
            },
        });
        if (!professional) {
            return res
                .status(401)
                .json({ error: "Unauthorized: You must be a professional" });
        }
        return next();
    }
    catch {
        return res.status(500).json({ error: "Failed to validate professional" });
    }
};
exports.default = validateProfessional;
