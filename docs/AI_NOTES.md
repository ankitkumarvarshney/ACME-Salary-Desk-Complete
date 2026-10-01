# AI-Assisted Build Notes

## Working prompt

The implementation followed the assessment request to first define a one-page scope, then build an end-to-end Rails/PostgreSQL and React salary-management workflow for an HR manager, seed 10,000 employees, add deterministic tests, and preserve the reasoning in versioned artifacts.

## How AI was used

- Used GitHub Copilot in the workspace to scaffold Rails and Vite, draft the requirements and architecture artifacts, implement the API and interface, and add test cases.
- Kept the first implementation slice small enough to validate the database schema and API tests before building the UI.
- Treated generated code as a draft: ran Rails tests, Vitest, ESLint, and the production Vite build; corrected the linted effect-state update, a currency display expectation, and a stale page-size assertion.
- Added regression coverage for currency-separated averages and for search terms combined with exact country filters, where SQL boolean grouping can otherwise produce incorrect matches.

## Decisions made during implementation

- Kept API and UI as independent apps with a Vite development proxy rather than adding a production CORS policy.
- Chose server-side search/filter/sort/pagination and bounded page size to avoid returning all salary records to the browser.
- Chose integer minor units, a deliberately small currency set, and no conversion so summary arithmetic stays explicit and testable.
- Deferred authentication, salary history, payroll, and imports; these are recorded as explicit requirements exclusions and the demo is labeled unsafe for real salary data.