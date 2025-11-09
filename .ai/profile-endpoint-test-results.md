# Raport testowania endpointa POST /api/profile

**Data testów:** 2025-11-09  
**Endpoint:** `POST /api/profile`  
**Serwer:** `http://localhost:3000`

## Podsumowanie

✅ **Wszystkie 9 testów zakończone sukcesem!**

| Test | Scenariusz                         | Status  | Kod HTTP |
| ---- | ---------------------------------- | ------- | -------- |
| 1    | Tworzenie profilu z pełnymi danymi | ✅ PASS | 201      |
| 2    | Brak wymaganego pola timezone      | ✅ PASS | 400      |
| 3    | Nieprawidłowy format daty          | ✅ PASS | 400      |
| 4    | Nieprawidłowy format telefonu      | ✅ PASS | 400      |
| 5    | Nieprawidłowa wartość sex          | ✅ PASS | 400      |
| 6    | Nieprawidłowa waga (ujemna)        | ✅ PASS | 400      |
| 7    | Profil już istnieje                | ✅ PASS | 409      |
| 8    | Nieprawidłowy JSON                 | ✅ PASS | 400      |
| 9    | Nadmiarowe pola w request body     | ✅ PASS | 400      |

---

## Szczegóły testów

### ✅ Test 1: Tworzenie profilu - sukces (201)

**Request:**

```bash
curl -X POST http://localhost:3000/api/profile \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Jan",
    "last_name": "Kowalski",
    "dob": "1990-05-12",
    "sex": "male",
    "weight": 80.5,
    "phone": "+48123456789",
    "timezone": "Europe/Warsaw"
  }'
```

**Response:** `201 Created`

```json
{
  "user_id": "408128e0-7ece-4062-849e-b94c3e79a96e",
  "first_name": "Jan",
  "last_name": "Kowalski",
  "dob": "1990-05-12",
  "sex": "male",
  "weight": 80.5,
  "phone": "+48123456789",
  "timezone": "Europe/Warsaw",
  "reminder_enabled": true,
  "created_at": "2025-11-09T12:23:12.694507+00:00",
  "updated_at": "2025-11-09T12:23:12.694507+00:00"
}
```

**Status:** ✅ PASS  
**Uwagi:** Profil został utworzony poprawnie z wszystkimi polami. Pola `reminder_enabled`, `created_at`, `updated_at` zostały ustawione automatycznie przez bazę danych.

---

### ✅ Test 2: Brak wymaganego pola timezone (400)

**Request:**

```bash
curl -X POST http://localhost:3000/api/profile \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Jan",
    "last_name": "Kowalski"
  }'
```

**Response:** `400 Bad Request`

```json
{
  "error": "ValidationError",
  "details": {
    "formErrors": [],
    "fieldErrors": {
      "timezone": ["Required"]
    }
  }
}
```

**Status:** ✅ PASS  
**Uwagi:** Walidacja Zod prawidłowo wykrywa brak wymaganego pola `timezone`.

---

### ✅ Test 3: Nieprawidłowy format daty (400)

**Request:**

```bash
curl -X POST http://localhost:3000/api/profile \
  -H "Content-Type: application/json" \
  -d '{
    "dob": "12/05/1990",
    "timezone": "Europe/Warsaw"
  }'
```

**Response:** `400 Bad Request`

```json
{
  "error": "ValidationError",
  "details": {
    "formErrors": [],
    "fieldErrors": {
      "dob": ["Date must be in ISO format (YYYY-MM-DD)"]
    }
  }
}
```

**Status:** ✅ PASS  
**Uwagi:** Walidacja wymaga formatu ISO (YYYY-MM-DD) zgodnie ze specyfikacją.

---

### ✅ Test 4: Nieprawidłowy format telefonu (400)

**Request:**

```bash
curl -X POST http://localhost:3000/api/profile \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "123456789",
    "timezone": "Europe/Warsaw"
  }'
```

**Response:** `400 Bad Request`

```json
{
  "error": "ValidationError",
  "details": {
    "formErrors": [],
    "fieldErrors": {
      "phone": ["Phone must be in E.164 format (e.g., +48123123123)"]
    }
  }
}
```

**Status:** ✅ PASS  
**Uwagi:** Regex walidacji wymaga formatu E.164 (zaczyna się od `+` i zawiera kod kraju).

---

### ✅ Test 5: Nieprawidłowa wartość sex (400)

**Request:**

```bash
curl -X POST http://localhost:3000/api/profile \
  -H "Content-Type: application/json" \
  -d '{
    "sex": "unknown",
    "timezone": "Europe/Warsaw"
  }'
```

**Response:** `400 Bad Request`

```json
{
  "error": "ValidationError",
  "details": {
    "formErrors": [],
    "fieldErrors": {
      "sex": ["Invalid enum value. Expected 'male' | 'female' | 'other', received 'unknown'"]
    }
  }
}
```

**Status:** ✅ PASS  
**Uwagi:** Enum Zod prawidłowo weryfikuje dozwolone wartości.

---

### ✅ Test 6: Nieprawidłowa waga (400)

**Request:**

```bash
curl -X POST http://localhost:3000/api/profile \
  -H "Content-Type: application/json" \
  -d '{
    "weight": -50,
    "timezone": "Europe/Warsaw"
  }'
```

**Response:** `400 Bad Request`

```json
{
  "error": "ValidationError",
  "details": {
    "formErrors": [],
    "fieldErrors": {
      "weight": ["Number must be greater than 0"]
    }
  }
}
```

**Status:** ✅ PASS  
**Uwagi:** Walidacja `.positive()` prawidłowo odrzuca wartości ≤ 0.

---

### ✅ Test 7: Profil już istnieje (409)

**Request:**

```bash
curl -X POST http://localhost:3000/api/profile \
  -H "Content-Type: application/json" \
  -d '{
    "timezone": "Europe/Warsaw"
  }'
```

**Response:** `409 Conflict`

```json
{
  "error": "ProfileExists"
}
```

**Status:** ✅ PASS  
**Uwagi:** Serwis `ProfileService` prawidłowo sprawdza istnienie profilu przed INSERTem i zwraca `ProfileExistsError`, który jest mapowany na status 409.

---

### ✅ Test 8: Nieprawidłowy JSON (400)

**Request:**

```bash
curl -X POST http://localhost:3000/api/profile \
  -H "Content-Type: application/json" \
  -d '{invalid json'
```

**Response:** `400 Bad Request`

```json
{
  "error": "ValidationError",
  "details": "Invalid JSON in request body"
}
```

**Status:** ✅ PASS  
**Uwagi:** Błąd parsowania JSON jest przechwycony w try-catch i zwraca czytelny komunikat.

---

### ✅ Test 9: Nadmiarowe pola (400)

**Request:**

```bash
curl -X POST http://localhost:3000/api/profile \
  -H "Content-Type: application/json" \
  -d '{
    "timezone": "Europe/Warsaw",
    "extra_field": "should not be here"
  }'
```

**Response:** `400 Bad Request`

```json
{
  "error": "ValidationError",
  "details": {
    "formErrors": ["Unrecognized key(s) in object: 'extra_field'"],
    "fieldErrors": {}
  }
}
```

**Status:** ✅ PASS  
**Uwagi:** `.strict()` w Zod schema odrzuca nierozpoznane klucze, co zapobiega niezamierzonemu przekazywaniu danych.

---

## Problemy napotkane podczas testowania

### 1. ❌ Problem: Row Level Security (RLS) blokował INSERT

**Błąd:**

```
code: '42501'
message: 'new row violates row-level security policy for table "profiles"'
```

**Rozwiązanie:**  
Zaktualizowano migrację `20241107000000_disable_all_rls_policies.sql` dodając:

```sql
alter table profiles disable row level security;
alter table measurements disable row level security;
alter table interpretation_logs disable row level security;
```

Po wykonaniu `npx supabase db reset --yes` problem został rozwiązany.

### 2. ❌ Problem: Foreign Key Constraint - brak user_id w tabeli users

**Błąd:**

```
code: '23503'
message: "insert or update on table \"profiles\" violates foreign key constraint \"profiles_user_id_fkey\""
```

**Rozwiązanie:**  
Użytkownik zmienił `DEFAULT_USER_ID` w `src/db/supabase.client.ts` na prawidłowy UUID istniejący w Supabase Auth.

---

## Wnioski

1. ✅ **Endpoint działa zgodnie ze specyfikacją API**
2. ✅ **Wszystkie scenariusze walidacji działają poprawnie**
3. ✅ **Kody statusu HTTP są zgodne z planem implementacji**
4. ✅ **Obsługa błędów jest kompletna i czytelna**
5. ✅ **Serwis `ProfileService` prawidłowo sprawdza duplikaty**
6. ✅ **Schema Zod (`CreateProfileInput`) waliduje wszystkie pola zgodnie z regułami**

## Następne kroki

1. ✅ Dodać testy jednostkowe i integracyjne (vitest/jest)
2. ✅ Wdrożyć uwierzytelnienie JWT (middleware authentication)
3. ✅ Dodać testy end-to-end z autentykacją
4. ✅ Zaktualizować dokumentację API (np. Swagger/OpenAPI)
5. ✅ Włączyć RLS z odpowiednimi politykami w środowisku produkcyjnym

---

**Endpoint gotowy do użycia w środowisku deweloperskim! 🎉**
