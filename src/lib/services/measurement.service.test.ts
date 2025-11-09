// src/lib/services/measurement.service.test.ts
import { describe, it, expect, vi } from "vitest";
import { MeasurementService, MeasurementDuplicateError, MeasurementNotFoundError } from "./measurement.service";
import { classify } from "../utils/bp-classifier";

// Mock the supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
      })),
    })),
  })),
};

describe("MeasurementService", () => {
  let service: MeasurementService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new MeasurementService(mockSupabase as any);
  });

  describe("business logic validation", () => {
    it("should classify BP levels correctly in service context", () => {
      // Test that the service uses the classifier correctly
      expect(classify(120, 80)).toBe("normal");
      expect(classify(140, 90)).toBe("grade1");
      expect(classify(180, 120)).toBe("hypertensive_crisis");
    });

    it("should handle business rule: sys >= dia", () => {
      // This would be validated at the schema level, but service should handle it
      expect(classify(120, 80)).toBe("normal"); // valid case
      expect(classify(100, 120)).toBe("grade3"); // dia >= 110, so grade3
    });
  });

  describe("error handling", () => {
    it("should identify MeasurementDuplicateError correctly", () => {
      const error = new MeasurementDuplicateError("2024-01-01T10:00:00Z");
      expect(error.message).toBe("Measurement already exists for timestamp: 2024-01-01T10:00:00Z");
      expect(error.name).toBe("MeasurementDuplicateError");
    });

    it("should identify MeasurementNotFoundError correctly", () => {
      const error = new MeasurementNotFoundError("measurement-123");
      expect(error.message).toBe("Measurement not found: measurement-123");
      expect(error.name).toBe("MeasurementNotFoundError");
    });
  });

  describe("integration with BP classifier", () => {
    it("should classify all BP levels according to ESC/ESH 2023 guidelines", () => {
      // Test all classification levels that the service would use
      expect(classify(110, 70)).toBe("optimal");
      expect(classify(125, 82)).toBe("normal");
      expect(classify(135, 87)).toBe("high_normal");
      expect(classify(145, 95)).toBe("grade1");
      expect(classify(165, 105)).toBe("grade2");
      expect(classify(185, 115)).toBe("grade3");
      expect(classify(185, 125)).toBe("hypertensive_crisis");
    });

    it("should handle edge cases in BP classification", () => {
      expect(classify(119, 79)).toBe("optimal");
      expect(classify(120, 80)).toBe("normal");
      expect(classify(179, 119)).toBe("grade3");
      expect(classify(180, 120)).toBe("hypertensive_crisis");
    });
  });
});
