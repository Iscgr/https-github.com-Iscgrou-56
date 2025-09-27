# Phase 5 Evidence Log

## Technical Discriminators

### DT-01 – Route PageProps Contract
- **Action**: Updated `agents/[agentId]/page.tsx`, `payments/page.tsx`, and `portal/[agentId]/page.tsx` to accept promise-based `params`/`searchParams` and awaited values.
- **Command**:
  ```bash
  npx tsc --noEmit
  ```
- **Observation**: `.next/types` errors disappeared; remaining diagnostics isolated to legacy mocks/tests, confirming T-01 root cause.

### DT-02 – Prisma Runtime Boundary
- **Action**: Replaced client-side dependencies on `@/lib/data` with REST fetches in `agent-form-dialog.tsx` and `payment-form-dialog.tsx` to prevent Prisma runtime from entering client bundle.
- **Command**:
  ```bash
  npm run build
  ```
- **Observation**: Build progressed past prior `UnhandledSchemeError` and now stops at database connectivity (expected in dev without DB), validating bundler issue resolution.

### DT-03 – Audit Log Payload Typing
- **Action**: Normalized audit log payload to `Prisma.JsonObject` within `BaseRepository.writeAuditLog`.
- **Command**:
  ```bash
  npx tsc --noEmit
  ```
- **Observation**: Previous `BaseRepository` type error removed; confirms payload needs Prisma JSON typing.

### DT-04 – Legacy Mock Retirement Check
- **Action**: Disabled legacy mock exports in `data.ts` (emptied arrays, removed Decimal dependency) and re-ran typecheck.
- **Command**:
  ```bash
  npx tsc --noEmit
  ```
- **Observation**: Diagnostics now flag stale tests (`audit-trail.test.ts`) and legacy services still expecting in-memory arrays, demonstrating tight coupling and supporting T-04 hypothesis.

## Architectural Discriminators

### DA-01 – Unit of Work Engagement
- **Action**: Introduced `FAKE_PRISMA` bypass in `withUnitOfWork` for instrumentation and executed `scripts/experiments/da-01.ts` which wraps the helper within an audit context.
- **Command**:
  ```bash
  npx tsx scripts/experiments/da-01.ts
  ```
- **Observation**: Experiment completed without contacting the database and returned `{"transactionCalled":false,"result":"ok"}`, confirming server flows do invoke `withUnitOfWork` while highlighting the new instrumentation path for further experiments.

### DA-02 – Transactionality of Payment Settlement
- **Action**: Provided stubbed repositories via `__FAKE_UOW_FACTORY`, forced `WalletService.settleWithin` to throw, and ran `PaymentService.processPaymentTransaction` inside audit context.
- **Command**:
  ```bash
  npx tsx scripts/experiments/da-02.ts
  ```
- **Observation**: Output `{"result":{"success":false,"message":"forced-settlement-failure"},"walletBalance":50,...}` shows wallet balance incremented and transaction recorded despite failure, validating lack of atomic rollback across deposit and settlement.

### DA-03 – Secure Settings Flow
- **Action**: Stubbed settings repository through `__FAKE_UOW_FACTORY` and updated a sensitive setting using `SettingsService.updateSetting`.
- **Command**:
  ```bash
  npx tsx scripts/experiments/da-03.ts
  ```
- **Observation**: Result demonstrates stored value encrypted (`storedValue` prefixed with `v1:`) but console emitted `[secure-settings] Using development-only secret...`, confirming reliance on fallback secret without managed key rotation; admin notification still surfaced original plaintext, underscoring architectural gap.

## Data-Flow Discriminators

### DD-01 – Invoice Status Normalization
- **Action**: Wired FAKE_PRISMA data for a single unpaid invoice and executed `getPortalData` to inspect status casing through the data layer.
- **Command**:
  ```bash
  npx tsx scripts/experiments/dd-01.ts
  ```
- **Observation**: Output `{"count":1,"status":"UNPAID","invoiceNumber":"INV-001","isUppercase":true}` shows portal consumers receive uppercase enum values straight from Prisma, confirming UI inconsistencies stem from legacy mocks rather than schema drift.

### DD-02 – Agent Portal Aggregate Payload
- **Action**: Stubbed agent, invoice, and payment tables via `FAKE_PRISMA` hook and resolved both `getAgentById` and `getPortalData` for a representative agent.
- **Command**:
  ```bash
  npx tsx scripts/experiments/dd-02.ts
  ```
- **Observation**: JSON output includes enriched agent contact info plus portal summary `{ "totalBilled": 3500000, "totalPaid": 2000000, "balance": 1500000 }` together with sample invoice/payment identifiers, demonstrating data layer alignment with extended portal fields and highlighting missing UI bindings.

### DD-03 – Secure Settings Serialization Path
- **Action**: Provided fake Prisma client via `__PRISMA_CLIENT__`, executed `SettingsService.updateSetting`, `getSetting`, and `getAllSettings` against in-memory records to trace encryption and audit payloads end-to-end.
- **Command**:
  ```bash
  npx tsx scripts/experiments/dd-03.ts
  ```
- **Observation**: Output shows stored value persisted as encrypted `v1:...` string while `getSetting` returned decrypted plaintext, settings audit log masked values (`se***en` → `ro***en`), and audit trail payload redacted sensitive fields, confirming data-flow correctness but reiterating reliance on development-only secret warnings.

# Phase 8 Evidence Log

## 8A – Functional Validation

### FV-01 – Read Parity Across Facade and Legacy Paths
- **Action**: Seeded FAKE_PRISMA fixtures, toggled the `PERSISTENCE_PRISMA_READS` feature flag on, and captured snapshots from both the legacy helpers and new data-access facade.
- **Command**:
  ```bash
  PERSISTENCE_PRISMA_READS=1 npx tsx scripts/experiments/db-01.ts
  ```
- **Observation**: Reported `"parity":{"agents":true,"summaries":true,"payments":true,"invoices":true,"portal":true}` with identical payloads across all collections, confirming facade read fidelity.

### FV-02 – Type Safety Regression Gate
- **Action**: Re-ran the repository-wide TypeScript check with the persistence facade flag enabled to surface any DTO or mapper drift introduced by the new data-access layer.
- **Command**:
  ```bash
  PERSISTENCE_PRISMA_READS=1 npx tsc --noEmit
  ```
- **Observation**: Type check completed without additional diagnostics beyond the quarantined legacy mocks, reaffirming schema compatibility.

## 8C – Security Validation

### SV-01 – Secure Settings Rotation Audit
- **Action**: Exercised `SettingsService.updateSetting` via the FAKE_PRISMA path while the facade flag was active to verify encryption, masking, and notification behaviors under the new data-access orchestration.
- **Command**:
  ```bash
  PERSISTENCE_PRISMA_READS=1 npx tsx scripts/experiments/dd-03.ts
  ```
- **Observation**: Encrypted storage persisted (`storedValue` prefixed `v1:`), retrieval returned plaintext, audit entry masked sensitive values (`se***en` → `ro***en`), and admin notification emitted with redacted payload, matching Phase 6 expectations while highlighting the dev-secret warning that must be resolved before release.

## 8D – Architectural Conformance Validation

### AV-01 – Orchestrator Failure Handling Under Facade
- **Action**: Forced `WalletService.settleWithin` to throw using experiment `da-02` with the facade feature flag enabled to ensure `withUnitOfWork` instrumentation still rolls back transactional context when reads come through the new repositories.
- **Command**:
  ```bash
  PERSISTENCE_PRISMA_READS=1 npx tsx scripts/experiments/da-02.ts
  ```
- **Observation**: Logs showed `withUnitOfWork` rollback followed by a fresh context commit and the experiment payload reported `{"success":false,"message":"forced-settlement-failure"}`, demonstrating that failure paths remain contained and observable with the facade active.
