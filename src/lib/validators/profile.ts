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

/**
 * Zod schema for validating PUT /api/profile request body.
 *
 * Requirements for profile form (all fields required when updating):
 * - first_name, last_name: minimum 2 characters
 * - dob: must be a date in the past
 * - sex: one of "male", "female", "other"
 * - weight: positive number, max 999.9
 * - phone: E.164 format phone number
 */
export const UpdateProfileSchema = z.object({
  first_name: z
    .string()
    .trim()
    .min(2, "Imię musi mieć co najmniej 2 znaki")
    .max(100, "Imię nie może być dłuższe niż 100 znaków"),
  last_name: z
    .string()
    .trim()
    .min(2, "Nazwisko musi mieć co najmniej 2 znaki")
    .max(100, "Nazwisko nie może być dłuższe niż 100 znaków"),
  dob: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data musi być w formacie YYYY-MM-DD")
    .refine((date) => {
      const parsedDate = new Date(date);
      return parsedDate < new Date();
    }, "Data urodzenia musi być w przeszłości"),
  sex: z.enum(["male", "female", "other"], {
    errorMap: () => ({ message: "Wybierz płeć" }),
  }),
  weight: z
    .number({
      required_error: "Waga jest wymagana",
      invalid_type_error: "Waga musi być liczbą",
    })
    .positive("Waga musi być większa od 0")
    .max(999.9, "Waga nie może być większa niż 999.9 kg"),
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/, "Telefon musi być w formacie E.164 (np. +48123123123)"),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

/**
 * Schema for profile form view model (used with react-hook-form)
 * The main difference is that dob is a Date object for the DatePicker
 */
export const ProfileFormSchema = z.object({
  first_name: z
    .string()
    .trim()
    .min(2, "Imię musi mieć co najmniej 2 znaki")
    .max(100, "Imię nie może być dłuższe niż 100 znaków"),
  last_name: z
    .string()
    .trim()
    .min(2, "Nazwisko musi mieć co najmniej 2 znaki")
    .max(100, "Nazwisko nie może być dłuższe niż 100 znaków"),
  dob: z.date({
    required_error: "Data urodzenia jest wymagana",
    invalid_type_error: "Nieprawidłowy format daty",
  }),
  sex: z.enum(["male", "female", "other"], {
    errorMap: () => ({ message: "Wybierz płeć" }),
  }),
  weight: z
    .number({
      required_error: "Waga jest wymagana",
      invalid_type_error: "Waga musi być liczbą",
    })
    .positive("Waga musi być większa od 0")
    .max(999.9, "Waga nie może być większa niż 999.9 kg"),
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/, "Telefon musi być w formacie E.164 (np. +48123123123)"),
});

export type ProfileFormInput = z.infer<typeof ProfileFormSchema>;
