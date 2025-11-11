// src/components/forms/LoginForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/**
 * Schema for login form validation
 */
export const LoginFormSchema = z.object({
  email: z.string().min(1, "Email jest wymagany").email("Nieprawidłowy format email"),
  password: z.string().min(1, "Hasło jest wymagane"),
});

export type LoginFormInput = z.infer<typeof LoginFormSchema>;

interface LoginFormProps {
  /** Callback when form is submitted with valid data */
  onSubmit: (data: LoginFormInput) => void;
  /** Whether the form is currently submitting */
  isSubmitting: boolean;
  /** Error message to display */
  error?: string;
}

/**
 * Login form with validation
 * Uses react-hook-form with Zod schema validation
 */
export function LoginForm({ onSubmit, isSubmitting, error }: LoginFormProps) {
  const form = useForm<LoginFormInput>({
    resolver: zodResolver(LoginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-form-type="other">
        {/* Error message */}
        {error && (
          <div
            className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
            data-test-id="login-error-message"
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
                  data-test-id="login-email-input"
                  data-lpignore="true"
                  data-form-type="other"
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
                  data-test-id="login-password-input"
                  data-lpignore="true"
                  data-form-type="other"
                  {...field}
                  disabled={isSubmitting}
                  autoComplete="current-password"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <Button type="submit" disabled={isSubmitting} className="w-full" data-test-id="login-submit-button">
          {isSubmitting ? "Logowanie..." : "Zaloguj się"}
        </Button>
      </form>
    </Form>
  );
}
