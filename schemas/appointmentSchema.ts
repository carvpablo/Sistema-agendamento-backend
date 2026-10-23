import { z } from "zod";

export const createAppointmentSchema = z.object({
  clientId: z.uuid(),
  professionalId: z.uuid(),
  serviceId: z.uuid(),
  startAt: z.coerce.date(),
});

export const validateId = z.object({
  id: z.uuid(),
});

export const updateAppointmentSchema = z.object({
  status: z.enum(["COMPLETED", "CANCELLED"]),
});
