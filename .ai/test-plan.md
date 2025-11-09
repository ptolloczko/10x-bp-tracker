# Plan testów projektu – aplikacja monitorowania ciśnienia krwi

## 1. Wprowadzenie i cele testowania

Celem testów jest zapewnienie, że aplikacja:

- poprawnie obsługuje procesy uwierzytelniania, zarządzania pomiarami i profilami użytkowników,
- prezentuje dane w sposób spójny i dostępny na wszystkich docelowych urządzeniach,
- jest bezpieczna, wydajna i odporna na błędy,
- spełnia wymagania użytkowników oraz wytyczne biznesowe.

## 2. Zakres testów

Objęte testami moduły i warstwy:

1. Frontend (Astro + React 19, TypeScript 5)  
   • Komponenty stron (`src/pages/*.astro`)  
   • Komponenty UI i formularzy (`src/components/**`)  
   • Hooki i logika kliencka (`src/components/hooks/**`)
2. Backend - API endpoints (`src/pages/api/**`)  
   • Auth (`auth/*.ts`)  
   • Measurements (`measurements/*.ts`)  
   • Profile (`profile*.ts`)
3. Warstwa usług (`src/lib/services/**`) – logika biznesowa
4. Narzędzia pomocnicze (`src/lib/utils/**`, `bp-classifier.ts`)
5. Integracja z Supabase (baza, auth)
6. Middleware (`src/middleware/index.ts`)
7. Konfiguracja i pipeline CI/CD (GitHub Actions)

## 3. Typy testów

| Poziom               | Cel                                                                                    | Narzędzia                                                   |
| -------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Testy jednostkowe    | Walidacja logiki w izolacji (np. `bp-classifier`, serwisy)                             | Vitest + ts-jest, React Testing Library                     |
| Testy integracyjne   | Sprawdzenie współpracy modułów (API ↔ DB, serwisy ↔ Supabase, komponenty formularzy) | Vitest, Supertest, @supabase/supabase-js (mock lub test DB) |
| Testy E2E/UI         | Walidacja ścieżek użytkownika w przeglądarce                                           | Playwright (desktop + mobile)                               |
| Testy dostępności    | Zapewnienie WCAG 2.1 AA                                                                | Playwright-axe, jest-axe                                    |
| Testy bezpieczeństwa | Kontrola luk (XSS, CSRF, RBAC)                                                         | OWASP ZAP, dependency-check                                 |
| Testy regresji       | Automatyczne uruchamianie zestawu krytycznych scenariuszy w CI                         | Playwright, Vitest suites                                   |
| Testy smoke / sanity | Szybka walidacja po wdrożeniu                                                          | Skrypt Playwright smoke                                     |

## 4. Scenariusze testowe dla kluczowych funkcjonalności

1. **Uwierzytelnianie**
   - Rejestracja użytkownika z poprawnymi/niepoprawnymi danymi
   - Logowanie (poprawne hasło / błędne hasło / nieaktywne konto)
   - Reset hasła (wysyłka maila, link z tokenem, zmiana hasła)
   - Wylogowanie i wygaszenie sesji
2. **Zarządzanie pomiarami**
   - Dodanie nowego pomiaru (unikalny `measured_at`)
   - Duplikat pomiaru → `MeasurementDuplicateError`
   - Lista pomiarów z paginacją, filtrowaniem i sortowaniem
   - Edycja pomiaru: zmiana wartości sys/dia → ponowna klasyfikacja
   - Usunięcie pomiaru (miękkie) i weryfikacja braku na liście
   - Eksport CSV
3. **Klasyfikacja ciśnienia (`bp-classifier`)**
   - Testy tabelaryczne dla wszystkich poziomów ESC/ESH 2023
   - Graniczne wartości progowe (np. 119/79 → optimal vs 120/80 → normal)
4. **Profil użytkownika**
   - Tworzenie profilu (brak → `ProfileExistsError`)
   - Aktualizacja danych osobowych
   - Przełącznik przypomnień e-mail
5. **UI/UX**
   - Walidacja formularzy (puste pola, wzorce haseł, komunikaty błędów)
   - Przełączanie motywu (ThemeToggle) i responsywność (Tailwind breakpoints)
   - Paginacja, sortowanie tabel (`MeasurementTable`)
   - Dostępność: fokus, aria-label, kontrast
6. **Bezpieczeństwo**
   - Dostęp do endpointów z/bez tokena JWT
   - Próba modyfikacji cudzych zasobów (inny `user_id`)
   - Skan podatności zależności npm

## 5. Środowisko testowe

- Oddzielna instancja Supabase (schema jak produkcja, obcięte dane)
- Zmienna `SUPABASE_URL` i `SUPABASE_ANON_KEY` wskazująca na środowisko testowe
- Kontenery Docker do lokalnego uruchamiania bazy i aplikacji
- Browser contexts: Chromium + WebKit + Firefox (Playwright)
- Emulacja urządzeń mobilnych (iPhone 14, Galaxy S22)
- Node 20 LTS, pnpm 8

## 6. Narzędzia do testowania

- Vitest + React Testing Library – jednostkowe/integracyjne
- Playwright (UI/E2E, smoke, dostępność)
- Supabase CLI (seed DB, migracje testowe)
- ESLint + Prettier – statyczna analiza
- GitHub Actions – orkiestracja pipeline
- Coveralls – raport pokrycia kodu
- OWASP ZAP – skan bezpieczeństwa

## 7. Harmonogram testów

| Faza | Zakres                                | Czas trwania       | Odpowiedzialny     |
| ---- | ------------------------------------- | ------------------ | ------------------ |
| T1   | Przygotowanie środowiska, seed danych | 1 dzień            | DevOps             |
| T2   | Jednostkowe + integracyjne (Vitest)   | 3 dni              | Developerzy        |
| T3   | UI/E2E smoke & regresja (Playwright)  | 2 dni              | QA                 |
| T4   | Testy bezpieczeństwa                  | 1 dzień            | QA + DevOps        |
| T5   | Testy akceptacyjne UAT                | 2 dni              | Product Owner + QA |
| T6   | Retest/Regression po poprawkach       | zależnie od wyniku | QA                 |

Testy jednostkowe uruchamiane są przy każdym PR, pełna regresja co noc, smoke po każdym deployu na staging.

## 8. Kryteria akceptacji testów

- Pokrycie kodu (lines) ≥ 80 % dla warstwy usług i utils
- 0 krytycznych lub wysokich błędów w backlogu
- Wszystkie scenariusze biznesowe zakończone statusem „Pass"
- Brak regresji w Core Web Vitals (LCP < 2,5 s, CLS < 0,1)

## 9. Role i odpowiedzialności

| Rola          | Zakres                                                        |
| ------------- | ------------------------------------------------------------- |
| QA Lead       | Koordynacja strategii testów, raportowanie ryzyk              |
| QA Engineer   | Implementacja scenariuszy Playwright, manualne UAT            |
| Developer     | Pisanie testów jednostkowych/integracyjnych, naprawa defektów |
| DevOps        | Utrzymanie środowisk, pipeline CI/CD                          |
| Product Owner | Akceptacja kryteriów, priorytetyzacja błędów                  |

## 10. Procedury raportowania błędów

1. Błąd rejestrowany w GitHub Issues z etykietą `bug` i priorytetem P0–P3  
   • Opis kroki-do-reprodukcji, oczekiwany vs rzeczywisty rezultat, zrzuty ekranu/logi
2. QA przypisuje błąd do odpowiedniego developera i sprintu
3. Po naprawie developer otwiera PR z adnotacją `Fixes #<issue>` i testem regresyjnym
4. QA wykonuje retest i aktualizuje status na `Verified` lub `Reopen`
5. Metryki defektów (czas naprawy, liczba reopen) raportowane w retrospekcji sprintu

---

Plan ten stanowi kompleksowy przewodnik po procesie testowania, dostosowany do architektury i technologii projektu oraz zapewnia jasne kryteria jakości i odpowiedzialności.
