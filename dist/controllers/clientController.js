"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClientAppointments = exports.deleteUser = exports.updateUser = exports.getUserById = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const zod_1 = require("zod");
const userSchema_1 = require("../schemas/userSchema");
const getUserById = async (req, res) => {
    try {
        const result = userSchema_1.ValidIdSchema.safeParse(req.params);
        if (!result.success) {
            return res.status(404).json({ error: "Invalid Id" });
        }
        const { id } = result.data;
        const user = await prisma_1.default.client.findUnique({
            where: {
                id,
            },
        });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        return res.status(200).json(user);
    }
    catch (err) {
        return res.status(500).json({ error: "Failed to find user" });
    }
};
exports.getUserById = getUserById;
const updateUser = async (req, res) => {
    try {
        const resultParams = userSchema_1.ValidIdSchema.safeParse(req.params);
        const resultBody = userSchema_1.UpdateUserSchema.safeParse(req.body);
        if (!resultParams.success) {
            return res.status(400).json({ error: "Invalid Id" });
        }
        if (!resultBody.success) {
            return res.status(400).json({
                error: "Invalid Input",
                details: zod_1.z.treeifyError(resultBody.error),
            });
        }
        const { id } = resultParams.data;
        const { name, email } = resultBody.data;
        const data = await prisma_1.default.client.update({
            where: {
                id,
            },
            data: {
                name,
                email,
            },
        });
        return res.status(200).json(data);
    }
    catch (err) {
        if (err.code === "P2025") {
            return res.status(404).json({ message: "Client not found" });
        }
        return res.status(500).json({ error: "Failed to update user" });
    }
};
exports.updateUser = updateUser;
const deleteUser = async (req, res) => {
    try {
        const result = userSchema_1.ValidIdSchema.safeParse(req.params);
        if (!result.success) {
            return res.status(404).json({ error: "Invalid Id" });
        }
        const { id } = result.data;
        const user = await prisma_1.default.client.delete({
            where: {
                id,
            },
        });
        return res
            .status(200)
            .json({ message: "User deleted sucessfully", client: user });
    }
    catch (err) {
        if (err.code === "P2025") {
            return res
                .status(404)
                .json({ message: "Cliente não encontrado para deleção" });
        }
        return res.status(500).json({ message: "Erro interno do servidor" });
    }
};
exports.deleteUser = deleteUser;
const getClientAppointments = async (req, res) => {
    try {
        const result = userSchema_1.ValidIdSchema.safeParse(req.params);
        if (!result.success) {
            return res.status(400).json({ error: "Invalid Id" });
        }
        const { id } = result.data;
        const appointments = await prisma_1.default.appointment.findMany({
            where: {
                clientId: id,
            },
            orderBy: {
                startAt: "asc",
            },
            include: {
                professional: {
                    select: {
                        name: true,
                    },
                },
                client: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
                service: {
                    select: {
                        name: true,
                        durationMinutes: true,
                        price: true,
                    },
                },
            },
        });
        return res.status(200).json(appointments);
    }
    catch {
        return res.status(500).json({ error: "Failed to fetch appointments" });
    }
};
exports.getClientAppointments = getClientAppointments;
