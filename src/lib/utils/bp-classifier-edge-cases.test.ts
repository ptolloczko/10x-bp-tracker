// src/lib/utils/bp-classifier-edge-cases.test.ts
import { describe, it, expect } from "vitest";
import { classify } from "./bp-classifier";

describe("BP Classifier - Edge Cases and Boundary Conditions", () => {
  describe("boundary values", () => {
    describe("optimal range boundaries", () => {
      it("should classify exactly 119/79 as optimal", () => {
        expect(classify(119, 79)).toBe("optimal");
      });

      it("should classify 119/80 as normal (dia boundary)", () => {
        expect(classify(119, 80)).toBe("normal");
      });

      it("should classify 120/79 as normal (sys boundary)", () => {
        expect(classify(120, 79)).toBe("normal");
      });

      it("should classify 0/0 as optimal", () => {
        expect(classify(0, 0)).toBe("optimal");
      });
    });

    describe("normal range boundaries", () => {
      it("should classify exactly 120/80 as normal", () => {
        expect(classify(120, 80)).toBe("normal");
      });

      it("should classify 129/84 as normal (upper boundary)", () => {
        expect(classify(129, 84)).toBe("normal");
      });

      it("should classify 130/84 as high_normal (sys crosses boundary)", () => {
        expect(classify(130, 84)).toBe("high_normal");
      });

      it("should classify 129/85 as high_normal (dia crosses boundary)", () => {
        expect(classify(129, 85)).toBe("high_normal");
      });
    });

    describe("high_normal range boundaries", () => {
      it("should classify exactly 130/85 as high_normal", () => {
        expect(classify(130, 85)).toBe("high_normal");
      });

      it("should classify 139/89 as high_normal (upper boundary)", () => {
        expect(classify(139, 89)).toBe("high_normal");
      });

      it("should classify 140/89 as grade1 (sys crosses boundary)", () => {
        expect(classify(140, 89)).toBe("grade1");
      });

      it("should classify 139/90 as grade1 (dia crosses boundary)", () => {
        expect(classify(139, 90)).toBe("grade1");
      });
    });

    describe("grade1 hypertension boundaries", () => {
      it("should classify exactly 140/90 as grade1", () => {
        expect(classify(140, 90)).toBe("grade1");
      });

      it("should classify 159/99 as grade1 (upper boundary)", () => {
        expect(classify(159, 99)).toBe("grade1");
      });

      it("should classify 160/99 as grade2 (sys crosses boundary)", () => {
        expect(classify(160, 99)).toBe("grade2");
      });

      it("should classify 159/100 as grade2 (dia crosses boundary)", () => {
        expect(classify(159, 100)).toBe("grade2");
      });
    });

    describe("grade2 hypertension boundaries", () => {
      it("should classify exactly 160/100 as grade2", () => {
        expect(classify(160, 100)).toBe("grade2");
      });

      it("should classify 179/109 as grade2 (upper boundary)", () => {
        expect(classify(179, 109)).toBe("grade2");
      });

      it("should classify 180/109 as grade3 (sys crosses boundary)", () => {
        expect(classify(180, 109)).toBe("grade3");
      });

      it("should classify 179/110 as grade3 (dia crosses boundary)", () => {
        expect(classify(179, 110)).toBe("grade3");
      });
    });

    describe("grade3 hypertension boundaries", () => {
      it("should classify exactly 180/110 as grade3", () => {
        expect(classify(180, 110)).toBe("grade3");
      });

      it("should classify 180/119 as grade3 (below hypertensive crisis)", () => {
        expect(classify(180, 119)).toBe("grade3");
      });

      it("should classify 179/110 as grade3 (sys below 180, dia at 110)", () => {
        expect(classify(179, 110)).toBe("grade3");
      });
    });

    describe("hypertensive crisis boundaries", () => {
      it("should classify exactly 180/120 as hypertensive_crisis", () => {
        expect(classify(180, 120)).toBe("hypertensive_crisis");
      });

      it("should classify 181/120 as hypertensive_crisis", () => {
        expect(classify(181, 120)).toBe("hypertensive_crisis");
      });

      it("should classify 180/121 as hypertensive_crisis", () => {
        expect(classify(180, 121)).toBe("hypertensive_crisis");
      });

      it("should classify 200/130 as hypertensive_crisis", () => {
        expect(classify(200, 130)).toBe("hypertensive_crisis");
      });
    });
  });

  describe("edge cases with extreme values", () => {
    it("should handle very high values", () => {
      expect(classify(300, 200)).toBe("hypertensive_crisis");
      expect(classify(250, 150)).toBe("hypertensive_crisis");
    });

    it("should handle very low values", () => {
      expect(classify(0, 0)).toBe("optimal");
      expect(classify(1, 1)).toBe("optimal");
    });

    it("should handle negative values", () => {
      // Negative values should still be classified as optimal since they're below all thresholds
      expect(classify(-10, -5)).toBe("optimal");
    });
  });

  describe("clinical edge cases", () => {
    describe("isolated systolic hypertension", () => {
      it("should classify high systolic with normal diastolic", () => {
        expect(classify(160, 80)).toBe("grade2");
        expect(classify(140, 70)).toBe("grade1");
      });
    });

    describe("isolated diastolic hypertension", () => {
      it("should classify normal systolic with high diastolic", () => {
        expect(classify(120, 100)).toBe("grade2");
        expect(classify(110, 90)).toBe("grade1");
      });
    });

    describe("white coat hypertension scenarios", () => {
      it("should classify borderline values appropriately", () => {
        expect(classify(135, 85)).toBe("high_normal");
        expect(classify(138, 88)).toBe("high_normal");
        expect(classify(142, 92)).toBe("grade1");
      });
    });

    describe("medication effect scenarios", () => {
      it("should classify low values after medication", () => {
        expect(classify(100, 60)).toBe("optimal");
        expect(classify(90, 50)).toBe("optimal");
      });
    });
  });

  describe("business rule validation", () => {
    describe("ESC/ESH 2023 guideline compliance", () => {
      it("should follow ESC/ESH optimal range: <120/<80", () => {
        expect(classify(119, 79)).toBe("optimal");
        expect(classify(110, 70)).toBe("optimal");
      });

      it("should follow ESC/ESH normal range: 120-129 or 80-84", () => {
        expect(classify(120, 80)).toBe("normal");
        expect(classify(125, 82)).toBe("normal");
        expect(classify(119, 82)).toBe("normal"); // dia in normal range
        expect(classify(125, 79)).toBe("normal"); // sys in normal range
      });

      it("should follow ESC/ESH high-normal range: 130-139 or 85-89", () => {
        expect(classify(130, 85)).toBe("high_normal");
        expect(classify(135, 87)).toBe("high_normal");
      });

      it("should follow ESC/ESH grade 1: 140-159 or 90-99", () => {
        expect(classify(140, 90)).toBe("grade1");
        expect(classify(150, 95)).toBe("grade1");
      });

      it("should follow ESC/ESH grade 2: 160-179 or 100-109", () => {
        expect(classify(160, 100)).toBe("grade2");
        expect(classify(170, 105)).toBe("grade2");
      });

      it("should follow ESC/ESH grade 3: >=180 or >=110", () => {
        expect(classify(180, 110)).toBe("grade3");
        expect(classify(190, 115)).toBe("grade3");
        expect(classify(170, 110)).toBe("grade3"); // dia >= 110
        expect(classify(180, 105)).toBe("grade3"); // sys >= 180
      });

      it("should follow ESC/ESH hypertensive crisis: >=180 and >=120", () => {
        expect(classify(180, 120)).toBe("hypertensive_crisis");
        expect(classify(200, 130)).toBe("hypertensive_crisis");
        expect(classify(185, 125)).toBe("hypertensive_crisis");
      });
    });

    describe("classification priority", () => {
      it("should prioritize hypertensive_crisis over other levels", () => {
        expect(classify(180, 120)).toBe("hypertensive_crisis");
        expect(classify(200, 130)).toBe("hypertensive_crisis");
      });

      it("should prioritize higher severity levels", () => {
        // These should be grade3, not grade2/grade1
        expect(classify(180, 105)).toBe("grade3");
        expect(classify(170, 110)).toBe("grade3");
      });
    });
  });

  describe("data integrity and type handling", () => {
    it("should handle floating point inputs (though they shouldn't occur)", () => {
      // In practice, inputs should be integers, but test robustness
      expect(classify(119.9, 79.9)).toBe("optimal");
      expect(classify(120.1, 80.1)).toBe("normal");
    });

    it("should handle equal systolic and diastolic (though unusual)", () => {
      expect(classify(100, 100)).toBe("grade2"); // dia = 100 >= 100, so grade2
      expect(classify(140, 140)).toBe("grade3"); // dia = 140 >= 110, so grade3
      expect(classify(180, 180)).toBe("hypertensive_crisis");
    });

    it("should handle very close boundary values", () => {
      expect(classify(119, 79)).toBe("optimal");
      expect(classify(120, 80)).toBe("normal");
      expect(classify(129, 84)).toBe("normal");
      expect(classify(130, 85)).toBe("high_normal");
    });
  });

  describe("medical guideline edge cases", () => {
    describe("ambulatory blood pressure monitoring scenarios", () => {
      it("should handle ABPM equivalent values", () => {
        // Values that might be seen in 24-hour monitoring
        expect(classify(125, 75)).toBe("normal");
        expect(classify(135, 85)).toBe("high_normal");
      });
    });

    describe("home blood pressure monitoring scenarios", () => {
      it("should handle HBPM equivalent values", () => {
        expect(classify(128, 82)).toBe("normal");
        expect(classify(142, 88)).toBe("grade1");
      });
    });

    describe("pediatric/adolescent considerations", () => {
      it("should handle lower values that might be normal for younger patients", () => {
        // Note: This classifier is for adults, but test edge cases
        expect(classify(95, 55)).toBe("optimal");
        expect(classify(110, 65)).toBe("optimal");
      });
    });
  });
});
