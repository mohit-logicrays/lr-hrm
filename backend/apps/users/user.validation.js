import { z } from "zod";
import { ROLES } from "../../core/enums/enums.js";

/**
 * Request models (DTOs) for the users app.
 * Each incoming request body is validated against these schemas.
 */

const permissionSchema = z.object({
  create: z.boolean().default(false),
  read: z.boolean().default(false),
  update: z.boolean().default(false),
  delete: z.boolean().default(false),
});

const permissionOverrideSchema = z.object({
  modelName: z.string().min(1),
  permissions: permissionSchema,
});

export const createUserSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(100).trim(),
    email: z.string().email("A valid email is required").toLowerCase(),
    role: z.enum(ROLES).optional(),
    designation: z.string().max(100).trim().optional(),
    phone: z.string().max(20).trim().optional(),
    permissionGroups: z.array(z.string()).optional(),
    permissionOverrides: z.array(permissionOverrideSchema).optional(),
  })
  .strict();

export const adminUpdateUserSchema = z
  .object({
    name: z.string().min(1).max(100).trim().optional(),
    role: z.enum(ROLES).optional(),
    designation: z.string().max(100).trim().optional(),
    phone: z.string().max(20).trim().optional(),
    isActive: z.boolean().optional(),
    permissionGroups: z.array(z.string()).optional(),
    permissionOverrides: z.array(permissionOverrideSchema).optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required to update",
  });

export const updateProfileSchema = z
  .object({
    name: z.string().min(1).max(100).trim().optional(),
    designation: z.string().max(100).trim().optional(),
    phone: z.string().max(20).trim().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required to update",
  });

/** Generic body validator middleware factory */
export const validate =
  (schema) =>
  (req, res, next) => {
    req.body = schema.parse(req.body);
    next();
  };
