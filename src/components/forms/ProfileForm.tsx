// src/components/forms/ProfileForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProfileFormSchema, type ProfileFormInput } from "@/lib/validators/profile";
import type { ProfileDTO, UpdateProfileCommand } from "@/types";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface ProfileFormProps {
  /** Initial profile data to populate the form */
  initialData: ProfileDTO;
  /** Callback when form is submitted with valid data */
  onSubmit: (data: UpdateProfileCommand) => void;
  /** Whether the form is currently submitting */
  isSubmitting: boolean;
}

/**
 * Profile editing form with validation
 * Uses react-hook-form with Zod schema validation
 */
export function ProfileForm({ initialData, onSubmit, isSubmitting }: ProfileFormProps) {
  // Initialize form with default values from profile
  const form = useForm<ProfileFormInput>({
    resolver: zodResolver(ProfileFormSchema),
    defaultValues: {
      first_name: initialData.first_name,
      last_name: initialData.last_name,
      dob: new Date(initialData.dob),
      sex: initialData.sex,
      weight: initialData.weight,
      phone: initialData.phone,
    },
  });

  // Transform form data to UpdateProfileCommand before submitting
  const handleSubmit = (data: ProfileFormInput) => {
    const updateCommand: UpdateProfileCommand = {
      first_name: data.first_name,
      last_name: data.last_name,
      dob: data.dob.toISOString().split("T")[0], // Convert Date to ISO string (YYYY-MM-DD)
      sex: data.sex,
      weight: data.weight,
      phone: data.phone,
    };
    onSubmit(updateCommand);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* First Name */}
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Imię</FormLabel>
                <FormControl>
                  <Input placeholder="Podaj imię" {...field} disabled={isSubmitting} autoComplete="given-name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Last Name */}
          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nazwisko</FormLabel>
                <FormControl>
                  <Input placeholder="Podaj nazwisko" {...field} disabled={isSubmitting} autoComplete="family-name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Date of Birth */}
          <FormField
            control={form.control}
            name="dob"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data urodzenia</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    value={field.value instanceof Date ? field.value.toISOString().split("T")[0] : ""}
                    onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value) : new Date();
                      field.onChange(date);
                    }}
                    disabled={isSubmitting}
                    max={new Date().toISOString().split("T")[0]}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Sex */}
          <FormField
            control={form.control}
            name="sex"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Płeć</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Wybierz płeć" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="male">Mężczyzna</SelectItem>
                    <SelectItem value="female">Kobieta</SelectItem>
                    <SelectItem value="other">Inna</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Weight */}
          <FormField
            control={form.control}
            name="weight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Waga (kg)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="70"
                    step="0.1"
                    min="0"
                    max="999.9"
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value ? parseFloat(value) : "");
                    }}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Phone */}
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefon</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="+48123123123" {...field} disabled={isSubmitting} autoComplete="tel" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
            {isSubmitting ? "Zapisywanie..." : "Zapisz zmiany"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
