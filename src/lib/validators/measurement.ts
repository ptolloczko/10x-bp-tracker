// src/lib/validators/measurement.ts
import { z } from "zod";
import type { Database } from "../../db/database.types";

type BpLevel = Database["public"]["Enums"]["bp_level"];

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

/**
 * Zod schema for validating PUT /api/measurements/{id} request body.
 *
 * All fields are optional (partial update).
 * Same validation rules as CreateMeasurementSchema.
 */
export const UpdateMeasurementSchema = z
  .object({
    sys: z
      .number({
        invalid_type_error: "Ciśnienie skurczowe musi być liczbą",
      })
      .int("Ciśnienie skurczowe musi być liczbą całkowitą")
      .positive("Ciśnienie skurczowe musi być większe od 0")
      .max(32767, "Ciśnienie skurczowe jest zbyt duże")
      .optional(),
    dia: z
      .number({
        invalid_type_error: "Ciśnienie rozkurczowe musi być liczbą",
      })
      .int("Ciśnienie rozkurczowe musi być liczbą całkowitą")
      .positive("Ciśnienie rozkurczowe musi być większe od 0")
      .max(32767, "Ciśnienie rozkurczowe jest zbyt duże")
      .optional(),
    pulse: z
      .number({
        invalid_type_error: "Pulsacja musi być liczbą",
      })
      .int("Pulsacja musi być liczbą całkowitą")
      .positive("Pulsacja musi być większa od 0")
      .max(32767, "Pulsacja jest zbyt duża")
      .optional(),
    measured_at: z
      .string({
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
      )
      .optional(),
    notes: z.string().max(255, "Notatka nie może być dłuższa niż 255 znaków").optional(),
  })
  .strict() // Reject unknown fields
  .refine(
    (data) => {
      // If both sys and dia are provided, validate sys >= dia
      if (data.sys !== undefined && data.dia !== undefined) {
        return data.sys >= data.dia;
      }
      return true;
    },
    {
      message: "Ciśnienie skurczowe musi być większe lub równe rozkurczowemu",
      path: ["sys"],
    }
  );

export type UpdateMeasurementInput = z.infer<typeof UpdateMeasurementSchema>;

/**
 * Zod schema for validating GET /api/measurements query parameters.
 *
 * Query params:
 * - page: number >= 1 (default: 1)
 * - page_size: number 1-100 (default: 20)
 * - from: ISO datetime string (start of measured_at range)
 * - to: ISO datetime string (end of measured_at range)
 * - level: single bp_level or comma-separated list
 * - sort: 'asc' | 'desc' (default: 'desc')
 */
export const GetMeasurementsQuerySchema = z
  .object({
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1))
      .pipe(z.number().int().min(1, "Numer strony musi być >= 1")),
    page_size: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 20))
      .pipe(z.number().int().min(1, "Rozmiar strony musi być >= 1").max(100, "Rozmiar strony nie może być > 100")),
    from: z
      .string()
      .datetime("Parametr 'from' musi być w formacie ISO 8601")
      .optional()
      .transform((val) => (val ? val : undefined)),
    to: z
      .string()
      .datetime("Parametr 'to' musi być w formacie ISO 8601")
      .optional()
      .transform((val) => (val ? val : undefined)),
    level: z
      .string()
      .optional()
      .refine(
        (val) => {
          if (!val) return true;
          // Split by comma and validate each level
          const levels = val.split(",").map((l) => l.trim());
          const validLevels: BpLevel[] = [
            "optimal",
            "normal",
            "high_normal",
            "grade1",
            "grade2",
            "grade3",
            "hypertensive_crisis",
          ];
          for (const level of levels) {
            if (!validLevels.includes(level as BpLevel)) {
              return false;
            }
          }
          return true;
        },
        {
          message:
            "Nieprawidłowy poziom ciśnienia. Dozwolone: optimal, normal, high_normal, grade1, grade2, grade3, hypertensive_crisis",
        }
      )
      .transform((val) => (val ? val : undefined)),
    sort: z
      .enum(["asc", "desc"], {
        errorMap: () => ({ message: "Parametr 'sort' musi być 'asc' lub 'desc'" }),
      })
      .optional()
      .default("desc"),
  })
  .strict();

export type GetMeasurementsQueryInput = z.infer<typeof GetMeasurementsQuerySchema>;
