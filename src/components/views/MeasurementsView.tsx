// src/components/views/MeasurementsView.tsx
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useMeasurements } from "@/components/hooks/useMeasurements";
import { MeasurementTable } from "@/components/MeasurementTable";
import { AddMeasurementDialog } from "@/components/dialogs/AddMeasurementDialog";
import { EditMeasurementDialog } from "@/components/dialogs/EditMeasurementDialog";
import { measurementApiClient } from "@/lib/api/measurement.client";
import { Plus, Download } from "lucide-react";
import type { CreateMeasurementCommand, MeasurementDTO } from "@/types";

// Create a query client instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

/**
 * Measurements view content component
 * Handles measurements data loading, errors, and display
 */
function MeasurementsViewContent() {
  const [currentPage, setCurrentPage] = useState(1);
  const [editingMeasurement, setEditingMeasurement] = useState<MeasurementDTO | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const pageSize = 10;

  const {
    measurements,
    total,
    totalPages,
    isLoading,
    error,
    createMeasurement,
    isCreating,
    updateMeasurement,
    isUpdating,
    deleteMeasurement,
    isDeleting,
    refetch,
  } = useMeasurements({
    page: currentPage,
    page_size: pageSize,
    sort: "desc", // Most recent first
  });

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle edit measurement
  const handleEdit = (measurement: MeasurementDTO) => {
    setEditingMeasurement(measurement);
    setIsEditDialogOpen(true);
  };

  // Handle update measurement
  const handleUpdateMeasurement = async (id: string, data: CreateMeasurementCommand) => {
    return new Promise<void>((resolve, reject) => {
      updateMeasurement(
        { id, data },
        {
          onSuccess: () => {
            toast.success("Pomiar został zaktualizowany", {
              description: "Zmiany zostały pomyślnie zapisane.",
            });
            resolve();
          },
          onError: (error) => {
            toast.error("Nie udało się zaktualizować pomiaru", {
              description: error.message || "Spróbuj ponownie później.",
            });
            reject(error);
          },
        }
      );
    });
  };

  const handleEditSuccess = () => {
    setEditingMeasurement(null);
    setIsEditDialogOpen(false);
  };

  const handleEditDialogOpenChange = (open: boolean) => {
    setIsEditDialogOpen(open);
    if (!open) {
      setEditingMeasurement(null);
    }
  };

  // Handle delete measurement
  const handleDelete = (id: string) => {
    deleteMeasurement(id, {
      onSuccess: () => {
        toast.success("Pomiar został usunięty", {
          description: "Pomiar został trwale usunięty z systemu.",
        });
      },
      onError: (error) => {
        toast.error("Nie udało się usunąć pomiaru", {
          description: error.message || "Spróbuj ponownie później.",
        });
      },
    });
  };

  // Handle add measurement
  const handleAddMeasurement = async (data: CreateMeasurementCommand) => {
    return new Promise<void>((resolve, reject) => {
      createMeasurement(data, {
        onSuccess: () => {
          toast.success("Pomiar został dodany", {
            description: "Twój pomiar ciśnienia został pomyślnie zapisany.",
          });
          // Reset to first page to see the new measurement
          setCurrentPage(1);
          resolve();
        },
        onError: (error) => {
          toast.error("Nie udało się dodać pomiaru", {
            description: error.message || "Spróbuj ponownie później.",
          });
          reject(error);
        },
      });
    });
  };

  const handleAddSuccess = () => {
    // Additional actions after successful add (if needed)
  };

  // Handle CSV export
  const handleExport = async () => {
    try {
      // Call the API to get CSV data
      const blob = await measurementApiClient.exportMeasurements();

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `pomiary-cisnienia-${new Date().toISOString().split("T")[0]}.csv`;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Eksport zakończony", {
        description: "Plik CSV został pobrany.",
      });
    } catch (error: unknown) {
      // eslint-disable-next-line no-console
      console.error("CSV export error:", error);
      toast.error("Nie udało się wyeksportować danych", {
        description: "Spróbuj ponownie później.",
      });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div
            className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"
            role="status"
          >
            <span className="sr-only">Ładowanie...</span>
          </div>
          <p className="text-sm text-muted-foreground">Ładowanie pomiarów...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <h2 className="mb-2 text-lg font-semibold text-destructive">Wystąpił błąd</h2>
          <p className="mb-4 text-sm text-muted-foreground">Nie udało się załadować pomiarów. Spróbuj ponownie.</p>
          <Button onClick={() => refetch()} variant="outline">
            Spróbuj ponownie
          </Button>
        </div>
      </div>
    );
  }

  // Main content
  return (
    <>
      <div className="container mx-auto max-w-6xl py-8 px-4">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Lista Pomiarów</h1>
          <p className="mt-2 text-sm text-muted-foreground">Przeglądaj historię swoich pomiarów ciśnienia krwi</p>
        </header>

        <div className="space-y-6">
          {/* Action buttons */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {total > 0 && (
                <span>
                  Znaleziono <strong>{total}</strong> {total === 1 ? "pomiar" : "pomiarów"}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleExport} variant="outline" disabled={total === 0}>
                <Download className="mr-2 h-4 w-4" />
                Eksportuj CSV
              </Button>
              <AddMeasurementDialog
                trigger={
                  <Button data-test-id="add-measurement-button">
                    <Plus className="mr-2 h-4 w-4" />
                    Dodaj pomiar
                  </Button>
                }
                onSubmit={handleAddMeasurement}
                onSuccess={handleAddSuccess}
                isSubmitting={isCreating}
              />
            </div>
          </div>

          {/* Empty state */}
          {total === 0 ? (
            <div className="rounded-lg border bg-card p-12 text-center">
              <p className="mb-4 text-lg font-medium">Brak pomiarów</p>
              <p className="mb-6 text-sm text-muted-foreground">Nie masz jeszcze żadnych pomiarów ciśnienia krwi.</p>
              <AddMeasurementDialog
                trigger={
                  <Button data-test-id="add-first-measurement-button">
                    <Plus className="mr-2 h-4 w-4" />
                    Dodaj swój pierwszy pomiar
                  </Button>
                }
                onSubmit={handleAddMeasurement}
                onSuccess={handleAddSuccess}
                isSubmitting={isCreating}
              />
            </div>
          ) : (
            <>
              {/* Table */}
              <MeasurementTable
                measurements={measurements}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isDeleting={isDeleting}
              />

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => handlePageChange(currentPage - 1)}
                          aria-disabled={currentPage === 1}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>

                      {/* Page numbers */}
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        // Show first page, last page, current page, and pages around current
                        const showPage =
                          page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1);

                        if (!showPage) {
                          // Show ellipsis
                          if (page === currentPage - 2 || page === currentPage + 2) {
                            return (
                              <PaginationItem key={page}>
                                <span className="px-2">...</span>
                              </PaginationItem>
                            );
                          }
                          return null;
                        }

                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => handlePageChange(page)}
                              isActive={page === currentPage}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => handlePageChange(currentPage + 1)}
                          aria-disabled={currentPage === totalPages}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      {editingMeasurement && (
        <EditMeasurementDialog
          open={isEditDialogOpen}
          onOpenChange={handleEditDialogOpenChange}
          measurement={editingMeasurement}
          onSubmit={handleUpdateMeasurement}
          onSuccess={handleEditSuccess}
          isSubmitting={isUpdating}
        />
      )}

      <Toaster />
    </>
  );
}

/**
 * Main MeasurementsView component with QueryClientProvider
 * This is the entry point for the measurements list page
 */
export default function MeasurementsView() {
  return (
    <QueryClientProvider client={queryClient}>
      <MeasurementsViewContent />
    </QueryClientProvider>
  );
}
