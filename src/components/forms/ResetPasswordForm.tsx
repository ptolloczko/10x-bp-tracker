// src/components/forms/ResetPasswordForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/**
 * Schema for reset password form validation
 */
export const ResetPasswordFormSchema = z
  .object({
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

export type ResetPasswordFormInput = z.infer<typeof ResetPasswordFormSchema>;

interface ResetPasswordFormProps {
  /** Callback when form is submitted with valid data */
  onSubmit: (data: ResetPasswordFormInput) => void;
  /** Whether the form is currently submitting */
  isSubmitting: boolean;
  /** Error message to display */
  error?: string;
}

/**
 * Reset password form with validation
 * Uses react-hook-form with Zod schema validation
 */
export function ResetPasswordForm({ onSubmit, isSubmitting, error }: ResetPasswordFormProps) {
  const form = useForm<ResetPasswordFormInput>({
    resolver: zodResolver(ResetPasswordFormSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-form-type="other">
        {/* Error message */}
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Password */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nowe hasło</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  data-lpignore="true"
                  data-form-type="other"
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
              <FormLabel>Potwierdź nowe hasło</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  data-lpignore="true"
                  data-form-type="other"
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
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Ustawianie hasła..." : "Ustaw nowe hasło"}
        </Button>
      </form>
    </Form>
  );
}
