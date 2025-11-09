// src/lib/services/measurement.service.ts
import type { SupabaseClient } from "../../db/supabase.client";
import type { Database } from "../../db/database.types";
import type {
  CreateMeasurementCommand,
  MeasurementDTO,
  MeasurementListQuery,
  MeasurementListResponse,
} from "../../types";
import { classify } from "../utils/bp-classifier";

type BpLevel = Database["public"]["Enums"]["bp_level"];

/**
 * Custom error thrown when attempting to create a measurement with a duplicate timestamp.
 */
export class MeasurementDuplicateError extends Error {
  constructor(measuredAt: string) {
    super(`Measurement already exists for timestamp: ${measuredAt}`);
    this.name = "MeasurementDuplicateError";
  }
}

/**
 * Custom error thrown when a measurement is not found.
 */
export class MeasurementNotFoundError extends Error {
  constructor(id: string) {
    super(`Measurement not found: ${id}`);
    this.name = "MeasurementNotFoundError";
  }
}

/**
 * Service for managing blood pressure measurements.
 */
export class MeasurementService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Creates a new blood pressure measurement for the given user.
   *
   * Process:
   * 1. Classifies blood pressure using ESC/ESH 2023 guidelines
   * 2. Inserts measurement record with calculated level
   * 3. Creates interpretation log entry
   * 4. Returns the created measurement
   *
   * @param data - Measurement data from the request
   * @param userId - The authenticated user's ID
   * @returns The created measurement with classification
   * @throws {MeasurementDuplicateError} If measurement already exists for the timestamp
   * @throws {Error} For other database errors
   */
  async create(data: CreateMeasurementCommand, userId: string): Promise<MeasurementDTO> {
    // Step 1: Classify blood pressure
    const level = classify(data.sys, data.dia);

    // Step 2: Insert measurement
    const { data: newMeasurement, error: insertError } = await this.supabase
      .from("measurements")
      .insert({
        user_id: userId,
        sys: data.sys,
        dia: data.dia,
        pulse: data.pulse,
        measured_at: data.measured_at,
        notes: data.notes ?? null,
        level,
      })
      .select()
      .single();

    if (insertError) {
      // Handle unique constraint violation (duplicate measured_at for user)
      if (insertError.code === "23505") {
        throw new MeasurementDuplicateError(data.measured_at);
      }

      // eslint-disable-next-line no-console
      console.error("[MeasurementService] Error creating measurement:", insertError);
      throw new Error("Failed to create measurement");
    }

    // Step 3: Create interpretation log entry
    const { error: logError } = await this.supabase.from("interpretation_logs").insert({
      user_id: userId,
      measurement_id: newMeasurement.id,
      sys: data.sys,
      dia: data.dia,
      pulse: data.pulse,
      level,
      notes: data.notes ?? null,
    });

    if (logError) {
      // eslint-disable-next-line no-console
      console.error("[MeasurementService] Error creating interpretation log:", logError);
      // Non-critical error - we still return the measurement
      // In production, you might want to log this to a monitoring service
    }

    // Step 4: Map to DTO (remove internal fields)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user_id, deleted, ...measurementDTO } = newMeasurement;

    return measurementDTO;
  }

  /**
   * Retrieves a paginated list of measurements for the given user.
   *
   * @param userId - The authenticated user's ID
   * @param query - Query parameters (page, page_size, filters, sort)
   * @returns Paginated list of measurements
   * @throws {Error} For database errors
   */
  async list(userId: string, query: MeasurementListQuery): Promise<MeasurementListResponse> {
    const page = query.page ?? 1;
    const pageSize = query.page_size ?? 20;
    const sort = query.sort ?? "desc";

    // Calculate range for pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Build base query
    let queryBuilder = this.supabase
      .from("measurements")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .eq("deleted", false);

    // Apply filters
    if (query.from) {
      queryBuilder = queryBuilder.gte("measured_at", query.from);
    }

    if (query.to) {
      queryBuilder = queryBuilder.lte("measured_at", query.to);
    }

    if (query.level) {
      // Handle both single level and comma-separated list
      const levels = query.level.includes(",") ? (query.level.split(",") as BpLevel[]) : ([query.level] as BpLevel[]);
      queryBuilder = queryBuilder.in("level", levels);
    }

    // Apply sorting
    queryBuilder = queryBuilder.order("measured_at", { ascending: sort === "asc" });

    // Apply pagination
    queryBuilder = queryBuilder.range(from, to);

    // Execute query
    const { data: measurements, error, count } = await queryBuilder;

    if (error) {
      // eslint-disable-next-line no-console
      console.error("[MeasurementService] Error listing measurements:", error);
      throw new Error("Failed to list measurements");
    }

    // Map to DTOs (remove internal fields)
    const measurementDTOs: MeasurementDTO[] = (measurements ?? []).map((measurement) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { user_id, deleted, ...dto } = measurement;
      return dto;
    });

    return {
      data: measurementDTOs,
      page,
      page_size: pageSize,
      total: count ?? 0,
    };
  }

  /**
   * Updates an existing measurement for the given user.
   *
   * Process:
   * 1. Fetches the existing measurement
   * 2. Merges with update data
   * 3. Re-classifies BP if sys/dia changed
   * 4. Updates measurement record
   * 5. Creates new interpretation log entry
   * 6. Returns the updated measurement
   *
   * @param id - Measurement ID
   * @param data - Partial measurement data to update
   * @param userId - The authenticated user's ID
   * @returns The updated measurement
   * @throws {MeasurementNotFoundError} If measurement not found
   * @throws {MeasurementDuplicateError} If measured_at conflicts with another measurement
   * @throws {Error} For other database errors
   */
  async update(id: string, data: Partial<CreateMeasurementCommand>, userId: string): Promise<MeasurementDTO> {
    // Step 1: Fetch existing measurement
    const { data: existing, error: fetchError } = await this.supabase
      .from("measurements")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .eq("deleted", false)
      .single();

    if (fetchError || !existing) {
      if (fetchError?.code === "PGRST116") {
        throw new MeasurementNotFoundError(id);
      }
      // eslint-disable-next-line no-console
      console.error("[MeasurementService] Error fetching measurement:", fetchError);
      throw new Error("Failed to fetch measurement");
    }

    // Step 2: Merge data
    const updatedData = {
      sys: data.sys ?? existing.sys,
      dia: data.dia ?? existing.dia,
      pulse: data.pulse ?? existing.pulse,
      measured_at: data.measured_at ?? existing.measured_at,
      notes: data.notes !== undefined ? data.notes : existing.notes,
    };

    // Step 3: Re-classify if BP changed
    const level = classify(updatedData.sys, updatedData.dia);

    // Step 4: Update measurement
    const { data: updated, error: updateError } = await this.supabase
      .from("measurements")
      .update({
        ...updatedData,
        level,
      })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (updateError) {
      // Handle unique constraint violation (duplicate measured_at for user)
      if (updateError.code === "23505") {
        throw new MeasurementDuplicateError(updatedData.measured_at);
      }

      // eslint-disable-next-line no-console
      console.error("[MeasurementService] Error updating measurement:", updateError);
      throw new Error("Failed to update measurement");
    }

    // Step 5: Create new interpretation log entry
    const { error: logError } = await this.supabase.from("interpretation_logs").insert({
      user_id: userId,
      measurement_id: id,
      sys: updatedData.sys,
      dia: updatedData.dia,
      pulse: updatedData.pulse,
      level,
      notes: updatedData.notes ?? null,
    });

    if (logError) {
      // eslint-disable-next-line no-console
      console.error("[MeasurementService] Error creating interpretation log:", logError);
      // Non-critical error - we still return the measurement
    }

    // Step 6: Map to DTO
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user_id, deleted, ...measurementDTO } = updated;

    return measurementDTO;
  }

  /**
   * Soft-deletes a measurement (sets deleted=true).
   *
   * @param id - Measurement ID
   * @param userId - The authenticated user's ID
   * @throws {MeasurementNotFoundError} If measurement not found
   * @throws {Error} For database errors
   */
  async delete(id: string, userId: string): Promise<void> {
    // First check if measurement exists and is not already deleted
    const { data: existing, error: fetchError } = await this.supabase
      .from("measurements")
      .select("id, deleted")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (fetchError || !existing) {
      throw new MeasurementNotFoundError(id);
    }

    // If already deleted, throw error (not idempotent)
    if (existing.deleted) {
      throw new MeasurementNotFoundError(id);
    }

    // Perform soft delete
    const { error } = await this.supabase
      .from("measurements")
      .update({ deleted: true })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      // eslint-disable-next-line no-console
      console.error("[MeasurementService] Error deleting measurement:", error);
      throw new Error("Failed to delete measurement");
    }
  }
}
