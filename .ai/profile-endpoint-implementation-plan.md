# API Endpoint Implementation Plan: POST /api/profile

## 1. Przegląd punktu końcowego

Tworzy profil użytkownika natychmiast po rejestracji. Wywołanie możliwe wyłącznie raz na konto – kolejne próby zwracają 409. Zwraca pełny obiekt profilu po utworzeniu.

## 2. Szczegóły żądania

- **Metoda HTTP**: `POST`
- **URL**: `/api/profile`
- **Treść żądania (JSON)**:
  ```jsonc
  {
    "first_name": "John", // string | optional
    "last_name": "Doe", // string | optional
    "dob": "1990-05-12", // string-ISO-date | optional
    "sex": "male", // "male" | "female" | "other" | optional
    "weight": 80.5, // number(>0, <=999.9) | optional
    "phone": "+48123123123", // string-E.164 | optional
    "timezone": "Europe/Warsaw", // string-IANA-tz | required
  }
  ```
- **Parametry**:
  - Wymagane: `timezone`
  - Opcjonalne: `first_name`, `last_name`, `dob`, `sex`, `weight`, `phone`
- **Nagłówki wymagane**:
  - `Authorization: Bearer <jwt>` – uwierzytelnienie Supabase
  - `Content-Type: application/json`

## 3. Wykorzystywane typy

- `ProfileDTO` – DTO odpowiedzi (równy rekordowi z tabeli `profiles`)
- `CreateProfileCommand` – typ wejściowy (z `src/types.ts`)
- `[NEW] CreateProfileInput` – Zod-schema reprezentująca treść żądania
- `[NEW] CreateProfileService` – serwis domenowy (patrz §8)

## 4. Szczegóły odpowiedzi

| Kod | Znaczenie                           | Treść                                                  |
| --- | ----------------------------------- | ------------------------------------------------------ |
| 201 | Profil utworzony                    | `ProfileDTO`                                           |
| 400 | Błędne dane wejściowe               | `{ error: 'ValidationError', details: ZodErrorShape }` |
| 401 | Brak/nieprawidłowe uwierzytelnienie | `{ error: 'Unauthorized' }`                            |
| 409 | Profil już istnieje                 | `{ error: 'ProfileExists' }`                           |
| 500 | Błąd serwera                        | `{ error: 'ServerError' }`                             |

## 5. Przepływ danych

```mermaid
flowchart TD
  client -->|POST /api/profile| apiRoute
  apiRoute -->|validate(Zod)| validator
  validator -->|Supabase.auth\ngetUser()| auth
  auth -->|throw 401? | apiRoute
  apiRoute -->|call| profileService
  profileService -->|select profiles where user_id| dbCheck
  dbCheck -->|exists → 409| apiRoute
  dbCheck -->|not exists| dbInsert
  dbInsert -->|insert profiles| supabaseDB
  dbInsert -->|return ProfileDTO| apiRoute
  apiRoute --> client
```

## 6. Względy bezpieczeństwa

1. **Uwierzytelnienie**: wyłącznie Auth JWT z Supabase; dostęp do `context.locals.user`.
2. **Autoryzacja**: użytkownik może utworzyć tylko swój profil – PK = `user.id`.
3. **RLS**: tabela `profiles` powinna mieć politykę `user_id = auth.uid()` (zaznaczyć w migracjach).
4. **Walidacja wejścia**: Zod + typy z TypeScript.
5. **Ochrona przed duplikacją**: sprawdzenie aplikacyjne + unikalny PK gwarantuje jednoznaczność.
6. **Ograniczenie pól**: ignorować nadmiarowe pola przez `stripUnknown`.

## 7. Obsługa błędów

| Scenariusz               | Kod | Akcja                                |
| ------------------------ | --- | ------------------------------------ |
| Błąd walidacji Zod       | 400 | Zwróć szczegóły `zodError.flatten()` |
| Brak JWT / sesji         | 401 | `Unauthorized`                       |
| Profil już istnieje      | 409 | `ProfileExists`                      |
| Błąd DB (np. constraint) | 500 | Log → `console.error` + monitoring   |

## 8. Rozważania dotyczące wydajności

- Punkt końcowy wykonuje pojedyncze zapytanie `SELECT` + opcjonalne `INSERT` ⇒ niski koszt.
- Dodaj indeks na `profiles(user_id)` (PK już pokrywa).
- Po deployu należy zweryfikować cold-start czasu funkcji.

## 9. Etapy wdrożenia

1. **Typy & schemat**
   - Upewnij się, że `CreateProfileCommand` jest zaktualizowany (już jest w `src/types.ts`).
   - Utwórz `CreateProfileInput` (`zod`) w `src/lib/validators/profile.ts`.
2. **Service**
   - Dodaj `src/lib/services/profile.service.ts` z funkcjami `createProfile(userId, data)`.
3. **Endpoint**
   - Stwórz plik `src/pages/api/profile.ts`.
   - Importuj `CreateProfileInput`, `createProfile`.
   - Pobierz `supabase` i `user` z `context.locals`.
   - Waliduj JSON body → 400.
   - Wywołaj serwis → 201 / 409.
4. **Middleware**
   - Zapewnij, że `src/middleware/index.ts` wstrzykuje `user` i `supabase`.
5. **Dokumentacja**
   - Aktualizuj `README.md` oraz kolekcję API (np. Postman).
6. **Monitoring**
   - Skonfiguruj alerty na 5xx.

---

> **Gotowe do implementacji.**
