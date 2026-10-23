import z from "zod";

export const createUserSchema = z.object({
  name: z.string().min(2, "The name must be a least 2 characters long"),
  email: z.email("Invalid email format "),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export const loginSchema = z.object({
  email: z.email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;
