import { type Request, type Response } from "express";
import {
  createAppointmentSchema,
  updateAppointmentSchema,
  validateId,
} from "../schemas/appointmentSchema";
import prisma from "../lib/prisma";

export const createAppointment = async (req: Request, res: Response) => {
  try {
    const result = createAppointmentSchema.safeParse(req.body);
    const resultUser = validateId.safeParse(req.user);

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

    const professional = await prisma.professional.findUnique({
      where: {
        id: professionalId,
      },
    });
    //Check if professional exists
    if (!professional)
      return res.status(404).json({ error: "Professional not found" });
    //Check if client exists

    const professionalProvidesService =
      await prisma.professionalService.findUnique({
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

    const client = await prisma.client.findUnique({
      where: {
        id: clientId,
      },
    });

    if (!client) return res.status(404).json({ error: "Client not found" });
    //Check if service exists
    const service = await prisma.service.findUnique({
      where: {
        id: serviceId,
      },
    });

    if (!service) return res.status(404).json({ error: "Service not found" });

    const { durationMinutes, price } = service;

    const endAt = new Date(startAt.getTime() + durationMinutes * 60 * 1000);

    const availability = await prisma.availability.findMany({
      where: {
        professionalId,
      },
    });

    if (availability.length === 0) {
      return res.status(404).json({ error: "Availability not found" });
    }

    const appointmentIsValid = availability.some(
      (a) => a?.startAt <= startAt && endAt <= a?.endAt,
    );

    if (!appointmentIsValid) {
      return res.status(400).json({ error: "Invalid appointment hour" });
    }

    const checkTimeCollision = await prisma.appointment.findFirst({
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

    const data = await prisma.appointment.create({
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
  } catch {
    return res.status(500).json({ error: "Failed to create appointment" });
  }
};

export const updateAppointmentStatus = async (req: Request, res: Response) => {
  try {
    const resultParams = validateId.safeParse(req.params);
    const resultBody = updateAppointmentSchema.safeParse(req.body);
    const resultProfessionalId = validateId.safeParse(req.user);

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

    const appointment = await prisma.appointment.findUnique({
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

    const data = await prisma.appointment.update({
      where: {
        id,
      },
      data: {
        status,
      },
    });

    return res.status(200).json(data);
  } catch (err: any) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Appointment not found" });
    }
    return res
      .status(500)
      .json({ error: "Failed to update appointment status" });
  }
};

export const getAppointmentById = async (req: Request, res: Response) => {
  try {
    const result = validateId.safeParse(req.params);
    const resultUserId = validateId.safeParse(req.user);

    if (!resultUserId.success) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!result.success) {
      return res.status(400).json({ error: "Invalid Id" });
    }

    const { id } = result.data;
    const { id: userId } = resultUserId.data;

    const appointment = await prisma.appointment.findUnique({
      where: {
        id,
      },
    });

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    // Verifica se o agendamento pertence ao cliente ou ao profissional logado
    if (
      appointment.clientId !== userId &&
      appointment.professionalId !== userId
    ) {
      return res
        .status(403)
        .json({ error: "Unauthorized to access this appointment" });
    }

    return res.status(200).json(appointment);
  } catch {
    return res.status(500).json({ error: "Failed to fetch appointment" });
  }
};

export const getUserAppointments = async (req: Request, res: Response) => {
  try {
    const resultUserId = validateId.safeParse(req.user);

    if (!resultUserId.success) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id: userId } = resultUserId.data;

    const appointments = await prisma.appointment.findMany({
      where: {
        OR: [{ clientId: userId }, { professionalId: userId }],
      },
    });

    return res.status(200).json(appointments);
  } catch {
    return res.status(500).json({ error: "Failed to fetch appointments" });
  }
};
