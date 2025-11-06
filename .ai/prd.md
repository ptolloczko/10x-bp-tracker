# Dokument wymagań produktu (PRD) - BP Tracker

## 1. Przegląd produktu

BP Tracker to webowa aplikacja umożliwiająca użytkownikom ręczne rejestrowanie, przechowywanie i interpretowanie pomiarów ciśnienia krwi zgodnie z europejskimi normami ESC/ESH 2023. Aplikacja ułatwia śledzenie wyników, prezentuje alerty wizualne w zależności od poziomu ciśnienia, wysyła przypomnienia e-mail o pomiarach i pozwala użytkownikom eksportować dane do pliku CSV. System przechowuje historię interpretacji w celu audytu oraz zapewnia podstawowy mechanizm uwierzytelniania.

## 2. Problem użytkownika

Manualne wprowadzanie pomiarów w arkuszach kalkulacyjnych jest czasochłonne i podatne na błędy, a samodzielne porównywanie wyników z prawidłowymi zakresami wymaga wiedzy medycznej. Użytkownicy potrzebują prostego narzędzia, które:

- pozwoli szybko dodać pomiar jednym kliknięciem,
- automatycznie zinterpretuje wynik według obowiązujących norm,
- wyświetli graficzne alerty ostrzegające o nieprawidłowościach,
- przypomni o regularnych pomiarach,
- umożliwi łatwe udostępnienie danych lekarzowi w formacie CSV.

## 3. Wymagania funkcjonalne

1. Rejestracja i logowanie użytkownika (email, hasło; bez resetu hasła w MVP).
2. Formularz dodawania pomiaru z domyślną datą/godziną i walidacją pól:
   - skurczowy (sys), rozkurczowy (dia), puls, opcjonalne notatki (≤255 znaków).
3. Interpretacja wyniku wg ESC/ESH 2023 z klasyfikacją poziomu (zielony/pomarańczowy/czerwony).
4. Wizualne alerty na liście (ikona + kolor) oraz sortowanie malejąco po dacie.
5. Edycja i usuwanie istniejących pomiarów.
6. Profil użytkownika z danymi: imię, nazwisko, data urodzenia, płeć, waga, telefon.
7. Przypomnienia e-mail o 8:00 i 20:00 z możliwością wyłączenia w ustawieniach.
8. Eksport wszystkich pomiarów do pliku CSV (UTF-8; średnik).
9. Tabela logów interpretacji z kolumnami: user_id, input_values, wynik, timestamp.
10. Walidacja wartości pomiaru i pulsu w zakresie bezpieczeństwa (konkretne wartości TBD).
11. 50 % pokrycia testami jednostkowymi dla modułu interpretacji.
12. Daty przechowywane w UTC wraz z informacją o strefie czasowej użytkownika.

## 4. Granice produktu

- Brak współdzielenia pomiarów między użytkownikami w MVP.
- Brak integracji z zewnętrznymi platformami czy urządzeniami.
- Brak aplikacji mobilnych i obsługi wielu języków.
- Brak szyfrowania danych at-rest, kopii zapasowych i procedur DR w MVP.
- Brak automatycznego wylogowania sesji.
- Brak resetu hasła; użytkownik musi pamiętać swoje hasło.

## 5. Historyjki użytkowników

| ID     | Tytuł                   | Opis                                                                                                                                                        | Kryteria akceptacji                                                                                                                                                                                                        |
| ------ | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| US-001 | Rejestracja użytkownika | Jako nowy użytkownik chcę utworzyć konto z email i hasłem, aby moje pomiary były prywatne.                                                                  | 1. Formularz rejestracji wymaga unikalnego emaila i hasła spełniającego politykę.<br>2. Po poprawnym wypełnieniu tworzony jest profil użytkownika.<br>3. Użytkownik zostaje automatycznie zalogowany.                      |
| US-002 | Logowanie               | Jako użytkownik chcę zalogować się na swoje konto, aby uzyskać dostęp do swoich pomiarów.                                                                   | 1. Formularz logowania akceptuje poprawne dane i przekierowuje na stronę główną.<br>2. Błędne dane logowania wyświetlają stosowny komunikat.                                                                               |
| US-003 | Dodanie pomiaru         | Jako użytkownik chcę dodać pomiar ciśnienia, aby śledzić swoje zdrowie.                                                                                     | 1. Formularz posiada domyślną datę/godzinę < now().<br>2. Walidacja odrzuca wartości poza zakresem bezpieczeństwa.<br>3. Po zapisaniu pomiar pojawia się na liście z właściwą interpretacją.                               |
| US-004 | Interpretacja pomiaru   | Jako użytkownik chcę zobaczyć graficzny alert poziomu ciśnienia, aby szybko ocenić wynik.                                                                   | 1. System wyświetla ikonę i kolor odpowiadający klasyfikacji ESC/ESH 2023.<br>2. Interpretacja zapisywana w logach.                                                                                                        |
| US-005 | Edycja pomiaru          | Jako użytkownik chcę edytować pomiar, jeśli wprowadziłem błędne dane.                                                                                       | 1. Użytkownik może otworzyć formularz edycji z wstępnie wypełnionymi wartościami.<br>2. Zaktualizowane dane przechodzą tę samą walidację co przy dodawaniu.<br>3. Lista odświeża się z nowymi wartościami i interpretacją. |
| US-006 | Usunięcie pomiaru       | Jako użytkownik chcę usunąć pomiar, który został dodany omyłkowo.                                                                                           | 1. Użytkownik klika opcję usuń i otrzymuje prośbę o potwierdzenie.<br>2. Po potwierdzeniu pomiar znika z listy.                                                                                                            |
| US-007 | Przegląd listy pomiarów | Jako użytkownik chcę widzieć listę pomiarów posortowaną malejąco po dacie, aby łatwo znaleźć najnowsze.                                                     | 1. Lista domyślnie sortuje malejąco.<br>2. Każdy wiersz zawiera datę, ciśnienie, puls, kolor alertu i ikonę.                                                                                                               |
| US-008 | Eksport danych          | Jako użytkownik chcę pobrać swoje pomiary w CSV, aby przekazać je lekarzowi.                                                                                | 1. Opcja eksportu generuje plik CSV w formacie UTF-8; średnik.<br>2. Plik zawiera wszystkie kolumny: date;sys;dia;pulse;level;notes.                                                                                       |
| US-009 | Przypomnienia e-mail    | Jako użytkownik chcę otrzymywać przypomnienia o 8:00 i 20:00, abym nie zapomniał o pomiarze.                                                                | 1. System wysyła e-mail w ustalonych godzinach.<br>2. Użytkownik może wyłączyć przypomnienia w ustawieniach profilu.<br>3. Wyłączenie natychmiast przerywa wysyłkę.                                                        |
| US-010 | Zarządzanie profilem    | Jako użytkownik chcę uzupełnić dane profilu (imię, nazwisko, data urodzenia, płeć, waga, telefon), aby aplikacja była spersonalizowana.                     | 1. Formularz profilu waliduje wymagane pola.<br>2. Zmiany zapisywane są w bazie.<br>3. Po zapisaniu wyświetla się potwierdzenie.                                                                                           |
| US-011 | Bezpieczny dostęp       | Jako użytkownik chcę mieć pewność, że tylko ja widzę swoje dane, dlatego system powinien wymagać uwierzytelnienia przed dostępem do jakichkolwiek pomiarów. | 1. Niezalogowany użytkownik przekierowany jest na stronę logowania przy próbie wejścia na chronione strony.<br>2. Szyfrowane połączenie HTTPS jest wymagane na wszystkich stronach.                                        |
| US-012 | Walidacja danych        | Jako użytkownik chcę, aby aplikacja odrzucała wartości nielogiczne (np. sys < dia), aby uniknąć błędnych wpisów.                                            | 1. Formularz blokuje wprowadzenie danych poza ustalonym zakresem (TBD).<br>2. Użytkownik otrzymuje jasny komunikat błędu.                                                                                                  |

## 6. Metryki sukcesu

- 100 % pomiarów prawidłowo zaklasyfikowanych według ESC/ESH 2023 (brak krytycznych błędów interpretacji w logach).
- Użytkownik dodaje pomiar w czasie < 30 s w testach użyteczności.
- ≥ 70 % aktywnych użytkowników utrzymuje włączone przypomnienia po 30 dniach.
- ≥ 50 % pokrycia testami jednostkowymi modułu interpretacji.
- Dostępność usług ≥ 99 % w okresie miesięcznym.
