// src/lib/validators/measurement.ts
import { z } from "zod";

/**
 * Zod schema for validating POST /api/measurements request body.
 *
 * Requirements:
 * - sys: positive integer (smallint > 0)
 * - dia: positive integer (smallint > 0)
 * - pulse: positive integer (smallint > 0)
 * - measured_at: ISO 8601 datetime string, must not be in the future
 * - notes: optional string, max 255 characters
 * - Business rule: sys >= dia
 */
export const CreateMeasurementSchema = z
  .object({
    sys: z
      .number({
        required_error: "Ciśnienie skurczowe jest wymagane",
        invalid_type_error: "Ciśnienie skurczowe musi być liczbą",
      })
      .int("Ciśnienie skurczowe musi być liczbą całkowitą")
      .positive("Ciśnienie skurczowe musi być większe od 0")
      .max(32767, "Ciśnienie skurczowe jest zbyt duże"),
    dia: z
      .number({
        required_error: "Ciśnienie rozkurczowe jest wymagane",
        invalid_type_error: "Ciśnienie rozkurczowe musi być liczbą",
      })
      .int("Ciśnienie rozkurczowe musi być liczbą całkowitą")
      .positive("Ciśnienie rozkurczowe musi być większe od 0")
      .max(32767, "Ciśnienie rozkurczowe jest zbyt duże"),
    pulse: z
      .number({
        required_error: "Pulsacja jest wymagana",
        invalid_type_error: "Pulsacja musi być liczbą",
      })
      .int("Pulsacja musi być liczbą całkowitą")
      .positive("Pulsacja musi być większa od 0")
      .max(32767, "Pulsacja jest zbyt duża"),
    measured_at: z
      .string({
        required_error: "Data pomiaru jest wymagana",
        invalid_type_error: "Data pomiaru musi być tekstem",
      })
      .datetime("Data pomiaru musi być w formacie ISO 8601")
      .refine(
        (dateStr) => {
          const measured = new Date(dateStr);
          const now = new Date();
          return measured <= now;
        },
        { message: "Data pomiaru nie może być w przyszłości" }
      ),
    notes: z.string().max(255, "Notatka nie może być dłuższa niż 255 znaków").optional(),
  })
  .strict() // Reject unknown fields
  .refine((data) => data.sys >= data.dia, {
    message: "Ciśnienie skurczowe musi być większe lub równe rozkurczowemu",
    path: ["sys"],
  });

export type CreateMeasurementInput = z.infer<typeof CreateMeasurementSchema>;
