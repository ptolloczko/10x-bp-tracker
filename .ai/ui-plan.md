# Architektura UI dla BP Tracker

## 1. Przegląd struktury UI

BP Tracker to responsywna aplikacja webowa działająca jako Single-Page-Application hostowana w Astro. Po stronie klienta korzysta z React 19, Tailwind CSS 4 oraz komponentów Shadcn/ui. Aplikacja składa się z warstwy routingu (Astro pages + React Router w SPA-shellu), wspólnego układu `AppShell` (sidebar / navbar + główna sekcja treści) i zestawu widoków funkcjonalnych odwzorowujących kluczowe przypadki użycia opisane w PRD.  
Wszystkie żądania HTTP są wysyłane przez fabrykę `apiClient` z interceptorami obsługującymi token JWT, globalne mapowanie błędów na toasty oraz automatyczne wylogowanie przy 401.

## 2. Lista widoków

| # | Nazwa widoku | Ścieżka | Główny cel | Kluczowe informacje | Kluczowe komponenty | UX / A11y / Security |
|---|--------------|---------|------------|---------------------|---------------------|----------------------|
| 1 | Ekran logowania | `/login` | Umożliwia uwierzytelnienie użytkownika | Formularz email + hasło, link do rejestracji | `AuthForm`, `PasswordInput`, `SubmitButton`, `AuthErrorToast` | Walidacja inline, autofocus na email, aria-labels, wysoki kontrast, throttling prób logowania |
| 2 | Rejestracja | `/register` | Tworzy konto użytkownika | Formularz identyczny z loginem, polityka hasła | `AuthForm`, `PasswordRules`, `SubmitButton` | Walidacja siły hasła, aria-describedby, toast sukcesu |
| 3 | Kreator profilu | `/profile-setup` | Zebranie danych profilu po pierwszym logowaniu | Pola: imię, nazwisko, data urodzenia, płeć, waga, telefon, strefa | `Stepper`, `ProfileFormStep`, `PhoneInput`, `DatePicker`, `Select`, `SubmitButton` | Focus trapping, możliwość cofania kroków, walidacja onBlur, maski wejściowe phone/date |
| 4 | Dashboard „Ostatnie pomiary” | `/` (alias `/dashboard`) | Szybki podgląd najnowszych pomiarów | Tabela × 5 ostatnich rekordów, kolor/ikona/etykieta poziomu, przycisk „Dodaj pomiar”, karta statystyk | `MeasurementTable`, `LevelBadge`, `AddMeasurementButton`, `StatsCard`, `CSVExportButton` | Keyboard-navigable tabela, aria-sort, nagłówki TH, focus outline na przyciskach |
| 5 | Lista wszystkich pomiarów | `/measurements` | Przegląd pełnej historii | Tabela z paginacją, filtry daty/poziomu (v2), CSV export | `MeasurementTable`, `Pagination`, `CSVExportButton`, `FilterBar` (opc.) | Stronicowanie ma opisowe etykiety, responsywne ukrywanie numerów stron na xs |
| 6 | Szczegóły / Edycja pomiaru | `/measurements/:id` | Podgląd/edycja pojedynczego wpisu | Formularz z wartościami, historia interpretacji | `MeasurementForm`, `InterpretationLogList`, `DeleteButton` | Walidacja jak przy dodawaniu, potwierdzenie usunięcia (dialog), RLS chroni rekord |
| 7 | Modal „Dodaj pomiar” | `Dialog` otwierany z Dashboard / Listy | Szybkie dodanie nowego pomiaru | Formularz sys/dia/pulse/notes + measured_at | `Dialog`, `MeasurementForm`, `SubmitButton` | Focus trap, aria-modal, tryb pełnoekranowy na mobile, enter-to-submit |
| 8 | Ustawienia profilu | `/profile` | Aktualizacja danych profilu + toggle przypomnień + motyw | Formularz pól profilu, przełącznik `reminder_enabled`, toggle motywu | `ProfileForm`, `Switch`, `ThemeToggle`, `SubmitButton` | Guarded route, optimistic UI, aria-switch, zapamiętanie motywu w localStorage |
| 9 | Strona błędu sesji wygasłej | globalny redirect | Informuje o wylogowaniu | Banner/toast „Sesja wygasła” + redirect | `Toast`, `Redirect` | Minimalny czas wyświetlania toastu, brak wrażliwych danych |

## 3. Mapa podróży użytkownika

1. **Rejestracja ➜ Kreator profilu ➜ Dashboard**  
   a. Użytkownik wypełnia formularz rejestracji → sukces 201 → logowanie automatyczne.  
   b. API `/api/profile` zwraca 404 → przekierowanie do `/profile-setup`.  
   c. Użytkownik przechodzi kroki kreatora (stepper). Po zapisaniu `/api/profile` POST → redirect `/`.  

2. **Codzienne dodanie pomiaru**  
   a. Użytkownik na Dashboard klika „Dodaj pomiar” → otwiera się modal Dialog.  
   b. Walidacja formularza; POST `/api/measurements` → toast sukcesu „Pomiar zapisany” → zamknięcie modalu → refetch listy.  

3. **Przegląd historii i edycja**  
   a. Navigacja do `/measurements` z sidebaru.  
   b. Użytkownik wybiera numer strony lub filtr (v2) → React Query fetchuje dane.  
   c. Klik w wiersz otwiera `/measurements/:id`.  
   d. Edycja pól → PUT `/api/measurements/{id}` → toast sukcesu → powrót w historię lub automatyczny redirect.

4. **Eksport CSV**  
   a. Na Dashboard lub Liście kliknięcie `CSVExportButton` wysyła GET `/api/measurements/export`.  
   b. Przeglądarka pobiera plik; toast „Eksport przygotowany”.

5. **Zmiana ustawień przypomnień/motywu**  
   a. Użytkownik w Sidebar wybiera „Profil”.  
   b. Przełącza `reminder_enabled` lub motyw.  
   c. PUT `/api/profile` z aktualizacją → toast.

## 4. Układ i struktura nawigacji

- **AppShell** z `<Sidebar>` (desktop ≥ md) oraz `<BottomNav>` (mobile &lt; md).  
- Pozycje: Dashboard (`/`), Measurements (`/measurements`), Add (`Dialog` trigger), Profile (`/profile`).  
- Logo + ThemeToggle w nagłówku sidebaru; na mobile ThemeToggle w Drawerze.  
- React Router utrzymuje stan SPA; aktywna pozycja oznaczona kolorem + sr-only label.  
- Dostępność: pełne wsparcie klawiatury, aria-current dla linków, widoczny focus, role="navigation".

## 5. Kluczowe komponenty

| Komponent | Opis | Wykorzystanie |
|-----------|------|---------------|
| `AppShell` | Layout z sidebarem / navbarem i obszarem treści | Wszystkie routy chronione |
| `Sidebar` / `BottomNav` | Nawigacja zależna od breakpointu | Global |
| `ToastProvider` | Globalny kontener toastów (success/error/info) | App root |
| `apiClient` | Fetch wrapper z interceptorami JWT, 401, mapowaniem błędów | Wszystkie widoki |
| `MeasurementTable` | Tabela pomiarów z kolorowym badge poziomu | Dashboard, /measurements |
| `LevelBadge` | Ikona + kolor + etykieta poziomu ciśnienia | MeasurementTable, MeasurementForm |
| `MeasurementForm` | react-hook-form dla tworzenia / edycji pomiaru | Modal Add, /measurements/:id |
| `Pagination` | Komponent stronicowania Shadcn/ui | /measurements |
| `CSVExportButton` | Wyzwala pobranie CSV | Dashboard, /measurements |
| `ThemeToggle` | Przełącznik jasny/ciemny; zapis w localStorage | Sidebar, BottomNav, Profile |
| `Stepper` | Kontroluje kroki kreatora profilu | /profile-setup |
| `FilterBar` (opc.) | Filtry daty/poziomu | /measurements (v2) |

---

**Mapowanie historyjek PRD ➜ Widoki**  
US-001, 002 → `/login`, `/register`  
US-003, 004, 005, 006, 007, 012 → Modal Add, `/measurements`, `/measurements/:id`, Dashboard  
US-008 → `CSVExportButton`  
US-009 → `Profile` (`reminder_enabled` toggle)  
US-010 → `/profile`, `/profile-setup`  
US-011 → AppShell + guard routes + interceptor 401

**Przypadki brzegowe i błędy**  
- 401 → globalny logout + toast  
- 400-500 → Toast error z przyjazną treścią  
- Pusty wynik listy → komunikat „Brak pomiarów” + link „Dodaj”.  
- Walidacja biznesowa (sys < dia) → inline błąd formularza.  
- Brak profilu (404) → redirect do kreatora.  
- Słabe połączenie internetowe → loading skeleton / spinner.
