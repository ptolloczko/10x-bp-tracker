# API Endpoint Implementation Plan: GET /api/measurements

## 1. Przegląd punktu końcowego

Punkt końcowy zwraca stronicowaną listę pomiarów ciśnienia krwi (measurements) należących do uwierzytelnionego użytkownika. Dane są pobierane z tabeli `measurements` w bazie danych Supabase i zwracane w formacie DTO, z zachowaniem filtrów i sortowania określonych w parametrach zapytania.

## 2. Szczegóły żądania

- **Metoda HTTP**: `GET`
- **URL**: `/api/measurements`
- **Query-string parameters** (wszystkie opcjonalne):
  | Parametr | Typ | Domyślna | Opis |
  |----------|-----|----------|------|
  | `page` | number (>=1) | `1` | Numer strony |
  | `page_size` | number (1-100) | `20` | Liczba elementów na stronę |
  | `from` | ISO date-time | — | Początek zakresu `measured_at` (≥) |
  | `to` | ISO date-time | — | Koniec zakresu `measured_at` (≤) |
  | `level` | enum `bp_level` lub lista rozdzielona przecinkami | — | Filtr po poziomie ciśnienia |
  | `sort` | `asc`\|`desc` | `desc` | Kolejność po `measured_at` |

Brak body requestu.

## 3. Wykorzystywane typy

- `MeasurementDTO` – DTO zwracany w tablicy `data`.
- `MeasurementListResponse` – pełna odpowiedź (zawiera paginację).
- `MeasurementListQuery` – model parametrów zapytania.

## 4. Szczegóły odpowiedzi

| Kod stanu | Scenariusz | Payload |
|-----------|-----------|---------|
| 200 | Sukces | `MeasurementListResponse` |
| 400 | Nieprawidłowe parametry | `{ error: string }` |
| 401 | Brak/nieprawidłowy JWT | `{ error: "unauthorized" }` |
| 500 | Błąd serwera | `{ error: string }` |

## 5. Przepływ danych

1. Klient wysyła `GET /api/measurements` z opcjonalnymi parametrami.
2. Middleware `src/middleware/index.ts` uwierzytelnia żądanie i udostępnia `supabase` w `locals`.
3. Endpoint:
   1. Parsuje `url.searchParams` i waliduje je przez Zod.
   2. Wywołuje `measurementService.listMeasurements(userId, validatedQuery)`.
4. `measurementService` buduje zapytanie do Supabase z:
   - Filtrami `eq`, `gte`, `lte`, `in`.
   - Sortowaniem i paginacją (`range`).
5. Wyniki konwertowane są do `MeasurementDTO` i zwracane wraz z metadanymi paginacji.
6. Supabase RLS gwarantuje, że użytkownik otrzymuje tylko własne dane.

## 6. Względy bezpieczeństwa

- **Uwierzytelnienie**: JWT via Supabase; middleware przekazuje `session?.user.id`.
- **Autoryzacja**: RLS na tabeli `measurements` (`user_id = auth.uid()` i `deleted = FALSE`).
- **Walidacja**: Zod schema odrzuca nieprawidłowe/nieoczekiwane parametry (zapobiega SQL-inj.).
- **Rate-limiting**: Możliwe do dodania w globalnym middleware.

## 7. Obsługa błędów

| Sytuacja | Kod | Akcja |
|----------|-----|-------|
| Brak JWT lub sesji | 401 | Zwróć `{ error: "unauthorized" }` |
| Nieprawidłowe parametry | 400 | Zwróć `{ error: zodError }` |
| Błąd bazy (np. timeout) | 500 | Log do konsoli + `{ error: "internal_server_error" }` |

## 8. Rozważania dotyczące wydajności

- Indeksy `idx_measurements_user_time` i `idx_measurements_user_time_desc` zapewniają szybkie zakresowe sortowanie.
- Paginacja z wykorzystaniem `range` zapobiega dużym obciążeniom pamięci.
- Domyślny limit 20; maks. 100 elementów per page, aby ograniczyć rozmiar odpowiedzi.

## 9. Etapy wdrożenia

1. **Typy & Schemat Walidacji**
   - [ ] Utwórz `src/lib/validators/measurement.ts` z `getMeasurementsQuerySchema` (Zod) mapowanym na `MeasurementListQuery`.
2. **Service**
   - [ ] Stwórz `src/lib/services/measurement.service.ts` z metodą `listMeasurements(userId, query)`.
   - [ ] Zapewnij konwersję do DTO oraz liczenie `total` (drugi query z `count` lub `single().count('*', { head: true })`).
3. **Endpoint**
   - [ ] Dodaj `src/pages/api/measurements.ts`:
     ```ts
     import { z } from 'zod';
     import { getMeasurementsQuerySchema } from '@/lib/validators/measurement';
     import { measurementService } from '@/lib/services/measurement.service';
     export const prerender = false;
     export const GET: APIRoute = async ({ locals, url }) => {
       const { supabase, session } = locals;
       if (!session) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
       const parse = getMeasurementsQuerySchema.safeParse(Object.fromEntries(url.searchParams));
       if (!parse.success) return new Response(JSON.stringify({ error: parse.error.flatten() }), { status: 400 });
       try {
         const body = await measurementService.listMeasurements(session.user.id, parse.data);
         return new Response(JSON.stringify(body), { status: 200 });
       } catch (err) {
         console.error(err);
         return new Response(JSON.stringify({ error: 'internal_server_error' }), { status: 500 });
       }
     };
     ```
4. **Testy**
   - [ ] Dodaj testy integracyjne (Vitest) dla endpointu (scenariusze 200, 400, 401).
5. **Dokumentacja**
   - [ ] Zaktualizuj README oraz `.ai/api-plan.md` jeśli wymagane.
6. **CI**
   - [ ] Dodaj workflow uruchamiający testy dla nowego endpointu.
7. **Code Review & Deploy**
   - [ ] Pull Request → review → merge → deploy.
