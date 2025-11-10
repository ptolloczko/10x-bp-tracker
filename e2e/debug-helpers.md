# 🐛 Debugowanie testów E2E

## Problem: Element nie jest widoczny (toBeVisible failed)

### Przyczyny:

1. **React hydration delay** - Komponenty używają `client:load` w Astro
2. **Brak .env.test** - Zmienne środowiskowe nie są załadowane
3. **Supabase nie działa** - Aplikacja nie może się połączyć z bazą
4. **Niepoprawne data-test-id** - Literówka w atrybucie

### Rozwiązania:

#### 1. Sprawdź czy .env.test istnieje

```bash
# Sprawdź czy plik istnieje
ls -la .env.test

# Jeśli nie, skopiuj przykład
cp .env.test.example .env.test

# Wyświetl zawartość
cat .env.test
```

#### 2. Sprawdź czy Supabase działa

```bash
# Status Supabase
npm run supabase:status

# Jeśli nie działa
npm run supabase:start
```

#### 3. Sprawdź czy aplikacja działa

```bash
# Uruchom dev server ręcznie
npm run dev

# W przeglądarce otwórz
http://localhost:3000/register

# Sprawdź czy formularz się wyświetla
```

#### 4. Użyj Playwright Inspector

```bash
# Uruchom test w trybie debug
npm run test:e2e:debug

# Lub konkretny test
npm run test:e2e:debug -- register-and-add-measurement.spec.ts
```

#### 5. Sprawdź czy element ma data-test-id

W Playwright Inspector lub DevTools:

```javascript
// W konsoli przeglądarki
document.querySelector('[data-test-id="register-email-input"]')
```

#### 6. Sprawdź timeouty

Timeouty są już skonfigurowane w `playwright.config.ts`:

```typescript
export default defineConfig({
  timeout: 60000, // 60 sekund per test
  expect: {
    timeout: 15000 // 15 sekund dla assertions
  },
  use: {
    navigationTimeout: 30000, // 30 sekund dla page loads
    actionTimeout: 15000, // 15 sekund dla actions
  }
});
```

Jeśli nadal masz problemy, zwiększ je:

```typescript
// W konkretnym teście
test.setTimeout(120000); // 2 minuty

// Lub dla konkretnej asercji
await expect(element).toBeVisible({ timeout: 30000 });
```

## Problem: Testy są flaky (niestabilne)

### Rozwiązania:

1. **Dodaj czekanie na hydration**

```typescript
// W Page Object
async navigate() {
  await this.goto(this.path);
  await this.waitForPageLoad();
  // Czekaj na konkretny element
  await this.emailInput.waitFor({ state: "visible" });
}
```

2. **Użyj auto-retry assertions**

```typescript
// ✅ Dobrze - auto-retry
await expect(page.getByTestId('element')).toBeVisible();

// ❌ Źle - bez retry
const isVisible = await page.getByTestId('element').isVisible();
expect(isVisible).toBe(true);
```

3. **Czekaj na network idle**

```typescript
await page.waitForLoadState('networkidle');
```

## Problem: Testy działają lokalnie, ale nie na CI

### Sprawdź:

1. **Zmienne środowiskowe**
   - CI ma dostęp do `.env.test`?
   - Wartości są poprawne dla środowiska CI?

2. **Timeouty**
   - CI może być wolniejsze, zwiększ timeouty

3. **Supabase**
   - CI używa lokalnego Supabase czy external?

## Przydatne komendy

```bash
# Uruchom jeden konkretny test
npm run test:e2e -- register-and-add-measurement.spec.ts

# Uruchom testy z widocznym oknem
npm run test:e2e:headed

# Pokaż raport z ostatniego uruchomienia
npm run test:e2e:report

# Nagrywaj test (codegen)
npm run test:e2e:codegen

# Uruchom z więcej logów
DEBUG=pw:api npm run test:e2e
```

## Sprawdzanie logów

### 1. Screenshot przy błędzie

Automatycznie zapisywane w `test-results/`:

```bash
ls -la test-results/
```

### 2. Video replay

Automatycznie nagrywane przy błędach:

```bash
# Zobacz w raporcie HTML
npm run test:e2e:report
```

### 3. Trace logs

```bash
# Pokaż trace dla konkretnego błędu
npx playwright show-trace test-results/.../trace.zip
```

## Typowe błędy i rozwiązania

| Błąd | Przyczyna | Rozwiązanie |
|------|-----------|-------------|
| `element(s) not found` | React nie załadował się | Dodaj `waitFor` w navigate() |
| `.env.test not found` | Brak pliku konfiguracyjnego | `cp .env.test.example .env.test` |
| `Connection refused` | Supabase nie działa | `npm run supabase:start` |
| `Port already in use` | Dev server już działa | Zmień port w .env.test |
| `Timeout 30000ms exceeded` | Zbyt wolne ładowanie | Zwiększ timeout w config |

## Najlepsze praktyki debugowania

1. **Start small** - Najpierw przetestuj jeden element
2. **Use inspector** - `npm run test:e2e:debug` jest twoim przyjacielem
3. **Check the screenshot** - Automatyczne screenshoty pokazują stan UI
4. **Read trace logs** - Trace viewer pokazuje każdy krok
5. **Console logs** - Dodaj `console.log()` w testach jeśli potrzeba

## Przykład: Debug konkretnego testu

```typescript
test("debug register flow", async ({ page }) => {
  // Włącz verbose logging
  await page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  // Screenshot przed każdą akcją
  const registerPage = new RegisterPage(page);
  await registerPage.navigate();
  await page.screenshot({ path: 'debug-after-navigate.png' });
  
  // Sprawdź czy element istnieje
  const emailInput = page.getByTestId('register-email-input');
  console.log('Email input:', await emailInput.count());
  
  // Czekaj dłużej
  await emailInput.waitFor({ state: 'visible', timeout: 30000 });
  
  await page.screenshot({ path: 'debug-after-wait.png' });
});
```

## Kontakt z zespołem

Jeśli problem nadal występuje:
1. Uruchom test z `--debug`
2. Zrób screenshot błędu
3. Sprawdź logi w `test-results/`
4. Skopiuj pełny error message
5. Zgłoś issue z tymi informacjami

