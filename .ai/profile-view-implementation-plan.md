# Plan implementacji widoku Ustawienia Profilu

## 1. Przegląd

Widok "Ustawienia Profilu" umożliwia zalogowanemu użytkownikowi zarządzanie swoimi danymi osobowymi, takimi jak imię, nazwisko, data urodzenia, płeć, waga i numer telefonu. Pozwala również na włączanie i wyłączanie przypomnień e-mail oraz zmianę motywu interfejsu (jasny/ciemny). Celem widoku jest zapewnienie użytkownikowi pełnej kontroli nad personalizacją swojego konta zgodnie z historyjką użytkownika US-010.

## 2. Routing widoku

Widok będzie dostępny pod chronioną ścieżką (wymagającą zalogowania): `/profile`.

## 3. Struktura komponentów

Hierarchia komponentów będzie zorganizowana w celu zapewnienia reużywalności i przejrzystości. Głównym kontenerem będzie komponent strony, który zarządza pobieraniem danych i stanem.

```
/src/pages/profile.astro
└── <ProfileView client:load /> (React Island)
    ├── <PageHeader title="Ustawienia Profilu" />
    ├── <ProfileForm />
    │   ├── <Input label="Imię" name="first_name" />
    │   ├── <Input label="Nazwisko" name="last_name" />
    │   ├── <DatePicker label="Data urodzenia" name="dob" />
    │   ├── <Select label="Płeć" name="sex" options="..." />
    │   ├── <Input label="Waga (kg)" name="weight" type="number" />
    │   ├── <Input label="Telefon" name="phone" />
    │   └── <Button type="submit">Zapisz zmiany</Button>
    ├── <ReminderToggle />
    │   └── <Switch label="Włącz przypomnienia e-mail" name="reminder_enabled" />
    └── <ThemeToggle />
```

## 4. Szczegóły komponentów

### ProfileView

- **Opis komponentu**: Główny komponent strony (`/profile`), renderowany jako React Island w Astro. Odpowiada za pobieranie danych profilu, obsługę stanu ładowania i błędów, a także za przekazywanie danych i funkcji do komponentów podrzędnych.
- **Główne elementy**: Kontener `div`, komponenty `PageHeader`, `ProfileForm`, `ReminderToggle`, `ThemeToggle`. Wyświetla stan ładowania (np. skeleton) lub komunikat o błędzie.
- **Obsługiwane interakcje**: Brak bezpośrednich interakcji.
- **Obsługiwana walidacja**: Brak.
- **Typy**: `ProfileDTO`.
- **Propsy**: Brak.

### ProfileForm

- **Opis komponentu**: Formularz do edycji danych osobowych użytkownika. Używa biblioteki `react-hook-form` do zarządzania stanem, walidacji i obsługi wysyłania.
- **Główne elementy**: `<form>`, komponenty `Input`, `DatePicker`, `Select` i `Button` z biblioteki Shadcn/ui.
- **Obsługiwane interakcje**: Wprowadzanie danych, wysłanie formularza (`onSubmit`).
- **Obsługiwana walidacja**: Walidacja wszystkich pól formularza zgodnie z wymaganiami API.
- **Typy**: `ProfileFormViewModel`, `UpdateProfileCommand`.
- **Propsy**:
  - `initialData: ProfileDTO` - dane do inicjalizacji formularza.
  - `onSubmit: (data: UpdateProfileCommand) => void` - funkcja wywoływana po pomyślnej walidacji i wysłaniu formularza.
  - `isSubmitting: boolean` - flaga informująca o trwającym procesie zapisu.

## 5. Typy

- **`ProfileDTO`**: (z `src/types.ts`) Obiekt transferu danych otrzymywany z API, reprezentujący pełny profil użytkownika.
- **`UpdateProfileCommand`**: (z `src/types.ts`) Obiekt wysyłany w ciele żądania `PUT /api/profile`, zawierający tylko pola, które mogą być aktualizowane.
- **`ProfileFormViewModel`**: Nowy typ, specyficzny dla formularza w widoku. Służy do zarządzania stanem w `react-hook-form`. Różni się od DTO głównie typem pola `dob`, które będzie obiektem `Date` dla komponentu `DatePicker`.
  ```typescript
  export type ProfileFormViewModel = {
    first_name: string;
    last_name: string;
    dob: Date;
    sex: "male" | "female" | "other";
    weight: number | string; // Może być stringiem w trakcie edycji
    phone: string;
    reminder_enabled: boolean;
  };
  ```

## 6. Zarządzanie stanem

Stan będzie zarządzany przy użyciu kombinacji hooków React i biblioteki React Query.

- **Stan serwera**: Dane profilu użytkownika będą pobierane i cache'owane przy użyciu hooka `useQuery` z React Query. Aktualizacje będą wykonywane za pomocą `useMutation`, co zapewni automatyczne odświeżanie danych i obsługę stanu operacji (ładowanie, błąd).
- **Stan formularza**: Wewnętrzny stan komponentu `ProfileForm` będzie zarządzany przez bibliotekę `react-hook-form`.
- **Custom Hook**: Zalecane jest stworzenie hooka `useProfile`, który będzie enkapsulował logikę `useQuery` i `useMutation` związaną z profilem, udostępniając prosty interfejs dla komponentu `ProfileView` (np. `profile`, `isLoading`, `updateProfile`).

## 7. Integracja API

Integracja z API będzie realizowana przez dedykowany klient API (np. `apiClient` oparty na `fetch` lub `axios`).

- **Pobieranie danych**:
  - **Endpoint**: `GET /api/profile`
  - **Akcja**: Wywołanie przy pierwszym renderowaniu widoku `/profile`.
  - **Typ odpowiedzi**: `ProfileDTO`
- **Aktualizacja danych**:
  - **Endpoint**: `PUT /api/profile`
  - **Akcja**: Wywołanie po wysłaniu formularza `ProfileForm`.
  - **Typ żądania**: `UpdateProfileCommand`
  - **Typ odpowiedzi**: `ProfileDTO` (zaktualizowany profil)

## 8. Interakcje użytkownika

- **Wejście na stronę `/profile`**: Aplikacja automatycznie pobiera dane profilu i wypełnia nimi formularz. W trakcie ładowania wyświetlany jest wskaźnik (np. skeleton).
- **Edycja pól formularza**: Użytkownik modyfikuje dane, a stan formularza jest aktualizowany w czasie rzeczywistym przez `react-hook-form`.
- **Kliknięcie "Zapisz zmiany"**:
  1. Uruchamiana jest walidacja po stronie klienta.
  2. Jeśli dane są nieprawidłowe, pod odpowiednimi polami wyświetlane są komunikaty o błędach.
  3. Jeśli dane są prawidłowe, przycisk "Zapisz zmiany" jest blokowany, a do API wysyłane jest żądanie `PUT /api/profile`.
  4. Po otrzymaniu odpowiedzi od serwera, przycisk jest odblokowywany.

## 9. Warunki i walidacja

Walidacja będzie realizowana po stronie klienta za pomocą schemy Zod zintegrowanej z `react-hook-form` jako `resolver`.

- `first_name`, `last_name`: Wymagane, minimum 2 znaki.
- `dob`: Wymagana, musi być datą w przeszłości.
- `sex`: Wymagane, musi być jedną z wartości: `male`, `female`, `other`.
- `weight`: Wymagane, liczba większa od 0 i mniejsza lub równa 999.9.
- `phone`: Wymagane, musi pasować do formatu numeru telefonu E.164.

## 10. Obsługa błędów

- **Błąd pobierania danych (GET)**: Jeśli API zwróci błąd (np. 500), widok wyświetli komunikat o błędzie uniemożliwiający interakcję z formularzem. Jeśli API zwróci 404 (brak profilu), użytkownik zostanie przekierowany do kreatora profilu (`/profile-setup`).
- **Błąd zapisu danych (PUT)**: W przypadku błędu walidacji (400) lub błędu serwera (500), użytkownik zobaczy powiadomienie typu "toast" z informacją o niepowodzeniu operacji. Wprowadzone przez niego dane w formularzu zostaną zachowane.
- **Brak połączenia sieciowego**: React Query automatycznie obsłuży błędy sieciowe, co zostanie zakomunikowane użytkownikowi za pomocą toasta.

## 11. Kroki implementacji

1. Utworzenie pliku strony Astro `/src/pages/profile.astro`.
2. Stworzenie głównego komponentu React `ProfileView.tsx` w `/src/components/views/`.
3. Implementacja logiki pobierania danych w `ProfileView` przy użyciu React Query (lub w hooku `useProfile`). Dodanie obsługi stanu ładowania i błędów.
4. Stworzenie komponentu `ProfileForm.tsx`.
5. Zdefiniowanie schemy walidacji Zod dla formularza profilu w `/src/lib/validators/`.
6. Zintegrowanie `react-hook-form` z `ProfileForm` i schemą Zod. Zbudowanie układu formularza przy użyciu komponentów Shadcn/ui.
7. Implementacja logiki wysyłania formularza, w tym transformacji `ProfileFormViewModel` do `UpdateProfileCommand` i wywołania mutacji z React Query.
8. Dodanie komponentów `ReminderToggle` i `ThemeToggle`.
9. Połączenie wszystkich komponentów w `ProfileView` i przekazanie niezbędnych propsów.
10. Dodanie obsługi powiadomień "toast" dla operacji zapisu i błędów.
11. Stylowanie komponentów za pomocą Tailwind CSS w celu zapewnienia zgodności z resztą aplikacji.
12. Przeprowadzenie testów manualnych w celu weryfikacji wszystkich interakcji, walidacji i obsługi błędów.
