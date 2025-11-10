# 🧪 Testing Guide

Kompletny przewodnik po testowaniu w projekcie BP Tracker.

## 📋 Spis treści

- [Typy testów](#typy-testów)
- [Szybki start](#szybki-start)
- [E2E testy (Playwright)](#e2e-testy-playwright)
- [Unit testy (Vitest)](#unit-testy-vitest)
- [Debugowanie](#debugowanie)

## Typy testów

### 🎭 E2E (End-to-End)

- **Framework:** Playwright
- **Lokalizacja:** `/e2e`
- **Cel:** Testowanie pełnych ścieżek użytkownika
- **Uruchomienie:** `npm run test:e2e`

### ⚡ Unit

- **Framework:** Vitest
- **Lokalizacja:** `/src/**/*.test.ts`
- **Cel:** Testowanie pojedynczych funkcji/komponentów
- **Uruchomienie:** `npm run test:unit`

## Szybki start

### Pierwsza konfiguracja

```bash
# 1. Skopiuj konfigurację dla testów E2E
cp .env.test.example .env.test

# 2. Uruchom lokalny Supabase
npm run supabase:start

# 3. Uzupełnij .env.test wartościami z terminala (API URL i anon key)

# 4. Uruchom wszystkie testy
npm test
```

### Codzienne użycie

```bash
# Uruchom wszystkie testy
npm test

# Tylko E2E
npm run test:e2e

# Tylko unit
npm run test:unit

# Unit testy w trybie watch
npm run test:unit:watch
```

## E2E testy (Playwright)

### 📚 Dokumentacja

Szczegółowa dokumentacja znajduje się w:

- **[e2e/README.md](./e2e/README.md)** - Główny przewodnik E2E
- **[e2e/page-objects/README.md](./e2e/page-objects/README.md)** - Page Object Model
- **[e2e/debug-helpers.md](./e2e/debug-helpers.md)** - Debugowanie

### Struktura

```
e2e/
├── page-objects/              # Page Object Model
│   ├── BasePage.ts           # Klasa bazowa
│   ├── RegisterPage.ts       # Strona rejestracji
│   ├── MeasurementsPage.ts   # Lista pomiarów
│   └── AddMeasurementDialog.ts # Dialog dodawania
├── register-and-add-measurement.spec.ts  # Testy
└── README.md                 # Dokumentacja
```

### Komendy

```bash
# Wszystkie testy E2E
npm run test:e2e

# Konkretny plik
npm run test:e2e register-and-add-measurement.spec.ts

# Tryb interaktywny
npm run test:e2e:ui

# Z widocznym oknem przeglądarki
npm run test:e2e:headed

# Tryb debug (krok po kroku)
npm run test:e2e:debug

# Nagrywanie testów
npm run test:e2e:codegen

# Raport z ostatniego uruchomienia
npm run test:e2e:report
```

### Przykład testu E2E

```typescript
import { test, expect } from "@playwright/test";
import { RegisterPage, MeasurementsPage } from "./page-objects";

test("should register and add measurement", async ({ page }) => {
  // ARRANGE
  const registerPage = new RegisterPage(page);
  await registerPage.navigate();

  // ACT
  await registerPage.register("test@example.com", "Test123!@#");

  // ASSERT
  await expect(page).toHaveURL(/.*measurements/);
});
```

### Page Object Model

Wszystkie interakcje z UI przechodzą przez Page Objects:

```typescript
// ✅ Dobrze - przez Page Object
await registerPage.register(email, password);

// ❌ Źle - bezpośrednio
await page.getByTestId("email").fill(email);
```

### Data-test-id

Wszystkie kluczowe elementy mają `data-test-id`:

```tsx
// W komponencie React/Astro
<Input data-test-id="register-email-input" />;

// W teście
page.getByTestId("register-email-input");
```

## Unit testy (Vitest)

### Komendy

```bash
# Uruchom unit testy
npm run test:unit

# Watch mode (auto-rerun)
npm run test:unit:watch

# UI mode (przegląd w przeglądarce)
npm run test:unit:ui

# Coverage
npm run test:unit:coverage
```

### Przykład unit testu

```typescript
import { describe, it, expect } from "vitest";
import { calculateBloodPressureLevel } from "./utils";

describe("calculateBloodPressureLevel", () => {
  it("should return optimal for 120/80", () => {
    const result = calculateBloodPressureLevel(120, 80);
    expect(result).toBe("optimal");
  });

  it("should return grade1 for 140/90", () => {
    const result = calculateBloodPressureLevel(140, 90);
    expect(result).toBe("grade1");
  });
});
```

## Debugowanie

### E2E - Playwright

**1. Tryb debug**

```bash
npm run test:e2e:debug
```

**2. Screenshot przy błędzie**

```bash
# Automatycznie zapisywane w test-results/
ls test-results/
```

**3. Trace viewer**

```bash
# Po błędzie, otwórz trace
npx playwright show-trace test-results/.../trace.zip
```

**4. Więcej logów**

```bash
DEBUG=pw:api npm run test:e2e
```

### Unit - Vitest

**1. UI mode**

```bash
npm run test:unit:ui
```

**2. Konkretny test**

```bash
npm run test:unit -- measurement.test.ts
```

**3. Debug w VSCode**

Dodaj do `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Vitest",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "test:unit"],
  "console": "integratedTerminal"
}
```

## Typowe problemy

### Problem: Element not found w Playwright

**Przyczyna:** React nie zdążył się załadować (hydration delay)

**Rozwiązanie:**

```typescript
// W Page Object
async navigate() {
  await this.goto(this.path);
  await this.waitForPageLoad();
  await this.emailInput.waitFor({ state: "visible" }); // 👈 Dodaj to
}
```

### Problem: .env.test not found

**Rozwiązanie:**

```bash
cp .env.test.example .env.test
# Uzupełnij wartości
```

### Problem: Connection refused (Supabase)

**Rozwiązanie:**

```bash
npm run supabase:start
```

### Problem: Port 3000 zajęty

**Rozwiązanie:**

```bash
# Zmień port w .env.test
BASE_URL=http://localhost:3001
```

## CI/CD

### GitHub Actions (przykład)

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: "20"

      - name: Install dependencies
        run: npm ci

      - name: Setup Supabase
        run: |
          npm run supabase:start
          # Czekaj aż Supabase będzie gotowy
          sleep 10

      - name: Create .env.test
        run: |
          cp .env.test.example .env.test
          # Uzupełnij wartościami z supabase status

      - name: Run unit tests
        run: npm run test:unit

      - name: Install Playwright
        run: npx playwright install --with-deps chromium

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## Najlepsze praktyki

### E2E

1. ✅ **Używaj Page Object Model**
2. ✅ **Używaj data-test-id zamiast selektorów CSS**
3. ✅ **Wzorzec AAA (Arrange-Act-Assert)**
4. ✅ **Czekaj na elementy zamiast używać sleep**
5. ✅ **Jeden test = jedna funkcjonalność**
6. ❌ **Nie testuj implementacji, testuj zachowanie**
7. ❌ **Nie duplikuj logiki w testach**

### Unit

1. ✅ **Testuj funkcje pure (bez side effects)**
2. ✅ **Mock zależności zewnętrzne**
3. ✅ **Testuj edge cases**
4. ✅ **Używaj describe/it dla organizacji**
5. ❌ **Nie testuj bibliotek zewnętrznych**
6. ❌ **Nie testuj CSS/styling**

## Wsparcie

- 📖 **E2E:** Zobacz [e2e/README.md](./e2e/README.md)
- 🐛 **Debug:** Zobacz [e2e/debug-helpers.md](./e2e/debug-helpers.md)
- 📚 **Playwright:** https://playwright.dev/
- ⚡ **Vitest:** https://vitest.dev/
