"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserAppointments = exports.getAppointmentById = exports.cancelAppointment = exports.updateAppointmentStatus = exports.createAppointment = void 0;
const appointmentSchema_1 = require("../schemas/appointmentSchema");
const prisma_1 = __importDefault(require("../lib/prisma"));
const createAppointment = async (req, res) => {
    try {
        const result = appointmentSchema_1.createAppointmentSchema.safeParse(req.body);
        const resultUser = appointmentSchema_1.validateId.safeParse(req.user);
        if (!resultUser.success) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        if (!result.success) {
            return res.status(400).json({ error: "Invalid input" });
        }
        const { serviceId, professionalId, clientId, startAt } = result.data;
        const { id: authenticatedUserId } = resultUser.data;
        // Garante que o usuário autenticado só crie agendamento para si mesmo
        if (clientId !== authenticatedUserId) {
            return res
                .status(403)
                .json({ error: "Unauthorized to create appointment for another user" });
        }
        const professional = await prisma_1.default.professional.findUnique({
            where: {
                id: professionalId,
            },
        });
        //Check if professional exists
        if (!professional)
            return res.status(404).json({ error: "Professional not found" });
        //Check if client exists
        const professionalProvidesService = await prisma_1.default.professionalService.findUnique({
            where: {
                serviceId_professionalId: {
                    serviceId,
                    professionalId,
                },
            },
        });
        if (!professionalProvidesService) {
            return res
                .status(400)
                .json({ error: "This professional does not offer this service" });
        }
        const client = await prisma_1.default.client.findUnique({
            where: {
                id: clientId,
            },
        });
        if (!client)
            return res.status(404).json({ error: "Client not found" });
        //Check if service exists
        const service = await prisma_1.default.service.findUnique({
            where: {
                id: serviceId,
            },
        });
        if (!service)
            return res.status(404).json({ error: "Service not found" });
        const { durationMinutes, price } = service;
        const endAt = new Date(startAt.getTime() + durationMinutes * 60 * 1000);
        const availability = await prisma_1.default.availability.findMany({
            where: {
                professionalId,
            },
        });
        if (availability.length === 0) {
            return res.status(404).json({ error: "Availability not found" });
        }
        const appointmentIsValid = availability.some((a) => a?.startAt <= startAt && endAt <= a?.endAt);
        if (!appointmentIsValid) {
            return res.status(400).json({ error: "Invalid appointment hour" });
        }
        const checkTimeCollision = await prisma_1.default.appointment.findFirst({
            where: {
                professionalId,
                status: "SCHEDULED",
                startAt: { lt: endAt },
                endAt: { gt: startAt },
            },
        });
        if (checkTimeCollision) {
            return res.status(409).json({
                error: "Appointment time collides with an existing appointment",
            });
        }
        const data = await prisma_1.default.appointment.create({
            data: {
                clientId,
                professionalId,
                serviceId,
                servicePrice: price,
                startAt,
                endAt,
            },
        });
        return res.status(201).json(data);
    }
    catch {
        return res.status(500).json({ error: "Failed to create appointment" });
    }
};
exports.createAppointment = createAppointment;
const updateAppointmentStatus = async (req, res) => {
    try {
        const resultParams = appointmentSchema_1.validateId.safeParse(req.params);
        const resultBody = appointmentSchema_1.updateAppointmentSchema.safeParse(req.body);
        const resultProfessionalId = appointmentSchema_1.validateId.safeParse(req.user);
        if (!resultProfessionalId.success) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        if (!resultParams.success) {
            return res.status(400).json({ error: "Invalid Id " });
        }
        if (!resultBody.success) {
            return res.status(400).json({ error: "Invalid input" });
        }
        const { id } = resultParams.data;
        const { status } = resultBody.data;
        const { id: professionalId } = resultProfessionalId.data;
        const appointment = await prisma_1.default.appointment.findUnique({
            where: { id },
        });
        if (!appointment) {
            return res.status(404).json({ error: "Appointment not found" });
        }
        if (appointment.professionalId !== professionalId) {
            return res
                .status(403)
                .json({ error: "Unauthorized to update this appointment" });
        }
        if (status === "CANCELLED") {
            const now = new Date();
            const twentyFourHoursInMs = 24 * 60 * 60 * 1000;
            if (appointment.startAt.getTime() - now.getTime() <= twentyFourHoursInMs) {
                return res.status(400).json({
                    error: "Appointments can only be cancelled with more than 24 hours in advance",
                });
            }
        }
        const data = await prisma_1.default.appointment.update({
            where: {
                id,
            },
            data: {
                status,
            },
        });
        return res.status(200).json(data);
    }
    catch (err) {
        if (err.code === "P2025") {
            return res.status(404).json({ error: "Appointment not found" });
        }
        return res
            .status(500)
            .json({ error: "Failed to update appointment status" });
    }
};
exports.updateAppointmentStatus = updateAppointmentStatus;
const cancelAppointment = async (req, res) => {
    try {
        const resultParams = appointmentSchema_1.validateId.safeParse(req.params);
        const resultUser = appointmentSchema_1.validateId.safeParse(req.user);
        if (!resultUser.success) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        if (!resultParams.success) {
            return res.status(400).json({ error: "Invalid Id" });
        }
        const { id } = resultParams.data;
        const { id: userId } = resultUser.data;
        const appointment = await prisma_1.default.appointment.findUnique({
            where: { id },
        });
        if (!appointment) {
            return res.status(404).json({ error: "Appointment not found" });
        }
        if (appointment.clientId !== userId &&
            appointment.professionalId !== userId) {
            return res
                .status(403)
                .json({ error: "Unauthorized to cancel this appointment" });
        }
        if (appointment.status === "CANCELLED") {
            return res
                .status(400)
                .json({ error: "Appointment is already cancelled" });
        }
        if (appointment.status === "COMPLETED") {
            return res
                .status(400)
                .json({ error: "Cannot cancel a completed appointment" });
        }
        const now = new Date();
        const twentyFourHoursInMs = 24 * 60 * 60 * 1000;
        if (appointment.startAt.getTime() - now.getTime() <= twentyFourHoursInMs) {
            return res.status(400).json({
                error: "Appointments can only be cancelled with more than 24 hours in advance",
            });
        }
        const data = await prisma_1.default.appointment.update({
            where: { id },
            data: {
                status: "CANCELLED",
            },
        });
        return res.status(200).json(data);
    }
    catch {
        return res.status(500).json({ error: "Failed to cancel appointment" });
    }
};
exports.cancelAppointment = cancelAppointment;
const getAppointmentById = async (req, res) => {
    try {
        const result = appointmentSchema_1.validateId.safeParse(req.params);
        const resultUserId = appointmentSchema_1.validateId.safeParse(req.user);
        if (!resultUserId.success) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        if (!result.success) {
            return res.status(400).json({ error: "Invalid Id" });
        }
        const { id } = result.data;
        const { id: userId } = resultUserId.data;
        const appointment = await prisma_1.default.appointment.findUnique({
            where: {
                id,
            },
        });
        if (!appointment) {
            return res.status(404).json({ error: "Appointment not found" });
        }
        // Verifica se o agendamento pertence ao cliente ou ao profissional logado
        if (appointment.clientId !== userId &&
            appointment.professionalId !== userId) {
            return res
                .status(403)
                .json({ error: "Unauthorized to access this appointment" });
        }
        return res.status(200).json(appointment);
    }
    catch {
        return res.status(500).json({ error: "Failed to fetch appointment" });
    }
};
exports.getAppointmentById = getAppointmentById;
const getUserAppointments = async (req, res) => {
    try {
        const resultUserId = appointmentSchema_1.validateId.safeParse(req.user);
        if (!resultUserId.success) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const { id: userId } = resultUserId.data;
        const appointments = await prisma_1.default.appointment.findMany({
            where: {
                OR: [{ clientId: userId }, { professionalId: userId }],
            },
        });
        return res.status(200).json(appointments);
    }
    catch {
        return res.status(500).json({ error: "Failed to fetch appointments" });
    }
};
exports.getUserAppointments = getUserAppointments;
