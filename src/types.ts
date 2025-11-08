// src/types.ts
import type { Tables, TablesInsert } from "./db/database.types";

/* -------------------------------------------------------------------
   Generic helpers
------------------------------------------------------------------- */

/**
 * Standard wrapper used by list endpoints.
 */
export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  page_size: number;
  total: number;
}

/* -------------------------------------------------------------------
   Entities (raw DB rows) – handy aliases
------------------------------------------------------------------- */
export type ProfileEntity = Tables<"profiles">;
export type MeasurementEntity = Tables<"measurements">;
export type InterpretationLogEntity = Tables<"interpretation_logs">;

/* -------------------------------------------------------------------
   Profile
------------------------------------------------------------------- */

/**
 * DTO returned by GET /api/profile
 */
export type ProfileDTO = ProfileEntity;

/**
 * Body accepted by POST /api/profile
 */
export type CreateProfileCommand = Omit<
  TablesInsert<"profiles">,
  "user_id" | "created_at" | "updated_at" | "reminder_enabled"
> & {
  /** IANA timezone identifier is required by the API spec */
  timezone: string;
};

/**
 * Body accepted by PUT /api/profile (PATCH style)
 */
export type UpdateProfileCommand = Partial<Omit<ProfileEntity, "user_id" | "created_at" | "updated_at">>;

/**
 * Body accepted by POST /api/profile/reminder
 */
export interface ToggleReminderCommand {
  enabled: boolean;
}

/* -------------------------------------------------------------------
   Measurements
------------------------------------------------------------------- */

/**
 * DTO returned by all measurement read endpoints.
 * Internal linking fields (`user_id`) and soft-delete flag are hidden
 * from the client.
 */
export type MeasurementDTO = Omit<MeasurementEntity, "user_id" | "deleted">;

/**
 * Body accepted by POST /api/measurements
 */
export type CreateMeasurementCommand = Pick<MeasurementEntity, "sys" | "dia" | "pulse" | "measured_at" | "notes">;

/**
 * Body accepted by PUT /api/measurements/{id}
 */
export type UpdateMeasurementCommand = Partial<CreateMeasurementCommand>;

/**
 * Response returned by GET /api/measurements
 */
export type MeasurementListResponse = PaginatedResponse<MeasurementDTO>;

/**
 * Query-string params accepted by GET /api/measurements
 */
export interface MeasurementListQuery {
  page?: number;
  page_size?: number;
  from?: string; // ISO datetime
  to?: string; // ISO datetime
  level?: MeasurementEntity["level"] | `${MeasurementEntity["level"]},${MeasurementEntity["level"]}`; // allow comma-separated list
  sort?: "asc" | "desc";
}

/* -------------------------------------------------------------------
   Interpretation Logs
------------------------------------------------------------------- */

/**
 * DTO used by interpretation-log endpoints.
 */
export type InterpretationLogDTO = Omit<InterpretationLogEntity, "user_id">;

/**
 * Response returned by log list endpoints.
 */
export type InterpretationLogListResponse = PaginatedResponse<InterpretationLogDTO>;
