# Quick Start - POST /api/profile

## 1. Upewnij się, że Supabase działa

```bash
# Sprawdź czy Supabase odpowiada
curl http://127.0.0.1:54321

# Jeśli nie działa, uruchom:
supabase start
```

## 2. Uruchom serwer dev

```bash
npm run dev
```

## 3. Przetestuj endpoint

### Test podstawowy - utworzenie profilu

```bash
curl -X POST http://localhost:3000/api/profile \
  -H "Content-Type: application/json" \
  -d '{"timezone": "Europe/Warsaw"}' \
  -w "\nStatus: %{http_code}\n"
```

Powinno zwrócić `Status: 201` i obiekt profilu.

### Test błędu walidacji

```bash
curl -X POST http://localhost:3000/api/profile \
  -H "Content-Type: application/json" \
  -d '{}' \
  -w "\nStatus: %{http_code}\n"
```

Powinno zwrócić `Status: 400` i szczegóły błędu.

### Test duplikatu

```bash
# Wywołaj ponownie pierwszy request
curl -X POST http://localhost:3000/api/profile \
  -H "Content-Type: application/json" \
  -d '{"timezone": "Europe/Warsaw"}' \
  -w "\nStatus: %{http_code}\n"
```

Powinno zwrócić `Status: 409` z błędem `ProfileExists`.

## 4. Reset danych testowych

```bash
# W terminalu z działającym Supabase
supabase db reset
```

Lub usuń ręcznie profil testowy z `user_id = "456"`.

---

Więcej testów w pliku: `.ai/profile-endpoint-testing.md`
