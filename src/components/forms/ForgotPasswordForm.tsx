// src/components/forms/ForgotPasswordForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/**
 * Schema for forgot password form validation
 */
export const ForgotPasswordFormSchema = z.object({
  email: z.string().min(1, "Email jest wymagany").email("Nieprawidłowy format email"),
});

export type ForgotPasswordFormInput = z.infer<typeof ForgotPasswordFormSchema>;

interface ForgotPasswordFormProps {
  /** Callback when form is submitted with valid data */
  onSubmit: (data: ForgotPasswordFormInput) => void;
  /** Whether the form is currently submitting */
  isSubmitting: boolean;
  /** Error message to display */
  error?: string;
}

/**
 * Forgot password form with validation
 * Uses react-hook-form with Zod schema validation
 */
export function ForgotPasswordForm({ onSubmit, isSubmitting, error }: ForgotPasswordFormProps) {
  const form = useForm<ForgotPasswordFormInput>({
    resolver: zodResolver(ForgotPasswordFormSchema),
    defaultValues: {
      email: "",
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
                  data-lpignore="true"
                  data-form-type="other"
                  {...field}
                  disabled={isSubmitting}
                  autoComplete="email"
                />
              </FormControl>
              <FormDescription>Wyślemy Ci link do resetowania hasła na podany adres email</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Wysyłanie..." : "Wyślij link resetujący"}
        </Button>
      </form>
    </Form>
  );
}
