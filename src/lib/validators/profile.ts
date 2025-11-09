// src/lib/validators/profile.ts
import { z } from "zod";

/**
 * Zod schema for validating POST /api/profile request body.
 *
 * Requirements:
 * - timezone is required (IANA timezone identifier)
 * - first_name, last_name are optional strings
 * - dob is optional ISO date string
 * - sex is optional enum: "male" | "female" | "other"
 * - weight is optional number (>0, <=999.9)
 * - phone is optional E.164 formatted phone number
 */
export const CreateProfileInput = z
  .object({
    first_name: z.string().trim().min(1).max(100).optional(),
    last_name: z.string().trim().min(1).max(100).optional(),
    dob: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in ISO format (YYYY-MM-DD)")
      .optional(),
    sex: z.enum(["male", "female", "other"]).optional(),
    weight: z.number().positive().max(999.9).optional(),
    phone: z
      .string()
      .regex(/^\+[1-9]\d{1,14}$/, "Phone must be in E.164 format (e.g., +48123123123)")
      .optional(),
    timezone: z.string().min(1, "Timezone is required"),
  })
  .strict(); // Reject unknown fields

export type CreateProfileInput = z.infer<typeof CreateProfileInput>;
