Frontend - Astro z React dla komponentów interaktywnych:

- Astro 5 pozwala na tworzenie szybkich, wydajnych stron i aplikacji z minimalną ilością JavaScript
- React 19 zapewni interaktywność tam, gdzie jest potrzebna
- TypeScript 5 dla statycznego typowania kodu i lepszego wsparcia IDE
- Tailwind 4 pozwala na wygodne stylowanie aplikacji
- Shadcn/ui zapewnia bibliotekę dostępnych komponentów React, na których oprzemy UI

Backend - Supabase jako kompleksowe rozwiązanie backendowe:

- Zapewnia bazę danych PostgreSQL
- Zapewnia SDK w wielu językach, które posłużą jako Backend-as-a-Service
- Jest rozwiązaniem open source, które można hostować lokalnie lub na własnym serwerze
- Posiada wbudowaną autentykację użytkowników

Testing - Kompleksowe testowanie aplikacji:

- Vitest + React Testing Library do testów jednostkowych i integracyjnych
- Playwright do testów E2E/UI na różnych przeglądarkach (Chromium, WebKit, Firefox)
- Playwright-axe i jest-axe do testów dostępności (WCAG 2.1 AA)
- Supertest do testów API endpoints
- Supabase CLI do zarządzania testową bazą danych (seed, migracje)
- OWASP ZAP do testów bezpieczeństwa
- Coveralls do raportowania pokrycia kodu

CI/CD i Hosting:

- Github Actions do tworzenia pipeline'ów CI/CD
- DigitalOcean do hostowania aplikacji za pośrednictwem obrazu docker
