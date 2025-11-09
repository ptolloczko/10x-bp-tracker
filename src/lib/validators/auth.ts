// src/lib/validators/auth.ts
import { z } from "zod";

/**
 * Schema for login form validation (client-side)
 * More detailed error messages for user feedback
 */
export const LoginFormSchema = z.object({
  email: z.string().min(1, "Email jest wymagany").email("Nieprawidłowy format email"),
  password: z.string().min(1, "Hasło jest wymagane"),
});

/**
 * Schema for login request validation (server-side)
 * Simpler validation for API endpoint
 */
export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/**
 * Schema for register form validation (client-side)
 * Includes password complexity requirements and confirmation
 */
export const RegisterFormSchema = z
  .object({
    email: z.string().min(1, "Email jest wymagany").email("Nieprawidłowy format email"),
    password: z
      .string()
      .min(8, "Hasło musi mieć minimum 8 znaków")
      .regex(/[A-Z]/, "Hasło musi zawierać wielką literę")
      .regex(/[0-9]/, "Hasło musi zawierać cyfrę")
      .regex(/[^A-Za-z0-9]/, "Hasło musi zawierać znak specjalny"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła muszą być identyczne",
    path: ["confirmPassword"],
  });

/**
 * Schema for register request validation (server-side)
 */
export const RegisterRequestSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[0-9]/)
    .regex(/[^A-Za-z0-9]/),
});

/**
 * Schema for forgot password request
 */
export const ForgotPasswordRequestSchema = z.object({
  email: z.string().email(),
});

/**
 * Schema for reset password request
 */
export const ResetPasswordRequestSchema = z.object({
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[0-9]/)
    .regex(/[^A-Za-z0-9]/),
});
