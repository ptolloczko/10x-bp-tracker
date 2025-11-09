// src/components/dialogs/EditMeasurementDialog.tsx
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MeasurementForm } from "@/components/forms/MeasurementForm";
import type { CreateMeasurementCommand, MeasurementDTO, MeasurementFormViewModel } from "@/types";

interface EditMeasurementDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Measurement data to edit */
  measurement: MeasurementDTO;
  /** Callback when measurement is successfully updated */
  onSuccess: () => void;
  /** Callback to update measurement */
  onSubmit: (id: string, data: CreateMeasurementCommand) => Promise<void>;
  /** Whether the form is currently submitting */
  isSubmitting: boolean;
}

/**
 * Dialog for editing an existing measurement
 * Contains MeasurementForm with initial data and handles open/close state
 */
export function EditMeasurementDialog({
  open,
  onOpenChange,
  measurement,
  onSuccess,
  onSubmit,
  isSubmitting,
}: EditMeasurementDialogProps) {
  // Convert MeasurementDTO to MeasurementFormViewModel
  const initialData: MeasurementFormViewModel = {
    sys: measurement.sys,
    dia: measurement.dia,
    pulse: measurement.pulse,
    measured_at: new Date(measurement.measured_at),
    notes: measurement.notes || undefined,
  };

  const handleSubmit = async (data: CreateMeasurementCommand) => {
    try {
      await onSubmit(measurement.id, data);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      // Error is handled by the parent component through toast
      // eslint-disable-next-line no-console
      console.error("Failed to update measurement:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edytuj pomiar ciśnienia</DialogTitle>
          <DialogDescription>Zaktualizuj dane swojego pomiaru ciśnienia krwi i tętna.</DialogDescription>
        </DialogHeader>
        <MeasurementForm onSubmit={handleSubmit} isSubmitting={isSubmitting} initialData={initialData} />
      </DialogContent>
    </Dialog>
  );
}
