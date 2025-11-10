# E2E Tests with Playwright

## 🚀 Szybki start

### 1. Konfiguracja zmiennych środowiskowych

Skopiuj przykładowy plik konfiguracyjny:

```bash
cp .env.test.example .env.test
```

### 2. Uruchom lokalną instancję Supabase

```bash
npm run supabase:start
```

Po uruchomieniu, skopiuj wartości `API URL` i `anon key` z terminala.

### 3. Uzupełnij plik `.env.test`

Wklej skopiowane wartości do pliku `.env.test`:

```bash
# .env.test
BASE_URL=http://localhost:3000
PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
PUBLIC_SUPABASE_ANON_KEY=<twój-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<twój-service-role-key>
```

**Ważne:** `SUPABASE_SERVICE_ROLE_KEY` jest potrzebny do automatycznego czyszczenia bazy danych po testach. Znajdziesz go w terminalu po uruchomieniu `npm run supabase:start` jako "service_role key".

### 4. Upewnij się że Supabase działa

```bash
# Sprawdź status
npm run supabase:status

# Jeśli nie działa, uruchom
npm run supabase:start
```

### 5. Uruchom testy

```bash
# Wszystkie testy E2E
npm run test:e2e

# Konkretny test
npm run test:e2e register-and-add-measurement.spec.ts

# Tryb UI (interaktywny)
npm run test:e2e:ui

# Tryb debug
npm run test:e2e:debug

# Z widocznym oknem przeglądarki
npm run test:e2e:headed
```

## 📁 Struktura projektu

```
e2e/
├── page-objects/           # Page Object Model classes
│   ├── BasePage.ts        # Klasa bazowa
│   ├── RegisterPage.ts    # Strona rejestracji
│   ├── MeasurementsPage.ts # Strona z pomiarami
│   ├── AddMeasurementDialog.ts # Dialog dodawania
│   ├── index.ts           # Barrel exports
│   └── README.md          # Dokumentacja POM
├── utils/
│   └── supabase-admin.ts  # Admin client dla teardown
├── global-teardown.ts     # Czyszczenie bazy po testach
├── *.spec.ts              # Pliki testów
└── README.md              # Ten plik
```

## 🔧 Konfiguracja

### Playwright Config

Konfiguracja znajduje się w pliku `playwright.config.ts` i zawiera:

- **Ładowanie `.env.test`** - Automatyczne ładowanie przez `dotenv` w config
- **Tylko Chromium** - Zgodnie z wytycznymi
- **Parallel execution** - Szybkie wykonywanie testów
- **Auto webServer** - Automatyczne uruchamianie dev servera
- **Traces & Screenshots** - Automatyczne debugowanie przy błędach
- **Global Teardown** - Automatyczne czyszczenie bazy po testach

### NPM Scripts

Wszystkie skrypty E2E używają `dotenv-cli` do ładowania `.env.test`:

```json
"test:e2e": "dotenv -e .env.test -- playwright test"
```

To zapewnia działanie cross-platform (Windows, Linux, macOS).

### Zmienne środowiskowe

| Zmienna                     | Opis                                    | Przykład                         | Wymagany |
| --------------------------- | --------------------------------------- | -------------------------------- | -------- |
| `BASE_URL`                  | URL aplikacji testowej                  | `http://localhost:3000`          | ✅       |
| `PUBLIC_SUPABASE_URL`       | URL Supabase (local)                    | `http://127.0.0.1:54321`         | ✅       |
| `PUBLIC_SUPABASE_ANON_KEY`  | Klucz anon Supabase                     | `<z supabase start>`             | ✅       |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key dla teardown           | `<z supabase start>`             | ✅       |
| `E2E_USERNAME_ID`           | ID użytkownika chronionego (opcjonalny) | `uuid-użytkownika-do-zachowania` | ❌       |

## 🧪 Dostępne testy

### `register-and-add-measurement.spec.ts`

Testy pełnego scenariusza użytkownika:

1. **Happy path**: Rejestracja → Przekierowanie → Dodanie pomiaru
2. **Walidacja**: Słabe hasło
3. **Walidacja**: Niezgodne hasła

```typescript
// Przykład użycia Page Objects
const registerPage = new RegisterPage(page);
await registerPage.navigate();
await registerPage.register("test@example.com", "Test123!@#");

const measurementsPage = new MeasurementsPage(page);
await measurementsPage.clickAddMeasurement();

const dialog = new AddMeasurementDialog(page);
await dialog.addMeasurement({
  sys: 120,
  dia: 80,
  pulse: 70,
  notes: "Test measurement",
});
```

## 🎨 Wzorce i konwencje

### AAA Pattern (Arrange-Act-Assert)

Każdy test powinien być zorganizowany w trzy sekcje:

```typescript
test("should do something", async ({ page }) => {
  // ============================================================
  // ARRANGE: Przygotowanie stanu początkowego
  // ============================================================
  const registerPage = new RegisterPage(page);
  await registerPage.navigate();

  // ============================================================
  // ACT: Wykonanie akcji
  // ============================================================
  await registerPage.register(email, password);

  // ============================================================
  // ASSERT: Weryfikacja wyniku
  // ============================================================
  await expect(page).toHaveURL(/.*measurements/);
});
```

### Page Object Model

Wszystkie interakcje z UI powinny przechodzić przez Page Objects:

✅ **Dobrze:**

```typescript
await registerPage.register(email, password);
```

❌ **Źle:**

```typescript
await page.getByTestId("register-email-input").fill(email);
await page.getByTestId("register-password-input").fill(password);
await page.getByTestId("register-submit-button").click();
```

### Selektory data-test-id

Wszystkie kluczowe elementy używają `data-test-id`:

```typescript
// W Page Object
get emailInput() {
  return this.page.getByTestId('register-email-input');
}

// W komponencie
<Input data-test-id="register-email-input" />
```

## 🧹 Czyszczenie bazy danych

### Global Teardown

Po zakończeniu wszystkich testów, automatycznie uruchamia się skrypt czyszczący (`e2e/global-teardown.ts`), który:

1. ✅ Usuwa wszystkie `interpretation_logs`
2. ✅ Usuwa wszystkie `measurements`
3. ✅ Usuwa wszystkie `profiles`
4. ✅ Usuwa wszystkich użytkowników auth (`auth.users`)

Kolejność ma znaczenie ze względu na foreign keys w bazie danych.

### Admin Client

Skrypt używa `SUPABASE_SERVICE_ROLE_KEY` do połączenia z bazą z pełnymi uprawnieniami (bypass RLS). Client admin znajduje się w `e2e/utils/supabase-admin.ts`.

**Uwaga:** Service role key daje pełen dostęp do bazy - używaj tylko w testach lokalnych!

### Chroniony użytkownik

Jeśli chcesz zachować konkretnego użytkownika i jego dane po testach, ustaw zmienną `E2E_USERNAME_ID` w pliku `.env.test`:

```bash
E2E_USERNAME_ID=<uuid-użytkownika>
```

Skrypt teardown automatycznie pominie:

- ✅ Użytkownika auth z tym ID
- ✅ Profil użytkownika
- ✅ Pomiary użytkownika
- ✅ Logi interpretacji użytkownika

## 📊 Raporty testów

Po uruchomieniu testów, raport HTML jest generowany automatycznie:

```bash
npm run test:e2e:report
```

Raport zawiera:

- Screenshots przy błędach
- Video replay przy błędach
- Trace logs
- Timings

## 🐛 Debugowanie

### Tryb debug

```bash
npm run test:e2e:debug
```

Otwiera Playwright Inspector do krokowego debugowania.

### Codegen - nagrywanie testów

```bash
npm run test:e2e:codegen
```

Otwiera przeglądarkę i nagrywa interakcje jako kod testowy.

### Traces

Po błędzie, trace jest automatycznie zapisywany. Zobacz go w raporcie HTML lub:

```bash
npx playwright show-trace test-results/path-to-trace.zip
```

## ⚠️ Rozwiązywanie problemów

### Problem: Testy nie mogą połączyć się z bazą danych

**Rozwiązanie:**

```bash
# Sprawdź czy Supabase działa
npm run supabase:status

# Jeśli nie, uruchom
npm run supabase:start

# Sprawdź czy .env.test istnieje i ma poprawne wartości
cat .env.test
```

**Ważne:** Musisz najpierw ręcznie uruchomić Supabase przed testami!

### Problem: Port 3000 jest zajęty

**Rozwiązanie:**

```bash
# Zmień BASE_URL w .env.test na inny port
BASE_URL=http://localhost:3001
```

I zaktualizuj `webServer.url` w `playwright.config.ts`.

### Problem: Testy są niestabilne (flaky)

**Rozwiązanie:**

- Użyj `waitFor` zamiast `setTimeout`
- Sprawdź czy używasz odpowiednich `expect` z auto-retry
- Dodaj `await page.waitForLoadState('networkidle')` w krytycznych miejscach

## 📚 Dokumentacja

- [Page Objects Documentation](./page-objects/README.md)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](./.cursor/rules/playwright-e2e-testing.mdc)

## 🤝 Współpraca

Przy dodawaniu nowych testów:

1. Stwórz Page Object jeśli potrzebny
2. Użyj wzorca AAA
3. Dodaj `data-test-id` do nowych elementów UI
4. Upewnij się że testy działają lokalnie
5. Sprawdź czy testy są deterministyczne (nie flaky)
