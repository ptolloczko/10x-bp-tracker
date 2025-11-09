// src/pages/api/measurements/export.ts
import type { APIRoute } from "astro";

import { MeasurementService } from "../../../lib/services/measurement.service";

export const prerender = false;

/**
 * GET /api/measurements/export
 *
 * Exports all blood pressure measurements for the authenticated user as CSV.
 * Returns data sorted by measured_at (descending).
 * Requires authentication.
 *
 * @returns 200 - CSV file with all measurements
 * @returns 401 - Unauthorized
 * @returns 500 - Server error
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    // 1. Check authentication
    if (!locals.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Fetch all measurements (no pagination)
    const measurementService = new MeasurementService(locals.supabase);
    const response = await measurementService.list(locals.user.id, {
      page: 1,
      page_size: 10000, // Large number to get all measurements
      sort: "desc",
    });

    // 3. Generate CSV content
    const csv = generateCSV(response.data);

    // 4. Return CSV file
    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="pomiary-cisnienia-${new Date().toISOString().split("T")[0]}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    // Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("[GET /api/measurements/export] Unexpected error:", error);
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
 * Generates CSV content from measurements data
 */
function generateCSV(
  measurements: {
    id: string;
    sys: number;
    dia: number;
    pulse: number;
    measured_at: string;
    level: string;
    notes: string | null;
    created_at: string;
    updated_at: string;
  }[]
): string {
  // CSV Header (Polish labels)
  const header = ["Data i czas pomiaru", "SYS (mmHg)", "DIA (mmHg)", "Tętno (bpm)", "Poziom ciśnienia", "Notatki"].join(
    ","
  );

  // CSV Rows
  const rows = measurements.map((m) => {
    const measuredAt = new Date(m.measured_at).toLocaleString("pl-PL");
    const levelLabel = getLevelLabel(m.level);
    const notes = m.notes ? escapeCSVField(m.notes) : "";

    return [measuredAt, m.sys, m.dia, m.pulse, levelLabel, notes].join(",");
  });

  return [header, ...rows].join("\n");
}

/**
 * Escapes CSV field (handles commas, quotes, and newlines)
 */
function escapeCSVField(field: string): string {
  // If field contains comma, quote, or newline, wrap in quotes and escape existing quotes
  if (field.includes(",") || field.includes('"') || field.includes("\n")) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

/**
 * Maps level enum to Polish label
 */
function getLevelLabel(level: string): string {
  const labels: Record<string, string> = {
    optimal: "Optymalne",
    normal: "Normalne",
    high_normal: "Wysokie normalne",
    grade1: "Nadciśnienie I°",
    grade2: "Nadciśnienie II°",
    grade3: "Nadciśnienie III°",
    hypertensive_crisis: "Przełom nadciśnieniowy",
  };

  return labels[level] || level;
}
