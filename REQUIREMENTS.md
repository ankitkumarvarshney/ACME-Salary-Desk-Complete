# ACME Salary Desk: Requirements

## Goal
Give ACME's HR manager one reliable web workspace to find, understand, and maintain salary data for 10,000 employees across countries. Replace spreadsheet-led lookup and comparison with structured, searchable records and explainable summaries.

## User and primary jobs
The primary user is an authorized HR manager. They need to find an employee quickly, review pay alongside role and location, compare compensation across teams or countries, and correct an employee's current salary without losing track of the update.

## First-release scope
- An employee directory with server-side search, filters (country, department, level), stable pagination, and useful employee totals.
- Employee records with name, work email, country, department, job title, level, currency, and annual base salary.
- Create and edit employee details with validation; salary must be non-negative and currency must be explicit.
- A compensation overview with employee count, average salary by currency, and department-level counts. Never aggregate unlike currencies into one amount.
- Seed data for 10,000 deterministic, plausible employee records for local evaluation.
- Responsive React interface backed by a Rails JSON API and PostgreSQL; automated tests for validation, filtering/pagination, and summary calculations.

## Deliberately out of scope
- Payroll runs, payslips, tax, benefits, bonuses, equity, and integrations with HRIS or banking systems: they require jurisdiction-specific rules and operational controls beyond this data-management exercise.
- Authentication, role administration, and production authorization: a real deployment must add SSO, least-privilege access, and audit-grade identity controls before exposing salary data. The local demo is not safe for real employee information.
- Historical salary changes and approval workflows: valuable for governance, but they need an agreed effective-date and approval model; this release edits the current record only.
- Currency conversion and global pay-equity conclusions: exchange rates and normalized compensation methodology are not specified. Summaries remain separated by currency and are descriptive, not policy recommendations.
- CSV import/export and advanced reporting: spreadsheet migration and bespoke reporting need explicit field mapping, privacy, and export controls; the initial workflow establishes a validated source of truth first.

## Product and engineering decisions
- Store annual base pay as integer minor units (for example, cents) with an ISO currency code; do not use floating-point money or infer currency from country.
- Use PostgreSQL indexes for the common directory filters and a bounded API page size so a 10,000-row dataset does not become a 10,000-row browser payload.
- Keep the API and interface separable, with clear validation errors and deterministic seed data. Keep summaries currency-aware and their arithmetic covered by tests.

## Acceptance checks
An evaluator can start the app locally, seed exactly 10,000 employees, search and filter the directory without loading the full dataset, inspect a record, create or edit a valid employee, see invalid input rejected, and verify currency-separated overview metrics. Core behavior is covered by fast, deterministic automated tests.