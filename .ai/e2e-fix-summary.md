# Poprawka Konfiguracji E2E Tests

## Problem

Testy E2E nie mogły się uruchomić, ponieważ:

1. **Niezgodność portów**: Playwright próbował łączyć się z portem 4321, ale serwer Astro jest skonfigurowany na port 3000
2. **Brak Supabase**: Aplikacja wymaga uruchomionego Supabase, a testy nie sprawdzały czy jest dostępny

## Rozwiązanie

### 1. Poprawiono konfigurację Playwright (`playwright.config.ts`)

- ✅ Zmieniono port z 4321 na 3000
- ✅ Zwiększono timeout z 60s do 120s (2 minuty)
- ✅ Dodano więcej czasu na start Supabase jeśli potrzebny

### 2. Utworzono skrypt pomocniczy (`scripts/test-e2e.sh`)

- ✅ Automatycznie sprawdza czy Supabase działa
- ✅ Uruchamia Supabase jeśli nie jest uruchomiony
- ✅ Dopiero potem uruchamia testy Playwright

### 3. Zaktualizowano skrypty NPM

Wszystkie komendy E2E teraz automatycznie sprawdzają Supabase:

```bash
npm run test:e2e         # Automatycznie startuje Supabase jeśli potrzebny
npm run test:e2e:ui      # UI mode z auto-startem Supabase
npm run test:e2e:headed  # Headed mode z auto-startem Supabase
npm run test:e2e:debug   # Debug mode z auto-startem Supabase
```

### 4. Zaktualizowano dokumentację

- ✅ TESTING.md - dodano informacje o wymaganiu Supabase
- ✅ Wyjaśniono workflow testów E2E

## Jak teraz uruchomić testy E2E

### Opcja 1: Automatyczny start wszystkiego (zalecane)

```bash
npm run test:e2e
```

Skrypt sam:

1. Sprawdzi czy Supabase działa
2. Uruchomi Supabase jeśli potrzebny
3. Playwright uruchomi serwer dev (port 3000)
4. Uruchomi testy

### Opcja 2: Ręczny start (dla większej kontroli)

```bash
# Terminal 1: Start Supabase
npm run supabase:start

# Terminal 2: Uruchom testy
npm run test:e2e
```

## Sprawdzenie konfiguracji

Prawidłowe porty w projekcie:

- **Serwer Astro dev**: `http://localhost:3000` (astro.config.mjs)
- **Playwright baseURL**: `http://localhost:3000` (playwright.config.ts)
- **Supabase API**: `http://localhost:54321` (local instance)
- **Supabase Studio**: `http://localhost:54323`

## Co dalej?

Teraz możesz:

1. ✅ Uruchomić `npm run test:e2e` - wszystko powinno działać
2. ✅ Pisać nowe testy E2E używając Page Object Model
3. ✅ Używać `npm run test:e2e:codegen` do nagrywania testów
4. ✅ Debugować testy z `npm run test:e2e:debug`

---

**Środowisko testowe E2E jest teraz w pełni funkcjonalne! 🎉**
