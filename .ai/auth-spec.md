# Specyfikacja Techniczna: Moduł Autentykacji BP Tracker

## UWAGI DOTYCZĄCE SPRZECZNOŚCI W PRD

### Sprzeczność 1: Reset hasła

**PRD linie 19 i 40:** "bez resetu hasła w MVP", "Brak resetu hasła; użytkownik musi pamiętać swoje hasło"
**PRD linia 65:** "Odzyskiwanie hasła powinno być możliwe"

**ROZWIĄZANIE:** Linia 65 jest późniejszą korektą wymagań. Implementujemy pełną funkcjonalność resetu hasła zgodnie z linią 65.

### Sprzeczność 2: Przekierowanie po logowaniu

**PRD US-002:** "przekierowuje na stronę główną"

**ROZWIĄZANIE:** Dla użytkownika zalogowanego, stroną główną jest `/measurements` - to najbardziej użyteczny punkt wejścia do aplikacji.

### Wyjaśnienie: Flow po rejestracji

**PRD US-001:** "Po poprawnym wypełnieniu tworzony jest profil użytkownika"
**PRD US-010:** "Jako użytkownik chcę uzupełnić dane profilu"

**ROZWIĄZANIE:** Profil tworzony jest automatycznie z pustymi polami opcjonalnymi. Użytkownik jest przekierowywany na `/measurements` i może **później** uzupełnić profil w `/profile` (zgodnie z US-010 - "uzupełnić" sugeruje opcjonalność).

---

## 1. ARCHITEKTURA INTERFEJSU UŻYTKOWNIKA

### 1.1. Strony Astro (Server-Side)

#### 1.1.1. Strona Logowania (`/src/pages/login.astro`)

**Cel:** Umożliwienie zalogowania istniejącym użytkownikom.

**Struktura:**

```
Layout (title: "Logowanie")
  └─ LoginView (React, client:load)
```

**Logika SSR:**

- Sprawdzenie w middleware czy użytkownik jest już zalogowany
- Jeśli zalogowany → przekierowanie na `/measurements`
- Jeśli niezalogowany → renderowanie strony logowania

**Integracja z backendem:**

- Wykorzystuje Supabase Auth przez middleware w `context.locals.user`
- Przekierowanie następuje po stronie serwera przed renderowaniem

#### 1.1.2. Strona Rejestracji (`/src/pages/register.astro`)

**Cel:** Umożliwienie rejestracji nowym użytkownikom.

**Struktura:**

```
Layout (title: "Rejestracja")
  └─ RegisterView (React, client:load)
```

**Logika SSR:**

- Sprawdzenie czy użytkownik jest już zalogowany
- Jeśli zalogowany → przekierowanie na `/measurements`
- Jeśli niezalogowany → renderowanie formularza rejestracji

**Integracja z backendem:**

- Po rejestracji automatyczne logowanie użytkownika
- Utworzenie profilu przez POST /api/profile

#### 1.1.3. Strona Resetowania Hasła (`/src/pages/forgot-password.astro`)

**Cel:** Umożliwienie użytkownikom odzyskania dostępu do konta.

**Struktura:**

```
Layout (title: "Resetowanie hasła")
  └─ ForgotPasswordView (React, client:load)
```

**Logika SSR:**

- Dostępna dla niezalogowanych użytkowników
- Nie wymaga autentykacji

#### 1.1.4. Strona Resetowania Hasła - Potwierdzenie (`/src/pages/reset-password.astro`)

**Cel:** Strona docelowa linku z maila, gdzie użytkownik ustawia nowe hasło.

**Struktura:**

```
Layout (title: "Ustaw nowe hasło")
  └─ ResetPasswordView (React, client:load)
```

**Logika SSR:**

- Odczytanie tokena resetowania z URL (query params)
- Walidacja tokena przez Supabase Auth
- Przekierowanie na `/login` jeśli token nieprawidłowy

#### 1.1.5. Aktualizacja Strony Głównej (`/src/pages/index.astro`)

**Cel:** Landing page z nawigacją do logowania/rejestracji lub pomiarów.

**Struktura:**

```
Layout (title: "BP Tracker")
  └─ Welcome (Astro component)
```

**Zmiany:**

- Dodanie przycisków "Zaloguj się" i "Zarejestruj się" dla niezalogowanych
- Dodanie przycisku "Przejdź do pomiarów" dla zalogowanych
- Sprawdzenie stanu autentykacji w SSR

#### 1.1.6. Aktualizacja Stron Chronionych

**Strony:** `/src/pages/measurements.astro`, `/src/pages/profile.astro`

**Logika SSR:**

- Sprawdzenie `context.locals.user` w middleware
- Jeśli `user === null` → przekierowanie na `/login`
- Jeśli `user !== null` → renderowanie strony

**Implementacja przekierowania:**

```typescript
// W każdej chronionej stronie
if (!Astro.locals.user) {
  return Astro.redirect("/login");
}
```

### 1.2. Komponenty React (Client-Side)

#### 1.2.1. LoginView (`/src/components/views/LoginView.tsx`)

**Odpowiedzialność:** Widok główny strony logowania.

**Struktura:**

```
LoginView
  ├─ LoginForm (formularz logowania)
  └─ Link do strony rejestracji
  └─ Link do strony resetowania hasła
```

**Zarządzanie stanem:**

- Stan lokalny: loading, error
- Komunikacja z AuthApiClient
- Obsługa przekierowania po zalogowaniu przez window.location

#### 1.2.2. RegisterView (`/src/components/views/RegisterView.tsx`)

**Odpowiedzialność:** Widok główny strony rejestracji.

**Struktura:**

```
RegisterView
  ├─ RegisterForm (formularz rejestracji)
  └─ Link do strony logowania
```

**Zarządzanie stanem:**

- Stan lokalny: loading, error
- Komunikacja z AuthApiClient
- Po rejestracji: automatyczne logowanie + utworzenie profilu + przekierowanie

#### 1.2.3. ForgotPasswordView (`/src/components/views/ForgotPasswordView.tsx`)

**Odpowiedzialność:** Widok żądania resetu hasła.

**Struktura:**

```
ForgotPasswordView
  ├─ ForgotPasswordForm (pole email)
  └─ Link do strony logowania
```

**Zarządzanie stanem:**

- Stan lokalny: loading, error, success
- Wyświetlenie komunikatu o wysłaniu emaila

#### 1.2.4. ResetPasswordView (`/src/components/views/ResetPasswordView.tsx`)

**Odpowiedzialność:** Widok ustawiania nowego hasła.

**Struktura:**

```
ResetPasswordView
  ├─ ResetPasswordForm (nowe hasło + potwierdzenie)
  └─ Token z URL
```

**Zarządzanie stanem:**

- Stan lokalny: loading, error, success
- Przekierowanie na `/login` po pomyślnym resecie

#### 1.2.5. LoginForm (`/src/components/forms/LoginForm.tsx`)

**Odpowiedzialność:** Formularz logowania z walidacją.

**Pola:**

- email (wymagany, format email)
- password (wymagany, min 8 znaków)

**Biblioteki:**

- react-hook-form dla zarządzania formularzem
- zod dla walidacji

**Walidacja:**

- Walidacja po stronie klienta przed wysłaniem
- Walidacja schematu przez Zod
- Wyświetlanie błędów walidacji pod polami

**Integracja:**

- Callback onSubmit przekazany z LoginView
- Obsługa błędów z API (nieprawidłowy email/hasło)

#### 1.2.6. RegisterForm (`/src/components/forms/RegisterForm.tsx`)

**Odpowiedzialność:** Formularz rejestracji z walidacją.

**Pola:**

- email (wymagany, format email)
- password (wymagany, min 8 znaków, wymogi złożoności)
- confirmPassword (wymagany, musi być identyczny z password)

**Walidacja:**

- Email: poprawny format
- Hasło: min 8 znaków, min 1 wielka litera, min 1 cyfra, min 1 znak specjalny
- Potwierdzenie hasła: zgodność z polem password
- Walidacja w czasie rzeczywistym (onBlur)

**Komunikaty błędów:**

- "Email jest wymagany"
- "Nieprawidłowy format email"
- "Hasło musi mieć min 8 znaków"
- "Hasło musi zawierać wielką literę, cyfrę i znak specjalny"
- "Hasła muszą być identyczne"

#### 1.2.7. ForgotPasswordForm (`/src/components/forms/ForgotPasswordForm.tsx`)

**Odpowiedzialność:** Formularz żądania resetu hasła.

**Pola:**

- email (wymagany, format email)

**Walidacja:**

- Format email

**Komunikaty:**

- Success: "Link do resetowania hasła został wysłany na podany adres email"
- Error: "Nie udało się wysłać linku resetującego"

#### 1.2.8. ResetPasswordForm (`/src/components/forms/ResetPasswordForm.tsx`)

**Odpowiedzialność:** Formularz ustawiania nowego hasła.

**Pola:**

- password (wymagany, min 8 znaków, wymogi złożoności)
- confirmPassword (wymagany, musi być identyczny z password)

**Walidacja:**

- Identyczna jak w RegisterForm dla pól hasła

#### 1.2.9. Aktualizacja Layout (`/src/layouts/Layout.astro`)

**Zmiany:**

- Dodanie nawigacji w prawym górnym rogu
- Dla niezalogowanych: przycisk "Zaloguj się"
- Dla zalogowanych: przycisk "Wyloguj się"

**Struktura:**

```astro
<header>
  <nav>
    <div>Logo / Nazwa aplikacji</div>
    <div>
      {user ? <LogoutButton client:load user={user} /> : <a href="/login">Zaloguj się</a>}
    </div>
  </nav>
</header>
```

#### 1.2.10. LogoutButton (`/src/components/LogoutButton.tsx`)

**Odpowiedzialność:** Przycisk wylogowania.

**Funkcjonalność:**

- Wywołanie AuthApiClient.logout()
- Przekierowanie na stronę główną
- Wyświetlanie loadera podczas wylogowywania

**Props:**

- user: User object (dla wyświetlenia np. avatara)

### 1.3. Relacje między Komponentami

#### 1.3.1. Strona główna → Pomiary/Profil

```
index.astro
  ├─ Sprawdzenie context.locals.user (SSR)
  ├─ Jeśli zalogowany → przyciski do /measurements, /profile
  └─ Jeśli niezalogowany → przyciski do /login, /register
```

#### 1.3.2. Rejestracja → Profil

```
RegisterView (React)
  ├─ RegisterForm.onSubmit()
  ├─ AuthApiClient.register()
  ├─ Automatyczne logowanie
  ├─ ProfileApiClient.createProfile() (z danymi domyślnymi)
  └─ window.location.href = '/measurements'
```

#### 1.3.3. Logowanie → Pomiary

```
LoginView (React)
  ├─ LoginForm.onSubmit()
  ├─ AuthApiClient.login()
  └─ window.location.href = '/measurements'
```

#### 1.3.4. Measurements/Profile → API

```
measurements.astro / profile.astro
  ├─ SSR: sprawdzenie context.locals.user
  ├─ Jeśli niezalogowany → redirect('/login')
  └─ MeasurementsView / ProfileView (React)
      ├─ API calls z user_id z sesji
      └─ Obsługa 401 → redirect('/login')
```

### 1.4. Walidacja i Komunikaty Błędów

#### 1.4.1. Walidacja Formularzy (Client-Side)

**Schemat LoginFormSchema (Zod):**

```typescript
z.object({
  email: z.string().email("Nieprawidłowy format email"),
  password: z.string().min(8, "Hasło musi mieć min 8 znaków"),
});
```

**Schemat RegisterFormSchema (Zod):**

```typescript
z.object({
  email: z.string().email("Nieprawidłowy format email"),
  password: z
    .string()
    .min(8, "Hasło musi mieć min 8 znaków")
    .regex(/[A-Z]/, "Hasło musi zawierać wielką literę")
    .regex(/[0-9]/, "Hasło musi zawierać cyfrę")
    .regex(/[^A-Za-z0-9]/, "Hasło musi zawierać znak specjalny"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Hasła muszą być identyczne",
  path: ["confirmPassword"],
});
```

#### 1.4.2. Błędy API

**Logowanie:**

- 400: "Nieprawidłowy email lub hasło"
- 500: "Błąd serwera. Spróbuj ponownie później"

**Rejestracja:**

- 400: "Nieprawidłowe dane" (+ szczegóły walidacji)
- 409: "Użytkownik o podanym adresie email już istnieje"
- 500: "Błąd serwera. Spróbuj ponownie później"

**Resetowanie hasła:**

- 400: "Nieprawidłowy adres email"
- 404: "Użytkownik nie został znaleziony"
- 500: "Nie udało się wysłać emaila"

### 1.5. Scenariusze Użytkownika

#### 1.5.1. Scenariusz: Nowy użytkownik chce się zarejestrować (US-001)

1. Użytkownik wchodzi na stronę główną `/`
2. Widzi przycisk "Zarejestruj się", klika
3. Zostaje przekierowany na `/register`
4. Wypełnia formularz: email, hasło, potwierdzenie hasła
5. Walidacja formularza w czasie rzeczywistym
6. Klika "Zarejestruj się"
7. Loader podczas przetwarzania
8. System tworzy konto w Supabase Auth
9. System automatycznie loguje użytkownika
10. System tworzy profil użytkownika (POST /api/profile) z domyślnymi wartościami (wszystkie pola opcjonalne puste)
11. Użytkownik jest przekierowany na `/measurements`
12. Użytkownik może później uzupełnić dane profilu w `/profile` (US-010)

**Alternatywa: Email już istnieje**

- System wyświetla błąd: "Użytkownik o podanym adresie email już istnieje"
- Link do strony logowania

#### 1.5.2. Scenariusz: Istniejący użytkownik chce się zalogować (US-002)

1. Użytkownik wchodzi na stronę główną `/`
2. Widzi przycisk "Zaloguj się", klika
3. Zostaje przekierowany na `/login`
4. Wypełnia formularz: email, hasło
5. Klika "Zaloguj się"
6. Loader podczas przetwarzania
7. System weryfikuje dane przez Supabase Auth
8. Użytkownik jest przekierowany na `/measurements` (główna strona aplikacji)

**Alternatywa: Nieprawidłowe dane**

- System wyświetla błąd: "Nieprawidłowy email lub hasło"
- Formularz pozostaje wypełniony (email)
- Link do strony resetowania hasła

#### 1.5.3. Scenariusz: Użytkownik zapomniał hasła

1. Użytkownik wchodzi na `/login`
2. Klika link "Nie pamiętam hasła"
3. Zostaje przekierowany na `/forgot-password`
4. Wprowadza email
5. Klika "Wyślij link resetujący"
6. System wysyła email z linkiem (Supabase Auth)
7. Wyświetla się komunikat: "Link został wysłany na podany adres"
8. Użytkownik otwiera email i klika link
9. Zostaje przekierowany na `/reset-password?token=...`
10. Wprowadza nowe hasło i potwierdzenie
11. Klika "Ustaw nowe hasło"
12. Hasło zostaje zaktualizowane
13. Użytkownik jest przekierowany na `/login` z komunikatem sukcesu

#### 1.5.4. Scenariusz: Niezalogowany użytkownik próbuje dostać się do pomiarów (US-011)

1. Użytkownik wpisuje w przeglądarkę `/measurements`
2. Middleware sprawdza autentykację (brak user w sesji)
3. SSR w measurements.astro wykrywa brak user
4. Użytkownik jest przekierowany na `/login`
5. Po zalogowaniu jest przekierowany z powrotem na `/measurements`

#### 1.5.5. Scenariusz: Zalogowany użytkownik przegląda pomiary

1. Użytkownik jest zalogowany (sesja aktywna)
2. Wchodzi na `/measurements`
3. Middleware ustawia context.locals.user
4. SSR renderuje stronę
5. MeasurementsView wykonuje API call do GET /api/measurements
6. API endpoint odczytuje user_id z context.locals.user
7. Zwraca pomiary użytkownika
8. Widok wyświetla listę pomiarów

#### 1.5.6. Scenariusz: Użytkownik się wylogowuje

1. Użytkownik jest na dowolnej stronie (zalogowany)
2. Klika przycisk "Wyloguj się" w prawym górnym rogu
3. LogoutButton wywołuje AuthApiClient.logout()
4. Sesja zostaje zakończona
5. Użytkownik jest przekierowany na stronę główną `/`

---

## 2. LOGIKA BACKENDOWA

### 2.1. Struktura Endpointów API

#### 2.1.1. POST /api/auth/register

**Cel:** Rejestracja nowego użytkownika.

**Request Body:**

```typescript
{
  email: string;
  password: string;
}
```

**Response:**

- 201: `{ user: User, session: Session }`
- 400: `{ error: "ValidationError", details: {...} }`
- 409: `{ error: "UserExists" }`
- 500: `{ error: "ServerError" }`

**Logika:**

1. Walidacja danych wejściowych (RegisterRequestSchema)
2. Wywołanie `supabase.auth.signUp()`
3. Jeśli sukces → zwrócenie user + session
4. Obsługa błędów (email już istnieje, słabe hasło)

**Walidacja (Zod Schema):**

```typescript
RegisterRequestSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[0-9]/)
    .regex(/[^A-Za-z0-9]/),
});
```

#### 2.1.2. POST /api/auth/login

**Cel:** Logowanie użytkownika.

**Request Body:**

```typescript
{
  email: string;
  password: string;
}
```

**Response:**

- 200: `{ user: User, session: Session }`
- 400: `{ error: "ValidationError", details: {...} }`
- 401: `{ error: "InvalidCredentials" }`
- 500: `{ error: "ServerError" }`

**Logika:**

1. Walidacja danych wejściowych (LoginRequestSchema)
2. Wywołanie `supabase.auth.signInWithPassword()`
3. Jeśli sukces → zwrócenie user + session
4. Obsługa błędów (nieprawidłowe dane)

**Walidacja (Zod Schema):**

```typescript
LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
```

#### 2.1.3. POST /api/auth/logout

**Cel:** Wylogowanie użytkownika.

**Request:** Brak body, autentykacja przez Bearer token w header.

**Response:**

- 200: `{ message: "Logged out successfully" }`
- 401: `{ error: "Unauthorized" }`
- 500: `{ error: "ServerError" }`

**Logika:**

1. Odczytanie user z context.locals (z middleware)
2. Jeśli brak user → 401
3. Wywołanie `supabase.auth.signOut()`
4. Zwrócenie potwierdzenia

#### 2.1.4. POST /api/auth/forgot-password

**Cel:** Wysłanie emaila z linkiem resetującym hasło.

**Request Body:**

```typescript
{
  email: string;
}
```

**Response:**

- 200: `{ message: "Password reset email sent" }`
- 400: `{ error: "ValidationError", details: {...} }`
- 500: `{ error: "ServerError" }`

**Logika:**

1. Walidacja email (ForgotPasswordRequestSchema)
2. Wywołanie `supabase.auth.resetPasswordForEmail(email, { redirectTo: 'https://app-url/reset-password' })`
3. Zwrócenie potwierdzenia (zawsze 200, nawet jeśli email nie istnieje - security best practice)

**Walidacja (Zod Schema):**

```typescript
ForgotPasswordRequestSchema = z.object({
  email: z.string().email(),
});
```

#### 2.1.5. POST /api/auth/reset-password

**Cel:** Ustawienie nowego hasła.

**Request Body:**

```typescript
{
  password: string;
}
```

**Headers:**

```
Authorization: Bearer <access_token_from_email_link>
```

**Response:**

- 200: `{ message: "Password updated successfully" }`
- 400: `{ error: "ValidationError", details: {...} }`
- 401: `{ error: "InvalidToken" }`
- 500: `{ error: "ServerError" }`

**Logika:**

1. Walidacja hasła (ResetPasswordRequestSchema)
2. Odczytanie user z middleware (token z linku w emailu)
3. Jeśli brak user → 401
4. Wywołanie `supabase.auth.updateUser({ password: newPassword })`
5. Zwrócenie potwierdzenia

**Walidacja (Zod Schema):**

```typescript
ResetPasswordRequestSchema = z.object({
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[0-9]/)
    .regex(/[^A-Za-z0-9]/),
});
```

#### 2.1.6. GET /api/auth/user

**Cel:** Pobranie danych zalogowanego użytkownika.

**Request:** Brak body, autentykacja przez Bearer token.

**Response:**

- 200: `{ user: User }`
- 401: `{ error: "Unauthorized" }`

**Logika:**

1. Odczytanie user z context.locals
2. Jeśli brak user → 401
3. Zwrócenie user

### 2.2. Aktualizacja Istniejących Endpointów

#### 2.2.1. Usunięcie DEFAULT_USER_ID

**Pliki do aktualizacji:**

- `/src/db/supabase.client.ts` - usunięcie eksportu DEFAULT_USER_ID
- `/src/pages/api/profile.ts` - zamiana DEFAULT_USER_ID na context.locals.user.id
- `/src/pages/api/measurements/[id].ts` - zamiana DEFAULT_USER_ID na context.locals.user.id
- `/src/pages/api/measurements/index.ts` - zamiana DEFAULT_USER_ID na context.locals.user.id
- `/src/lib/services/profile.service.ts` - brak zmian (już używa userId parametru)
- `/src/lib/services/measurement.service.ts` - brak zmian (już używa userId parametru)

#### 2.2.2. Dodanie Sprawdzania Autentykacji

**We wszystkich endpointach API (poza auth):**

```typescript
export const GET: APIRoute = async ({ locals }) => {
  // Sprawdzenie autentykacji
  if (!locals.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userId = locals.user.id;

  // Dalsza logika...
};
```

**Dotyczy plików:**

- `/src/pages/api/profile.ts` (GET, PUT)
- `/src/pages/api/profile/reminder.ts` (POST)
- `/src/pages/api/measurements/index.ts` (GET, POST)
- `/src/pages/api/measurements/[id].ts` (GET, PUT, DELETE)
- `/src/pages/api/measurements/export.ts` (GET)

### 2.3. Modele Danych

#### 2.3.1. Typy Supabase Auth

**W pliku `/src/types.ts`:**

```typescript
import type { User, Session } from "@supabase/supabase-js";

/**
 * Response z endpointów logowania/rejestracji
 */
export interface AuthResponse {
  user: User;
  session: Session;
}

/**
 * Dane żądania rejestracji
 */
export interface RegisterRequest {
  email: string;
  password: string;
}

/**
 * Dane żądania logowania
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Dane żądania resetowania hasła
 */
export interface ForgotPasswordRequest {
  email: string;
}

/**
 * Dane żądania ustawienia nowego hasła
 */
export interface ResetPasswordRequest {
  password: string;
}
```

#### 2.3.2. Rozszerzenie Astro.locals

**W pliku `/src/env.d.ts`:**

```typescript
/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    supabase: import("./db/supabase.client").SupabaseClient;
    user: import("@supabase/supabase-js").User | null;
  }
}
```

### 2.4. Walidacja Danych Wejściowych

#### 2.4.1. Plik Walidatorów Auth (`/src/lib/validators/auth.ts`)

```typescript
import { z } from "zod";

/**
 * Schema walidacji formularza rejestracji
 */
export const RegisterFormSchema = z
  .object({
    email: z.string().min(1, "Email jest wymagany").email("Nieprawidłowy format email"),
    password: z
      .string()
      .min(8, "Hasło musi mieć minimum 8 znaków")
      .regex(/[A-Z]/, "Hasło musi zawierać wielką literę")
      .regex(/[0-9]/, "Hasło musi zawierać cyfrę")
      .regex(/[^A-Za-z0-9]/, "Hasło musi zawierać znak specjalny"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła muszą być identyczne",
    path: ["confirmPassword"],
  });

/**
 * Schema walidacji żądania rejestracji (API)
 */
export const RegisterRequestSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[0-9]/)
    .regex(/[^A-Za-z0-9]/),
});

/**
 * Schema walidacji formularza logowania
 */
export const LoginFormSchema = z.object({
  email: z.string().min(1, "Email jest wymagany").email("Nieprawidłowy format email"),
  password: z.string().min(1, "Hasło jest wymagane"),
});

/**
 * Schema walidacji żądania logowania (API)
 */
export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/**
 * Schema walidacji żądania resetowania hasła
 */
export const ForgotPasswordRequestSchema = z.object({
  email: z.string().email(),
});

/**
 * Schema walidacji nowego hasła
 */
export const ResetPasswordRequestSchema = z.object({
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[0-9]/)
    .regex(/[^A-Za-z0-9]/),
});
```

### 2.5. Obsługa Wyjątków

#### 2.5.1. Błędy Supabase Auth

**Mapping błędów Supabase → kody HTTP:**

```typescript
// W każdym endpoint auth
try {
  const { data, error } = await supabase.auth.signInWithPassword(...);

  if (error) {
    // Mapowanie błędów
    if (error.message.includes("Invalid login credentials")) {
      return new Response(
        JSON.stringify({ error: "InvalidCredentials" }),
        { status: 401 }
      );
    }

    if (error.message.includes("User already registered")) {
      return new Response(
        JSON.stringify({ error: "UserExists" }),
        { status: 409 }
      );
    }

    // Domyślny błąd
    return new Response(
      JSON.stringify({ error: "ServerError" }),
      { status: 500 }
    );
  }

  return new Response(JSON.stringify(data), { status: 200 });
} catch (error) {
  console.error("[Auth] Unexpected error:", error);
  return new Response(
    JSON.stringify({ error: "ServerError" }),
    { status: 500 }
  );
}
```

#### 2.5.2. Globalna obsługa błędów 401

**W MeasurementApiClient i ProfileApiClient:**

```typescript
// Dodanie metody pomocniczej
private async handleResponse(response: Response) {
  if (response.status === 401) {
    // Przekierowanie na stronę logowania
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    throw new Error('Request failed');
  }

  return response.json();
}
```

### 2.6. Aktualizacja Renderowania Server-Side

#### 2.6.1. Konfiguracja Astro

**Plik `/astro.config.mjs`:**

- Już skonfigurowany na `output: "server"`
- Brak dodatkowych zmian wymaganych

#### 2.6.2. Middleware - Sesje

**Aktualizacja `/src/middleware/index.ts`:**

```typescript
import { defineMiddleware } from "astro:middleware";
import { supabaseClient } from "../db/supabase.client.js";

export const onRequest = defineMiddleware(async (context, next) => {
  // 1. Udostępnienie Supabase client
  context.locals.supabase = supabaseClient;

  // 2. Próba odczytania sesji z cookie (dla SSR)
  const accessToken = context.cookies.get("sb-access-token")?.value;
  const refreshToken = context.cookies.get("sb-refresh-token")?.value;

  if (accessToken && refreshToken) {
    try {
      // Ustawienie sesji w Supabase client
      const {
        data: { user },
        error,
      } = await supabaseClient.auth.getUser(accessToken);

      if (!error && user) {
        context.locals.user = user;
      } else {
        // Próba odświeżenia tokena
        const {
          data: { session },
          error: refreshError,
        } = await supabaseClient.auth.refreshSession({ refresh_token: refreshToken });

        if (!refreshError && session) {
          context.locals.user = session.user;
          // Aktualizacja cookies
          context.cookies.set("sb-access-token", session.access_token, {
            path: "/",
            httpOnly: true,
            secure: true,
            sameSite: "lax",
          });
          context.cookies.set("sb-refresh-token", session.refresh_token, {
            path: "/",
            httpOnly: true,
            secure: true,
            sameSite: "lax",
          });
        } else {
          context.locals.user = null;
        }
      }
    } catch (error) {
      console.error("[Middleware] Error verifying session:", error);
      context.locals.user = null;
    }
  } else {
    context.locals.user = null;
  }

  return next();
});
```

**Uwaga:** Supabase automatycznie zarządza cookies po stronie klienta. Middleware odpowiada za odczyt sesji w SSR.

#### 2.6.3. Ochrona Stron

**Implementacja w chronionych stronach Astro:**

```astro
---
// measurements.astro / profile.astro
import Layout from "@/layouts/Layout.astro";

// Sprawdzenie autentykacji
if (!Astro.locals.user) {
  return Astro.redirect("/login");
}

// Opcjonalnie: zapisanie URL do powrotu po logowaniu
const returnUrl = encodeURIComponent(Astro.url.pathname);
---
```

---

## 3. SYSTEM AUTENTYKACJI

### 3.1. Integracja Supabase Auth z Astro

#### 3.1.1. Supabase Client - Session Management

**Plik `/src/db/supabase.client.ts`:**

**Aktualizacje:**

1. Usunięcie `DEFAULT_USER_ID`
2. Konfiguracja persistencji sesji
3. Dodanie konfiguracji dla reset password

```typescript
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

// Konfiguracja dla browser client (używana w React components)
export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  },
});

// Konfiguracja dla server-side (używana w middleware i API)
export const supabaseServerClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export type SupabaseClient = typeof supabaseClient;
```

#### 3.1.2. Auth Service

**Plik `/src/lib/services/auth.service.ts`:**

```typescript
import type { SupabaseClient } from "@/db/supabase.client";
import type { User, Session } from "@supabase/supabase-js";

export interface AuthResponse {
  user: User;
  session: Session;
}

/**
 * Service dla operacji autentykacji
 */
export class AuthService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Rejestracja nowego użytkownika
   */
  async register(email: string, password: string): Promise<AuthResponse> {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user || !data.session) {
      throw new Error("Registration failed");
    }

    return {
      user: data.user,
      session: data.session,
    };
  }

  /**
   * Logowanie użytkownika
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user || !data.session) {
      throw new Error("Login failed");
    }

    return {
      user: data.user,
      session: data.session,
    };
  }

  /**
   * Wylogowanie użytkownika
   */
  async logout(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();

    if (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Wysłanie emaila z linkiem resetującym hasło
   */
  async sendPasswordResetEmail(email: string, redirectTo: string): Promise<void> {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Ustawienie nowego hasła (wymaga aktywnej sesji z tokena w emailu)
   */
  async updatePassword(newPassword: string): Promise<void> {
    const { error } = await this.supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Pobranie aktualnie zalogowanego użytkownika
   */
  async getCurrentUser(): Promise<User | null> {
    const {
      data: { user },
    } = await this.supabase.auth.getUser();
    return user;
  }
}
```

#### 3.1.3. Auth API Client

**Plik `/src/lib/api/auth.client.ts`:**

```typescript
import type { AuthResponse, LoginRequest, RegisterRequest, ForgotPasswordRequest } from "@/types";

/**
 * Client dla endpointów autentykacji
 */
export class AuthApiClient {
  /**
   * Rejestracja nowego użytkownika
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      if (response.status === 400) {
        const error = await response.json();
        throw new Error(error.details || "Błąd walidacji");
      }
      if (response.status === 409) {
        throw new Error("Użytkownik o podanym adresie email już istnieje");
      }
      throw new Error("Nie udało się zarejestrować");
    }

    return response.json();
  }

  /**
   * Logowanie użytkownika
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Nieprawidłowy email lub hasło");
      }
      throw new Error("Nie udało się zalogować");
    }

    return response.json();
  }

  /**
   * Wylogowanie użytkownika
   */
  async logout(): Promise<void> {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Nie udało się wylogować");
    }
  }

  /**
   * Wysłanie emaila z linkiem resetującym hasło
   */
  async sendPasswordResetEmail(data: ForgotPasswordRequest): Promise<void> {
    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Nie udało się wysłać emaila");
    }
  }

  /**
   * Ustawienie nowego hasła
   */
  async resetPassword(password: string): Promise<void> {
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Link resetowania hasła wygasł lub jest nieprawidłowy");
      }
      throw new Error("Nie udało się zresetować hasła");
    }
  }

  /**
   * Pobranie danych zalogowanego użytkownika
   */
  async getCurrentUser(): Promise<any> {
    const response = await fetch("/api/auth/user", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return null;
      }
      throw new Error("Nie udało się pobrać danych użytkownika");
    }

    return response.json();
  }
}

// Export singleton instance
export const authApiClient = new AuthApiClient();
```

### 3.2. Flow Autentykacji

#### 3.2.1. Rejestracja (US-001)

```
1. Użytkownik wypełnia RegisterForm
   ↓
2. React: walidacja client-side (Zod)
   ↓
3. React: AuthApiClient.register()
   ↓
4. API: POST /api/auth/register
   ↓
5. API: walidacja server-side (Zod)
   ↓
6. API: supabase.auth.signUp()
   ↓
7. Supabase: utworzenie użytkownika w auth.users
   ↓
8. Supabase: zwrócenie user + session
   ↓
9. API: zapisanie session w cookies
   ↓
10. API: zwrócenie user + session
   ↓
11. React: automatyczne logowanie (session w Supabase client)
   ↓
12. React: ProfileApiClient.createProfile() z danymi domyślnymi
   ↓
13. API: POST /api/profile
   ↓
14. Service: ProfileService.createProfile()
   ↓
15. DB: INSERT do profiles
   ↓
16. React: window.location.href = '/measurements'
```

#### 3.2.2. Logowanie (US-002)

```
1. Użytkownik wypełnia LoginForm
   ↓
2. React: walidacja client-side (Zod)
   ↓
3. React: AuthApiClient.login()
   ↓
4. API: POST /api/auth/login
   ↓
5. API: walidacja server-side (Zod)
   ↓
6. API: supabase.auth.signInWithPassword()
   ↓
7. Supabase: weryfikacja credentials
   ↓
8. Supabase: zwrócenie user + session
   ↓
9. API: zapisanie session w cookies
   ↓
10. API: zwrócenie user + session
   ↓
11. React: session zapisana w Supabase client
   ↓
12. React: window.location.href = '/measurements'
```

#### 3.2.3. Wylogowanie

```
1. Użytkownik klika LogoutButton
   ↓
2. React: AuthApiClient.logout()
   ↓
3. API: POST /api/auth/logout
   ↓
4. API: sprawdzenie context.locals.user
   ↓
5. API: supabase.auth.signOut()
   ↓
6. Supabase: unieważnienie sesji
   ↓
7. API: usunięcie cookies
   ↓
8. React: window.location.href = '/'
```

#### 3.2.4. Resetowanie Hasła

```
1. Użytkownik klika "Nie pamiętam hasła"
   ↓
2. Browser: redirect na /forgot-password
   ↓
3. Użytkownik wypełnia ForgotPasswordForm (email)
   ↓
4. React: AuthApiClient.sendPasswordResetEmail()
   ↓
5. API: POST /api/auth/forgot-password
   ↓
6. API: supabase.auth.resetPasswordForEmail()
   ↓
7. Supabase: wysłanie emaila z linkiem
   ↓
8. Email: link zawiera token → https://app-url/reset-password?token=...
   ↓
9. Użytkownik klika link w emailu
   ↓
10. Browser: redirect na /reset-password?token=...
   ↓
11. Supabase: automatyczna weryfikacja tokena (detectSessionInUrl: true)
   ↓
12. Middleware: ustawienie tymczasowej sesji w context.locals.user
   ↓
13. Użytkownik wypełnia ResetPasswordForm (nowe hasło)
   ↓
14. React: AuthApiClient.resetPassword()
   ↓
15. API: POST /api/auth/reset-password
   ↓
16. API: sprawdzenie context.locals.user (z tokena)
   ↓
17. API: supabase.auth.updateUser({ password })
   ↓
18. Supabase: aktualizacja hasła
   ↓
19. React: window.location.href = '/login'
```

#### 3.2.5. Ochrona Stron (US-011)

```
1. Użytkownik wpisuje /measurements w przeglądarkę
   ↓
2. Browser: request na serwer
   ↓
3. Middleware: onRequest
   ↓
4. Middleware: odczyt cookies (sb-access-token, sb-refresh-token)
   ↓
5. Middleware: supabase.auth.getUser(token)
   ↓
6. Middleware: ustawienie context.locals.user
   ↓
7. measurements.astro: sprawdzenie Astro.locals.user
   ↓
8a. Jeśli user === null:
    ↓
    return Astro.redirect('/login')

8b. Jeśli user !== null:
    ↓
    renderowanie MeasurementsView
    ↓
9. React: fetch('/api/measurements')
   ↓
10. API: sprawdzenie locals.user
   ↓
11. API: MeasurementService.getMeasurements(user.id)
   ↓
12. DB: SELECT z filtrami WHERE user_id = ...
   ↓
13. API: zwrócenie danych
   ↓
14. React: wyświetlenie listy
```

### 3.3. Zarządzanie Sesją

#### 3.3.1. Cookies

**Nazwy cookies (Supabase defaults):**

- `sb-access-token` - JWT access token (krótkotrwały)
- `sb-refresh-token` - refresh token (długotrwały)

**Konfiguracja:**

```typescript
{
  path: '/',
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 7 // 7 dni dla refresh token
}
```

**Zarządzanie:**

- Supabase automatycznie zarządza cookies po stronie klienta
- API endpointy auth ustawiają cookies w response
- Middleware odczytuje cookies dla SSR

#### 3.3.2. Token Refresh

**Automatyczne odświeżanie:**

- Supabase client automatycznie odświeża tokeny (autoRefreshToken: true)
- Middleware sprawdza ważność tokena przed każdym requestem SSR
- Jeśli access token wygasł → próba odświeżenia przez refresh token
- Jeśli refresh token wygasł → wylogowanie (usunięcie cookies)

#### 3.3.3. Session Storage

**Browser:**

- Supabase przechowuje sesję w localStorage (persistSession: true)
- Automatyczne odzyskanie sesji po odświeżeniu strony

**Server:**

- Brak persistencji (persistSession: false)
- Sesja odczytywana z cookies dla każdego requesta

### 3.4. Bezpieczeństwo

#### 3.4.1. PKCE Flow

**Konfiguracja w supabaseClient:**

```typescript
{
  auth: {
    flowType: "pkce";
  }
}
```

**Zalety:**

- Dodatkowa warstwa bezpieczeństwa dla SPA
- Ochrona przed atakami przechwytującymi authorization code

#### 3.4.2. HttpOnly Cookies

- Access token i refresh token przechowywane w HttpOnly cookies
- Ochrona przed XSS attacks
- Brak dostępu do tokenów z JavaScript

#### 3.4.3. CSRF Protection

- SameSite=Lax dla cookies
- Ochrona przed CSRF attacks

#### 3.4.4. Walidacja Tokenów

- Middleware weryfikuje JWT signature
- Sprawdzenie expiration time
- Automatyczna weryfikacja przez Supabase

#### 3.4.5. Rate Limiting (Supabase)

- Supabase automatycznie limituje requesty do auth endpoints
- Ochrona przed brute-force attacks
- Konfiguracja w Supabase Dashboard

### 3.5. Konfiguracja Supabase

#### 3.5.1. Auth Settings (Supabase Dashboard)

**Email Templates:**

- Confirmation email (rejestracja) - enabled
- Password reset email - enabled, redirect to https://app-url/reset-password
- Magic link - disabled (nie używamy w MVP)

**URL Configuration:**

- Site URL: https://app-url
- Redirect URLs:
  - https://app-url/reset-password
  - http://localhost:3000/reset-password (development)

**Password Requirements:**

- Minimum length: 8 znaków
- Wymaga: wielka litera, cyfra, znak specjalny (enforced przez Zod)

**Session Settings:**

- JWT expiry: 3600s (1 godzina)
- Refresh token expiry: 604800s (7 dni)

#### 3.5.2. Email Provider

**Opcje:**

1. Supabase default (do testów, limit 4 emaile/h)
2. SendGrid (produkcja)
3. SMTP (custom)

**Konfiguracja SendGrid (rekomendacja dla produkcji):**

- API Key w Supabase Dashboard
- Verified sender address
- Email templates w SendGrid

### 3.6. Zmienne Środowiskowe

**Plik `.env`:**

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PUBLIC_APP_URL=http://localhost:3000
```

**Plik `.env.production`:**

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PUBLIC_APP_URL=https://bp-tracker.app
```

---

## 4. PODSUMOWANIE IMPLEMENTACJI

### 4.1. Nowe Pliki do Utworzenia

**Strony Astro:**

1. `/src/pages/login.astro`
2. `/src/pages/register.astro`
3. `/src/pages/forgot-password.astro`
4. `/src/pages/reset-password.astro`

**API Endpoints:** 5. `/src/pages/api/auth/register.ts` 6. `/src/pages/api/auth/login.ts` 7. `/src/pages/api/auth/logout.ts` 8. `/src/pages/api/auth/forgot-password.ts` 9. `/src/pages/api/auth/reset-password.ts` 10. `/src/pages/api/auth/user.ts`

**Komponenty React:** 11. `/src/components/views/LoginView.tsx` 12. `/src/components/views/RegisterView.tsx` 13. `/src/components/views/ForgotPasswordView.tsx` 14. `/src/components/views/ResetPasswordView.tsx` 15. `/src/components/forms/LoginForm.tsx` 16. `/src/components/forms/RegisterForm.tsx` 17. `/src/components/forms/ForgotPasswordForm.tsx` 18. `/src/components/forms/ResetPasswordForm.tsx` 19. `/src/components/LogoutButton.tsx`

**Services i Clients:** 20. `/src/lib/services/auth.service.ts` 21. `/src/lib/api/auth.client.ts`

**Walidatory:** 22. `/src/lib/validators/auth.ts`

### 4.2. Pliki do Aktualizacji

**Konfiguracja:**

1. `/src/middleware/index.ts` - zarządzanie sesjami z cookies
2. `/src/db/supabase.client.ts` - usunięcie DEFAULT_USER_ID, konfiguracja auth
3. `/src/types.ts` - dodanie typów auth
4. `/src/env.d.ts` - rozszerzenie Astro.locals

**Layouty:** 5. `/src/layouts/Layout.astro` - dodanie nawigacji login/logout 6. `/src/components/Welcome.astro` - dodanie przycisków do auth

**Strony:** 7. `/src/pages/index.astro` - warunek zalogowany/niezalogowany 8. `/src/pages/measurements.astro` - ochrona strony 9. `/src/pages/profile.astro` - ochrona strony

**API Endpoints (dodanie sprawdzania autentykacji):** 10. `/src/pages/api/profile.ts` 11. `/src/pages/api/profile/reminder.ts` 12. `/src/pages/api/measurements/index.ts` 13. `/src/pages/api/measurements/[id].ts` 14. `/src/pages/api/measurements/export.ts`

**Clients (obsługa 401):** 15. `/src/lib/api/profile.client.ts` 16. `/src/lib/api/measurement.client.ts`

### 4.3. Kolejność Implementacji (Rekomendacja)

**Faza 1: Podstawy autentykacji**

1. Aktualizacja `/src/types.ts` - typy auth
2. Aktualizacja `/src/env.d.ts` - Astro.locals
3. Utworzenie `/src/lib/validators/auth.ts`
4. Aktualizacja `/src/db/supabase.client.ts` - konfiguracja auth
5. Utworzenie `/src/lib/services/auth.service.ts`
6. Utworzenie `/src/lib/api/auth.client.ts`

**Faza 2: API Endpoints** 7. Utworzenie `/src/pages/api/auth/register.ts` 8. Utworzenie `/src/pages/api/auth/login.ts` 9. Utworzenie `/src/pages/api/auth/logout.ts` 10. Utworzenie `/src/pages/api/auth/forgot-password.ts` 11. Utworzenie `/src/pages/api/auth/reset-password.ts` 12. Utworzenie `/src/pages/api/auth/user.ts`

**Faza 3: UI - Formularze** 13. Utworzenie `/src/components/forms/LoginForm.tsx` 14. Utworzenie `/src/components/forms/RegisterForm.tsx` 15. Utworzenie `/src/components/forms/ForgotPasswordForm.tsx` 16. Utworzenie `/src/components/forms/ResetPasswordForm.tsx`

**Faza 4: UI - Widoki** 17. Utworzenie `/src/components/views/LoginView.tsx` 18. Utworzenie `/src/components/views/RegisterView.tsx` 19. Utworzenie `/src/components/views/ForgotPasswordView.tsx` 20. Utworzenie `/src/components/views/ResetPasswordView.tsx`

**Faza 5: Strony** 21. Utworzenie `/src/pages/login.astro` 22. Utworzenie `/src/pages/register.astro` 23. Utworzenie `/src/pages/forgot-password.astro` 24. Utworzenie `/src/pages/reset-password.astro`

**Faza 6: Middleware i Ochrona** 25. Aktualizacja `/src/middleware/index.ts` - zarządzanie sesjami 26. Aktualizacja `/src/pages/measurements.astro` - ochrona 27. Aktualizacja `/src/pages/profile.astro` - ochrona

**Faza 7: Nawigacja** 28. Utworzenie `/src/components/LogoutButton.tsx` 29. Aktualizacja `/src/layouts/Layout.astro` - nawigacja 30. Aktualizacja `/src/components/Welcome.astro` - przyciski auth 31. Aktualizacja `/src/pages/index.astro` - logika warunkowa

**Faza 8: Aktualizacja Istniejących Endpointów** 32. Aktualizacja wszystkich `/src/pages/api/*` - sprawdzanie auth 33. Aktualizacja `/src/lib/api/*.client.ts` - obsługa 401

**Faza 9: Testowanie** 34. Manualne testy wszystkich flow 35. Testowanie edge cases (wygasłe tokeny, nieprawidłowe dane)

### 4.4. Zależności do Dodania

**package.json:**

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0"
  }
}
```

**Uwaga:** `@supabase/supabase-js` może już być zainstalowane. Sprawdzić i w razie potrzeby zaktualizować do najnowszej wersji.

### 4.5. Migracje Bazy Danych

**Brak dodatkowych migracji wymaganych:**

- Supabase Auth używa własnego schematu `auth.users`
- Istniejąca tabela `profiles` już ma kolumnę `user_id` typu UUID
- Kolumna `user_id` w `profiles` będzie referencją do `auth.users(id)`

**Opcjonalna migracja (dodanie foreign key):**

```sql
-- /supabase/migrations/YYYYMMDDHHMMSS_add_profiles_user_fk.sql
ALTER TABLE profiles
ADD CONSTRAINT profiles_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;
```

**Zaleta:** Automatyczne usuwanie profilu przy usunięciu użytkownika z auth.

### 4.6. Konfiguracja Supabase Dashboard

**Do wykonania ręcznie:**

1. Auth → Email Templates → Customize "Reset Password" template
   - Redirect URL: `{{ .SiteURL }}/reset-password`
2. Auth → URL Configuration
   - Site URL: `https://bp-tracker.app` (produkcja)
   - Additional Redirect URLs: `http://localhost:3000/reset-password`
3. Auth → Providers → Email → Enable
4. Auth → Email Settings → Konfiguracja SMTP lub SendGrid (produkcja)
5. Auth → Password → Minimum length: 8

---

## 5. KLUCZOWE WNIOSKI

### 5.1. Architektura

1. **Wyraźny podział odpowiedzialności:**
   - Astro (SSR) → routing, ochrona stron, initial check autentykacji
   - React (CSR) → formularze, interaktywność, API calls
   - Supabase Auth → zarządzanie użytkownikami, tokeny, sesje

2. **Middleware jako centralny punkt autentykacji:**
   - Odczyt sesji z cookies
   - Ustawienie `context.locals.user` dla SSR
   - Weryfikacja tokenów

3. **API First:**
   - Wszystkie operacje auth przez dedykowane endpointy
   - Walidacja na dwóch poziomach (client + server)
   - Jednolita obsługa błędów

### 5.2. Bezpieczeństwo

1. **HttpOnly Cookies:** tokeny niedostępne z JavaScript
2. **PKCE Flow:** dodatkowa ochrona dla SPA
3. **Server-Side Validation:** wszystkie dane walidowane na serwerze
4. **CSRF Protection:** SameSite cookies
5. **Automatyczne odświeżanie tokenów:** bezproblemowa sesja użytkownika

### 5.3. User Experience

1. **Seamless Registration:** automatyczne logowanie po rejestracji
2. **Password Reset:** prosty flow z emailem
3. **Protected Routes:** automatyczne przekierowanie na login
4. **Persistent Sessions:** sesja zachowana po odświeżeniu strony
5. **Inline Validation:** natychmiastowy feedback w formularzach

### 5.4. Zgodność z Wymaganiami

**US-001 (Rejestracja):** ✅

- Formularz z email i hasłem
- Automatyczne utworzenie profilu z domyślnymi (pustymi) wartościami
- Auto-login po rejestracji
- Przekierowanie na `/measurements`

**US-002 (Logowanie):** ✅

- Formularz logowania
- Przekierowanie na `/measurements` (główna strona aplikacji)
- Obsługa błędów

**US-011 (Bezpieczny dostęp):** ✅

- Wymóg autentykacji dla `/measurements` i `/profile`
- Przekierowanie niezalogowanych na `/login`
- Przyciski login/logout w nawigacji

**Odzyskiwanie hasła (linia 65 PRD):** ✅

- Pełny flow forgot-password → email → reset-password
- Link w emailu z tokenem
- Ustawienie nowego hasła
- **Uwaga:** PRD w liniach 19 i 40 wspomina "bez resetu hasła w MVP", ale linia 65 wyraźnie stwierdza "Odzyskiwanie hasła powinno być możliwe" - implementujemy zgodnie z linią 65

### 5.5. Kompatybilność z Istniejącym Kodem

1. **Brak breaking changes:**
   - Istniejące komponenty nie wymagają modyfikacji
   - ProfileService i MeasurementService już używają userId parametru
   - Tylko zamiana DEFAULT_USER_ID na context.locals.user.id

2. **Stopniowa migracja:**
   - Możliwość implementacji po kolei (auth → ochrona → aktualizacja API)

3. **Backward compatibility:**
   - Istniejące API contracts zachowane
   - Tylko dodanie sprawdzania autentykacji

---

**Koniec specyfikacji technicznej**
