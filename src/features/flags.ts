/**
 * Feature Flags System
 *
 * Centralny moduł do zarządzania flagami funkcjonalności.
 * Flagi są oceniane w czasie budowania (build-time) na podstawie zmiennej PUBLIC_ENV_NAME.
 */

export const featureFlags = {
  local: {
    auth: true,
    measurement: true,
    profile: true,
  },
  integration: {
    auth: true,
    measurement: true,
    profile: false,
  },
  production: {
    auth: true,
    measurement: true,
    profile: true,
  },
} as const;

const CURRENT_ENV = (import.meta.env.PUBLIC_ENV_NAME as keyof typeof featureFlags) || "local";

/**
 * Sprawdza, czy dana funkcjonalność jest włączona w bieżącym środowisku.
 *
 * @param feature - Nazwa funkcjonalności do sprawdzenia
 * @returns true jeśli funkcjonalność jest włączona, false w przeciwnym razie
 *
 * @example
 * ```ts
 * if (!isFeatureEnabled("measurement")) {
 *   return new Response("Feature disabled", { status: 404 });
 * }
 * ```
 */
export function isFeatureEnabled(feature: keyof (typeof featureFlags)[typeof CURRENT_ENV]): boolean {
  return featureFlags[CURRENT_ENV]?.[feature] ?? false;
}
