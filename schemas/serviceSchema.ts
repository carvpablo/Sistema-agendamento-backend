import { z } from "zod";

export const createServiceSchema = z.object({
  name: z.string(),
  description: z.string().max(500).optional(),
  durationMinutes: z
    .number()
    .int("Durantion must be a intenger")
    .positive("Durantion must be a positive number"),
  price: z.number(),
});

export const updateServiceSchema = createServiceSchema.partial();

export const validateId = z.object({
  id: z.uuid(),
});
