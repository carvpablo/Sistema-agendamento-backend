"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfessionalServices = exports.getProfessionalAppointments = exports.createServiceProfessional = exports.deleteAvailability = exports.getProfessionalAvailableSlots = exports.getProfessionalAvailability = exports.createAvailability = exports.deleteProfessional = exports.getProfessionalById = exports.updateProfessional = exports.createProfessional = void 0;
const zod_1 = require("zod");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const userSchema_1 = require("../schemas/userSchema");
const professionalSchema_1 = require("../schemas/professionalSchema");
const createProfessional = async (req, res) => {
    try {
        const result = professionalSchema_1.createProfessionalSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(404).json({
                error: "Invalid user input",
                details: zod_1.z.treeifyError(result.error),
            });
        }
        const { name, email, password } = result.data;
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const data = await prisma_1.default.professional.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        });
        return res.status(201).json(data);
    }
    catch (err) {
        return res.status(500).json({ error: "Error creating professional" });
    }
};
exports.createProfessional = createProfessional;
const updateProfessional = async (req, res) => {
    try {
        const resultParams = userSchema_1.ValidIdSchema.safeParse(req.params);
        const resultBody = userSchema_1.UpdateUserSchema.safeParse(req.body);
        if (!resultParams.success) {
            return res.status(400).json({ error: "Invalid Id" });
        }
        if (!resultBody.success) {
            return res.status(400).json({
                error: "Invalid input",
                details: zod_1.z.treeifyError(resultBody.error),
            });
        }
        const { id } = resultParams.data;
        const { name, email } = resultBody.data;
        const data = await prisma_1.default.professional.update({
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
exports.updateProfessional = updateProfessional;
const getProfessionalById = async (req, res) => {
    try {
        const result = userSchema_1.ValidIdSchema.safeParse(req.params);
        if (!result.success) {
            return res.status(400).json({ error: "Invalid Id" });
        }
        const { id } = result.data;
        const data = await prisma_1.default.professional.findUnique({
            where: {
                id,
            },
        });
        if (!data) {
            return res.status(404).json({ error: "No professional found" });
        }
        return res.status(200).json(data);
    }
    catch (err) {
        return res.status(500).json({ error: "Failed to fetch data" });
    }
};
exports.getProfessionalById = getProfessionalById;
const deleteProfessional = async (req, res) => {
    try {
        const result = userSchema_1.ValidIdSchema.safeParse(req.params);
        if (!result.success) {
            return res.status(400).json({ error: "Invalid Id" });
        }
        const { id } = result.data;
        const data = await prisma_1.default.professional.delete({
            where: {
                id,
            },
        });
        return res
            .status(200)
            .json({ message: "Professional deleted sucessfully", data });
    }
    catch (err) {
        if (err.code === "P2025") {
            return res.status(404).json({ message: "Professional not found" });
        }
        return res.status(500).json({ error: "Failed to delete professional" });
    }
};
exports.deleteProfessional = deleteProfessional;
const createAvailability = async (req, res) => {
    try {
        const resultUser = userSchema_1.ValidIdSchema.safeParse(req.user);
        const resultBody = professionalSchema_1.AvailabilitySchema.safeParse(req.body);
        if (!resultUser.success) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        if (!resultBody.success) {
            return res.status(400).json({
                error: resultBody.error.issues[0]?.message || "Invalid input",
            });
        }
        const { id } = resultUser.data;
        const { startAt, endAt } = resultBody.data;
        const data = await prisma_1.default.availability.create({
            data: {
                professionalId: id,
                startAt,
                endAt,
            },
        });
        return res.status(201).json(data);
    }
    catch (err) {
        return res.status(500).json({ error: "Failed to create availability" });
    }
};
exports.createAvailability = createAvailability;
const getProfessionalAvailability = async (req, res) => {
    try {
        const result = userSchema_1.ValidIdSchema.safeParse(req.params);
        if (!result.success) {
            return res.status(400).json({ error: "Invalid Id" });
        }
        const { id } = result.data;
        const now = new Date();
        const availabilities = await prisma_1.default.availability.findMany({
            where: {
                professionalId: id,
                startAt: {
                    gt: now,
                },
            },
            orderBy: {
                startAt: "asc",
            },
        });
        return res.status(200).json(availabilities);
    }
    catch {
        return res.status(500).json({ error: "Failed to fetch availability" });
    }
};
exports.getProfessionalAvailability = getProfessionalAvailability;
const getProfessionalAvailableSlots = async (req, res) => {
    try {
        const resultParams = userSchema_1.ValidIdSchema.safeParse(req.params);
        const resultService = userSchema_1.ValidIdSchema.safeParse({ id: req.query.serviceId });
        if (!resultParams.success || !resultService.success) {
            return res
                .status(400)
                .json({ error: "Invalid professionalId or serviceId" });
        }
        const { id: professionalId } = resultParams.data;
        const { id: serviceId } = resultService.data;
        const service = await prisma_1.default.service.findUnique({
            where: { id: serviceId },
        });
        if (!service) {
            return res.status(404).json({ error: "Service not found" });
        }
        const availabilities = await prisma_1.default.availability.findMany({
            where: { professionalId },
            orderBy: { startAt: "asc" },
        });
        const scheduledAppointments = await prisma_1.default.appointment.findMany({
            where: {
                professionalId,
                status: "SCHEDULED",
            },
            select: {
                startAt: true,
                endAt: true,
            },
        });
        const durationMs = service.durationMinutes * 60 * 1000;
        const slotsMap = new Map();
        for (const availability of availabilities) {
            let cursor = availability.startAt.getTime();
            const windowEnd = availability.endAt.getTime();
            while (cursor + durationMs <= windowEnd) {
                const slotStart = new Date(cursor);
                const slotEnd = new Date(cursor + durationMs);
                const hasCollision = scheduledAppointments.some((appt) => appt.startAt < slotEnd && appt.endAt > slotStart);
                if (!hasCollision) {
                    const isoStart = slotStart.toISOString();
                    slotsMap.set(isoStart, {
                        startAt: isoStart,
                        endAt: slotEnd.toISOString(),
                    });
                }
                cursor += durationMs;
            }
        }
        const slots = Array.from(slotsMap.values()).sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
        return res.status(200).json(slots);
    }
    catch {
        return res
            .status(500)
            .json({ error: "Failed to calculate available slots" });
    }
};
exports.getProfessionalAvailableSlots = getProfessionalAvailableSlots;
const deleteAvailability = async (req, res) => {
    try {
        const resultParams = userSchema_1.ValidIdSchema.safeParse(req.params);
        const resultUser = userSchema_1.ValidIdSchema.safeParse(req.user);
        if (!resultUser.success) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        if (!resultParams.success) {
            return res.status(400).json({ error: "Invalid Id" });
        }
        const { id: availabilityId } = resultParams.data;
        const { id: professionalId } = resultUser.data;
        const availability = await prisma_1.default.availability.findUnique({
            where: { id: availabilityId },
        });
        if (!availability) {
            return res.status(404).json({ error: "Availability not found" });
        }
        if (availability.professionalId !== professionalId) {
            return res.status(403).json({
                error: "Forbidden: You are not authorized to delete this availability",
            });
        }
        await prisma_1.default.availability.delete({
            where: { id: availabilityId },
        });
        return res
            .status(200)
            .json({ message: "Availability deleted successfully" });
    }
    catch {
        return res.status(500).json({ error: "Failed to delete availability" });
    }
};
exports.deleteAvailability = deleteAvailability;
const createServiceProfessional = async (req, res) => {
    try {
        const resultParams = userSchema_1.ValidIdSchema.safeParse(req.params);
        const result = professionalSchema_1.createServiceProfessionalSchema.safeParse(req.body);
        if (!resultParams.success) {
            return res.status(400).json({
                error: "Invalid Id",
            });
        }
        if (!result.success) {
            return res.status(400).json({
                error: "Invalid input",
                details: zod_1.z.treeifyError(result.error),
            });
        }
        const { id } = resultParams.data;
        const { serviceId } = result.data;
        const data = await prisma_1.default.professionalService.create({
            data: {
                professionalId: id,
                serviceId,
            },
        });
        return res.status(201).json(data);
    }
    catch (err) {
        return res
            .status(500)
            .json({ error: "Failed to create a linked service to a professional" });
    }
};
exports.createServiceProfessional = createServiceProfessional;
const getProfessionalAppointments = async (req, res) => {
    try {
        const result = userSchema_1.ValidIdSchema.safeParse(req.params);
        if (!result.success) {
            return res.status(400).json({ error: "Invalid Id" });
        }
        const { id } = result.data;
        const appointment = await prisma_1.default.appointment.findMany({
            where: {
                professionalId: id,
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
        return res.status(200).json(appointment);
    }
    catch {
        return res.status(500).json({ error: "Failed to fetch appointments" });
    }
};
exports.getProfessionalAppointments = getProfessionalAppointments;
const getProfessionalServices = async (req, res) => {
    try {
        const result = userSchema_1.ValidIdSchema.safeParse(req.params);
        if (!result.success) {
            return res.status(400).json({ error: "Invalid Id" });
        }
        const { id } = result.data;
        const professional = await prisma_1.default.professional.findUnique({
            where: { id },
        });
        if (!professional) {
            return res.status(404).json({ error: "Professional not found" });
        }
        const professionalServices = await prisma_1.default.professionalService.findMany({
            where: { professionalId: id },
            include: {
                service: {
                    include: {
                        professionalServices: {
                            include: {
                                professional: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        const services = professionalServices.map((item) => item.service);
        return res.status(200).json(services);
    }
    catch {
        return res
            .status(500)
            .json({ error: "Failed to fetch professional services" });
    }
};
exports.getProfessionalServices = getProfessionalServices;
