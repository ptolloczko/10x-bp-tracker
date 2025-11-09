# API Endpoint Implementation Plan: GET /api/measurements

## 1. Przegląd punktu końcowego

Endpoint zwraca stronicowaną listę pomiarów ciśnienia dla uwierzytelnionego użytkownika. Dane są pobierane z tabeli `measurements` w Supabase, filtrując rekordy należące do bieżącego użytkownika i `deleted = FALSE`. Obsługiwane są różne parametry filtrowania i sortowania.

## 2. Szczegóły żądania

- **Metoda HTTP**: `GET`
- **URL**: `/api/measurements`
- **Parametry zapytania** (wszystkie opcjonalne):
  | Parametr | Typ | Domyślnie | Opis |
  |--------------|---------------------|-----------|------|
  | `page` | `number` ≥ 1 | `1` | Numer strony. |
  | `page_size` | `number` 1-100 | `20` | Rozmiar strony. |
  | `from` | `string` (ISO) | – | Początek zakresu dat _(measured_at ≥ from)_. |
  | `to` | `string` (ISO) | – | Koniec zakresu dat _(measured_at ≤ to)_. |
  | `level` | `bp_level\|csv` | – | Pojedyncza wartość lub lista poziomów ciśnienia oddzielonych przecinkami. |
  | `sort` | `'asc'\|'desc'` | `desc` | Kolejność sortowania po `measured_at`. |

Brak body – jest to zapytanie `GET`.

## 3. Wykorzystywane typy

- `MeasurementDTO` – struktura pojedynczego pomiaru zwracana w `data[]`.
- `MeasurementListResponse` – cała odpowiedź (lista + metadane paginacji).
- `MeasurementListQuery` – model zapytania (parametry). Zdefiniowany w `src/types.ts`.

## 4. Szczegóły odpowiedzi

- **Status 200** – zawiera obiekt `MeasurementListResponse` zgodny z przykładem w specyfikacji.
- **Status 400** – niepoprawne parametry (walidacja Zod); body `{ error: string }`.
- **Status 401** – brak lub niepoprawny JWT; obsługiwane automatycznie przez middleware autoryzacji.
- **Status 500** – nieoczekiwany błąd serwera.

## 5. Przepływ danych

1. Middleware autoryzuje żądanie i udostępnia `supabase` z kontekstu.
2. Handler `GET /api/measurements`:
   1. Parsuje `req.url.searchParams` i waliduje Zod-schematem `measurementListQuerySchema`.
   2. Oblicza offset: `offset = (page - 1) * page_size`.
   3. Wywołuje `measurementService.list(userId, query)`.
3. `measurementService.list`:
   1. Buduje zapytanie do Supabase (`from('measurements')`).
   2. Nakłada filtry `from`, `to`, `level`, `deleted = FALSE`.
   3. Ustawia sortowanie i paginację.
   4. Wykonuje `select`, pobierając `page_size` rekordów + zapytanie count (`.range` + `.single()` lub `.order()` + `.limit()` + `.maybeSingle()` według Supabase JS v2).
   5. Zwraca `{ data, total }`.
4. Handler składa obiekt `MeasurementListResponse` i zwraca `200`.

## 6. Względy bezpieczeństwa

- Autoryzacja: wymagana ważna sesja Supabase (JWT) – zapewnia middleware.
- RLS w DB ogranicza `select` do `user_id = auth.uid()` i `deleted = FALSE`.
- Brak wrażliwych danych w odpowiedzi (pole `user_id` i `deleted` są pomijane przez SELECT / aliasowanie).
- Ochrona przed injection zapewniona przez Supabase klienta (parametryzacja) i Zod-walidację.

## 7. Obsługa błędów

| Sytuacja                                    | Kod | Body example                           |
| ------------------------------------------- | --- | -------------------------------------- |
| Niepoprawny format parametru (np. `page=0`) | 400 | `{ "error": "page must be ≥ 1" }`      |
| Brak JWT / wygasła sesja                    | 401 | –                                      |
| Błąd komunikacji z DB                       | 500 | `{ "error": "internal_server_error" }` |

Błędy są logowane przez `src/lib/logger.ts` (jeśli istnieje) lub `console.error` + Sentry (przewidziane na przyszłość).

## 8. Rozważania dotyczące wydajności

- Indeks `idx_measurements_user_time_desc` wspiera zapytania sortowane po `measured_at DESC` i filtr `deleted = FALSE`.
- Przy dużych danych rozważyć keyset-pagination zamiast offset-pagination.
- `page_size` limit 100 zapobiega nadmiernemu zużyciu pamięci.
- SELECT tylko potrzebnych kolumn bez `user_id`, `deleted`.

## 9. Etapy wdrożenia

1. **Zdefiniuj Zod-schemat** `measurementListQuerySchema` w `src/lib/validation/measurement.ts`.
2. **Utwórz service** `src/lib/services/measurement.service.ts` z metodą `list`.
3. **Dodaj endpoint** `src/pages/api/measurements.ts`:
   - `export const GET = withAuth(async ({ request, locals, url }) => { ... })`.
4. **Jednostkowe testy walidacji** – sprawdź przypadki edge (np. podwójne poziomy, błędne daty).
5. **Testy integracyjne** endpointu (Happy path, brak danych, out-of-range, brak JWT).
6. **Aktualizacja dokumentacji API** (`.ai/api-plan.md`).
7. **Code review & lint**.
8. **Deploy na staging** i smoke tests.
9. **Monitoruj logi po wdrożeniu produkcyjnym**.
