# CI/CD Pipeline - Dokumentacja

## Przegląd

Minimalny ale kompletny pipeline CI/CD zaprojektowany dla projektu 10x-BP-Tracker. Pipeline weryfikuje jakość kodu, testy oraz poprawność buildu produkcyjnego.

## Architektura Pipeline

Pipeline składa się z 5 jobs wykonywanych w określonej kolejności:

```
lint ──┐
       │
unit-tests ──┼──> build ──> summary
       │
e2e-tests ──┘
```

### Job 1: Lint & Format Check
- **Cel**: Walidacja formatowania i jakości kodu
- **Narzędzia**: ESLint
- **Czas wykonania**: ~1-2 min
- **Fail fast**: Tak

### Job 2: Unit Tests
- **Cel**: Weryfikacja testów jednostkowych
- **Narzędzia**: Vitest
- **Czas wykonania**: ~2-3 min
- **Coverage**: Opcjonalnie dostępne

### Job 3: E2E Tests
- **Cel**: Weryfikacja testów end-to-end
- **Narzędzia**: Playwright + Supabase Local
- **Browser**: Chromium (minimalny setup)
- **Czas wykonania**: ~5-7 min
- **Artefakty**: Playwright report (7 dni retencji)

### Job 4: Production Build
- **Cel**: Weryfikacja poprawności buildu produkcyjnego
- **Narzędzia**: Astro Build
- **Zależności**: Wymaga sukcesu wszystkich poprzednich jobs
- **Czas wykonania**: ~2-3 min
- **Artefakty**: Build artifacts w `dist/` (7 dni retencji)

### Job 5: Pipeline Summary
- **Cel**: Agregacja wyników i podsumowanie
- **Wykonanie**: Zawsze (nawet przy błędach)
- **Output**: Markdown summary w GitHub Actions UI

## Triggery

### 1. Automatyczny (Push)
```yaml
on:
  push:
    branches: [master]
```
Pipeline uruchamia się automatycznie przy każdym push do brancha `master`.

### 2. Manualny (Workflow Dispatch)
```yaml
on:
  workflow_dispatch:
```
Pipeline można uruchomić ręcznie z zakładki "Actions" w GitHub:
1. Przejdź do zakładki **Actions**
2. Wybierz workflow **CI/CD Pipeline**
3. Kliknij **Run workflow**
4. Wybierz branch (domyślnie `master`)
5. Kliknij **Run workflow**

## Optymalizacje

### Cache
Pipeline wykorzystuje automatyczny cache npm poprzez:
```yaml
- uses: actions/setup-node@v6
  with:
    cache: 'npm'
```

### Node Version
Wersja Node.js jest automatycznie pobierana z pliku `.nvmrc`:
```yaml
node-version-file: '.nvmrc'
```

### Playwright Browsers
Instalowany jest tylko Chromium dla szybszego wykonania:
```bash
npx playwright install --with-deps chromium
```

### Parallel Jobs
Jobs `lint`, `unit-tests` i `e2e-tests` wykonują się równolegle dla oszczędności czasu.

## Monitoring i Debugging

### Artefakty
- **Playwright Report**: Dostępny przez 7 dni po wykonaniu testów E2E
- **Production Build**: Dostępny przez 7 dni po udanym buildzie

### Job Summary
Po zakończeniu pipeline'a dostępne jest podsumowanie w formacie tabelarycznym:

| Job | Status |
|-----|--------|
| Lint | success |
| Unit Tests | success |
| E2E Tests | success |
| Build | success |

### Logi
Wszystkie logi są dostępne w zakładce Actions → wybrany workflow run → poszczególne joby.

## Supabase Local

Pipeline automatycznie:
1. Instaluje Supabase CLI
2. Uruchamia lokalną instancję Supabase
3. Po zakończeniu testów zatrzymuje Supabase (nawet przy błędach)

## Czas Wykonania

Całkowity czas wykonania pipeline'a: **~7-10 minut**

Breakdown:
- Lint: 1-2 min
- Unit Tests: 2-3 min (równolegle)
- E2E Tests: 5-7 min (równolegle)
- Build: 2-3 min (po zakończeniu testów)
- Summary: <1 min

## Rozszerzenia (Opcjonalne)

### Coverage Reports
Aby dodać raportowanie pokrycia kodu:

```yaml
- name: Run unit tests with coverage
  run: npm run test:unit:coverage

- name: Upload coverage reports
  uses: codecov/codecov-action@v4
  with:
    token: ${{ secrets.CODECOV_TOKEN }}
```

### Multiple Browsers (Playwright)
Aby testować na wielu przeglądarkach:

```yaml
strategy:
  matrix:
    browser: [chromium, firefox, webkit]
steps:
  - run: npx playwright install --with-deps ${{ matrix.browser }}
  - run: npm run test:e2e -- --project=${{ matrix.browser }}
```

### Deploy na DigitalOcean
Dodaj job po udanym buildzie:

```yaml
deploy:
  needs: build
  if: github.ref == 'refs/heads/master'
  runs-on: ubuntu-latest
  steps:
    - name: Deploy to DigitalOcean
      # Implementacja deploy
```

## Troubleshooting

### Pipeline nie startuje
- Sprawdź czy plik `.github/workflows/master.yml` jest w repo
- Sprawdź czy workflow jest enabled w Settings → Actions

### Supabase nie startuje
- Sprawdź logi w job E2E Tests
- Upewnij się że Supabase CLI jest poprawnie zainstalowane

### Playwright testy failują
- Sprawdź Playwright Report w artefaktach
- Lokalnie uruchom: `npm run test:e2e:debug`

### Build failuje
- Sprawdź logi buildu
- Lokalnie uruchom: `npm run build`

## Bezpieczeństwo

Pipeline nie używa żadnych sekretów, więc jest bezpieczny dla publicznych repozytoriów. Jeśli planujesz deployment, dodaj sekrety w Settings → Secrets and variables → Actions.

## Wersje Akcji

Wszystkie akcje używają najnowszych stabilnych wersji:
- `actions/checkout@v5`
- `actions/setup-node@v6`
- `actions/upload-artifact@v4`
- `supabase/setup-cli@v1`
- `microsoft/playwright-github-action@v1` (opcjonalnie)

## Kontakt i Wsparcie

W przypadku problemów sprawdź:
1. GitHub Actions logs
2. Dokumentację poszczególnych narzędzi
3. Issues w repozytorium projektu

