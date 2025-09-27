# Failure to Checklist Mapping

This artifact correlates current automated diagnostics with the audit checklist items.

## TypeScript Diagnostics (2025-XX-XX)

| Failure Source | Diagnostic Summary | Related Audit Issues | Notes |
| --- | --- | --- | --- |
| `.next/types/app/(dashboard)/agents/[agentId]/page.ts` | Next.js generated types reject manual PageProps typings (params/searchParams typed as plain objects). | New | Generated `PageProps` now expects a promise-based shape; no matching checklist entry. Requires phase tracking. |
| `.next/types/app/(dashboard)/payments/page.ts` | Same PageProps mismatch for dashboard payments page. | New | Align with Next.js App Router typing expectations. |
| `.next/types/app/portal/[agentId]/page.ts` | Same PageProps mismatch for portal agent page. | New | Must remove manual types in route files. |
| `src/lib/audit-trail.test.ts` | Missing Vitest types, lowercase invoice statuses, numeric/Date values that violate domain types, undefined services, wallet history mismatches. | B-01, B-02, D-02, D-03 | Test tries to exercise business logic but mocks diverge from schema and services are not wired. Indicates broader audit trail/data integrity issues. |
| `src/lib/data.ts` (lines 362-365) | Mock invoice uses lowercase status literal and Decimal/Date objects incompatible with declared `Invoice` interface. | D-02 | Confirms mock data divergence. |
| `src/lib/invoice-service.ts` | Local `InvoiceStatus` string union conflicts with Prisma enum; sample history uses lowercase statuses. | B-01, B-02 | Business logic relying on in-memory history and outdated enum definitions. |
| `src/lib/persistence/repositories/base.ts` | Audit log payload typed as generic record, violating Prisma `InputJsonValue` requirement. | New | Checklist lacks explicit item; categorize as infrastructure typing gap. |

## Build (Next.js) Diagnostics

| Failure Source | Diagnostic Summary | Related Audit Issues | Notes |
| --- | --- | --- | --- |
| `next build` Webpack | Importing `node:async_hooks`, `node:child_process`, etc., from Prisma runtime within Next.js build causes `ERR_UNSUPPORTED_NODE_IMPORT`. | I-02 | Running Prisma client in edge/serverless bundler without Node polyfills; indicates runtime architecture misalignment with persistence approach. |

## Observations

- Existing checklist items largely cover domain/business/persistence mismatches surfaced by `tsc`.
- Three new gaps identified (PageProps typings, audit log payload typing, Prisma runtime bundling) to be added to checklist for full coverage.
- Diagnostics reinforce need to replace legacy mock data with Prisma-backed repositories and align enums/types.
