# Instrukcja testowania endpointa POST /api/profile

## Wymagania wstępne

1. Uruchomiona lokalna instancja Supabase z tabelą `profiles`
2. Serwer dev Astro (`npm run dev`)

## Scenariusze testowe

### 1. ✅ Tworzenie profilu - sukces (201)

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

**Oczekiwany rezultat:**
- Status HTTP: `201`
- Zwrócony obiekt `ProfileDTO` z wszystkimi polami
- W bazie danych pojawia się nowy rekord z `user_id = "456"` (DEFAULT_USER_ID)

### 2. ❌ Błąd walidacji - brak wymaganego pola timezone (400)

```bash
curl -X POST http://localhost:3000/api/profile \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Jan",
    "last_name": "Kowalski"
  }'
```

**Oczekiwany rezultat:**
- Status HTTP: `400`
- Odpowiedź:
```json
{
  "error": "ValidationError",
  "details": {
    "fieldErrors": {
      "timezone": ["Required"]
    }
  }
}
```

### 3. ❌ Błąd walidacji - nieprawidłowy format daty (400)

```bash
curl -X POST http://localhost:3000/api/profile \
  -H "Content-Type: application/json" \
  -d '{
    "dob": "12/05/1990",
    "timezone": "Europe/Warsaw"
  }'
```

**Oczekiwany rezultat:**
- Status HTTP: `400`
- Odpowiedź z błędem walidacji dla pola `dob`

### 4. ❌ Błąd walidacji - nieprawidłowy format telefonu (400)

```bash
curl -X POST http://localhost:3000/api/profile \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "123456789",
    "timezone": "Europe/Warsaw"
  }'
```

**Oczekiwany rezultat:**
- Status HTTP: `400`
- Odpowiedź z błędem walidacji dla pola `phone` (wymagany format E.164: `+48123456789`)

### 5. ❌ Błąd walidacji - nieprawidłowa wartość sex (400)

```bash
curl -X POST http://localhost:3000/api/profile \
  -H "Content-Type: application/json" \
  -d '{
    "sex": "unknown",
    "timezone": "Europe/Warsaw"
  }'
```

**Oczekiwany rezultat:**
- Status HTTP: `400`
- Odpowiedź z błędem walidacji (dozwolone: `"male"`, `"female"`, `"other"`)

### 6. ❌ Błąd walidacji - nieprawidłowa waga (400)

```bash
curl -X POST http://localhost:3000/api/profile \
  -H "Content-Type: application/json" \
  -d '{
    "weight": -50,
    "timezone": "Europe/Warsaw"
  }'
```

**Oczekiwany rezultat:**
- Status HTTP: `400`
- Odpowiedź z błędem walidacji (weight musi być > 0)

### 7. ❌ Profil już istnieje (409)

```bash
# Wykonaj ponownie żądanie z punktu 1 (po wcześniejszym sukcesie)
curl -X POST http://localhost:3000/api/profile \
  -H "Content-Type: application/json" \
  -d '{
    "timezone": "Europe/Warsaw"
  }'
```

**Oczekiwany rezultat:**
- Status HTTP: `409`
- Odpowiedź:
```json
{
  "error": "ProfileExists"
}
```

### 8. ❌ Nieprawidłowy JSON (400)

```bash
curl -X POST http://localhost:3000/api/profile \
  -H "Content-Type: application/json" \
  -d '{invalid json'
```

**Oczekiwany rezultat:**
- Status HTTP: `400`
- Odpowiedź:
```json
{
  "error": "ValidationError",
  "details": "Invalid JSON in request body"
}
```

### 9. ❌ Nadmiarowe pola (400)

```bash
curl -X POST http://localhost:3000/api/profile \
  -H "Content-Type: application/json" \
  -d '{
    "timezone": "Europe/Warsaw",
    "extra_field": "should not be here"
  }'
```

**Oczekiwany rezultat:**
- Status HTTP: `400`
- Odpowiedź z błędem walidacji (nierozpoznane pole)

## Czyszczenie danych testowych

Po zakończeniu testów, usuń profil testowy z bazy:

```sql
DELETE FROM profiles WHERE user_id = '456';
```

Lub przez REST API Supabase:

```bash
curl -X DELETE "http://127.0.0.1:54321/rest/v1/profiles?user_id=eq.456" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## Uwagi

- Endpoint obecnie używa `DEFAULT_USER_ID = "456"` dla wszystkich żądań
- Uwierzytelnienie zostanie dodane w przyszłości
- Upewnij się, że tabela `profiles` ma odpowiednie RLS policies (lub są wyłączone w środowisku dev)

