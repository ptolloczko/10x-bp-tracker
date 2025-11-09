// src/components/MeasurementTable.tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { LevelBadge } from "@/components/LevelBadge";
import { DeleteConfirmationDialog } from "@/components/dialogs/DeleteConfirmationDialog";
import { Edit, Trash2 } from "lucide-react";
import type { MeasurementDTO } from "@/types";

interface MeasurementTableProps {
  measurements: MeasurementDTO[];
  onEdit: (measurement: MeasurementDTO) => void;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

/**
 * Presentational component for rendering measurements in a table
 * Uses Shadcn/ui Table components
 */
export function MeasurementTable({ measurements, onEdit, onDelete, isDeleting = false }: MeasurementTableProps) {
  if (measurements.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-12 text-center">
        <p className="mb-4 text-lg font-medium text-muted-foreground">Brak pomiarów</p>
        <p className="text-sm text-muted-foreground">Nie masz jeszcze żadnych pomiarów ciśnienia krwi.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data i czas</TableHead>
            <TableHead className="text-center">SYS</TableHead>
            <TableHead className="text-center">DIA</TableHead>
            <TableHead className="text-center">Tętno</TableHead>
            <TableHead>Poziom</TableHead>
            <TableHead>Notatki</TableHead>
            <TableHead className="text-right">Akcje</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {measurements.map((measurement) => (
            <TableRow key={measurement.id}>
              <TableCell className="font-medium">{formatDateTime(measurement.measured_at)}</TableCell>
              <TableCell className="text-center font-semibold">{measurement.sys}</TableCell>
              <TableCell className="text-center font-semibold">{measurement.dia}</TableCell>
              <TableCell className="text-center">{measurement.pulse}</TableCell>
              <TableCell>
                <LevelBadge level={measurement.level} />
              </TableCell>
              <TableCell className="max-w-xs truncate">
                {measurement.notes || <span className="text-muted-foreground">—</span>}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(measurement)}
                    aria-label={`Edytuj pomiar z ${formatDateTime(measurement.measured_at)}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <DeleteConfirmationDialog
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Usuń pomiar z ${formatDateTime(measurement.measured_at)}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    }
                    title="Usunąć ten pomiar?"
                    description={`Czy na pewno chcesz usunąć pomiar z dnia ${formatDateTime(measurement.measured_at)}? Ta akcja jest nieodwracalna.`}
                    onConfirm={() => onDelete(measurement.id)}
                    isDeleting={isDeleting}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/**
 * Formats ISO datetime string to Polish locale format
 */
function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat("pl-PL", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}
