"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteService = exports.getServiceById = exports.getService = exports.updateService = exports.createService = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const zod_1 = require("zod");
const serviceSchema_1 = require("../schemas/serviceSchema");
const createService = async (req, res) => {
    try {
        const resultId = serviceSchema_1.validateId.safeParse(req.user);
        const result = serviceSchema_1.createServiceSchema.safeParse(req.body);
        if (!resultId.success) {
            return res.status(400).json({ error: "Invalid Id" });
        }
        if (!result.success) {
            return res.status(400).json({
                error: "Invalid input",
                details: zod_1.z.treeifyError(result.error),
            });
        }
        const { id } = resultId.data;
        const { name, description, durationMinutes, price } = result.data;
        const data = await prisma_1.default.service.create({
            data: {
                name,
                description,
                durationMinutes,
                price,
            },
        });
        await prisma_1.default.professionalService.create({
            data: {
                professionalId: id,
                serviceId: data.id,
            },
        });
        return res.status(201).json(data);
    }
    catch {
        return res.status(500).json({ error: "Failed to create service" });
    }
};
exports.createService = createService;
const updateService = async (req, res) => {
    try {
        const resultParams = serviceSchema_1.validateId.safeParse(req.params);
        const resultProfessionalId = serviceSchema_1.validateId.safeParse(req.user);
        const resultBody = serviceSchema_1.updateServiceSchema.safeParse(req.body);
        if (!resultProfessionalId.success) {
            return res.status(400).json({ error: "Invalid Id" });
        }
        if (!resultParams.success) {
            return res.status(400).json({ error: "Invalid Id" });
        }
        if (!resultBody.success) {
            return res.status(400).json({
                error: "Invalid Input",
                details: zod_1.z.treeifyError(resultBody.error),
            });
        }
        const { id: serviceId } = resultParams.data;
        const { id: professionalId } = resultProfessionalId.data;
        const professionalService = await prisma_1.default.professionalService.findUnique({
            where: {
                serviceId_professionalId: {
                    serviceId,
                    professionalId,
                },
            },
        });
        if (!professionalService) {
            return res
                .status(401)
                .json({ error: "Unauthorized to update this service" });
        }
        const { name, description, durationMinutes, price } = resultBody.data;
        const data = await prisma_1.default.service.update({
            where: {
                id: serviceId,
            },
            data: {
                name,
                description,
                durationMinutes,
                price,
            },
        });
        return res.status(200).json(data);
    }
    catch (err) {
        if (err.code === "P2025") {
            return res.status(404).json({ error: "User not found" });
        }
        return res.status(500).json({ error: "Failed to update service" });
    }
};
exports.updateService = updateService;
const getService = async (req, res) => {
    try {
        const data = await prisma_1.default.service.findMany({
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
        });
        return res.status(200).json(data);
    }
    catch {
        return res.status(500).json({ error: "Failed to fetch services" });
    }
};
exports.getService = getService;
const getServiceById = async (req, res) => {
    try {
        const result = serviceSchema_1.validateId.safeParse(req.params);
        if (!result.success) {
            return res.status(400).json({
                error: "Invalid id",
            });
        }
        const { id } = result.data;
        const data = await prisma_1.default.service.findUnique({
            where: {
                id,
            },
            include: {
                professionalServices: {
                    include: {
                        professional: true,
                    },
                },
            },
        });
        return res.status(200).json(data);
    }
    catch {
        return res.status(500).json({ error: "Failed to fetch service" });
    }
};
exports.getServiceById = getServiceById;
const deleteService = async (req, res) => {
    try {
        const result = serviceSchema_1.validateId.safeParse(req.params);
        const resultProfessionalId = serviceSchema_1.validateId.safeParse(req.user);
        if (!resultProfessionalId.success) {
            return res.status(400).json({ error: "Invalid Id" });
        }
        if (!result.success) {
            return res.status(400).json({ error: "Invalid Id" });
        }
        const { id: professionalId } = resultProfessionalId.data;
        const { id: serviceId } = result.data;
        const professionalService = await prisma_1.default.professionalService.findUnique({
            where: {
                serviceId_professionalId: {
                    professionalId,
                    serviceId,
                },
            },
        });
        if (!professionalService) {
            return res.status(403).json({ error: "Unauthorized to delete service" });
        }
        const service = await prisma_1.default.professionalService.delete({
            where: {
                serviceId_professionalId: { professionalId, serviceId },
            },
        });
        return res
            .status(200)
            .json({ message: "Service deleted successfully", service });
    }
    catch (err) {
        if (err.code === "P2025") {
            return res.status(404).json({ message: "Service not found" });
        }
        return res.status(500).json({ message: "Error trying to delete service" });
    }
};
exports.deleteService = deleteService;
