// src/pages/api/measurements/index.ts
import type { APIRoute } from "astro";
import { ZodError } from "zod";

import { CreateMeasurementSchema } from "../../../lib/validators/measurement";
import { MeasurementService, MeasurementDuplicateError } from "../../../lib/services/measurement.service";
import { DEFAULT_USER_ID } from "../../../db/supabase.client";
import type { MeasurementDTO } from "../../../types";

export const prerender = false;

/**
 * POST /api/measurements
 *
 * Creates a new blood pressure measurement.
 * Validates input, classifies BP according to ESC/ESH 2023 guidelines,
 * stores measurement and creates interpretation log.
 *
 * @returns 201 - Measurement created successfully
 * @returns 400 - Invalid request body, validation error, or duplicate timestamp
 * @returns 401 - Unauthorized (not implemented yet)
 * @returns 500 - Server error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: "ValidationError",
          details: "Invalid JSON in request body",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const validatedData = CreateMeasurementSchema.parse(body);

    // 2. Create measurement via service (using DEFAULT_USER_ID for now)
    const measurementService = new MeasurementService(locals.supabase);
    const measurement: MeasurementDTO = await measurementService.create(validatedData, DEFAULT_USER_ID);

    // 3. Return created measurement with 201 status
    return new Response(JSON.stringify(measurement), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle validation errors from Zod
    if (error instanceof ZodError) {
      return new Response(
        JSON.stringify({
          error: "ValidationError",
          details: error.flatten(),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle duplicate measurement (unique constraint violation)
    if (error instanceof MeasurementDuplicateError) {
      return new Response(
        JSON.stringify({
          error: "MeasurementDuplicate",
          message: "Measurement already exists for given timestamp",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("[POST /api/measurements] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "ServerError",
        message: "An unexpected error occurred",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
