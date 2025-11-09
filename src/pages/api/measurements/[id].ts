// src/pages/api/measurements/[id].ts
import type { APIRoute } from "astro";
import { ZodError } from "zod";

import { UpdateMeasurementSchema } from "../../../lib/validators/measurement";
import {
  MeasurementService,
  MeasurementDuplicateError,
  MeasurementNotFoundError,
} from "../../../lib/services/measurement.service";
import type { MeasurementDTO } from "../../../types";

export const prerender = false;

/**
 * PUT /api/measurements/{id}
 *
 * Updates an existing blood pressure measurement.
 * Re-validates values, re-computes classification, and logs a new interpretation entry.
 * Requires authentication.
 *
 * @returns 200 - Measurement updated successfully
 * @returns 400 - Invalid request body, validation error, or duplicate timestamp
 * @returns 401 - Unauthorized
 * @returns 404 - Measurement not found
 * @returns 500 - Server error
 */
export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(
        JSON.stringify({
          error: "ValidationError",
          message: "Measurement ID is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 1. Check authentication
    if (!locals.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Parse and validate request body
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

    const validatedData = UpdateMeasurementSchema.parse(body);

    // 3. Update measurement via service using authenticated user's ID
    const measurementService = new MeasurementService(locals.supabase);
    const measurement: MeasurementDTO = await measurementService.update(id, validatedData, locals.user.id);

    // 4. Return updated measurement
    return new Response(JSON.stringify(measurement), {
      status: 200,
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

    // Handle measurement not found
    if (error instanceof MeasurementNotFoundError) {
      return new Response(
        JSON.stringify({
          error: "MeasurementNotFound",
          message: "Measurement not found",
        }),
        {
          status: 404,
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
    console.error("[PUT /api/measurements/:id] Unexpected error:", error);
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

/**
 * DELETE /api/measurements/{id}
 *
 * Soft-deletes a measurement (sets deleted=true).
 * Requires authentication.
 *
 * @returns 204 - Measurement deleted successfully
 * @returns 401 - Unauthorized
 * @returns 404 - Measurement not found
 * @returns 500 - Server error
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(
        JSON.stringify({
          error: "ValidationError",
          message: "Measurement ID is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 1. Check authentication
    if (!locals.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Delete measurement via service using authenticated user's ID
    const measurementService = new MeasurementService(locals.supabase);
    await measurementService.delete(id, locals.user.id);

    // 3. Return 204 No Content
    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    // Handle measurement not found
    if (error instanceof MeasurementNotFoundError) {
      return new Response(
        JSON.stringify({
          error: "MeasurementNotFound",
          message: "Measurement not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("[DELETE /api/measurements/:id] Unexpected error:", error);
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
