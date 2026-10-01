# Architecture and Trade-offs

## Request path

```mermaid
flowchart LR
  HR[HR manager] --> UI[React workspace]
  UI -->|JSON over Vite /api proxy| API[Rails API]
  API --> DB[(PostgreSQL)]
  DB --> API
  API --> UI
```

The React client and Rails API are separate applications. The Vite proxy keeps local development same-origin from the browser's perspective; production routing and CORS policy are intentionally deployment concerns rather than open CORS in this demo.

## Data and API boundaries

- `employees` stores current profile details and annual base salary as `salary_cents` plus an explicit ISO currency code. The first release accepts AUD, CAD, EUR, GBP, SGD, and USD, all with two minor-unit digits.
- PostgreSQL enforces required columns, a case-insensitive unique email index, and indexes common exact filters. Rails validates and normalizes values and returns field-level errors.
- Directory filters, sorting, and bounded pagination run in PostgreSQL. Page size defaults to 20 and is capped at 100; `id` is a stable secondary sort key.
- Search matches name, work email, and job title. At the 10,000-row target, PostgreSQL can evaluate this contains-search without extra extension dependencies. If data volume grows materially, measure it and consider a `pg_trgm` index.
- Dashboard averages and headcounts are grouped in SQL by currency or department. No exchange-rate conversion or cross-currency sum is exposed.
- The seed uses a fixed PRNG seed, fixed timestamps, stable email keys, 1,000-row bulk inserts, and resets the identity sequence. Re-running it replaces the local demo dataset.

## Scale and product trade-offs

10,000 records is modest for PostgreSQL, but it is enough to make loading every salary into a browser the wrong default. Server pagination bounds responses and table rendering; DB-side grouping avoids downloading the whole table for summaries. Filter indexes help the structured queries. The contains-search remains a scan by design at this target size, avoiding an extension that would complicate setup.

The demo edits the current salary in place. Historical compensation, approvals, imports/exports, payroll, and currency conversion are excluded because their retention, jurisdiction, and policy rules need product decisions. The required first-release scope and exclusions are recorded in [REQUIREMENTS.md](../REQUIREMENTS.md).

## Security boundary

There is no authentication or authorization. The UI's private-data note is not an access control. Treat this as a local fake-data demo only; before production, require SSO, least-privilege authorization, audit trails for salary changes and reads, encrypted transport/storage, secrets management, backups, and privacy-reviewed retention/export controls.