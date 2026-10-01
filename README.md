# ACME Salary Desk

A local HR workspace for finding employee compensation, updating current records, and reviewing currency-aware pay summaries. The required scope is in [REQUIREMENTS.md](REQUIREMENTS.md); architecture, performance assumptions, and security boundaries are in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Stack

- Rails 8 JSON API, Ruby 3.4+, PostgreSQL 16+
- React 19 + Vite 8, MUI controls, Lucide icons
- Rails Minitest and Vitest/React Testing Library

## Run locally

Use two terminals from the repository root. PostgreSQL must be running and your local PostgreSQL role must be allowed to create databases.

```sh
cd backend
bin/rails db:prepare
bin/rails db:seed
bin/rails server -p 3000
```

```sh
cd frontend
npm install
npm run dev -- --host 0.0.0.0
```

Open the Vite URL printed in the frontend terminal (normally `http://localhost:5173`). Vite proxies `/api` requests to Rails on port 3000. The seed script replaces employee rows with exactly 10,000 deterministic demo records; it refuses to run in production.

## Checks

```sh
cd backend && bin/rails test
cd frontend && npm test && npm run lint && npm run build
```

## API

- `GET /api/dashboard` returns organization totals, department headcount, and average annual base salary grouped by currency.
- `GET /api/employees` accepts `search`, `country`, `department`, `level`, `salary_currency`, `page`, `per_page`, `sort`, and `direction`.
- `GET /api/employees/:id` reads a single record.
- `POST /api/employees` creates a record; `PATCH /api/employees/:id` updates it. Both accept an `employee` JSON object and return field-level validation errors.

`salary_cents` is an integer amount in the smallest unit for the supported two-decimal currencies. Summary amounts are never combined across currencies.

## Demo safety

This is an unauthenticated local assessment demo. The seed data is fictional, but the application must not be connected to real employee salary data until identity, authorization, audit history, secure deployment, and operational controls are designed and implemented.