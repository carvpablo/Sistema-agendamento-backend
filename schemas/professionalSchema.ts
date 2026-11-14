import { z } from "zod";

export const AvailabilitySchema = z
  .object({
    startAt: z.coerce.date().refine((date) => date.getTime() > Date.now(), {
      message: "A data de início deve ser posterior ao momento atual",
    }),
    endAt: z.coerce.date(),
  })
  .refine((data) => data.startAt < data.endAt, {
    message: "startAt must be before endAt",
    path: ["endAt"],
  });

export const createServiceProfessionalSchema = z.object({
  serviceId: z.uuid(),
});

export const createProfessionalSchema = z.object({
  name: z.string().min(2, "The name must be a least 2 characters longs"),
  email: z.email("Invalid email format "),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});
