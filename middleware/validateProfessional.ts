import { type Request, type Response, type NextFunction } from "express";
import prisma from "../lib/prisma";

const validateProfessional = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ error: "Unauthorized: user not authenticated" });
    }

    const { id } = req.user;

    const professional = await prisma.professional.findFirst({
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
  } catch {
    return res.status(500).json({ error: "Failed to validate professional" });
  }
};

export default validateProfessional;
