// src/components/dialogs/AddMeasurementDialog.tsx
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MeasurementForm } from "@/components/forms/MeasurementForm";
import type { CreateMeasurementCommand } from "@/types";

interface AddMeasurementDialogProps {
  /** Trigger element that opens the dialog */
  trigger: React.ReactNode;
  /** Callback when measurement is successfully created */
  onSuccess: () => void;
  /** Callback to create measurement */
  onSubmit: (data: CreateMeasurementCommand) => Promise<void>;
  /** Whether the form is currently submitting */
  isSubmitting: boolean;
}

/**
 * Dialog for adding a new measurement
 * Contains MeasurementForm and handles open/close state
 */
export function AddMeasurementDialog({ trigger, onSuccess, onSubmit, isSubmitting }: AddMeasurementDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSubmit = async (data: CreateMeasurementCommand) => {
    try {
      await onSubmit(data);
      setOpen(false);
      onSuccess();
    } catch (error) {
      // Error is handled by the parent component through toast
      // Silently handle - parent component will show toast
      if (error instanceof Error) {
        throw error;
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Dodaj pomiar ciśnienia</DialogTitle>
          <DialogDescription>Wprowadź dane swojego pomiaru ciśnienia krwi i tętna.</DialogDescription>
        </DialogHeader>
        <MeasurementForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </DialogContent>
    </Dialog>
  );
}
