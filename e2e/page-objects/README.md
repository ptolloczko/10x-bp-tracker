# Page Object Model (POM) - E2E Tests

## 📚 Struktura

Page Object Model to wzorzec projektowy, który enkapsuluje logikę interakcji ze stronami i komponentami w dedykowanych klasach. Dzięki temu testy są bardziej czytelne, łatwiejsze w utrzymaniu i ponownym wykorzystaniu.

## 🗂️ Dostępne Page Objects

### `BasePage`
Klasa bazowa dla wszystkich Page Objects.

**Metody:**
- `goto(path: string)` - Nawigacja do określonej ścieżki
- `waitForPageLoad()` - Czeka na pełne załadowanie strony
- `getTitle()` - Pobiera tytuł strony
- `isVisible(selector: string)` - Sprawdza widoczność elementu
- `click(selector: string)` - Kliknięcie elementu
- `fill(selector: string, value: string)` - Wypełnienie pola
- `getText(selector: string)` - Pobiera tekst elementu
- `waitForSelector(selector: string)` - Czeka na pojawienie się elementu
- `screenshot(name: string)` - Tworzy zrzut ekranu

### `RegisterPage`
Page Object dla strony rejestracji (`/register`).

**Locatory:**
- `emailInput` - Pole email (`register-email-input`)
- `passwordInput` - Pole hasła (`register-password-input`)
- `confirmPasswordInput` - Pole potwierdzenia hasła (`register-confirm-password-input`)
- `submitButton` - Przycisk rejestracji (`register-submit-button`)
- `errorMessage` - Komunikat błędu (`register-error-message`)

**Główne metody:**
- `navigate()` - Przejdź do strony rejestracji
- `register(email, password)` - Wypełnij i wyślij formularz rejestracji
- `waitForRedirectToMeasurements()` - Czeka na przekierowanie po rejestracji
- `hasError()` - Sprawdza czy wyświetlany jest błąd
- `getErrorText()` - Pobiera tekst błędu

**Przykład użycia:**
```typescript
const registerPage = new RegisterPage(page);
await registerPage.navigate();
await registerPage.register('test@example.com', 'Test123!@#');
await registerPage.waitForRedirectToMeasurements();
```

### `MeasurementsPage`
Page Object dla strony z listą pomiarów (`/measurements`).

**Locatory:**
- `addMeasurementButton` - Przycisk "Dodaj pomiar" (`add-measurement-button`)
- `addFirstMeasurementButton` - Przycisk "Dodaj pierwszy pomiar" (`add-first-measurement-button`)

**Główne metody:**
- `navigate()` - Przejdź do strony pomiarów
- `clickAddMeasurement()` - Kliknij przycisk dodawania pomiaru
- `isEmptyState()` - Sprawdza czy lista jest pusta
- `hasTable()` - Sprawdza czy tabela jest widoczna
- `getMeasurementCount()` - Pobiera liczbę pomiarów
- `getMeasurementData(index)` - Pobiera dane konkretnego pomiaru
- `waitForToast(text)` - Czeka na toast z określonym tekstem

**Przykład użycia:**
```typescript
const measurementsPage = new MeasurementsPage(page);
await measurementsPage.navigate();
await measurementsPage.clickAddMeasurement();

// Po dodaniu pomiaru
const count = await measurementsPage.getMeasurementCount();
expect(count).toBeGreaterThan(0);
```

### `AddMeasurementDialog`
Page Object dla dialogu dodawania pomiaru.

**Locatory:**
- `dialog` - Dialog (`add-measurement-dialog`)
- `dateTimeInput` - Pole daty i czasu (`measurement-datetime-input`)
- `sysInput` - Pole ciśnienia skurczowego (`measurement-sys-input`)
- `diaInput` - Pole ciśnienia rozkurczowego (`measurement-dia-input`)
- `pulseInput` - Pole tętna (`measurement-pulse-input`)
- `notesInput` - Pole notatek (`measurement-notes-input`)
- `submitButton` - Przycisk zapisu (`measurement-submit-button`)

**Główne metody:**
- `waitForDialog()` - Czeka na pojawienie się dialogu
- `fillMeasurement(data)` - Wypełnia wszystkie pola formularza
- `addMeasurement(data)` - Wypełnia i zapisuje pomiar
- `waitForClose()` - Czeka na zamknięcie dialogu
- `getCurrentDateTime()` - Helper do generowania aktualnej daty

**Przykład użycia:**
```typescript
const dialog = new AddMeasurementDialog(page);
await dialog.waitForDialog();
await dialog.addMeasurement({
  sys: 120,
  dia: 80,
  pulse: 70,
  notes: 'Pomiar testowy'
});
await dialog.waitForClose();
```

## 🎯 Wzorzec AAA (Arrange-Act-Assert)

Wszystkie testy powinny być zorganizowane według wzorca AAA:

```typescript
test('should add measurement', async ({ page }) => {
  // ============================================================
  // ARRANGE: Przygotowanie stanu początkowego
  // ============================================================
  const measurementsPage = new MeasurementsPage(page);
  await measurementsPage.navigate();
  
  // ============================================================
  // ACT: Wykonanie akcji
  // ============================================================
  await measurementsPage.clickAddMeasurement();
  const dialog = new AddMeasurementDialog(page);
  await dialog.addMeasurement({ sys: 120, dia: 80, pulse: 70 });
  
  // ============================================================
  // ASSERT: Weryfikacja wyniku
  // ============================================================
  await expect(measurementsPage.hasTable()).toBeTruthy();
});
```

## 🔍 Konwencje nazewnictwa

### Locatory (gettery)
- Używaj nazw opisujących element: `emailInput`, `submitButton`
- Bez przedrostka `get` - to są gettery, nie metody

### Metody akcji
- Używaj czasowników: `navigate()`, `click()`, `fill()`
- Metody wypełniające: `fillEmail()`, `fillPassword()`
- Metody złożone: `register()`, `addMeasurement()`

### Metody sprawdzające
- Prefiksy `has`, `is`, `get`: `hasError()`, `isVisible()`, `getText()`
- Metody czekające: `waitFor...()`: `waitForDialog()`, `waitForToast()`

## 📝 Dobre praktyki

1. **Używaj `data-test-id`** zamiast selektorów CSS/XPath
2. **Enkapsuluj logikę** - szczegóły implementacji UI w Page Objects
3. **Zachowuj spójność** - wszystkie Page Objects dziedziczą z `BasePage`
4. **Dokumentuj** - dodawaj JSDoc do publicznych metod
5. **Zwracaj Promise** - wszystkie metody async powinny zwracać Promise
6. **Unikaj asercji** w Page Objects - tylko w testach
7. **Jedna odpowiedzialność** - każdy Page Object odpowiada za jedną stronę/komponent

## 🚀 Uruchomienie testów

```bash
# Uruchom wszystkie testy E2E
npm run test:e2e

# Uruchom konkretny test
npm run test:e2e register-and-add-measurement.spec.ts

# Uruchom testy w trybie UI
npm run test:e2e -- --ui

# Uruchom testy w trybie debug
npm run test:e2e -- --debug
```

## 📦 Import

Wszystkie Page Objects są dostępne poprzez barrel export:

```typescript
import { RegisterPage, MeasurementsPage, AddMeasurementDialog } from './page-objects';
```

## 🔗 Powiązane pliki

- Konfiguracja: `/playwright.config.ts`
- Testy: `/e2e/*.spec.ts`
- Page Objects: `/e2e/page-objects/*.ts`

