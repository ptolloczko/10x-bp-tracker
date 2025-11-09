# Instrukcja testowania endpointa GET /api/profile

## Wymagania wstępne

1. Uruchomiona lokalna instancja Supabase z tabelą `profiles`
2. Serwer dev Astro (`npm run dev`)
3. W bazie danych istnieje profil z `user_id = "408128e0-7ece-4062-849e-b94c3e79a96e"` (DEFAULT_USER_ID)

## Przygotowanie danych testowych

Przed testowaniem endpointa GET upewnij się, że istnieje profil testowy:

```bash
# Utwórz profil przez endpoint POST (jeśli nie istnieje)
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

## Scenariusze testowe

### 1. ✅ Odczyt profilu - sukces (200)

```bash
curl -X GET http://localhost:3000/api/profile \
  -H "Accept: application/json"
```

**Oczekiwany rezultat:**

- Status HTTP: `200`
- Nagłówek: `Cache-Control: no-store`
- Zwrócony obiekt `ProfileDTO` z wszystkimi polami:

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
  "reminder_enabled": false,
  "created_at": "2025-11-09T10:30:00.000Z",
  "updated_at": "2025-11-09T10:30:00.000Z"
}
```

### 2. ❌ Profil nie istnieje (404)

Aby przetestować ten scenariusz, usuń tymczasowo profil z bazy lub zmień `DEFAULT_USER_ID` w kodzie.

**Sposób 1: Usuń profil z bazy**

```sql
DELETE FROM profiles WHERE user_id = '408128e0-7ece-4062-849e-b94c3e79a96e';
```

Następnie wykonaj żądanie GET:

```bash
curl -X GET http://localhost:3000/api/profile \
  -H "Accept: application/json"
```

**Oczekiwany rezultat:**

- Status HTTP: `404`
- Odpowiedź:

```json
{
  "error": "ProfileNotFound"
}
```

**Po teście:** Utwórz ponownie profil testowy (patrz sekcja "Przygotowanie danych testowych").

### 3. ⚠️ Błąd serwera (500)

Ten scenariusz jest trudny do przetestowania bez symulowania awarii bazy danych.

Możliwe sposoby testowania:

1. Tymczasowo wyłącz Supabase
2. Zmień credentials w `.env` na nieprawidłowe
3. Dodaj tymczasowy kod w service, który rzuca wyjątek

**Oczekiwany rezultat:**

- Status HTTP: `500`
- Odpowiedź:

```json
{
  "error": "ServerError"
}
```

## Test z verbose output

Aby zobaczyć wszystkie nagłówki i szczegóły odpowiedzi:

```bash
curl -X GET http://localhost:3000/api/profile \
  -H "Accept: application/json" \
  -v
```

## Weryfikacja nagłówków odpowiedzi

Sprawdź, czy nagłówek `Cache-Control` jest prawidłowo ustawiony:

```bash
curl -X GET http://localhost:3000/api/profile \
  -H "Accept: application/json" \
  -I
```

**Oczekiwany wynik:**

```
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
...
```

## Testowanie wydajności

Sprawdź czas odpowiedzi endpointa:

```bash
time curl -X GET http://localhost:3000/api/profile \
  -H "Accept: application/json"
```

**Oczekiwany czas:** < 100ms (zapytanie po kluczu głównym jest bardzo szybkie)

## Automatyczny skrypt testowy

Stwórz plik `test-get-profile.sh`:

```bash
#!/bin/bash

echo "🧪 Testing GET /api/profile endpoint"
echo "======================================"
echo ""

BASE_URL="http://localhost:4321"

# Test 1: Success (200)
echo "Test 1: Profile exists (200)"
response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/profile" -H "Accept: application/json")
body=$(echo "$response" | head -n -1)
status=$(echo "$response" | tail -n 1)

if [ "$status" = "200" ]; then
  echo "✅ PASS - Status: $status"
  echo "Response: $body"
else
  echo "❌ FAIL - Expected 200, got $status"
  echo "Response: $body"
fi
echo ""

# Test 2: Check Cache-Control header
echo "Test 2: Cache-Control header"
headers=$(curl -s -I -X GET "$BASE_URL/api/profile")
if echo "$headers" | grep -q "cache-control: no-store"; then
  echo "✅ PASS - Cache-Control header present"
else
  echo "❌ FAIL - Cache-Control header missing or incorrect"
fi
echo ""

echo "======================================"
echo "✅ Testing completed"
```

Uruchom:

```bash
chmod +x test-get-profile.sh
./test-get-profile.sh
```

## Czyszczenie danych testowych

Po zakończeniu wszystkich testów:

```bash
# Użyj skryptu cleanup
./scripts/cleanup-supabase.sh

# Lub ręcznie:
# DELETE FROM profiles WHERE user_id = '408128e0-7ece-4062-849e-b94c3e79a96e';
```

## Uwagi

- Endpoint obecnie używa `DEFAULT_USER_ID = "408128e0-7ece-4062-849e-b94c3e79a96e"` dla wszystkich żądań
- Uwierzytelnienie zostanie dodane w przyszłości (middleware z JWT będzie pomijany na etapie testowania)
- Upewnij się, że tabela `profiles` ma odpowiednie RLS policies (lub są wyłączone w środowisku dev)
- Nagłówek `Cache-Control: no-store` zapewnia, że dane profilu nie są cache'owane
- Supabase RLS automatycznie ograniczy dostęp do rekordów użytkownika (gdy auth będzie włączony)

## Integracja z istniejącymi testami

Jeśli korzystasz z pliku `profile-endpoint-testing.md` dla POST, możesz połączyć testy:

1. POST - utwórz profil
2. GET - zweryfikuj, że profil istnieje i ma poprawne dane
3. POST - spróbuj utworzyć ponownie (oczekuj 409)
4. GET - ponownie odczytaj (powinno działać)
5. Cleanup - usuń profil
6. GET - spróbuj odczytać nieistniejący profil (oczekuj 404)

Ten przepływ testuje pełną funkcjonalność obu endpointów.
