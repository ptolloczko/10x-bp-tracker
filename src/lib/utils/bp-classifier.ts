// src/lib/utils/bp-classifier.ts
import type { Database } from "../../db/database.types";

type BpLevel = Database["public"]["Enums"]["bp_level"];

/**
 * Classifies blood pressure according to ESC/ESH 2023 guidelines.
 *
 * Classification levels:
 * - optimal: sys < 120 AND dia < 80
 * - normal: sys 120-129 OR dia 80-84
 * - high_normal: sys 130-139 OR dia 85-89
 * - grade1: sys 140-159 OR dia 90-99
 * - grade2: sys 160-179 OR dia 100-109
 * - grade3: sys >= 180 OR dia >= 110
 * - hypertensive_crisis: sys >= 180 AND dia >= 120
 *
 * @param sys - Systolic blood pressure (mmHg)
 * @param dia - Diastolic blood pressure (mmHg)
 * @returns Blood pressure level classification
 */
export function classify(sys: number, dia: number): BpLevel {
  // Hypertensive crisis (most severe - check first)
  if (sys >= 180 && dia >= 120) {
    return "hypertensive_crisis";
  }

  // Grade 3 hypertension
  if (sys >= 180 || dia >= 110) {
    return "grade3";
  }

  // Grade 2 hypertension
  if (sys >= 160 || dia >= 100) {
    return "grade2";
  }

  // Grade 1 hypertension
  if (sys >= 140 || dia >= 90) {
    return "grade1";
  }

  // High normal
  if (sys >= 130 || dia >= 85) {
    return "high_normal";
  }

  // Normal
  if (sys >= 120 || dia >= 80) {
    return "normal";
  }

  // Optimal
  return "optimal";
}
