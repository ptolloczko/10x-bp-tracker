// src/components/forms/RegisterForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/**
 * Schema for register form validation
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

export type RegisterFormInput = z.infer<typeof RegisterFormSchema>;

interface RegisterFormProps {
  /** Callback when form is submitted with valid data */
  onSubmit: (data: RegisterFormInput) => void;
  /** Whether the form is currently submitting */
  isSubmitting: boolean;
  /** Error message to display */
  error?: string;
}

/**
 * Registration form with validation
 * Uses react-hook-form with Zod schema validation
 */
export function RegisterForm({ onSubmit, isSubmitting, error }: RegisterFormProps) {
  const form = useForm<RegisterFormInput>({
    resolver: zodResolver(RegisterFormSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Error message */}
        {error && (
          <div
            className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
            data-test-id="register-error-message"
          >
            {error}
          </div>
        )}

        {/* Email */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="twoj@email.pl"
                  data-test-id="register-email-input"
                  {...field}
                  disabled={isSubmitting}
                  autoComplete="email"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Password */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hasło</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  data-test-id="register-password-input"
                  {...field}
                  disabled={isSubmitting}
                  autoComplete="new-password"
                />
              </FormControl>
              <FormDescription>Minimum 8 znaków, wielka litera, cyfra i znak specjalny</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Confirm Password */}
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Potwierdź hasło</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  data-test-id="register-confirm-password-input"
                  {...field}
                  disabled={isSubmitting}
                  autoComplete="new-password"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <Button type="submit" disabled={isSubmitting} className="w-full" data-test-id="register-submit-button">
          {isSubmitting ? "Rejestracja..." : "Zarejestruj się"}
        </Button>
      </form>
    </Form>
  );
}
