import { describe, it, expect } from "vitest";
import { classify } from "@/lib/utils/bp-classifier";

/**
 * Example unit test for BP classifier utility
 * Run with: npm run test:unit
 */
describe("BP Classifier", () => {
  describe("classify", () => {
    it("should classify optimal blood pressure", () => {
      const result = classify(110, 70);

      expect(result).toBe("optimal");
    });

    it("should classify normal blood pressure", () => {
      const result = classify(125, 82);

      expect(result).toBe("normal");
    });

    it("should classify high normal blood pressure", () => {
      const result = classify(135, 87);

      expect(result).toBe("high_normal");
    });

    it("should classify grade 1 hypertension", () => {
      const result = classify(145, 95);

      expect(result).toBe("grade1");
    });

    it("should classify grade 2 hypertension", () => {
      const result = classify(165, 105);

      expect(result).toBe("grade2");
    });

    it("should classify grade 3 hypertension", () => {
      const result = classify(185, 115);

      expect(result).toBe("grade3");
    });

    it("should classify hypertensive crisis", () => {
      const result = classify(185, 125);

      expect(result).toBe("hypertensive_crisis");
    });

    it("should handle edge cases", () => {
      expect(classify(0, 0)).toBe("optimal");
      expect(classify(119, 79)).toBe("optimal");
      expect(classify(120, 80)).toBe("normal");
    });
  });
});
