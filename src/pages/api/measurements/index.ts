// src/pages/api/measurements/index.ts
import type { APIRoute } from "astro";
import { ZodError } from "zod";

import { CreateMeasurementSchema, GetMeasurementsQuerySchema } from "../../../lib/validators/measurement";
import { MeasurementService, MeasurementDuplicateError } from "../../../lib/services/measurement.service";
import type { MeasurementDTO, MeasurementListResponse } from "../../../types";

export const prerender = false;

/**
 * GET /api/measurements
 *
 * Returns a paginated list of blood pressure measurements for the authenticated user.
 * Supports filtering by date range, BP level, and sorting.
 * Requires authentication.
 *
 * @returns 200 - Paginated list of measurements
 * @returns 400 - Invalid query parameters
 * @returns 401 - Unauthorized
 * @returns 500 - Server error
 */
export const GET: APIRoute = async ({ url, locals }) => {
  try {
    // 1. Check authentication
    if (!locals.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Parse and validate query parameters
    const queryParams = Object.fromEntries(url.searchParams);
    const validatedQuery = GetMeasurementsQuerySchema.parse(queryParams);

    // 3. Fetch measurements via service using authenticated user's ID
    const measurementService = new MeasurementService(locals.supabase);
    const response: MeasurementListResponse = await measurementService.list(
      locals.user.id,
      validatedQuery as Parameters<typeof measurementService.list>[1]
    );

    // 4. Return paginated measurements
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
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

    // Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("[GET /api/measurements] Unexpected error:", error);
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
 * POST /api/measurements
 *
 * Creates a new blood pressure measurement.
 * Validates input, classifies BP according to ESC/ESH 2023 guidelines,
 * stores measurement and creates interpretation log.
 * Requires authentication.
 *
 * @returns 201 - Measurement created successfully
 * @returns 400 - Invalid request body, validation error, or duplicate timestamp
 * @returns 401 - Unauthorized
 * @returns 500 - Server error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
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

    const validatedData = CreateMeasurementSchema.parse(body);

    // 3. Create measurement via service using authenticated user's ID
    const measurementService = new MeasurementService(locals.supabase);
    const measurement: MeasurementDTO = await measurementService.create(validatedData, locals.user.id);

    // 4. Return created measurement with 201 status
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
