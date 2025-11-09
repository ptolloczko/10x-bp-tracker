# API Endpoint Implementation Plan: POST /api/measurements

## 1. Przegląd punktu końcowego

Punkt końcowy umożliwia autoryzowanym użytkownikom dodanie pojedynczego pomiaru ciśnienia krwi do systemu. Po weryfikacji danych i zapisaniu rekordu, aplikacja automatycznie klasyfikuje poziom ciśnienia wg wytycznych ESC/ESH 2023 oraz tworzy log interpretacji. Zwracany jest kompletny obiekt pomiaru.

## 2. Szczegóły żądania

- **Metoda HTTP:** `POST`
- **URL:** `/api/measurements`
- **Nagłówki:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>` (przenoszony w cookie zgodnie z middleware Supabase)

### Parametry

| Parametr      | Typ                 | Wymagany | Walidacja             | Opis                   |
| ------------- | ------------------- | -------- | --------------------- | ---------------------- |
| `sys`         | `number` (smallint) | ✔       | `> 0`                 | Ciśnienie skurczowe    |
| `dia`         | `number` (smallint) | ✔       | `> 0`<br>`sys >= dia` | Ciśnienie rozkurczowe  |
| `pulse`       | `number` (smallint) | ✔       | `> 0`                 | Tętno                  |
| `measured_at` | `string` (ISO 8601) | ✔       | data ≤ `now()`        | Data i godzina pomiaru |
| `notes`       | `string`            | ✖       | `<= 255 znaków`       | Notatki użytkownika    |

> Wszystkie parametry przekazywane są w body jako JSON. Brak parametrów URL lub query.

## 3. Wykorzystywane typy

```ts
// src/types.ts (rozszerzenie)
export type BloodPressureLevel =
  | "optimal"
  | "normal"
  | "high_normal"
  | "grade_1_htn"
  | "grade_2_htn"
  | "grade_3_htn"
  | "isolated_systolic_htn";

export interface Measurement {
  id: string; // uuid
  user_id: string;
  sys: number;
  dia: number;
  pulse: number;
  level: BloodPressureLevel;
  measured_at: string; // ISO
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MeasurementCreateDTO {
  sys: number;
  dia: number;
  pulse: number;
  measured_at: string;
  notes?: string;
}
```

### Modele Command / Service

```ts
// src/lib/services/measurement.service.ts
class MeasurementService {
  create(dto: MeasurementCreateDTO, userId: string): Promise<Measurement>;
}
```

## 4. Szczegóły odpowiedzi

- **Kod 201** – pomiar utworzony.
- **Body:**

```json
{
  "id": "uuid",
  "sys": 120,
  "dia": 80,
  "pulse": 72,
  "level": "normal",
  "measured_at": "2025-11-07T07:45:00Z",
  "notes": "Morning reading",
  "created_at": "2025-11-07T08:00:00Z",
  "updated_at": "2025-11-07T08:00:00Z"
}
```

#### Kody błędów

| Kod | Scenariusz                                                             |
| --- | ---------------------------------------------------------------------- |
| 400 | Walidacja Zod ⟂ reguły biznesowe ⟂ duplikat (`user_id`, `measured_at`) |
| 401 | Brak/niepoprawny token supabase                                        |
| 500 | Nieoczekiwany błąd serwera                                             |

## 5. Przepływ danych

1. **Middleware** sprawdza sesję Supabase (`Astro.locals.user`).
2. **Zod Schema** waliduje `MeasurementCreateDTO` + reguła `sys >= dia`.
3. **Service** uruchamia transakcję Postgresa:
   1. INSERT do `measurements` (kolumna `level` = `NULL`).
   2. Wywołuje `classifyBloodPressure(sys, dia)` ⇒ `level`.
   3. UPDATE rekordu z wyliczonym `level`.
   4. INSERT do `interpretation_logs` (`measurement_id`, `level`, `algorithm_version`).
4. Commit. Wynik zwrócony z SELECT `*`.
5. API Route zwraca `201` + zserializowany obiekt.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie:** Supabase JWT; endpoint odrzuca brak sesji (`401`).
- **Autoryzacja:** sprawdzenie `row_level_security` w bazie (`user_id = auth.uid()`).
- **Walidacja danych:** Zod + typy TS + ograniczenia DB.
- **Ochrona przed powtórzeniami:** unikalny indeks (`user_id`, `measured_at`).
- **Sanityzacja `notes`:** escape/strip HTML przy renderowaniu; w DB przechowywane raw.
- **Rate limiting:** globalne middleware (jeśli istnieje) / Supabase Edge Functions.

## 7. Obsługa błędów

| Źródło                            | Mechanizm                   | Mapa na HTTP |
| --------------------------------- | --------------------------- | ------------ |
| Zod parse error                   | throw `ValidationError`     | 400          |
| Supabase `23505` unique_violation | map to `DuplicateError`     | 400          |
| Supabase `AuthError`              | `401 Unauthorized`          | 401          |
| Inne błędy                        | log + `InternalServerError` | 500          |

Wszystkie błędy logowane do `src/lib/logger.ts` (lub Sentry).

## 8. Rozważania dotyczące wydajności

- **Transakcja** zmniejsza liczbę round-trip’ów (1 request RPC zamiast 3).
- Indeks na (`user_id`, `measured_at`) przyspiesza wykrywanie duplikatów.
- Klasyfikacja poziomu w kodzie TS jest O(1); można przenieść do funkcji PL/pgSQL jeśli zajdzie potrzeba batching.

## 9. Etapy wdrożenia

1. **DB**: dodać kolumnę `level` oraz unikalny indeks, jeśli nie istnieją.
2. **Typy**: rozszerzyć `src/types.ts` o `BloodPressureLevel`, `MeasurementCreateDTO`, `Measurement`.
3. **Service**: utworzyć `src/lib/services/measurement.service.ts`:
   - `create(dto, userId)` implementuje pełen flow w transakcji.
4. **Utils**: utworzyć `src/lib/classify-bp.ts` z funkcją `classifyBloodPressure(sys, dia)`.
5. **API Route**: `src/pages/api/measurements.ts`:
   - Guard auth (`Astro.locals.user`).
   - Parse body → Zod.
   - Wywołanie `MeasurementService.create()`.
   - `return new Response(JSON.stringify(measurement), { status: 201 })`.
6. **Tests**:
   - Unit: klasyfikacja, service.
   - Integration: POST `/api/measurements` happy path, duplica, validation.
7. **Docs**: aktualizacja OpenAPI / README.
8. **Monitoring**: dodanie logów + alertów metryk błędów.
