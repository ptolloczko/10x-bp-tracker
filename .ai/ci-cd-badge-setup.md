# CI/CD Pipeline Status

![CI/CD Pipeline](https://github.com/ptolloczko/10x-bp-tracker/actions/workflows/master.yml/badge.svg)

## Dodaj do README.md

Skopiuj poniższy kod na początek głównego README.md:

```markdown
# 10x BP Tracker

![CI/CD Pipeline](https://github.com/ptolloczko/10x-bp-tracker/actions/workflows/master.yml/badge.svg)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Blood Pressure Tracker - aplikacja do monitorowania ciśnienia krwi.

## Status

- ✅ Automated testing (Unit + E2E)
- ✅ Production build validation
- ✅ Code quality checks (ESLint)
- 🚀 Ready for deployment
```

## Konfiguracja GitHub Repository

### 1. Aktywuj Actions

Jeśli Actions nie są włączone:

1. Idź do: Settings → Actions → General
2. Wybierz: "Allow all actions and reusable workflows"
3. Zapisz

### 2. Włącz Workflow

1. Idź do: Actions
2. Jeśli widzisz "Workflows aren't being run on this forked repository"
3. Kliknij: "I understand my workflows, go ahead and enable them"

### 3. Uruchom Pierwszy Workflow

#### Opcja A: Push do master
```bash
git add .
git commit -m "Add CI/CD pipeline"
git push origin master
```

#### Opcja B: Manual trigger
1. Idź do: Actions
2. Wybierz: "CI/CD Pipeline"
3. Kliknij: "Run workflow"
4. Wybierz branch: master
5. Kliknij: "Run workflow"

## Monitorowanie

### Dashboard
Przejdź do: https://github.com/ptolloczko/10x-bp-tracker/actions

### Email Notifications
GitHub automatycznie wysyła powiadomienia o:
- ❌ Failed workflows
- ✅ Workflows fixed po poprzednim fail

### Status Badge
Badge pokazuje aktualny status pipeline:
- ✅ **passing** - wszystko działa
- ❌ **failing** - są problemy
- ⏸️ **no status** - workflow nie był uruchomiony

## Branch Protection (Opcjonalnie)

Zalecane ustawienia dla brancha `master`:

1. Settings → Branches → Add rule
2. Branch name pattern: `master`
3. Zaznacz:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
     - ✅ Require branches to be up to date before merging
     - Status checks: `lint`, `unit-tests`, `e2e-tests`, `build`
   - ✅ Do not allow bypassing the above settings

To wymusi przechodzenie testów przed merge do mastera.

## Troubleshooting

### Badge pokazuje "no status"
- Workflow nie był jeszcze uruchomiony
- Uruchom ręcznie lub zrób push

### Badge pokazuje "failing"
- Sprawdź logi: https://github.com/ptolloczko/10x-bp-tracker/actions
- Kliknij na failed workflow
- Zobacz szczegóły błędów

### Workflow nie startuje
- Sprawdź czy Actions są włączone
- Sprawdź czy `.github/workflows/master.yml` istnieje
- Sprawdź czy masz uprawnienia do repo

## Dokumentacja

Pełna dokumentacja CI/CD znajduje się w:
- `.ai/ci-cd-documentation.md` - Szczegółowa dokumentacja
- `.ai/ci-cd-quick-reference.md` - Szybki przewodnik

