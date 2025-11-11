# Plan Implementacji Feature-Flagów

## Cel

Wprowadzenie prostego systemu flag typu on/off, który pozwoli włączać lub ukrywać funkcjonalności w zależności od środowiska deploymentu (`local`, `integration`, `prod`) bez użycia zewnętrznych usług.

## Wymagania

1. Flagi są oceniane **w czasie budowania** (build-time).
2. Dostęp do flag musi być możliwy **zarówno po stronie serwera, jak i klienta** (strony Astro, endpointy API, komponenty Reacta).
3. Źródłem prawdy jest zmienna środowiskowa `ENV_NAME` (analogicznie do zmiennych Supabase).
4. Nieznana flaga lub środowisko ⇒ traktowane jako `false`.
5. Pełne autouzupełnianie TypeScript dla nazw flag.

## Artefakty

| Plik                    | Cel                                |
| ----------------------- | ---------------------------------- |
| `src/features/flags.ts` | Centralny, uniwersalny moduł flag. |
| `.env.example`          | Domyślna wartość `ENV_NAME`.       |
| `src/env.d.ts`          | Deklaracja typu dla `ENV_NAME`.    |

## Struktura modułu (`src/features/flags.ts`)

```ts
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
  prod: {
    auth: true,
    measurement: false,
    profile: false,
  },
} as const;

const CURRENT_ENV = (import.meta.env.ENV_NAME as keyof typeof featureFlags) || "local";

export function isFeatureEnabled(feature: keyof (typeof featureFlags)[typeof CURRENT_ENV]): boolean {
  return featureFlags[CURRENT_ENV]?.[feature] ?? false;
}
```

## Przykłady użycia

1. **Endpoint API**

```ts
import { isFeatureEnabled } from "@/features/flags";

export const GET = () => {
  if (!isFeatureEnabled("measurement")) {
    return new Response("Endpoint disabled", { status: 404 });
  }
  // …zwykła logika…
};
```

2. **Strona Astro**

```astro
---
import { isFeatureEnabled } from "@/features/flags";

if (!isFeatureEnabled("auth")) {
  return Astro.redirect("/");
}
---
```

3. **Komponent React**

```tsx
if (!isFeatureEnabled("profile")) {
  return null;
}
```

## Zmienne środowiskowe

Dodaj do `.env.example`:

```env
# Środowisko deploymentu (local | integration | prod)
ENV_NAME=local
```

Ustaw odpowiednią wartość w `.env.integration`, `.env.production` itd.

## Deklaracje typów (`src/env.d.ts`)

```ts
interface ImportMetaEnv {
  readonly ENV_NAME: "local" | "integration" | "prod";
}
```

## Kolejne kroki

1. Dodać wywołania `isFeatureEnabled` w:
   - `/src/pages/login.astro`, `register.astro`, `reset-password.astro`.
   - Endpointach Measurement i Profile.
   - Komponentach `MeasurementTable` oraz `ProfileView`.
2. (Opcjonalnie) dodać walidację build-time ostrzegającą, gdy `ENV_NAME` nie jest ustawione.
