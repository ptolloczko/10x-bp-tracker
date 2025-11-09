// src/components/dialogs/DeleteConfirmationDialog.tsx
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DeleteConfirmationDialogProps {
  /** Trigger element that opens the dialog */
  trigger: React.ReactNode;
  /** Title of the confirmation dialog */
  title?: string;
  /** Description of what will be deleted */
  description?: string;
  /** Callback when delete is confirmed */
  onConfirm: () => void;
  /** Whether the delete operation is in progress */
  isDeleting?: boolean;
}

/**
 * Confirmation dialog for delete operations
 * Uses AlertDialog from Shadcn/ui for a standard destructive action pattern
 */
export function DeleteConfirmationDialog({
  trigger,
  title = "Czy na pewno chcesz usunąć?",
  description = "Ta akcja jest nieodwracalna. Dane zostaną trwale usunięte.",
  onConfirm,
  isDeleting = false,
}: DeleteConfirmationDialogProps) {
  const [open, setOpen] = useState(false);

  const handleConfirm = () => {
    onConfirm();
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Anuluj</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting ? "Usuwanie..." : "Usuń"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
