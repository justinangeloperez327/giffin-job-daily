import { z } from "zod";

import { requiredText } from "@/lib/validation/common";
import { USER_ROLES } from "@/lib/auth/constants";

export const userRoleSchema = z.enum(USER_ROLES);

export const emailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address.")
  .max(254, "Email must be 254 characters or fewer.")
  .transform((value) => value.toLowerCase());

export const passwordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters.")
  .max(128, "Password must be 128 characters or fewer.");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required.").max(128),
});

export const createUserSchema = z.object({
  name: requiredText("Name", 120),
  email: emailSchema,
  password: passwordSchema,
  role: userRoleSchema,
});

export const updateUserSchema = z.object({
  id: z.string().uuid(),
  name: requiredText("Name", 120),
  email: emailSchema,
  role: userRoleSchema,
  isActive: z.boolean(),
});

export const resetUserPasswordSchema = z.object({
  id: z.string().uuid(),
  password: passwordSchema,
});

export const userIdSchema = z.string().uuid();

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
