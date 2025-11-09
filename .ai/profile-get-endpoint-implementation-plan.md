# API Endpoint Implementation Plan: GET /api/profile

## 1. Przegląd punktu końcowego

Punkt końcowy umożliwia klientowi odczyt profilu zalogowanego użytkownika. Zwraca pełne dane profilu zapisane w tabeli `profiles`. Jest dostępny wyłącznie dla uwierzytelnionych żądań i wykorzystuje Supabase RLS do zapewnienia, że użytkownik może odczytać wyłącznie swój własny rekord.

## 2. Szczegóły żądania

- **Metoda HTTP:** `GET`
- **URL:** `/api/profile`
- **Parametry:**
  - **Wymagane:** brak (identyfikacja użytkownika odbywa się na podstawie JWT w nagłówku `Authorization: Bearer <jwt>`)
  - **Opcjonalne:** brak
- **Treść żądania:** brak
- **Nagłówki:**
  - `Authorization: Bearer <jwt>` – obowiązkowy token JWT wydany przez Supabase Auth
  - `Accept: application/json`

## 3. Wykorzystywane typy

- **ProfileDTO** – już zdefiniowany w `src/types.ts`; odwzorowuje strukturę rekordu z bazy.
- **ProfileEntity** – alias na surowy wiersz z tabeli (zawiera te same pola, ale przydaje się do typów wewnętrznych).

Nie ma potrzeby dodatkowych modeli Command, gdyż `GET` nie przyjmuje treści.

## 4. Szczegóły odpowiedzi

| Kod | Opis                | Treść                            |
| --- | ------------------- | -------------------------------- |
| 200 | Sukces              | `ProfileDTO` w formacie JSON     |
| 401 | Nieautoryzowany     | `{ "error": "Unauthorized" }`    |
| 404 | Profil nie istnieje | `{ "error": "ProfileNotFound" }` |
| 500 | Błąd serwera        | `{ "error": "ServerError" }`     |

Przykład odpowiedzi 200:

```json
{
  "user_id": "uuid",
  "first_name": "John",
  "last_name": "Doe",
  "dob": "1990-05-12",
  "sex": "male",
  "weight": 80.5,
  "phone": "+48123123123",
  "timezone": "Europe/Warsaw",
  "reminder_enabled": true,
  "created_at": "2025-11-07T12:00:00Z",
  "updated_at": "2025-11-07T12:00:00Z"
}
```

## 5. Przepływ danych

1. Klient wysyła żądanie `GET /api/profile` z nagłówkiem `Authorization`.
2. Astro middleware w `src/middleware/index.ts` weryfikuje JWT i wypełnia `locals.supabase` oraz `locals.user` (jeśli nie istnieje – dodać).
3. Handler endpointu (`GET` w `src/pages/api/profile.ts`) wywołuje `ProfileService.getProfile(userId)`.
4. `ProfileService` wykonuje zapytanie `SELECT * FROM profiles WHERE user_id = :userId LIMIT 1`.
5. Supabase RLS gwarantuje, że użytkownik odczyta wyłącznie swoje dane.
6. Service zwraca wynik do handlera.
7. Handler serializuje wynik do JSON i zwraca status 200.

## 6. Względy bezpieczeństwa

- **Uwierzytelnienie**: wymagana poprawna sygnatura JWT; middleware zwraca 401 przy braku lub nieważnym tokenie.
- **Autoryzacja**: RLS w Supabase ogranicza dostęp do rekordów użytkownika.
- **Brak danych wrażliwych**: endpoint nie zwraca danych, które nie są już dostępne użytkownikowi.
- **Rate limiting**: rozważyć globalne middleware (np. VerbalExpressions/RateLimit) – poza zakresem podstawowej implementacji.
- **Input validation**: brak wejścia poza nagłówkiem, więc walidacja ogranicza się do obecności JWT.

## 7. Obsługa błędów

| Scenariusz                     | Kod | Działanie                                                 |
| ------------------------------ | --- | --------------------------------------------------------- |
| Brak / nieprawidłowy JWT       | 401 | Zwróć `{ error: "Unauthorized" }`                         |
| Brak profilu w DB (null)       | 404 | Zwróć `{ error: "ProfileNotFound" }`                      |
| Błąd bazodanowy / inny wyjątek | 500 | Zaloguj `console.error`, zwróć `{ error: "ServerError" }` |

## 8. Rozważania dotyczące wydajności

- Zapytanie po kluczu głównym jest bardzo szybkie (index PK). Brak dodatkowych optymalizacji.
- Sukcesywny dostęp może zostać skeszowany po stronie CDN (jeśli JWT w cookie) lub klienta (SW), jednak dane profilu mogą się zmieniać; ustawić nagłówek `Cache-Control: no-store`.

## 9. Etapy wdrożenia

1. **Routing** – Utwórz plik `src/pages/api/profile.ts` (jeśli nie istnieje) i dodaj export `GET`.
2. **Service** – Dodaj metodę `getProfile(userId)` w `ProfileService`:
   ```ts
   async getProfile(userId: string): Promise<ProfileDTO | null> { /* ... */ }
   ```
3. **Middleware** – Upewnij się, że w `locals.user` znajduje się `id` użytkownika po weryfikacji JWT.
4. **Handler** –
   - Sprawdź `locals.user`; jeśli brak → 401.
   - Wywołaj `ProfileService.getProfile`.
   - Jeśli `null` → 404; w przeciwnym razie zwróć 200.
5. **Dokumentacja** – zaktualizuj OpenAPI / README.
6. **CI/CD** – Dodaj testy do pipeline GitHub Actions.
7. **Monitoring** – opcjonalnie dodać Sentry dla błędów serwera.
