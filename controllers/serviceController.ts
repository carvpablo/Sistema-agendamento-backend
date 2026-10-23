import prisma from "../lib/prisma";
import { type Request, type Response } from "express";
import { z } from "zod";
import {
  createServiceSchema,
  updateServiceSchema,
  validateId,
} from "../schemas/serviceSchema";

export const createService = async (req: Request, res: Response) => {
  try {
    const resultId = validateId.safeParse(req.user);
    const result = createServiceSchema.safeParse(req.body);

    if (!resultId.success) {
      return res.status(400).json({ error: "Invalid Id" });
    }

    if (!result.success) {
      return res.status(400).json({
        error: "Invalid input",
        details: z.treeifyError(result.error),
      });
    }

    const { id } = resultId.data;

    const { name, description, durationMinutes, price } = result.data;

    const data = await prisma.service.create({
      data: {
        name,
        description,
        durationMinutes,
        price,
      },
    });

    await prisma.professionalService.create({
      data: {
        professionalId: id,
        serviceId: data.id,
      },
    });

    return res.status(201).json(data);
  } catch {
    return res.status(500).json({ error: "Failed to create service" });
  }
};

export const updateService = async (req: Request, res: Response) => {
  try {
    const resultParams = validateId.safeParse(req.params);
    const resultProfessionalId = validateId.safeParse(req.user);
    const resultBody = updateServiceSchema.safeParse(req.body);

    if (!resultProfessionalId.success) {
      return res.status(400).json({ error: "Invalid Id" });
    }

    if (!resultParams.success) {
      return res.status(400).json({ error: "Invalid Id" });
    }

    if (!resultBody.success) {
      return res.status(400).json({
        error: "Invalid Input",
        details: z.treeifyError(resultBody.error),
      });
    }

    const { id: serviceId } = resultParams.data;
    const { id: professionalId } = resultProfessionalId.data;

    const professionalService = await prisma.professionalService.findUnique({
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

    const data = await prisma.service.update({
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
  } catch (err: any) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(500).json({ error: "Failed to update service" });
  }
};

export const getService = async (req: Request, res: Response) => {
  try {
    const data = await prisma.service.findMany({
      include: {
        professionalServices: {
          include: {
            professional: true,
          },
        },
      },
    });

    return res.status(200).json(data);
  } catch {
    return res.status(500).json({ error: "Failed to fetch services" });
  }
};

export const getServiceById = async (req: Request, res: Response) => {
  try {
    const result = validateId.safeParse(req.params);

    if (!result.success) {
      return res.status(400).json({
        error: "Invalid id",
      });
    }

    const { id } = result.data;

    const data = await prisma.service.findUnique({
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
  } catch {
    return res.status(500).json({ error: "Failed to fetch service" });
  }
};

export const deleteService = async (req: Request, res: Response) => {
  try {
    const result = validateId.safeParse(req.params);
    const resultProfessionalId = validateId.safeParse(req.user);

    if (!resultProfessionalId.success) {
      return res.status(400).json({ error: "Invalid Id" });
    }

    if (!result.success) {
      return res.status(400).json({ error: "Invalid Id" });
    }

    const { id: professionalId } = resultProfessionalId.data;

    const { id: serviceId } = result.data;

    const professionalService = await prisma.professionalService.findUnique({
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

    const service = await prisma.professionalService.delete({
      where: {
        serviceId_professionalId: { professionalId, serviceId },
      },
    });

    return res
      .status(200)
      .json({ message: "Service deleted successfully", service });
  } catch (err: any) {
    if (err.code === "P2025") {
      return res.status(404).json({ message: "Service not found" });
    }
    return res.status(500).json({ message: "Error trying to delete service" });
  }
};
