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
export HR_ADMIN_EMAIL=hr@example.com
export HR_ADMIN_PASSWORD='use-a-unique-password-at-least-12-characters'
bin/rails db:prepare
bin/rails db:seed
bin/rails server -p 3000
```

```sh
cd frontend
npm install
npm run dev -- --host 0.0.0.0
```

Open the Vite URL printed in the frontend terminal (normally `http://localhost:5173`). The configured HR account is the initial administrator. Other users can request access from the sign-in screen, but remain blocked until an administrator approves them. Vite proxies `/api` requests to Rails on port 3000. The seed script replaces employee rows with exactly 10,000 deterministic demo records; it refuses to run in production. It creates or refreshes the initial administrator only when both environment variables are set.

For an existing database, create the initial administrator without reseeding employees:

```sh
cd backend
bin/rails runner 'User.create!(name: "HR Administrator", email: ENV.fetch("HR_ADMIN_EMAIL"), password: ENV.fetch("HR_ADMIN_PASSWORD"), status: "approved", admin: true)'
```

## Checks

```sh
cd backend && bin/rails test
cd frontend && npm test && npm run lint && npm run build
```

## API

- `POST /api/session` accepts `email` and `password`; `GET /api/session` returns the current user; `DELETE /api/session` logs out. All employee and dashboard routes require an authenticated session.
- `POST /api/registration` accepts `name`, `email`, and `password` and creates a pending account request without issuing a session.
- `GET /api/admin/access-requests` lists pending requests; `PATCH /api/admin/access-requests/:id/approve` and `/reject` are administrator-only and require the CSRF nonce.
- `GET /api/dashboard` returns organization totals, department headcount, and average annual base salary grouped by currency.
- `GET /api/employees` accepts `search`, `country`, `department`, `level`, `salary_currency`, `page`, `per_page`, `sort`, and `direction`.
- `GET /api/employees/:id` reads a single record.
- `POST /api/employees` creates a record; `PATCH /api/employees/:id` updates it. Both accept an `employee` JSON object and return field-level validation errors.

`salary_cents` is an integer amount in the smallest unit for the supported two-decimal currencies. Summary amounts are never combined across currencies.

## Authentication and demo safety

The API signs 15-minute HS256 JWTs with Rails' secret key and stores them only in `HttpOnly`, `SameSite=Strict` cookies (also `Secure` in production). Mutating requests require a separate CSRF nonce. Passwords are bcrypt hashes, public registration creates pending accounts, and only an administrator can approve or reject them. Approval is checked on login and every protected API request. Login and registration are rate limited, and logout revokes existing tokens. Never use a checked-in/default password; supply deployment secrets through a secret manager.

`HttpOnly` prevents application JavaScript from reading the authentication token; it cannot hide a token from the browser owner inspecting their own network traffic or cookie storage. Use HTTPS in production. This assessment app still needs production identity controls such as SSO/MFA, role-based least privilege, login throttling, audit trails, key rotation, and security monitoring before handling real salary data. Seed data is fictional and seeding is disabled in production.