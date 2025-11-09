// src/lib/services/measurement.service.ts
import type { SupabaseClient } from "../../db/supabase.client";
import type { CreateMeasurementCommand, MeasurementDTO } from "../../types";
import { classify } from "../utils/bp-classifier";

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
}
