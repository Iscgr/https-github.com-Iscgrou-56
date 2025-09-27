# Phase 3 Hypothesis Registry

This registry enumerates candidate root causes across multiple perspectives. Confidence values represent prior probability before discriminative testing.

## Technical Perspective

| Hypothesis ID | Statement | Evidence | Related Issues | Confidence |
| --- | --- | --- | --- | --- |
| T-01 | Next.js route files manually type `params`/`searchParams` and violate generated `PageProps` contract, breaking typecheck and risking runtime serialization bugs. | `npx tsc --noEmit` errors in `.next/types/...` files. | New (add to checklist) | 0.6 |
| T-02 | Prisma client usage within Next.js build relies on Node.js-only `node:*` modules, causing build failure unless execution stays server-only with dynamic import. | Historical `next build` failure. | I-02 | 0.7 |
| T-03 | Audit logging payload typing mismatch arises from using plain `Record<string, unknown>` instead of Prisma `InputJsonValue`, preventing audit log persistence. | `tsc` error in `BaseRepository`. | New | 0.65 |
| T-04 | Legacy mock data and services (invoice-service, wallet-service) still referenced by tests and UI, preventing transition to Prisma-backed repos and causing enum/type drift. | Multiple `tsc` errors in `audit-trail.test.ts`, `data.ts`. | D-02, B-01, B-02 | 0.75 |

## Architectural Perspective

| Hypothesis ID | Statement | Evidence | Related Issues | Confidence |
| --- | --- | --- | --- | --- |
| A-01 | Application layer still oriented around in-memory repositories rather than unit-of-work with Prisma, leaving auditability and persistence incomplete. | Checklist I-02; tests referencing arrays. | B-02, I-02 | 0.7 |
| A-02 | Lacking transactional boundary between wallet settlements and payments due to incomplete repository orchestration, leading to inconsistent states under failure. | Checklist B-04; absence of Prisma transaction usage. | B-04 | 0.6 |
| A-03 | Settings service bypasses dedicated security infrastructure (encryption/logging), requiring architectural decision on secure storage provider. | Checklist I-03; absence of crypto modules. | I-03 | 0.55 |

## Data-Flow Perspective

| Hypothesis ID | Statement | Evidence | Related Issues | Confidence |
| --- | --- | --- | --- | --- |
| D-01 | UI expects `invoiceNumber` and `referenceNumber` fields that are absent from Prisma schema/mocks, causing broken data flow between persistence and presentation. | Checklist P-02, B-03; schema review. | P-02, B-03, D-02 | 0.8 |
| D-01 | UI expects `invoiceNumber` and `referenceNumber` fields that are absent from Prisma schema/mocks, causing broken data flow between persistence and presentation. | Checklist P-02, B-03; schema review; **DD-01** showed Prisma-sourced invoices deliver uppercase status and expected identifiers, indicating the remaining gap is legacy mock consumers. | P-02, B-03, D-02 | 0.4 |
| D-02 | Agent portal needs contact/avatar fields missing from Agent schema, causing portal rendering failures. | Checklist P-01; schema review (Agent lacks contact fields); **DD-02** produced enriched agent payload (email/phone/avatar) from data layer, implying UI binding/portal fetch is at fault rather than schema. | P-01, D-02 | 0.35 |
| D-03 | Settings audit payloads require structured JSON but are stored as plaintext strings, limiting observability and rollback. | Checklist I-03; repository audit log type mismatch; **DD-03** confirmed encrypted persistence plus masked audit entries, reducing likelihood of plaintext storage but highlighting key-management warnings. | I-03 | 0.25 |

## Cross-Layer Interaction Hypotheses

| Hypothesis ID | Statement | Evidence | Related Issues | Confidence |
| --- | --- | --- | --- | --- |
| X-01 | Without aligning Prisma schema, generated types, and UI components, migrating from mock data to persistence will continue failing (e.g., uppercase enums vs lowercase UI), blocking multiple layers simultaneously. | `tsc` errors for status literals; UI badges expecting lowercase; **DD-01/DD-02** demonstrate Prisma data already normalized, so misalignment now isolated to presentation layer expectations. | P-04, D-02, B-02 | 0.5 |
| X-02 | Audit trail deficiencies stem from both infrastructure (missing persistence) and business logic (services not invoking repositories), causing tests to fail and compliance risk. | `audit-trail.test.ts` failures; absence of repository wiring. | B-02, I-02 | 0.65 |
| X-03 | Lack of idempotency in invoice ingestion affects application (server action), business logic (settlement), and persistence (duplicate records), leading to inconsistent financial aggregates. | Checklist A-03, A-04, I-01; review of `createIdempotentInvoice`. | A-03, A-04, I-01 | 0.6 |

## Relationship Mapping

- `T-04`, `A-01`, and `X-01` describe the intertwined need to retire legacy mock data in favor of Prisma-backed repositories.
- `T-03` and `D-03` link through audit log serialization; fixing payload typing supports secure settings logging.
- `A-02`, `B-04`, and `X-03` converge on transactional integrity of payment workflows.
- Newly identified gaps (`T-01`, `T-03`) should be appended to the audit checklist for future tracking.
