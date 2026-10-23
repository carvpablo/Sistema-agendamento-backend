import { z } from "zod";

export const UserSchema = z.object({
  name: z.string().min(2, "The name must be a least 2 characters longs"),
  email: z.email("Invalid email format "),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export const UpdateUserSchema = UserSchema.partial();

export const ValidIdSchema = z.object({
  id: z.uuid("Invalid Id"),
});
