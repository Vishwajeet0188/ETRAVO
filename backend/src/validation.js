import { z } from "zod";

export const roleSchema = z.enum(["driver", "passenger"]);

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email().max(255),
  phone: z.string().trim().min(7).max(20),
  password: z.string().min(8).max(72),
  role: roleSchema,
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(1).max(72),
  role: roleSchema,
});
