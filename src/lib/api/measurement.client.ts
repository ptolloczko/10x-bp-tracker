// src/lib/api/measurement.client.ts
import type {
  MeasurementDTO,
  MeasurementListResponse,
  MeasurementListQuery,
  CreateMeasurementCommand,
  UpdateMeasurementCommand,
} from "@/types";

/**
 * Client for measurement API endpoints
 */
export class MeasurementApiClient {
  /**
   * Fetches paginated list of measurements with optional filters
   *
   * @param query - Query parameters for filtering and pagination
   * @returns Paginated list of measurements
   * @throws {Error} When the request fails
   */
  async getMeasurements(query?: MeasurementListQuery): Promise<MeasurementListResponse> {
    const params = new URLSearchParams();

    if (query?.page !== undefined) params.append("page", query.page.toString());
    if (query?.page_size !== undefined) params.append("page_size", query.page_size.toString());
    if (query?.from) params.append("from", query.from);
    if (query?.to) params.append("to", query.to);
    if (query?.level) params.append("level", query.level);
    if (query?.sort) params.append("sort", query.sort);

    const url = `/api/measurements${params.toString() ? `?${params.toString()}` : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch measurements");
    }

    return response.json();
  }

  /**
   * Creates a new measurement
   *
   * @param data - Measurement data to create
   * @returns The created measurement
   * @throws {Error} When the request fails
   */
  async createMeasurement(data: CreateMeasurementCommand): Promise<MeasurementDTO> {
    const response = await fetch("/api/measurements", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      if (response.status === 400) {
        const error = await response.json();
        throw new Error(error.details || "Validation error");
      }
      throw new Error("Failed to create measurement");
    }

    return response.json();
  }

  /**
   * Updates an existing measurement
   *
   * @param id - Measurement ID
   * @param data - Partial measurement data to update
   * @returns The updated measurement
   * @throws {Error} When the request fails
   */
  async updateMeasurement(id: string, data: UpdateMeasurementCommand): Promise<MeasurementDTO> {
    const response = await fetch(`/api/measurements/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      if (response.status === 400) {
        const error = await response.json();
        throw new Error(error.details || "Validation error");
      }
      if (response.status === 404) {
        throw new Error("Measurement not found");
      }
      throw new Error("Failed to update measurement");
    }

    return response.json();
  }

  /**
   * Deletes a measurement (soft delete)
   *
   * @param id - Measurement ID
   * @throws {Error} When the request fails
   */
  async deleteMeasurement(id: string): Promise<void> {
    const response = await fetch(`/api/measurements/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Measurement not found");
      }
      throw new Error("Failed to delete measurement");
    }
  }

  /**
   * Exports all measurements to CSV
   *
   * @returns CSV content as blob
   * @throws {Error} When the request fails
   */
  async exportMeasurements(): Promise<Blob> {
    const response = await fetch("/api/measurements/export", {
      method: "GET",
      headers: {
        Accept: "text/csv",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to export measurements");
    }

    return response.blob();
  }
}

// Export singleton instance
export const measurementApiClient = new MeasurementApiClient();
