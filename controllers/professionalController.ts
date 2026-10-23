import { type Request, type Response } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";

import prisma from "../lib/prisma";
import { ValidIdSchema, UpdateUserSchema } from "../schemas/userSchema";
import {
  AvailabilitySchema,
  createServiceProfessionalSchema,
  createProfessionalSchema,
} from "../schemas/professionalSchema";

export const createProfessional = async (req: Request, res: Response) => {
  try {
    const result = createProfessionalSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(404).json({
        error: "Invalid user input",
        details: z.treeifyError(result.error),
      });
    }

    const { name, email, password } = result.data;

    const hashedPassword = await bcrypt.hash(password, 10);

    const data = await prisma.professional.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    return res.status(201).json(data);
  } catch (err) {
    return res.status(500).json({ error: "Error creating professional" });
  }
};

export const updateProfessional = async (req: Request, res: Response) => {
  try {
    const resultParams = ValidIdSchema.safeParse(req.params);
    const resultBody = UpdateUserSchema.safeParse(req.body);

    if (!resultParams.success) {
      return res.status(400).json({ error: "Invalid Id" });
    }

    if (!resultBody.success) {
      return res.status(400).json({
        error: "Invalid input",
        details: z.treeifyError(resultBody.error),
      });
    }

    const { id } = resultParams.data;
    const { name, email } = resultBody.data;

    const data = await prisma.professional.update({
      where: {
        id,
      },
      data: {
        name,
        email,
      },
    });

    return res.status(200).json(data);
  } catch (err: any) {
    if (err.code === "P2025") {
      return res.status(404).json({ message: "Client not found" });
    }
    return res.status(500).json({ error: "Failed to update user" });
  }
};

export const getProfessionalById = async (req: Request, res: Response) => {
  try {
    const result = ValidIdSchema.safeParse(req.params);

    if (!result.success) {
      return res.status(400).json({ error: "Invalid Id" });
    }

    const { id } = result.data;

    const data = await prisma.professional.findUnique({
      where: {
        id,
      },
    });

    if (!data) {
      return res.status(404).json({ error: "No professional found" });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch data" });
  }
};

export const deleteProfessional = async (req: Request, res: Response) => {
  try {
    const result = ValidIdSchema.safeParse(req.params);

    if (!result.success) {
      return res.status(400).json({ error: "Invalid Id" });
    }

    const { id } = result.data;

    const data = await prisma.professional.delete({
      where: {
        id,
      },
    });

    return res
      .status(200)
      .json({ message: "Professional deleted sucessfully", data });
  } catch (err: any) {
    if (err.code === "P2025") {
      return res.status(404).json({ message: "Professional not found" });
    }
    return res.status(500).json({ error: "Failed to delete professional" });
  }
};

export const createAvailability = async (req: Request, res: Response) => {
  try {
    const resultUser = ValidIdSchema.safeParse(req.user);
    const result = AvailabilitySchema.safeParse(req.body);

    if (!resultUser.success) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!result.success) {
      return res.status(400).json({
        error: "Invalid input",
        details: z.treeifyError(result.error),
      });
    }

    const { id: authenticatedId } = resultUser.data;
    const { professionalId, startAt, endAt } = result.data;

    if (authenticatedId !== professionalId) {
      return res.status(403).json({
        error: "Forbidden: You can only create availability for yourself",
      });
    }

    const data = await prisma.availability.create({
      data: {
        professionalId,
        startAt,
        endAt,
      },
    });

    return res.status(201).json(data);
  } catch (err) {
    return res.status(500).json({ error: "Failed to create availability" });
  }
};

export const getProfessionalAvailability = async (
  req: Request,
  res: Response,
) => {
  try {
    const result = ValidIdSchema.safeParse(req.params);

    if (!result.success) {
      return res.status(400).json({ error: "Invalid Id" });
    }

    const { id } = result.data;

    const availabilities = await prisma.availability.findMany({
      where: {
        professionalId: id,
      },
      orderBy: {
        startAt: "asc",
      },
    });

    return res.status(200).json(availabilities);
  } catch {
    return res.status(500).json({ error: "Failed to fetch availability" });
  }
};

export const getProfessionalAvailableSlots = async (
  req: Request,
  res: Response,
) => {
  try {
    const resultParams = ValidIdSchema.safeParse(req.params);
    const resultService = ValidIdSchema.safeParse({ id: req.query.serviceId });

    if (!resultParams.success || !resultService.success) {
      return res
        .status(400)
        .json({ error: "Invalid professionalId or serviceId" });
    }

    const { id: professionalId } = resultParams.data;
    const { id: serviceId } = resultService.data;

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }

    const availabilities = await prisma.availability.findMany({
      where: { professionalId },
      orderBy: { startAt: "asc" },
    });

    const scheduledAppointments = await prisma.appointment.findMany({
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
    const slotsMap = new Map<string, { startAt: string; endAt: string }>();

    for (const availability of availabilities) {
      let cursor = availability.startAt.getTime();
      const windowEnd = availability.endAt.getTime();

      while (cursor + durationMs <= windowEnd) {
        const slotStart = new Date(cursor);
        const slotEnd = new Date(cursor + durationMs);

        const hasCollision = scheduledAppointments.some(
          (appt) => appt.startAt < slotEnd && appt.endAt > slotStart,
        );

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

    const slots = Array.from(slotsMap.values()).sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
    );

    return res.status(200).json(slots);
  } catch {
    return res
      .status(500)
      .json({ error: "Failed to calculate available slots" });
  }
};

export const deleteAvailability = async (req: Request, res: Response) => {
  try {
    const resultParams = ValidIdSchema.safeParse(req.params);
    const resultUser = ValidIdSchema.safeParse(req.user);

    if (!resultUser.success) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!resultParams.success) {
      return res.status(400).json({ error: "Invalid Id" });
    }

    const { id: availabilityId } = resultParams.data;
    const { id: professionalId } = resultUser.data;

    const availability = await prisma.availability.findUnique({
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

    await prisma.availability.delete({
      where: { id: availabilityId },
    });

    return res
      .status(200)
      .json({ message: "Availability deleted successfully" });
  } catch {
    return res.status(500).json({ error: "Failed to delete availability" });
  }
};

export const createServiceProfessional = async (
  req: Request,
  res: Response,
) => {
  try {
    const resultParams = ValidIdSchema.safeParse(req.params);
    const result = createServiceProfessionalSchema.safeParse(req.body);

    if (!resultParams.success) {
      return res.status(400).json({
        error: "Invalid Id",
      });
    }

    if (!result.success) {
      return res.status(400).json({
        error: "Invalid input",
        details: z.treeifyError(result.error),
      });
    }

    const { id } = resultParams.data;
    const { serviceId } = result.data;

    const data = await prisma.professionalService.create({
      data: {
        professionalId: id,
        serviceId,
      },
    });
    return res.status(201).json(data);
  } catch (err) {
    return res
      .status(500)
      .json({ error: "Failed to create a linked service to a professional" });
  }
};

export const getProfessionalAppointments = async (
  req: Request,
  res: Response,
) => {
  try {
    const result = ValidIdSchema.safeParse(req.params);

    if (!result.success) {
      return res.status(400).json({ error: "Invalid Id" });
    }

    const { id } = result.data;

    const appointment = await prisma.appointment.findMany({
      where: {
        professionalId: id,
        status: { not: "CANCELLED" },
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
  } catch {
    return res.status(500).json({ error: "Failed to fetch appointments" });
  }
};

export const getProfessionalServices = async (req: Request, res: Response) => {
  try {
    const result = ValidIdSchema.safeParse(req.params);

    if (!result.success) {
      return res.status(400).json({ error: "Invalid Id" });
    }

    const { id } = result.data;

    const professional = await prisma.professional.findUnique({
      where: { id },
    });

    if (!professional) {
      return res.status(404).json({ error: "Professional not found" });
    }

    const professionalServices = await prisma.professionalService.findMany({
      where: { professionalId: id },
      include: {
        service: true,
      },
    });

    const services = professionalServices.map((item) => item.service);

    return res.status(200).json(services);
  } catch {
    return res
      .status(500)
      .json({ error: "Failed to fetch professional services" });
  }
};
