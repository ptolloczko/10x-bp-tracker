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
- **Analiza Hostingu**: Przeprowadzono analizę w celu wyboru optymalnej platformy hostingowej, biorąc pod uwagę potencjalny rozwój projektu w kierunku komercyjnym. Głównym wymaganiem jest wsparcie dla środowiska Node.js w celu obsługi renderowania po stronie serwera (SSR) przez Astro.

### Rekomendowane Platformy

|| Platforma | Ocena | Podsumowanie |
|| ----------------- | :---: | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
|| **Cloudflare Pages** | 10/10 | **Najlepsza rekomendacja.** Idealna dla rosnącego projektu. Oferuje najlepszy darmowy plan do użytku komercyjnego, wyjątkową wydajność dzięki sieci edge i przewidywalne, niskie koszty skalowania. |
|| **Netlify** | 9/10 | Bardzo solidny i bezpieczny wybór. Świetne doświadczenie deweloperskie i darmowy plan przyjazny komercyjnie, co stanowi doskonały punkt startowy dla projektu. |
|| **Vercel** | 8/10 | Fantastyczne doświadczenie deweloperskie, ale darmowy plan "Hobby" kategorycznie zabrania użytku komercyjnego, co czyni go ryzykownym wyborem dla potencjalnego startupu. |

### Platformy Alternatywne

|| Platforma | Ocena | Podsumowanie |
|| ------------------------- | :---: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|| **Render** | 8/10 | Świetny kompromis między łatwością użycia a kontrolą. Główną wadą dla projektu przed monetyzacją jest brak darmowego, zawsze aktywnego planu dla usług serwerowych. |
|| **DigitalOcean App Platform** | 7/10 | Potężna i efektywna kosztowo, ale większa złożoność i narzut DevOps sprawiają, że jest mniej idealna dla małego zespołu skupionego na szybkim rozwoju. Najlepsza, gdy potrzebujesz większej kontroli. |
