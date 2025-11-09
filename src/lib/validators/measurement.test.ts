// src/lib/validators/measurement.test.ts
import { describe, it, expect } from "vitest";
import {
  CreateMeasurementSchema,
  UpdateMeasurementSchema,
  GetMeasurementsQuerySchema,
} from "./measurement";

describe("Measurement Validators", () => {
  describe("CreateMeasurementSchema", () => {
    describe("valid inputs", () => {
      it("should accept valid measurement data", () => {
        const validData = {
          sys: 120,
          dia: 80,
          pulse: 70,
          measured_at: "2024-01-01T10:00:00.000Z",
          notes: "Test measurement",
        };

        const result = CreateMeasurementSchema.parse(validData);
        expect(result).toEqual(validData);
      });

      it("should accept measurement without notes", () => {
        const dataWithoutNotes = {
          sys: 120,
          dia: 80,
          pulse: 70,
          measured_at: "2024-01-01T10:00:00.000Z",
        };

        const result = CreateMeasurementSchema.parse(dataWithoutNotes);
        expect(result.notes).toBeUndefined();
      });

      it("should accept minimal values", () => {
        const minimalData = {
          sys: 1,
          dia: 1,
          pulse: 1,
          measured_at: "2024-01-01T10:00:00.000Z",
        };

        const result = CreateMeasurementSchema.parse(minimalData);
        expect(result).toEqual(minimalData);
      });

      it("should accept maximum values", () => {
        const maxData = {
          sys: 32767,
          dia: 32766, // sys must be >= dia
          pulse: 32767,
          measured_at: "2024-01-01T10:00:00.000Z",
          notes: "x".repeat(255), // max length
        };

        const result = CreateMeasurementSchema.parse(maxData);
        expect(result).toEqual(maxData);
      });
    });

    describe("business rules", () => {
      it("should enforce sys >= dia rule", () => {
        const invalidData = {
          sys: 100,
          dia: 120, // dia > sys
          pulse: 70,
          measured_at: "2024-01-01T10:00:00.000Z",
        };

        expect(() => CreateMeasurementSchema.parse(invalidData)).toThrow(
          "Ciśnienie skurczowe musi być większe lub równe rozkurczowemu"
        );
      });

      it("should allow sys == dia", () => {
        const equalData = {
          sys: 100,
          dia: 100,
          pulse: 70,
          measured_at: "2024-01-01T10:00:00.000Z",
        };

        const result = CreateMeasurementSchema.parse(equalData);
        expect(result.sys).toBe(result.dia);
      });
    });

    describe("validation errors", () => {
      it("should reject missing required fields", () => {
        const incompleteData = {
          sys: 120,
          dia: 80,
          // missing pulse and measured_at
        };

        expect(() => CreateMeasurementSchema.parse(incompleteData)).toThrow();
      });

      it("should reject non-integer values", () => {
        const floatData = {
          sys: 120.5,
          dia: 80,
          pulse: 70,
          measured_at: "2024-01-01T10:00:00.000Z",
        };

        expect(() => CreateMeasurementSchema.parse(floatData)).toThrow(
          "Ciśnienie skurczowe musi być liczbą całkowitą"
        );
      });

      it("should reject negative values", () => {
        const negativeData = {
          sys: -10,
          dia: 80,
          pulse: 70,
          measured_at: "2024-01-01T10:00:00.000Z",
        };

        expect(() => CreateMeasurementSchema.parse(negativeData)).toThrow(
          "Ciśnienie skurczowe musi być większe od 0"
        );
      });

      it("should reject future dates", () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 1); // tomorrow

        const futureData = {
          sys: 120,
          dia: 80,
          pulse: 70,
          measured_at: futureDate.toISOString(),
        };

        expect(() => CreateMeasurementSchema.parse(futureData)).toThrow(
          "Data pomiaru nie może być w przyszłości"
        );
      });

      it("should reject invalid datetime format", () => {
        const invalidDateData = {
          sys: 120,
          dia: 80,
          pulse: 70,
          measured_at: "2024-01-01", // not ISO 8601
        };

        expect(() => CreateMeasurementSchema.parse(invalidDateData)).toThrow(
          "Data pomiaru musi być w formacie ISO 8601"
        );
      });

      it("should reject notes too long", () => {
        const longNotesData = {
          sys: 120,
          dia: 80,
          pulse: 70,
          measured_at: "2024-01-01T10:00:00.000Z",
          notes: "x".repeat(256), // 256 characters, max is 255
        };

        expect(() => CreateMeasurementSchema.parse(longNotesData)).toThrow(
          "Notatka nie może być dłuższa niż 255 znaków"
        );
      });

      it("should reject extra fields", () => {
        const extraFieldData = {
          sys: 120,
          dia: 80,
          pulse: 70,
          measured_at: "2024-01-01T10:00:00.000Z",
          extraField: "should not be here",
        };

        expect(() => CreateMeasurementSchema.parse(extraFieldData)).toThrow();
      });
    });

    describe("edge cases", () => {
      it("should handle current datetime", () => {
        const nowData = {
          sys: 120,
          dia: 80,
          pulse: 70,
          measured_at: new Date().toISOString(),
        };

        const result = CreateMeasurementSchema.parse(nowData);
        expect(result).toBeDefined();
      });

      it("should handle very old dates", () => {
        const oldDateData = {
          sys: 120,
          dia: 80,
          pulse: 70,
          measured_at: "1900-01-01T00:00:00.000Z",
        };

        const result = CreateMeasurementSchema.parse(oldDateData);
        expect(result).toBeDefined();
      });
    });
  });

  describe("UpdateMeasurementSchema", () => {
    it("should accept partial update data", () => {
      const partialData = {
        sys: 130,
      };

      const result = UpdateMeasurementSchema.parse(partialData);
      expect(result.sys).toBe(130);
      expect(result.dia).toBeUndefined();
    });

    it("should validate all fields when provided", () => {
      const fullUpdateData = {
        sys: 140,
        dia: 90,
        pulse: 75,
        measured_at: "2024-01-01T10:00:00.000Z",
        notes: "Updated notes",
      };

      const result = UpdateMeasurementSchema.parse(fullUpdateData);
      expect(result).toEqual(fullUpdateData);
    });

    it("should enforce sys >= dia rule when both are provided", () => {
      const invalidUpdateData = {
        sys: 100,
        dia: 120,
      };

      expect(() => UpdateMeasurementSchema.parse(invalidUpdateData)).toThrow(
        "Ciśnienie skurczowe musi być większe lub równe rozkurczowemu"
      );
    });

    it("should allow update when only one of sys or dia is provided", () => {
      const sysOnlyUpdate = { sys: 150 };
      const diaOnlyUpdate = { dia: 85 };

      expect(() => UpdateMeasurementSchema.parse(sysOnlyUpdate)).not.toThrow();
      expect(() => UpdateMeasurementSchema.parse(diaOnlyUpdate)).not.toThrow();
    });

    it("should accept empty update object", () => {
      const emptyUpdate = {};

      const result = UpdateMeasurementSchema.parse(emptyUpdate);
      expect(result).toEqual({});
    });
  });

  describe("GetMeasurementsQuerySchema", () => {
    describe("pagination", () => {
      it("should use default values when not provided", () => {
        const query = {};

        const result = GetMeasurementsQuerySchema.parse(query);
        expect(result.page).toBe(1);
        expect(result.page_size).toBe(20);
        expect(result.sort).toBe("desc");
      });

      it("should accept custom pagination values", () => {
        const query = {
          page: "2",
          page_size: "10",
          sort: "asc",
        };

        const result = GetMeasurementsQuerySchema.parse(query);
        expect(result.page).toBe(2);
        expect(result.page_size).toBe(10);
        expect(result.sort).toBe("asc");
      });

      it("should reject invalid page values", () => {
        const invalidPageQuery = { page: "0" };

        expect(() => GetMeasurementsQuerySchema.parse(invalidPageQuery)).toThrow(
          "Numer strony musi być >= 1"
        );
      });

      it("should reject invalid page_size values", () => {
        const invalidSizeQuery = { page_size: "101" };

        expect(() => GetMeasurementsQuerySchema.parse(invalidSizeQuery)).toThrow(
          "Rozmiar strony nie może być > 100"
        );
      });

      it("should reject invalid sort values", () => {
        const invalidSortQuery = { sort: "invalid" };

        expect(() => GetMeasurementsQuerySchema.parse(invalidSortQuery)).toThrow();
      });
    });

    describe("date filtering", () => {
      it("should accept valid date range", () => {
        const dateQuery = {
          from: "2024-01-01T00:00:00.000Z",
          to: "2024-01-31T23:59:59.999Z",
        };

        const result = GetMeasurementsQuerySchema.parse(dateQuery);
        expect(result.from).toBe("2024-01-01T00:00:00.000Z");
        expect(result.to).toBe("2024-01-31T23:59:59.999Z");
      });

      it("should reject invalid date formats", () => {
        const invalidDateQuery = { from: "2024-01-01" };

        expect(() => GetMeasurementsQuerySchema.parse(invalidDateQuery)).toThrow(
          "Parametr 'from' musi być w formacie ISO 8601"
        );
      });
    });

    describe("level filtering", () => {
      it("should accept single BP level", () => {
        const singleLevelQuery = { level: "normal" };

        const result = GetMeasurementsQuerySchema.parse(singleLevelQuery);
        expect(result.level).toBe("normal");
      });

      it("should accept multiple BP levels", () => {
        const multiLevelQuery = { level: "normal,high_normal,grade1" };

        const result = GetMeasurementsQuerySchema.parse(multiLevelQuery);
        expect(result.level).toBe("normal,high_normal,grade1");
      });

      it("should reject invalid BP levels", () => {
        const invalidLevelQuery = { level: "invalid_level" };

        expect(() => GetMeasurementsQuerySchema.parse(invalidLevelQuery)).toThrow(
          "Nieprawidłowy poziom ciśnienia"
        );
      });

      it("should accept all valid BP levels", () => {
        const allLevels = "optimal,normal,high_normal,grade1,grade2,grade3,hypertensive_crisis";
        const allLevelsQuery = { level: allLevels };

        const result = GetMeasurementsQuerySchema.parse(allLevelsQuery);
        expect(result.level).toBe(allLevels);
      });
    });

    describe("edge cases", () => {
      it("should handle empty string level", () => {
        const emptyLevelQuery = { level: "" };

        const result = GetMeasurementsQuerySchema.parse(emptyLevelQuery);
        expect(result.level).toBeUndefined();
      });

      it("should transform string numbers to numbers", () => {
        const stringNumbersQuery = {
          page: "5",
          page_size: "50",
        };

        const result = GetMeasurementsQuerySchema.parse(stringNumbersQuery);
        expect(result.page).toBe(5);
        expect(result.page_size).toBe(50);
      });
    });
  });
});
