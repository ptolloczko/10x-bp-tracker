# Plan implementacji widoku: Lista Pomiarów

## 1. Przegląd

Widok „Lista Pomiarów” (`/measurements`) jest głównym interfejsem do przeglądania pełnej, historycznej listy pomiarów ciśnienia krwi użytkownika. Umożliwia on paginację wyników, sortowanie, a także inicjowanie akcji dodawania, edycji i usuwania pojedynczych wpisów. Widok zawiera również funkcjonalność eksportu wszystkich danych do pliku CSV. Jest to kluczowy ekran, który musi być chroniony i dostępny tylko dla zalogowanych użytkowników.

## 2. Routing widoku

- **Ścieżka:** `/measurements`
- **Ochrona:** Dostęp do tej ścieżki wymaga aktywnej sesji użytkownika. Niezalogowani użytkownicy powinni być automatycznie przekierowywani na stronę logowania.

## 3. Struktura komponentów

Struktura zostanie oparta o architekturę komponentową z wykorzystaniem Astro do renderowania strony i React do interaktywnych wysp (islands).

```
- src/pages/measurements.astro (Strona Astro, ochrona routingu)
  - Layout.astro
    - MeasurementsView.tsx (Główny komponent React, zarządza stanem)
      - Header (Nagłówek z tytułem)
      - ActionButtons (Kontener na przyciski akcji)
        - AddMeasurementButton -> otwiera AddMeasurementDialog
        - CSVExportButton
      - MeasurementTable.tsx (Tabela z pomiarami)
        - TableRow (Wiersz dla pojedynczego pomiaru)
          - LevelBadge.tsx (Wizualna reprezentacja poziomu ciśnienia)
          - ActionMenu (Menu z opcjami Edytuj/Usuń)
      - Pagination (Komponent paginacji z Shadcn/ui)
      - AddMeasurementDialog.tsx (Modal do dodawania pomiaru)
        - MeasurementForm.tsx (Formularz wielokrotnego użytku)
      - DeleteConfirmationDialog.tsx (Modal potwierdzenia usunięcia)
```

## 4. Szczegóły komponentów

### `MeasurementsView.tsx`

- **Opis:** Główny komponent-kontener, który orkiestruje pobieranie danych, zarządzanie stanem (paginacja, modale) i renderowanie komponentów podrzędnych.
- **Główne elementy:** `div` jako wrapper, `h1` dla tytułu, `ActionButtons`, `MeasurementTable`, `Pagination`.
- **Obsługiwane interakcje:** Zmiana strony w paginacji, otwieranie modalu dodawania, inicjowanie procesu usuwania pomiaru.
- **Obsługiwana walidacja:** Walidacja parametrów zapytania do API (np. `page >= 1`).
- **Typy:** `MeasurementListResponse`, `MeasurementListQuery`, `MeasurementDTO`.
- **Propsy:** Brak.

### `MeasurementTable.tsx`

- **Opis:** Komponent prezentacyjny renderujący dane w formie tabeli przy użyciu komponentów `Table` z biblioteki Shadcn/ui.
- **Główne elementy:** `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell` z Shadcn.
- **Obsługiwane interakcje:** Deleguje zdarzenia kliknięcia na przyciskach "Edytuj" i "Usuń" do komponentu nadrzędnego.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `MeasurementDTO[]`.
- **Propsy:**
  - `measurements: MeasurementDTO[]`
  - `onEdit: (id: string) => void`
  - `onDelete: (id: string) => void`

### `LevelBadge.tsx`

- **Opis:** Mały, wizualny komponent do wyświetlania poziomu ciśnienia (`level`) za pomocą odpowiedniego koloru, ikony i etykiety tekstowej, zgodnie z wymaganiami US-004.
- **Główne elementy:** `div` lub `span` stylizowany za pomocą `Badge` z Shadcn, zawierający ikonę (np. z `lucide-react`) i tekst.
- **Obsługiwane interakcje:** Brak.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `MeasurementEntity["level"]`.
- **Propsy:**
  - `level: MeasurementEntity["level"]`

### `AddMeasurementDialog.tsx`

- **Opis:** Modal oparty na `Dialog` z Shadcn, zawierający `MeasurementForm` do tworzenia nowego wpisu.
- **Główne elementy:** `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`, `MeasurementForm`.
- **Obsługiwane interakcje:** Otwieranie/zamykanie modalu, obsługa sukcesu/błędu po submisji formularza.
- **Obsługiwana walidacja:** Brak (delegowana do formularza).
- **Typy:** `CreateMeasurementCommand`, `MeasurementDTO`.
- **Propsy:**
  - `onSuccess: (newMeasurement: MeasurementDTO) => void`

### `MeasurementForm.tsx`

- **Opis:** Generyczny formularz do tworzenia i edycji pomiarów, zbudowany z użyciem `react-hook-form` i Zod do walidacji.
- **Główne elementy:** `form`, komponenty `Input`, `Label`, `Button` z Shadcn/ui, pole do wyboru daty (`DatePicker`).
- **Obsługiwane interakcje:** `onSubmit`.
- **Obsługiwana walidacja:**
  - `sys`, `dia`, `pulse`: `number > 0`.
  - `sys >= dia`: reguła biznesowa (`.refine` w Zod).
  - `measured_at`: data nie może być z przyszłości.
  - `notes`: `string`, maksymalnie 255 znaków.
- **Typy:** `MeasurementFormViewModel`, `CreateMeasurementCommand`.
- **Propsy:**
  - `onSubmit: (data: CreateMeasurementCommand) => Promise<void>`
  - `initialData?: Partial<MeasurementFormViewModel>`
  - `isSubmitting: boolean`

## 5. Typy

Oprócz istniejących typów `MeasurementDTO`, `MeasurementListResponse` i `CreateMeasurementCommand` z `src/types.ts`, wprowadzony zostanie nowy typ `ViewModel` dla formularza.

- **`MeasurementFormViewModel`**:
  - **Cel**: Ułatwienie pracy z formularzem w `react-hook-form`, w szczególności z komponentem `DatePicker`, który operuje na obiekcie `Date`.
  - **Struktura**:
    ```typescript
    export interface MeasurementFormViewModel {
      sys: number;
      dia: number;
      pulse: number;
      measured_at: Date; // Używany przez DatePicker
      notes?: string;
    }
    ```
  - **Konwersja**: Przed wysłaniem do API, `ViewModel` będzie konwertowany na `CreateMeasurementCommand`, gdzie pole `measured_at` zostanie zamienione na string ISO (`date.toISOString()`).

## 6. Zarządzanie stanem

Zalecane jest użycie biblioteki **TanStack Query (React Query)** do zarządzania stanem serwera. Zapewni to buforowanie danych, automatyczne odświeżanie i uproszczoną obsługę stanów ładowania/błędu.

- **Custom Hook `useMeasurements`**:
  - **Cel:** Abstrakcja logiki pobierania i modyfikacji danych pomiarów.
  - **Funkcjonalność:**
    - `useQuery` do pobierania listy pomiarów (`GET /api/measurements`) z parametrami (strona, sortowanie).
    - `useMutation` do usuwania pomiaru (`DELETE /api/measurements/{id}`).
    - `useMutation` do dodawania pomiaru (`POST /api/measurements`).
  - **Klucz zapytania:** `['measurements', { page, pageSize, sort }]`.
  - **Po mutacji (dodanie/usunięcie):** Automatyczne unieważnienie (`invalidateQueries`) klucza `['measurements']`, co spowoduje ponowne pobranie świeżych danych i aktualizację UI.

## 7. Integracja API

- **Pobieranie listy:**
  - **Endpoint:** `GET /api/measurements`
  - **Zapytanie:** `useMeasurements` będzie dynamicznie budować obiekt `MeasurementListQuery` na podstawie stanu paginacji.
  - **Odpowiedź:** `MeasurementListResponse`.
- **Dodawanie pomiaru:**
  - **Endpoint:** `POST /api/measurements`
  - **Zapytanie:** Body będzie miało typ `CreateMeasurementCommand`.
  - **Odpowiedź:** `MeasurementDTO` (dla statusu 201).
- **Usuwanie pomiaru:**
  - **Endpoint:** `DELETE /api/measurements/{id}`
  - **Odpowiedź:** Status 204.
- **Eksport CSV:**
  - **Endpoint:** **Rekomendowane jest stworzenie nowego endpointu `GET /api/measurements/export`**, który zwraca odpowiedź typu `text/csv`. Jeśli to niemożliwe, frontend będzie musiał iteracyjnie pobierać wszystkie strony, co jest nieefektywne. Plan zakłada istnienie dedykowanego endpointu.

## 8. Interakcje użytkownika

- **Wyświetlenie widoku:** Inicjalne pobranie pierwszej strony pomiarów, wyświetlenie szkieletu ładowania.
- **Zmiana strony:** Kliknięcie w `Pagination` aktualizuje parametr `page` w `useMeasurements`, co wyzwala pobranie nowej strony.
- **Kliknięcie "Usuń":** Otwiera `DeleteConfirmationDialog`. Po potwierdzeniu, wywoływana jest mutacja `deleteMeasurement`, która po sukcesie odświeża listę.
- **Kliknięcie "Dodaj pomiar":** Otwiera `AddMeasurementDialog`.
- **Wysłanie formularza dodawania:** Po walidacji, wywoływana jest mutacja `addMeasurement`. Po sukcesie, modal jest zamykany, a lista odświeżana (przechodząc na pierwszą stronę).
- **Kliknięcie "Eksportuj do CSV":** Przycisk wywołuje żądanie do `GET /api/measurements/export`, co inicjuje pobieranie pliku przez przeglądarkę.

## 9. Warunki i walidacja

- **Formularz `MeasurementForm`** będzie głównym miejscem walidacji po stronie klienta, używając schemy Zod, która odzwierciedla reguły API: `sys > 0`, `dia > 0`, `pulse > 0`, `sys >= dia`, data nie z przyszłości, `notes` do 255 znaków.
- **Przycisk "Wyślij"** w formularzu będzie nieaktywny, jeśli formularz nie jest poprawny lub trwa proces wysyłania.
- **Interfejs** będzie wizualnie informował o polach z błędami (np. czerwona ramka, komunikat pod polem).

## 10. Obsługa błędów

- **Błąd pobierania danych:** Jeśli `useQuery` zwróci błąd, zamiast tabeli wyświetlony zostanie komunikat błędu z przyciskiem "Spróbuj ponownie".
- **Pusta lista:** Jeśli API zwróci `total: 0`, tabela zostanie zastąpiona komunikatem "Brak pomiarów" i wyraźnym przyciskiem "Dodaj swój pierwszy pomiar".
- **Błąd usuwania/dodawania:** Mutacje w `TanStack Query` posiadają hook `onError`. W przypadku błędu zostanie wyświetlona notyfikacja typu "toast" z informacją o niepowodzeniu operacji.
- **Błąd walidacji (400) z API:** Błędy z API (np. duplikat `measured_at`) zostaną przechwycone i wyświetlone jako ogólny błąd w formularzu w modalu.

## 11. Kroki implementacji

1.  **Struktura plików:** Utworzenie plików: `src/pages/measurements.astro`, `src/components/views/MeasurementsView.tsx`, `src/components/MeasurementTable.tsx` i pozostałych komponentów.
2.  **Typy:** Zdefiniowanie `MeasurementFormViewModel`.
3.  **Routing i ochrona:** Implementacja logiki sprawdzania sesji w `measurements.astro` i przekierowania w razie braku autoryzacji.
4.  **Komponenty prezentacyjne:** Zakodowanie `MeasurementTable` i `LevelBadge` jako komponentów czysto prezentacyjnych, przyjmujących dane przez propsy.
5.  **Zarządzanie stanem:** Stworzenie customowego hooka `useMeasurements` z wykorzystaniem `TanStack Query` do obsługi zapytań i mutacji.
6.  **Główny widok:** Złożenie `MeasurementsView` z wykorzystaniem hooka `useMeasurements` i komponentów prezentacyjnych. Dodanie obsługi stanu ładowania (szkielet) i błędu.
7.  **Logika dodawania:** Zbudowanie `MeasurementForm` z walidacją Zod i `react-hook-form`. Zintegrowanie go w `AddMeasurementDialog` i połączenie z mutacją `addMeasurement` z hooka.
8.  **Logika usuwania:** Zaimplementowanie `DeleteConfirmationDialog` i połączenie go z mutacją `deleteMeasurement`.
9.  **Eksport CSV:** Dodanie `CSVExportButton` i logiki do wywołania endpointu eksportu.
10. **Stylowanie i A11y:** Dopracowanie stylów za pomocą Tailwind CSS, upewnienie się, że wszystkie interaktywne elementy są dostępne z klawiatury i posiadają odpowiednie atrybuty ARIA.
