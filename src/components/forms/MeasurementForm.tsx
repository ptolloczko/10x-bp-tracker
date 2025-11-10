// src/components/forms/MeasurementForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MeasurementFormSchema, type MeasurementFormInput } from "@/lib/validators/measurement-form";
import type { CreateMeasurementCommand, MeasurementFormViewModel } from "@/types";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface MeasurementFormProps {
  /** Callback when form is submitted with valid data */
  onSubmit: (data: CreateMeasurementCommand) => void;
  /** Whether the form is currently submitting */
  isSubmitting: boolean;
  /** Initial data to populate the form (for editing) */
  initialData?: Partial<MeasurementFormViewModel>;
}

/**
 * Measurement form with validation
 * Uses react-hook-form with Zod schema validation
 * Supports both creating new measurements and editing existing ones
 */
export function MeasurementForm({ onSubmit, isSubmitting, initialData }: MeasurementFormProps) {
  // Initialize form with default values
  const form = useForm<MeasurementFormInput>({
    resolver: zodResolver(MeasurementFormSchema),
    defaultValues: {
      sys: initialData?.sys || undefined,
      dia: initialData?.dia || undefined,
      pulse: initialData?.pulse || undefined,
      measured_at: initialData?.measured_at || new Date(),
      notes: initialData?.notes || "",
    },
  });

  // Transform form data to CreateMeasurementCommand before submitting
  const handleSubmit = (data: MeasurementFormInput) => {
    const command: CreateMeasurementCommand = {
      sys: data.sys,
      dia: data.dia,
      pulse: data.pulse,
      measured_at: data.measured_at.toISOString(),
      notes: data.notes || undefined,
    };
    onSubmit(command);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Date and Time */}
        <FormField
          control={form.control}
          name="measured_at"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data i czas pomiaru</FormLabel>
              <FormControl>
                <Input
                  type="datetime-local"
                  data-test-id="measurement-datetime-input"
                  {...field}
                  value={field.value instanceof Date ? toLocalDatetimeString(field.value) : ""}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : new Date();
                    field.onChange(date);
                  }}
                  disabled={isSubmitting}
                  max={toLocalDatetimeString(new Date())}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          {/* Systolic Pressure */}
          <FormField
            control={form.control}
            name="sys"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SYS (mmHg)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="120"
                    min="1"
                    max="300"
                    data-test-id="measurement-sys-input"
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value ? parseInt(value, 10) : "");
                    }}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Diastolic Pressure */}
          <FormField
            control={form.control}
            name="dia"
            render={({ field }) => (
              <FormItem>
                <FormLabel>DIA (mmHg)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="80"
                    min="1"
                    max="200"
                    data-test-id="measurement-dia-input"
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value ? parseInt(value, 10) : "");
                    }}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Pulse */}
          <FormField
            control={form.control}
            name="pulse"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tętno (bpm)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="70"
                    min="1"
                    max="250"
                    data-test-id="measurement-pulse-input"
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value ? parseInt(value, 10) : "");
                    }}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notatki (opcjonalnie)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Np. po wysiłku, rano, po lekach..."
                  data-test-id="measurement-notes-input"
                  {...field}
                  value={field.value || ""}
                  disabled={isSubmitting}
                  maxLength={255}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isSubmitting} className="min-w-[120px]" data-test-id="measurement-submit-button">
            {isSubmitting ? "Zapisywanie..." : "Zapisz pomiar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

/**
 * Converts Date to local datetime-local input format (YYYY-MM-DDThh:mm)
 */
function toLocalDatetimeString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
