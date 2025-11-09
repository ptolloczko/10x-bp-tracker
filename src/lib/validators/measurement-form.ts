// src/lib/validators/measurement-form.ts
import { z } from "zod";

/**
 * Zod schema for validating measurement form data (ViewModel)
 * Uses Date object for measured_at instead of ISO string
 *
 * Requirements:
 * - sys: positive integer
 * - dia: positive integer
 * - pulse: positive integer
 * - measured_at: Date object, must not be in the future
 * - notes: optional string, max 255 characters
 * - Business rule: sys >= dia
 */
export const MeasurementFormSchema = z
  .object({
    sys: z
      .number({
        required_error: "Ciśnienie skurczowe jest wymagane",
        invalid_type_error: "Ciśnienie skurczowe musi być liczbą",
      })
      .int("Ciśnienie skurczowe musi być liczbą całkowitą")
      .positive("Ciśnienie skurczowe musi być większe od 0")
      .max(300, "Ciśnienie skurczowe nie może być większe niż 300"),
    dia: z
      .number({
        required_error: "Ciśnienie rozkurczowe jest wymagane",
        invalid_type_error: "Ciśnienie rozkurczowe musi być liczbą",
      })
      .int("Ciśnienie rozkurczowe musi być liczbą całkowitą")
      .positive("Ciśnienie rozkurczowe musi być większe od 0")
      .max(200, "Ciśnienie rozkurczowe nie może być większe niż 200"),
    pulse: z
      .number({
        required_error: "Tętno jest wymagane",
        invalid_type_error: "Tętno musi być liczbą",
      })
      .int("Tętno musi być liczbą całkowitą")
      .positive("Tętno musi być większe od 0")
      .max(250, "Tętno nie może być większe niż 250"),
    measured_at: z
      .date({
        required_error: "Data i czas pomiaru są wymagane",
        invalid_type_error: "Data pomiaru musi być datą",
      })
      .refine(
        (date) => {
          const now = new Date();
          return date <= now;
        },
        { message: "Data pomiaru nie może być w przyszłości" }
      ),
    notes: z.string().max(255, "Notatka nie może być dłuższa niż 255 znaków").optional(),
  })
  .refine((data) => data.sys >= data.dia, {
    message: "Ciśnienie skurczowe musi być większe lub równe rozkurczowemu",
    path: ["sys"],
  });

export type MeasurementFormInput = z.infer<typeof MeasurementFormSchema>;
