# Phase 4 Discriminators Catalog

Each discriminator represents a unique observable signal needed to distinguish among the Phase 3 hypotheses. Signals are grouped by primary perspective; cross-layer impacts are noted where applicable.

## Technical Perspective

| Discriminator ID | Target Hypotheses | Signal Description | Observation Method | Expected Outcomes |
| --- | --- | --- | --- | --- |
| DT-01 | T-01 | Verify whether removing manual `PageProps` typings eliminates `.next/types` errors. | Create minimal branch removing exported `type Props` definitions from the three route files and rerun `npx tsc --noEmit`. | Pass: errors vanish → supports T-01. Fail: errors persist → refute or reduce confidence. |
| DT-02 | T-02 | Detect whether dynamic import boundary for Prisma runtime resolves `node:*` bundler errors. | Wrap Prisma client usage in `if (!process.env.NEXT_RUNTIME)` guard or `dynamic(() => import(...))` and run `next build`. | Success: build passes → supports T-02. Failure: errors remain → investigate alternative cause. |
| DT-03 | T-03 | Confirm Prisma `InputJsonValue` constraint by focusing on audit log payload structure. | Implement typed payload serializer using `Prisma.JsonObject`; run `npx tsc --noEmit`. | Typecheck pass validates hypothesis; failure implies additional constraints. |
| DT-04 | T-04 | Determine if swapping mock data references with repository endpoints eliminates enum/type drift. | Temporarily disable legacy arrays in `data.ts`, wire `InvoiceService` to repository stub, run tests/tsc. | Resolution supports T-04; persistent errors indicate deeper schema misalignment. |

## Architectural Perspective

| Discriminator ID | Target Hypotheses | Signal Description | Observation Method | Expected Outcomes |
| --- | --- | --- | --- | --- |
| DA-01 | A-01, X-01 | Check for active usage of Unit of Work repositories during server actions. | Instrument `withUnitOfWork` to log invocations; execute representative server action via integration test. | Logging absent → supports A-01; present → reduces hypothesis confidence. |
| DA-02 | A-02, B-04, X-03 | Validate presence of transactional wrapper around wallet settlement + payment. | Inspect implementation by forcing simulated failure inside settlement; observe DB or mock state. | Atomic rollback proves hypothesis false; partial updates prove true. |
| DA-03 | A-03, D-03 | Evaluate need for secure settings storage by attempting to inject encrypted value and observing read flow. | Implement mock crypto provider; update setting; verify audit trail structure. | Successful secure roundtrip refutes hypothesis; inability confirms. |

## Data-Flow Perspective

| Discriminator ID | Target Hypotheses | Signal Description | Observation Method | Expected Outcomes |
| --- | --- | --- | --- | --- |
| DD-01 | D-01, X-01 | Determine whether UI bindings accept uppercase enum values once data originates from Prisma. | Seed Prisma with invoice using uppercase status; render dashboard page via integration test. | Correct display supports migration; mismatch indicates UI normalization required. |
| DD-02 | D-02 | Test whether extending `Agent` schema with contact/avatar fields resolves portal crash. | Scaffold migration adding fields and update Prisma type; run portal page. | Success resolves D-02; failure hints at additional client assumptions. |
| DD-03 | D-03, T-03 | Inspect serialization path for settings payload from service to audit log. | Trigger settings update and inspect persisted JSON. | Structured JSON verifies fix requirement. |

## Cross-Layer Perspective

| Discriminator ID | Target Hypotheses | Signal Description | Observation Method | Expected Outcomes |
| --- | --- | --- | --- | --- |
| DX-01 | X-01, T-04 | Measure integration readiness by running combined Prisma-backed smoke test replacing mocks. | Execute scripted scenario covering invoice creation, status change, and UI fetch with Prisma data. | Full success indicates readiness and reduces multiple hypotheses. |
| DX-02 | X-02 | Trace audit trail event pipeline from service invocation to persistence. | Enable verbose logging and trigger invoice status change; validate audit log row with payload. | Missing events support X-02; complete trail reduces confidence. |
| DX-03 | X-03 | Evaluate duplicate ingestion handling under idempotency key collisions. | Reprocess identical invoice batch with pseudo idempotency key; check for duplicates or conflicts. | Duplicates support need for idempotency implementation; rejection refutes. |

## Discriminator Coverage Summary

- Technical (DT-01 → DT-04) cover all T-series hypotheses. 
- Architectural (DA-01 → DA-03) align with A-series and intersecting cross-layer hypotheses.
- Data-Flow (DD-01 → DD-03) address UI/schema alignment and audit payload shape.
- Cross-layer (DX-01 → DX-03) ensure multi-component interaction is testable.

Collectively these 13 discriminators provide unique evidence paths for every hypothesis recorded in Phase 3.
