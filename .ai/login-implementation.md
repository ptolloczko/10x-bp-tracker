# Dokumentacja Integracji Logowania

## ✅ Implementacja Zakończona

Integracja funkcji logowania z backendem Astro i Supabase Auth została zakończona pomyślnie.

## 📁 Utworzone Pliki

### 1. **Walidatory** (`src/lib/validators/auth.ts`)

- `LoginFormSchema` - walidacja formularza logowania (client-side)
- `LoginRequestSchema` - walidacja API endpoint (server-side)
- `RegisterFormSchema`, `RegisterRequestSchema` - dla przyszłej rejestracji
- `ForgotPasswordRequestSchema`, `ResetPasswordRequestSchema` - dla przyszłego resetu hasła

### 2. **Service** (`src/lib/services/auth.service.ts`)

- `AuthService.login()` - autentykacja przez Supabase Auth
- `AuthService.register()` - rejestracja użytkownika
- `AuthService.logout()` - wylogowanie
- `AuthService.sendPasswordResetEmail()` - wysłanie emaila resetującego
- `AuthService.updatePassword()` - aktualizacja hasła
- `AuthService.getCurrentUser()` - pobranie aktualnego użytkownika

### 3. **API Client** (`src/lib/api/auth.client.ts`)

- `AuthApiClient.login()` - client-side wrapper dla endpoint logowania
- `AuthApiClient.logout()` - client-side wrapper dla endpoint wylogowania
- Eksportowany singleton `authApiClient` do użycia w komponentach React

### 4. **API Endpoints**

- **`src/pages/api/auth/login.ts`** - POST endpoint logowania + ustawianie cookies
- **`src/pages/api/auth/logout.ts`** - POST endpoint wylogowania + czyszczenie cookies

### 5. **Komponenty React**

- **`src/components/LogoutButton.tsx`** - Przycisk wylogowania z obsługą stanu loading

## 🔧 Zaktualizowane Pliki

### 1. **Typy** (`src/types.ts`)

- Dodano import `User`, `Session` z `@supabase/supabase-js`
- Dodano interfejsy: `AuthResponse`, `LoginRequest`, `RegisterRequest`, `ForgotPasswordRequest`, `ResetPasswordRequest`

### 2. **Supabase Client** (`src/db/supabase.client.ts`)

- Dodano konfigurację auth:
  - `persistSession: true` - sesja zapisywana w localStorage
  - `autoRefreshToken: true` - automatyczne odświeżanie tokenów
  - `detectSessionInUrl: true` - detekcja sesji z URL (reset hasła)
  - `flowType: "pkce"` - dodatkowa warstwa bezpieczeństwa
- Dodano deprecation warning dla `DEFAULT_USER_ID`

### 3. **Middleware** (`src/middleware/index.ts`)

- **KLUCZOWA ZMIANA**: Middleware teraz obsługuje zarówno Authorization header jak i cookies
- Flow autentykacji:
  1. Sprawdzenie Authorization header (Bearer token)
  2. Jeśli brak - sprawdzenie cookies Supabase (`sb-access-token`, `sb-refresh-token`)
  3. Jeśli access token wygasł - automatyczne odświeżenie z refresh token
  4. Aktualizacja cookies po odświeżeniu
  5. Ustawienie `context.locals.user`

### 4. **LoginView** (`src/components/views/LoginView.tsx`)

- Integracja z `authApiClient`
- Wywołanie `authApiClient.login(data)`
- Przekierowanie na `/measurements` po sukcesie
- Wyświetlanie błędów użytkownikowi

### 5. **Strony Astro**

- **`src/pages/login.astro`** - Dodano sprawdzenie czy już zalogowany → redirect na `/measurements`
- **`src/pages/measurements.astro`** - Dodano sprawdzenie autentykacji → redirect na `/login`
- **`src/pages/profile.astro`** - Dodano sprawdzenie autentykacji → redirect na `/login`
- **`src/pages/index.astro`** - Przekierowanie: zalogowany → `/measurements`, niezalogowany → `/login`

### 6. **Layout** (`src/layouts/Layout.astro`)

- ✨ **NOWE**: Dodano header z nawigacją
- Weryfikacja stanu użytkownika (`Astro.locals.user`)
- Warunkowe wyświetlanie:
  - Dla zalogowanych: linki "Pomiary", "Profil" + przycisk "Wyloguj się"
  - Dla niezalogowanych: link "Zaloguj się"
- Użycie `client:load` dla LogoutButton (React)

## 🔐 Strategia Cookies

**Implementacja hybrydowa:**

- **Client-side**: Supabase automatycznie zarządza cookies w przeglądarce
- **Server-side**: Middleware odczytuje cookies dla SSR:
  - `sb-access-token` (JWT, krótkotrwały, 1h)
  - `sb-refresh-token` (długotrwały, 7 dni)
- **Bezpieczeństwo**:
  - `httpOnly: true` - ochrona przed XSS
  - `secure: true` (produkcja) - tylko HTTPS
  - `sameSite: 'lax'` - ochrona przed CSRF

## 🔄 Flow Logowania

### Krok po kroku:

1. **Użytkownik wchodzi na `/login`**
   - Middleware sprawdza sesję w cookies
   - Jeśli zalogowany → redirect na `/measurements`
   - Jeśli niezalogowany → renderowanie LoginView

2. **Użytkownik wypełnia formularz**
   - Client-side walidacja (Zod)
   - Wyświetlanie błędów walidacji inline

3. **Użytkownik klika "Zaloguj się"**
   - `LoginView.handleSubmit()` wywołuje `authApiClient.login()`
   - Request trafia do `POST /api/auth/login`

4. **API Endpoint przetwarza request**
   - Walidacja server-side (Zod)
   - `AuthService.login()` wywołuje `supabase.auth.signInWithPassword()`
   - Supabase zwraca user + session

5. **Supabase ustawia cookies**
   - Automatyczne zapisanie `sb-access-token` i `sb-refresh-token` w przeglądarce
   - Cookies są HttpOnly i Secure

6. **Redirect na `/measurements`**
   - `window.location.href = '/measurements'`
   - Pełne odświeżenie strony (SSR)

7. **SSR na `/measurements`**
   - Middleware odczytuje cookies
   - Weryfikuje access token
   - Ustawia `context.locals.user`
   - Renderowanie strony z danymi użytkownika

## 🎯 Zgodność z Wymaganiami

### ✅ US-002 (Logowanie)

- Formularz logowania z email i hasłem
- Przekierowanie na `/measurements` po sukcesie
- Obsługa błędów ("Nieprawidłowy email lub hasło")

### ✅ US-011 (Bezpieczny dostęp)

- Strona `/measurements` wymaga autentykacji
- Przekierowanie na `/login` dla niezalogowanych
- Middleware weryfikuje sesję dla każdego requesta SSR

### ✅ PRD (Logowanie i rejestracja)

- Logowanie odbywa się na dedykowanej stronie `/login`
- Wymaga podania email i hasła
- Użytkownik NIE MOŻE korzystać z `/measurements` bez logowania

## 🧪 Testowanie

### Manualne testy do wykonania:

1. **Test logowania pomyślnego:**
   - [ ] Wejdź na `/login`
   - [ ] Wprowadź prawidłowe dane
   - [ ] Sprawdź przekierowanie na `/measurements`
   - [ ] Zweryfikuj że sesja jest zachowana po odświeżeniu

2. **Test logowania niepomyślnego:**
   - [ ] Wprowadź nieprawidłowy email/hasło
   - [ ] Sprawdź komunikat błędu "Nieprawidłowy email lub hasło"
   - [ ] Sprawdź że formularz pozostaje wypełniony (email)

3. **Test ochrony strony:**
   - [ ] Bez logowania wejdź na `/measurements`
   - [ ] Sprawdź przekierowanie na `/login`

4. **Test przekierowania zalogowanego użytkownika:**
   - [ ] Zaloguj się
   - [ ] Wejdź na `/login`
   - [ ] Sprawdź przekierowanie na `/measurements`

5. **Test odświeżenia tokena:**
   - [ ] Zaloguj się
   - [ ] Poczekaj 1h (lub zmień expiry tokena w testach)
   - [ ] Odśwież stronę `/measurements`
   - [ ] Sprawdź że token został automatycznie odświeżony

## 🚀 Następne Kroki

Aby ukończyć moduł autentykacji, należy zaimplementować:

1. **Rejestracja** (`/register`)
   - Endpoint `POST /api/auth/register`
   - RegisterView komponent
   - Automatyczne utworzenie profilu
   - Automatyczne logowanie po rejestracji

2. **Reset hasła** (`/forgot-password`, `/reset-password`)
   - Endpoint `POST /api/auth/forgot-password`
   - Endpoint `POST /api/auth/reset-password`
   - ForgotPasswordView, ResetPasswordView
   - Konfiguracja email templates w Supabase

3. **Wylogowanie**
   - Endpoint `POST /api/auth/logout`
   - LogoutButton komponent
   - Aktualizacja Layout.astro z przyciskiem wylogowania

4. **Aktualizacja istniejących API endpoints**
   - Zamiana `DEFAULT_USER_ID` na `context.locals.user.id`
   - Dodanie sprawdzania autentykacji (401 dla niezalogowanych)

## 📝 Notatki Techniczne

### Dlaczego nie ustawiamy cookies ręcznie w API endpoint?

- Supabase automatycznie zarządza cookies po stronie klienta
- API endpoint tylko zwraca `user` + `session` jako JSON
- Client (browser) automatycznie zapisuje tokeny w localStorage i cookies
- Middleware odczytuje te cookies dla SSR

### Dlaczego używamy `window.location.href` zamiast client-side routingu?

- Astro używa SSR, nie SPA routingu
- Pełne odświeżenie strony zapewnia że middleware odczyta nowe cookies
- SSR na `/measurements` ma dostęp do `context.locals.user`

### Dlaczego PKCE flow?

- PKCE (Proof Key for Code Exchange) to dodatkowa warstwa bezpieczeństwa
- Chroni przed atakami przechwytującymi authorization code
- Rekomendowane dla wszystkich aplikacji public clients (SPA)

## ✅ Checklist Implementacji

- [x] Typy Auth w `src/types.ts`
- [x] Walidatory w `src/lib/validators/auth.ts`
- [x] Konfiguracja Supabase Client
- [x] Auth Service (`src/lib/services/auth.service.ts`)
- [x] Auth API Client (`src/lib/api/auth.client.ts`)
- [x] Login Endpoint (`src/pages/api/auth/login.ts`)
- [x] **Logout Endpoint (`src/pages/api/auth/logout.ts`)**
- [x] Middleware z obsługą cookies
- [x] LoginView integracja
- [x] **LogoutButton komponent**
- [x] Ochrona `/login` dla zalogowanych
- [x] Ochrona `/measurements` dla niezalogowanych
- [x] Ochrona `/profile` dla niezalogowanych
- [x] **Przekierowanie w `index.astro`**
- [x] **Layout z nawigacją i weryfikacją użytkownika**
- [x] Brak błędów lintera
- [ ] Testy manualne
- [ ] Testy automatyczne (opcjonalnie)

---

**Implementacja zakończona**: 2025-11-09
**Ostatnia aktualizacja**: 2025-11-09 (dodano wylogowanie i nawigację)
**Status**: ✅ Gotowe do testowania
