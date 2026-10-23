import prisma from "../lib/prisma";
import { type Request, type Response } from "express";
import { z } from "zod";
import {
  UserSchema,
  ValidIdSchema,
  UpdateUserSchema,
} from "../schemas/userSchema";

export const getUserById = async (req: Request, res: Response) => {
  try {
    const result = ValidIdSchema.safeParse(req.params);

    if (!result.success) {
      return res.status(404).json({ error: "Invalid Id" });
    }

    const { id } = result.data;

    const user = await prisma.client.findUnique({
      where: {
        id,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json(user);
  } catch (err) {
    return res.status(500).json({ error: "Failed to find user" });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const resultParams = ValidIdSchema.safeParse(req.params);
    const resultBody = UpdateUserSchema.safeParse(req.body);

    if (!resultParams.success) {
      return res.status(400).json({ error: "Invalid Id" });
    }

    if (!resultBody.success) {
      return res.status(400).json({
        error: "Invalid Input",
        details: z.treeifyError(resultBody.error),
      });
    }

    const { id } = resultParams.data;
    const { name, email } = resultBody.data;

    const data = await prisma.client.update({
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

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const result = ValidIdSchema.safeParse(req.params);

    if (!result.success) {
      return res.status(404).json({ error: "Invalid Id" });
    }

    const { id } = result.data;

    const user = await prisma.client.delete({
      where: {
        id,
      },
    });

    return res
      .status(200)
      .json({ message: "User deleted sucessfully", client: user });
  } catch (err: any) {
    if (err.code === "P2025") {
      return res
        .status(404)
        .json({ message: "Cliente não encontrado para deleção" });
    }
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

export const getClientAppointments = async (req: Request, res: Response) => {
  try {
    const result = ValidIdSchema.safeParse(req.params);

    if (!result.success) {
      return res.status(400).json({ error: "Invalid Id" });
    }

    const { id } = result.data;

    const appointments = await prisma.appointment.findMany({
      where: {
        clientId: id,
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

    return res.status(200).json(appointments);
  } catch {
    return res.status(500).json({ error: "Failed to fetch appointments" });
  }
};
