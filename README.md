# CForge

Private C programming academy. This repository is the Emergent frontend.

- Student login: `/login`
- Faculty login: `/faculty-login`
- Browser calls stay same-origin (`/api`)
- SSR and the production `/api` proxy use server-only `CFORGE_API_ORIGIN`
- The original Next.js API lives in a separate repository: `https://github.com/ruthvikgoud16/c-forge-back`

Do not commit `.env.local`, faculty tokens, roster CSV files, or `VITE_*` API URLs.

Do not set `VITE_CFORGE_DEMO` in production.
