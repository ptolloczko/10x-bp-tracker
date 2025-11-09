# CI/CD Pipeline - Quick Reference

## 🚀 Jak uruchomić

### Automatycznie

```bash
git push origin master
```

### Ręcznie

1. GitHub → Actions → "CI/CD Pipeline"
2. Kliknij "Run workflow"
3. Wybierz branch → "Run workflow"

## 📊 Struktura Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                    TRIGGER: Push to master                   │
│                    lub Manual Workflow                       │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │    PARALLEL EXECUTION     │
                └─────────────┬─────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐     ┌──────────────┐
│   LINT       │      │ UNIT TESTS   │     │  E2E TESTS   │
│              │      │              │     │              │
│ ESLint       │      │ Vitest       │     │ Playwright   │
│ ~1-2 min     │      │ ~2-3 min     │     │ + Supabase   │
│              │      │              │     │ ~5-7 min     │
└──────┬───────┘      └──────┬───────┘     └──────┬───────┘
       │                     │                     │
       └─────────────────────┼─────────────────────┘
                             │
                    ✅ All Success
                             │
                             ▼
                    ┌──────────────┐
                    │    BUILD     │
                    │              │
                    │ Astro Build  │
                    │ ~2-3 min     │
                    │              │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   SUMMARY    │
                    │              │
                    │ Report Gen   │
                    │ <1 min       │
                    │              │
                    └──────────────┘
                           │
                           ▼
                    ✅ READY TO DEPLOY
```

## ⏱️ Timeline

| Minuta | Aktywność                         |
| ------ | --------------------------------- |
| 0-2    | Lint, Setup (parallel)            |
| 2-7    | Unit Tests + E2E Tests (parallel) |
| 7-10   | Production Build                  |
| 10     | Summary & Done ✅                 |

**Total: ~7-10 minut**

## 📦 Artefakty

Po zakończeniu dostępne przez 7 dni:

1. **Playwright Report** (E2E Tests)
   - Screenshoty błędów
   - Video recordings
   - Test traces

2. **Production Build** (dist/)
   - Gotowy do deployment
   - Zoptymalizowany bundle

## 🔍 Monitorowanie

### Status Badge

Dodaj do README.md:

```markdown
![CI/CD Pipeline](https://github.com/{owner}/{repo}/actions/workflows/master.yml/badge.svg)
```

### Email Notifications

GitHub automatycznie wysyła powiadomienia o:

- ❌ Failed workflows
- ✅ Fixed workflows (po poprzednim fail)

## ⚡ Optymalizacje

| Feature           | Benefit            | Czas oszczędności |
| ----------------- | ------------------ | ----------------- |
| npm cache         | Szybsza instalacja | ~30-60s           |
| Parallel jobs     | Równoległe testy   | ~5-7 min          |
| Chromium only     | Szybsze E2E        | ~3-5 min          |
| Conditional build | Skip przy fail     | Variable          |

## 🛠️ Komendy Lokalne

Przed push testuj lokalnie:

```bash
# Full pipeline locally
npm run lint          # 1. Lint
npm run test:unit     # 2. Unit tests
npm run test:e2e      # 3. E2E tests
npm run build         # 4. Build

# Lub wszystko naraz
npm test && npm run build
```

## 🚨 Troubleshooting

### Pipeline czerwony ❌

1. **Lint failed**

   ```bash
   npm run lint:fix
   ```

2. **Unit tests failed**

   ```bash
   npm run test:unit:watch
   ```

3. **E2E tests failed**

   ```bash
   npm run test:e2e:ui
   # lub
   npm run test:e2e:headed
   ```

4. **Build failed**
   ```bash
   npm run build
   # Sprawdź logi
   ```

### Supabase issues

```bash
# Lokalnie
npm run supabase:restart

# W CI - sprawdź czy:
# - supabase/setup-cli@v1 jest zainstalowane
# - supabase start działa
```

## 📈 Metryki

Typowe wartości:

| Metric         | Target | Actual   |
| -------------- | ------ | -------- |
| Success rate   | >95%   | TBD      |
| Avg duration   | <10min | ~7-10min |
| Cache hit rate | >80%   | TBD      |
| Flaky tests    | <2%    | TBD      |

## 🔒 Bezpieczeństwo

✅ Brak sekretów w kodzie
✅ Supabase tylko lokalnie
✅ Artifacts auto-expire (7 dni)
✅ Read-only permissions

## 📚 Następne Kroki

1. **Coverage Reports** → Codecov/Coveralls
2. **Security Scanning** → Snyk/Dependabot
3. **Performance Tests** → Lighthouse CI
4. **Deploy** → DigitalOcean/Vercel/Netlify

## 💡 Tips

- ✨ Pipeline działa na każdym branchu (można testować)
- 🔄 Re-run failed jobs zamiast całego workflow
- 📊 Używaj GitHub Actions Summary dla quick insights
- 🎯 Monitor Playwright traces dla debugging E2E
