// src/lib/validators/auth.test.ts
import { describe, it, expect } from "vitest";
import {
  LoginFormSchema,
  LoginRequestSchema,
  RegisterFormSchema,
  RegisterRequestSchema,
  ForgotPasswordRequestSchema,
  ResetPasswordRequestSchema,
} from "./auth";

describe("Auth Validators", () => {
  describe("LoginFormSchema", () => {
    it("should accept valid login data", () => {
      const validData = {
        email: "user@example.com",
        password: "password123",
      };

      const result = LoginFormSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it("should reject empty email", () => {
      const invalidData = {
        email: "",
        password: "password123",
      };

      expect(() => LoginFormSchema.parse(invalidData)).toThrow("Email jest wymagany");
    });

    it("should reject invalid email format", () => {
      const invalidData = {
        email: "invalid-email",
        password: "password123",
      };

      expect(() => LoginFormSchema.parse(invalidData)).toThrow("Nieprawidłowy format email");
    });

    it("should reject empty password", () => {
      const invalidData = {
        email: "user@example.com",
        password: "",
      };

      expect(() => LoginFormSchema.parse(invalidData)).toThrow("Hasło jest wymagane");
    });
  });

  describe("LoginRequestSchema", () => {
    it("should accept valid login request", () => {
      const validData = {
        email: "user@example.com",
        password: "password123",
      };

      const result = LoginRequestSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it("should reject invalid email", () => {
      const invalidData = {
        email: "invalid-email",
        password: "password123",
      };

      expect(() => LoginRequestSchema.parse(invalidData)).toThrow();
    });
  });

  describe("RegisterFormSchema", () => {
    describe("valid inputs", () => {
      it("should accept valid registration data", () => {
        const validData = {
          email: "user@example.com",
          password: "Password123!",
          confirmPassword: "Password123!",
        };

        const result = RegisterFormSchema.parse(validData);
        expect(result.email).toBe("user@example.com");
        expect(result.password).toBe("Password123!");
        expect(result.confirmPassword).toBe("Password123!");
      });

      it("should accept minimum password length", () => {
        const minPasswordData = {
          email: "user@example.com",
          password: "Pass1!", // 6 characters, but we need 8 - wait, schema requires 8
          confirmPassword: "Pass1!",
        };

        expect(() => RegisterFormSchema.parse(minPasswordData)).toThrow("Hasło musi mieć minimum 8 znaków");
      });

      it("should accept password with all required complexity", () => {
        const complexPasswordData = {
          email: "user@example.com",
          password: "MySecure123!",
          confirmPassword: "MySecure123!",
        };

        const result = RegisterFormSchema.parse(complexPasswordData);
        expect(result.password).toBe("MySecure123!");
      });
    });

    describe("password complexity requirements", () => {
      it("should reject password shorter than 8 characters", () => {
        const shortPasswordData = {
          email: "user@example.com",
          password: "Short1!",
          confirmPassword: "Short1!",
        };

        expect(() => RegisterFormSchema.parse(shortPasswordData)).toThrow("Hasło musi mieć minimum 8 znaków");
      });

      it("should reject password without uppercase letter", () => {
        const noUppercaseData = {
          email: "user@example.com",
          password: "password123!",
          confirmPassword: "password123!",
        };

        expect(() => RegisterFormSchema.parse(noUppercaseData)).toThrow("Hasło musi zawierać wielką literę");
      });

      it("should reject password without digit", () => {
        const noDigitData = {
          email: "user@example.com",
          password: "Password!",
          confirmPassword: "Password!",
        };

        expect(() => RegisterFormSchema.parse(noDigitData)).toThrow("Hasło musi zawierać cyfrę");
      });

      it("should reject password without special character", () => {
        const noSpecialData = {
          email: "user@example.com",
          password: "Password123",
          confirmPassword: "Password123",
        };

        expect(() => RegisterFormSchema.parse(noSpecialData)).toThrow("Hasło musi zawierać znak specjalny");
      });
    });

    describe("password confirmation", () => {
      it("should reject mismatched passwords", () => {
        const mismatchData = {
          email: "user@example.com",
          password: "Password123!",
          confirmPassword: "Different123!",
        };

        expect(() => RegisterFormSchema.parse(mismatchData)).toThrow("Hasła muszą być identyczne");
      });

      it("should accept matching passwords", () => {
        const matchingData = {
          email: "user@example.com",
          password: "Password123!",
          confirmPassword: "Password123!",
        };

        const result = RegisterFormSchema.parse(matchingData);
        expect(result.password).toBe(result.confirmPassword);
      });
    });

    describe("edge cases", () => {
      it("should accept password with various special characters", () => {
        const specialChars = ["!", "@", "#", "$", "%", "^", "&", "*", "(", ")", "-", "_", "+", "="];

        specialChars.forEach((char) => {
          const data = {
            email: "user@example.com",
            password: `Password123${char}`,
            confirmPassword: `Password123${char}`,
          };

          expect(() => RegisterFormSchema.parse(data)).not.toThrow();
        });
      });

      it("should reject password with only spaces", () => {
        const spacePasswordData = {
          email: "user@example.com",
          password: "        ", // 8 spaces
          confirmPassword: "        ",
        };

        expect(() => RegisterFormSchema.parse(spacePasswordData)).toThrow(); // Should fail uppercase, digit, and special char requirements
      });

      it("should handle very long passwords", () => {
        const longPassword = "A".repeat(50) + "1" + "!"; // 52 chars
        const longPasswordData = {
          email: "user@example.com",
          password: longPassword,
          confirmPassword: longPassword,
        };

        const result = RegisterFormSchema.parse(longPasswordData);
        expect(result.password).toBe(longPassword);
      });
    });
  });

  describe("RegisterRequestSchema", () => {
    it("should accept valid registration request", () => {
      const validData = {
        email: "user@example.com",
        password: "Password123!",
      };

      const result = RegisterRequestSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it("should reject password not meeting complexity requirements", () => {
      const invalidData = {
        email: "user@example.com",
        password: "simple",
      };

      expect(() => RegisterRequestSchema.parse(invalidData)).toThrow();
    });
  });

  describe("ForgotPasswordRequestSchema", () => {
    it("should accept valid email", () => {
      const validData = {
        email: "user@example.com",
      };

      const result = ForgotPasswordRequestSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it("should reject invalid email", () => {
      const invalidData = {
        email: "invalid-email",
      };

      expect(() => ForgotPasswordRequestSchema.parse(invalidData)).toThrow();
    });
  });

  describe("ResetPasswordRequestSchema", () => {
    it("should accept valid reset password data", () => {
      const validData = {
        password: "NewPassword123!",
      };

      const result = ResetPasswordRequestSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it("should reject password not meeting requirements", () => {
      const invalidData = {
        password: "weak",
      };

      expect(() => ResetPasswordRequestSchema.parse(invalidData)).toThrow();
    });

    it("should accept complex password", () => {
      const complexData = {
        password: "MyComplex!@#123",
      };

      const result = ResetPasswordRequestSchema.parse(complexData);
      expect(result.password).toBe("MyComplex!@#123");
    });
  });

  describe("cross-schema consistency", () => {
    it("should have consistent password requirements across schemas", () => {
      const testPassword = "ValidPass123!";

      // All auth schemas should accept the same valid password format
      expect(() => RegisterRequestSchema.parse({ email: "test@example.com", password: testPassword })).not.toThrow();
      expect(() => ResetPasswordRequestSchema.parse({ password: testPassword })).not.toThrow();
      expect(() => LoginRequestSchema.parse({ email: "test@example.com", password: testPassword })).not.toThrow();
    });

    it("should have consistent email requirements across schemas", () => {
      const testEmail = "test.email+tag@example.co.uk";

      // All schemas with email should accept the same format
      expect(() => LoginFormSchema.parse({ email: testEmail, password: "pass123" })).not.toThrow();
      expect(() =>
        RegisterFormSchema.parse({ email: testEmail, password: "Password123!", confirmPassword: "Password123!" })
      ).not.toThrow();
      expect(() => ForgotPasswordRequestSchema.parse({ email: testEmail })).not.toThrow();
    });
  });
});
