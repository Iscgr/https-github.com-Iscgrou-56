# Phase 4 Evidence Collection Plan

This plan operationalizes each discriminator with concrete experiments, tooling, and data capture steps.

## Technical Experiments

### DT-01 – Route PageProps Contract
- **Prerequisites**: Create Git branch `experiment/dt-01-pageprops`. Ensure Next.js cache cleared (`rm -rf .next`).
- **Steps**:
  1. Remove or adjust manual `type Props` exports and the function signatures using them in the affected route files (`agents/[agentId]/page.tsx`, `payments/page.tsx`, `portal/[agentId]/page.tsx`).
  2. Run `npx tsc --noEmit`.
- **Data Capture**: Collect TypeScript output before/after change; diff route files.
- **Decision Rule**: If `.next/types/...` errors disappear, mark T-01 true.

### DT-02 – Prisma Runtime Boundary
- **Prerequisites**: Ensure Prisma client generated; set `NEXT_RUNTIME` env for server build scenario.
- **Steps**:
  1. Wrap Prisma client import in lazy factory inside persistence layer (e.g., `const prisma = globalThis...` pattern) or use `dynamic` import for Next components.
  2. Run `next build` with `NODE_OPTIONS="--trace-warnings"` for diagnostics.
- **Data Capture**: Build logs, stack traces.
- **Decision Rule**: Successful build confirms T-02.

### DT-03 – Audit Log Payload Typing
- **Prerequisites**: Access to Prisma type definitions; ability to modify `BaseRepository`.
- **Steps**:
  1. Replace payload typing with `Prisma.JsonObject`.
  2. Insert serialization helper ensuring no prototype pollution.
  3. Run `npx tsc --noEmit` and targeted unit tests once available.
- **Data Capture**: Typecheck output; repository diff.
- **Decision Rule**: Passing typecheck indicates T-03 validity.

### DT-04 – Mock Data Retirement Check
- **Prerequisites**: Feature flag to toggle between mock arrays and repositories.
- **Steps**:
  1. Disable legacy arrays in `data.ts` behind flag; ensure repositories supply data.
  2. Run `npx tsc --noEmit` and any relevant tests (`npm test -- audit-trail`).
- **Data Capture**: Error delta; runtime logs.
- **Decision Rule**: If errors disappear, hypothesis T-04 supported.

## Architectural Experiments

### DA-01 – Unit of Work Engagement
- **Prerequisites**: Logging capability inside `withUnitOfWork` (structured logger recommended).
- **Steps**:
  1. Add temporary instrumentation capturing call stack and action name.
  2. Trigger `saveAgentAction` via integration test or simulated request.
- **Data Capture**: Log entries correlating action -> repository usage.
- **Decision Rule**: Missing logs confirm A-01.

### DA-02 – Transactionality of Payment Settlement
- **Prerequisites**: Ability to run Prisma transaction or stub.
- **Steps**:
  1. Inject failure after wallet debit but before invoice settlement.
  2. Verify wallet balance and invoice status post-operation.
- **Data Capture**: Database snapshot before/after; logs.
- **Decision Rule**: Inconsistent state validates A-02/B-04.

### DA-03 – Secure Settings Flow
- **Prerequisites**: Mock crypto provider implementation; instrumentation of settings audit log.
- **Steps**:
  1. Introduce encrypted value update path.
  2. Trigger `updateSetting` action; inspect persisted record.
- **Data Capture**: Audit log row; decrypted value retrieval.
- **Decision Rule**: If plaintext persists, A-03 stands.

## Data-Flow Experiments

### DD-01 – Enum Normalization in UI
- **Prerequisites**: Seed Prisma with uppercase statuses using migration/seed script.
- **Steps**:
  1. Run dashboard invoice page SSR/ISR.
  2. Snapshot rendered badge text and styling.
- **Data Capture**: DOM snapshot, API response.
- **Decision Rule**: Correct display means UI handles uppercase; mismatch indicates transformation needed.

### DD-02 – Agent Contact Fields
- **Prerequisites**: Migration adding `contactPhone`, `contactEmail`, `avatarUrl` to `Agent`.
- **Steps**:
  1. Apply migration in dev DB.
  2. Update Prisma client and rerun portal agent page.
- **Data Capture**: Page render logs, runtime errors.
- **Decision Rule**: Successful render confirms D-02 fix path.

### DD-03 – Settings Payload Serialization
- **Prerequisites**: Access to audit log table; ability to trigger settings updates.
- **Steps**:
  1. Update sensitive setting with nested JSON payload.
  2. Query `SettingsAuditLog` for the corresponding entry.
- **Data Capture**: Stored JSON structure.
- **Decision Rule**: Structured payload supports D-03/T-03 hypotheses.

## Cross-Layer Experiments

### DX-01 – Prisma-backed Smoke Test
- **Prerequisites**: Seed data covering invoices, payments, agents; test harness hitting API/UI.
- **Steps**:
  1. Orchestrate scenario: create invoice, change status, fetch via dashboard.
  2. Ensure no mock data fallback triggered (logs/assertions).
- **Data Capture**: End-to-end logs, UI snapshots.
- **Decision Rule**: Seamless flow validates readiness; failures signal interplay issues.

### DX-02 – Audit Trail Pipeline
- **Prerequisites**: Logging at each pipeline step (service, repository, Prisma).
- **Steps**:
  1. Trigger `InvoiceService.changeStatus` in controlled environment.
  2. Inspect audit log entry, status history, wallet transaction references.
- **Data Capture**: Log chain, DB entries.
- **Decision Rule**: Missing link supports X-02.

### DX-03 – Idempotent Invoice Ingestion
- **Prerequisites**: Ability to rerun upload action with identical payload; environment isolating duplicates.
- **Steps**:
  1. Execute `uploadInvoicesAction` twice with same batch.
  2. Inspect invoice table for duplicates; review audit logs.
- **Data Capture**: Counts before/after; audit entries.
- **Decision Rule**: Duplicates support X-03; rejection indicates functioning idempotency.

## Tooling & Environment Considerations
- **Testing Stack**: Prefer Vitest once dependencies installed; leverage Prisma test database with transactional rollbacks.
- **Observability**: Use structured logging (JSON) to simplify correlation across layers.
- **Isolation**: Each experiment should run on clean DB snapshot; automate via migration reset script.
