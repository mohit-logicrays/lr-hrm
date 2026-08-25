import { z } from "zod";

export const loginSchema = z
  .object({
    email: z.string().email("A valid email is required").toLowerCase(),
    password: z.string().min(1, "Password is required"),
  })
  .strict();

export const validate =
  (schema) =>
  (req, res, next) => {
    req.body = schema.parse(req.body);
    next();
  };
