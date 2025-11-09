# API Endpoint Implementation Plan: POST /api/measurements

## 1. Przegląd punktu końcowego

Punkt końcowy umożliwia zarejestrowanie pojedynczego pomiaru ciśnienia krwi wraz z pulsacją. Operacja:

- przyjmuje dane wejściowe użytkownika,
- waliduje wartości oraz reguły biznesowe (m.in. `sys >= dia`),
- zapisuje rekord w tabeli `measurements`,
- wylicza poziom klasyfikacji ESC/ESH 2023 i aktualizuje rekord,
- tworzy wpis w tabeli `interpretation_logs`,
- zwraca utworzony rekord ze statusem 201.

## 2. Szczegóły żądania

- **Metoda HTTP:** `POST`
- **URL:** `/api/measurements`
- **Parametry URL:** brak
- **Nagłówki:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <jwt access token>` (wymagane)
- **Body (JSON):**
  - Wymagane:
    | Pole | Typ | Zakres / Reguły |
    |-------------|-----------|---------------------------------------------------|
    | `sys` | number | smallint > 0 |
    | `dia` | number | smallint > 0, `sys >= dia` |
    | `pulse` | number | smallint > 0 |
    | `measured_at` | string (ISO 8601) | Nieprzyszła data, unikalna per użytkownik |
  - Opcjonalne:
    | Pole | Typ | Reguły |
    |--------|-------|-----------------------------------|
    | `notes`| string| `<= 255` znaków |

## 3. Wykorzystywane typy

- `MeasurementDTO` — istniejący typ odpowiedzi (patrz `src/types.ts`).
- `CreateMeasurementCommand` — istniejący typ wejściowy (alias pick z `MeasurementEntity`).
- **Nowe / do aktualizacji:**
  - `CreateMeasurementSchema` (Zod) w `src/lib/validators/measurement.ts`.

## 4. Szczegóły odpowiedzi

- **Status 201 Created**
  - Body: `MeasurementDTO` (z polami `id`, `sys`, `dia`, `pulse`, `level`, `measured_at`, `notes`, `created_at`, `updated_at`).
- **Błędy:**
  | Kod | Sytuacja |
  |-----|---------------------------------------------------------|
  | 400 | Walidacja danych, `sys < dia`, duplikat (`user_id`,`measured_at`) |
  | 401 | Brak lub nieważny token JWT |
  | 500 | Nieoczekiwany błąd serwera |

## 5. Przepływ danych

1. **Klient** wysyła JSON do `/api/measurements`.
2. **Astro route** (`POST` handler) pobiera `supabase` z `context.locals` oraz `user.id` z JWT.
3. Dane są walidowane przez `CreateMeasurementSchema`.
4. Handler wywołuje `MeasurementService.create(command, userId, supabase)`.
5. Service:
   1. Wstawia wiersz do `measurements` (z `level = null`).
   2. Oblicza `level` funkcją `classify(sys, dia)`.
   3. Aktualizuje ten sam wiersz `level`-em.
   4. Tworzy wpis w `interpretation_logs` (kopiuje wartości + `level`).
6. Service zwraca pełny wiersz — mapowany na `MeasurementDTO`.
7. Handler odsyła `201` + body.

## 6. Względy bezpieczeństwa

- **Uwierzytelnienie:** Wymuszane przez middleware RLS + sprawdzenie tokena JWT.
- **Autoryzacja:** Polityki RLS gwarantują operacje tylko na własnych rekordach.
- **Walidacja wejścia:** Zod — ochrona przed SQL-injection i nadmiarowymi polami.
- **Rate-limiting:** Do rozważenia globalnie (np. middleware, reverse-proxy).
- **CSRF:** Nie dotyczy — endpoint bez sesji cookie (token Bearer).

## 7. Obsługa błędów

| Scenariusz                   | Typ błędu       | Kod | Akcja                                              |
| ---------------------------- | --------------- | --- | -------------------------------------------------- |
| Nieprawidłowe typy / zakresy | ValidationError | 400 | Zwróć komunikat pola + ruleId                      |
| `sys < dia`                  | BusinessError   | 400 | "sys must be greater or equal to dia"              |
| Duplikat (`measured_at`)     | UniqueViolation | 400 | "Measurement already exists for given timestamp"   |
| Brak JWT lub niepoprawny     | AuthError       | 401 | "Unauthorized"                                     |
| Błąd bazy (timeout/conn)     | DbError         | 500 | Loguj stack + context, wyślij generyczny komunikat |

## 8. Rozważania dotyczące wydajności

- Zapytania są proste (INSERT/UPDATE) – p95 < 30 ms lokalnie.
- Unikalny indeks `user_id, measured_at` zapobiega pełnemu skanowi.
- Po wzroście danych – partycjonowanie roczne `measurements` (zgodnie z sekcją _Additional Notes_ w db-plan).
- Batch insert – poza zakresem tego endpointa.

## 9. Etapy wdrożenia

1. **Typy & walidacja**  
   1.1 Utwórz `CreateMeasurementSchema` w `src/lib/validators/measurement.ts`.  
   1.2 Upewnij się, że `CreateMeasurementCommand` odzwierciedla schemat (update typów jeżeli potrzeba).
2. **Service**  
   2.1 Stwórz `MeasurementService` w `src/lib/services/measurement.service.ts` z metodą `async create(cmd, userId, supabase)`.  
   2.2 Dodaj funkcję util `classify(sys, dia): bp_level` (oddzielny plik w `src/lib/utils`).
3. **API Route**  
   3.1 W `src/pages/api/measurements/index.ts` zaimplementuj `export const POST`.  
   3.2 Pobierz `supabase = context.locals.supabase` oraz `userId` z tokena.  
   3.3 Waliduj body, przechwyć `ZodError`, zwróć 400.
4. **Error mapping** — mapuj błędy DB (`PostgrestError.code === "23505"`) na 400 Duplicate.
5. **Docs** – aktualizuj `README.md`
6. **Code Review & Deploy**.
