# Oysterponds Shellfish Co. — Invoice Management System

Full-stack TypeScript monorepo for managing shellfish orders, invoices, PDF generation, and email delivery. Internal staff manage orders/invoices through an authenticated dashboard; customers can self-order via a public portal at `/order/:customerSlug`. The system generates compliance-tracked invoice PDFs (harvest location, temperature, shipper certification) and emails them via Resend.

## Repo layout

```
oysterponds/
├── client/             # React 18 + Vite + TypeScript + Tailwind + shadcn/ui (port 8080)
├── server/             # Express + TypeScript + MongoDB/Mongoose (port 5000)
├── *.bat / *.command   # Windows + Mac launcher scripts
├── README.md           # Quick start
├── SETUP_GUIDE.md      # Detailed Mac setup + troubleshooting
└── DEPLOYMENT_GUIDE.md # Railway + Vercel deployment
```

## Tech stack

**Client** ([client/package.json](client/package.json)) — React 18.3, Vite 5.4, TypeScript 5.8 (loose: `strictNullChecks: false`), Redux Toolkit, React Query, React Hook Form + Zod, Axios, Tailwind 3.4 + shadcn/ui (Radix), Recharts, Sonner, Framer Motion.

**Server** ([server/package.json](server/package.json)) — Express 4.18, TypeScript 5.3 (strict), Mongoose 8.0, JWT (`jsonwebtoken`) + bcryptjs, Puppeteer 24 (PDFs), Resend (email), ExcelJS, express-validator, `tsx` for hot-reload dev.

## How to run

```bash
# First-time setup
./install-dependencies.bat        # or .command on Mac — installs both client & server
cd server && npm run create-admin # creates admin@oysterponds.com / admin123
cd server && npm run seed         # seeds 6 products, 4 harvest locations, 45 customers, 2 sample orders

# Daily dev (option A — convenience script)
./start-app.bat                   # backgrounds both servers; stop-app.bat to kill

# Daily dev (option B — manual, recommended for debugging)
cd server && npm run dev          # http://localhost:5000
cd client && npm run dev          # http://localhost:8080
```

Default login after `create-admin`: **admin@oysterponds.com / admin123** (rotate before production).

## Server architecture

- Entry point: [server/src/server.ts](server/src/server.ts) — loads `.env`, connects MongoDB, starts HTTP listener
- Express config: [server/src/app.ts](server/src/app.ts) — CORS, body parsing, route mounting, error handler
- DB connection: [server/src/config/db.ts](server/src/config/db.ts) — uses `MONGODB_URI`
- Routes index: [server/src/routes/index.ts](server/src/routes/index.ts) — splits public vs JWT-protected routes
- Models: [server/src/models/](server/src/models/) — `User`, `Order`, `Invoice`, `Customer`, `Product`, `HarvestLocation`
- Services: [server/src/services/pdfService.ts](server/src/services/pdfService.ts) (Puppeteer → invoice & shipping-tag PDFs), [server/src/services/emailService.ts](server/src/services/emailService.ts) (Resend)
- Auth middleware: [server/src/middleware/auth.ts](server/src/middleware/auth.ts) — JWT in `Authorization: Bearer` header **OR** `?token=` query param (the query-param fallback exists so `window.open()` can download authenticated PDFs)
- Utility scripts: [server/src/utils/seedData.ts](server/src/utils/seedData.ts), [server/src/utils/createAdmin.ts](server/src/utils/createAdmin.ts), [server/src/utils/cleanTestData.ts](server/src/utils/cleanTestData.ts)

### Public (unauthenticated) endpoints
- `POST /api/auth/login`, `POST /api/auth/register`
- `GET /api/products`, `GET /api/harvest-locations`
- `GET /api/customers/slug/:slug`, `GET /api/customers/:id/pricing`
- `POST /api/orders/public` — customer self-service ordering
- `GET /api/health`

Everything else under `/api/*` requires JWT.

## Client architecture

- Entry: [client/src/main.tsx](client/src/main.tsx) → [client/src/App.tsx](client/src/App.tsx) (React Router)
- Pages: [client/src/pages/](client/src/pages/) — `Login`, `Dashboard`, `NewOrder`, `Orders`, `Invoices`, `Customers`, `Reports`, `CustomerOrderPortal` (public), `NotFound`
- API client: [client/src/services/api.ts](client/src/services/api.ts) — Axios instance, base URL from `VITE_API_URL`, attaches token from localStorage
- Redux slices: [client/src/store/slices/](client/src/store/slices/) — `customers`, `orders`, `invoices`, `products`, `harvestLocations`
- shadcn/ui components: [client/src/components/ui/](client/src/components/ui/)
- Path alias: `@/*` → `client/src/*` (see [client/tsconfig.json](client/tsconfig.json))
- Vite config: [client/vite.config.ts](client/vite.config.ts) — **runs on port 8080**, not the Vite default 5173

## Environment variables

**`server/.env`** (see [server/.env.example](server/.env.example))
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/oysterponds
ORDER_NUMBER_START=16000
JWT_SECRET=<random-string>
RESEND_API_KEY=<resend-key>
RESEND_FROM_EMAIL=Oysterponds Shellfish Co. <phil@oysterpondsshellfish.com>
CLIENT_URL=https://your-frontend.vercel.app          # for CORS in prod
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium          # set in Docker/Railway
```

**`client/.env`**
```
VITE_API_URL=http://localhost:5000/api
```

## Gotchas / non-obvious things

- **Vite runs on port 8080**, not 5173 — configured in `client/vite.config.ts`. macOS users may hit AirPlay conflicts on this port (see SETUP_GUIDE.md).
- **TypeScript strictness is asymmetric** — server is strict, client is loose (`strictNullChecks: false`). Don't expect uniform null safety across the boundary.
- **`Invoice System.zip`** at the repo root is a legacy archive of an earlier version. Not part of the live codebase — ignore it.
- **PDF generation needs Chromium.** Locally, Puppeteer downloads its own. In production (Railway), the [server/Dockerfile](server/Dockerfile) installs `chromium` and sets `PUPPETEER_EXECUTABLE_PATH`.
- **Order numbers** auto-increment from `ORDER_NUMBER_START`. **Invoice numbers** are formatted `INV-#####` (zero-padded auto-increment). Both are unique-indexed in Mongo.
- **Order pre-save hook** auto-calculates subtotal/total from line items — don't try to set totals manually on the model.
- **Hardcoded company info** lives in `pdfService.ts` and `emailService.ts` (logo, address, shipper cert `NY27496SS`). Rebranding requires touching both files.
- **JWT fallback secret** in [server/src/middleware/auth.ts](server/src/middleware/auth.ts) is `'oysterponds-shellfish-secret-key-2026'` if `JWT_SECRET` is unset — fine for local, must be overridden in prod.

## Deployment

| Layer    | Provider          | Notes                                          |
| -------- | ----------------- | ---------------------------------------------- |
| Frontend | Vercel            | `npm run build` → `client/dist`                |
| Backend  | Railway (Docker)  | Dockerfile installs Chromium for Puppeteer     |
| Database | MongoDB Atlas M0  | Free tier sufficient for early use             |
| Email    | Resend            | API key in `RESEND_API_KEY`                    |

Full walkthrough: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md).

## Useful scripts

| Command                  | Where     | Effect                                            |
| ------------------------ | --------- | ------------------------------------------------- |
| `npm run dev`            | client/server | Hot-reload dev server                         |
| `npm run build`          | client/server | Production build                              |
| `npm run lint`           | client    | ESLint                                            |
| `npm run preview`        | client    | Preview production build locally                  |
| `npm start`              | server    | Run compiled JS from `dist/` (production)         |
| `npm run seed`           | server    | Populate DB with sample data                      |
| `npm run create-admin`   | server    | Bootstrap admin user                              |
| `npm run clean-data`     | server    | Wipe test data                                    |
