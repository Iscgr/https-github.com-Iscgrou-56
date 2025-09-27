# Prisma Persistence Layer Blueprint

## 1. Architectural Overview

- **Client factory**: `src/lib/persistence/prisma.ts` exports a lazily instantiated `PrismaClient` with connection reuse for serverless/dev.
- **Unit of Work (UoW)**: `src/lib/persistence/unit-of-work.ts` exposes `withUnitOfWork(context, callback)` wrapping `prisma.$transaction` and propagating audit metadata.
- **Repositories** (per bounded context):
  - `AgentRepository`
  - `InvoiceRepository`
  - `PaymentRepository`
  - `WalletRepository`
  - `NotificationRepository`
  - `SettingsRepository`
  - `CommissionRepository`
  - `AuditLogRepository`
  - `UsageIngestionRepository` (Processed hashes)
- **Domain services** interact with repositories only through the UoW, enforcing atomicity and context-aware logging.

## 2. Repository Contracts

| Repository | Key Methods | Notes |
|------------|-------------|-------|
| AgentRepository | `findById(id)`, `findByCode(code)`, `listSummaries(filter)`, `upsert(agent)`, `attachPartner(agentId, partnerId)`, `updateStatus(id, status)`, `listForPortal()` | Uses Prisma `agent`, `agentFinancialSummary`, `portalAppearance`. Summaries served from read model. |
| InvoiceRepository | `findById(id)`, `listByAgent(agentId)`, `listOverdue(today)`, `appendStatusChange(invoiceId, toStatus, actor, notes)`, `updateStatus(invoiceId, status)`, `createInvoice(data, {idempotencyKey?, metadata})`, `createBatch(data)`, `recordItems(invoiceId, items)` | Handles invoice lifecycle, ensures status history appended before status mutation. |
| PaymentRepository | `recordPayment(data)`, `listByAgent(agentId)`, `linkWalletTransaction(paymentId, walletTxnId)`, `findUnappliedForAgent(agentId)` | Payment writes always inside wallet UoW. |
| WalletRepository | `getOrCreate(agentId)`, `lock(walletId)`, `adjustBalance(walletId, delta)`, `recordTransaction(data)`, `listTransactions(agentId)`, `updateLastTransaction(walletId, timestamp)` | `lock` implemented via `prisma.wallet.update` optimistic concurrency (version field). |
| NotificationRepository | `logSend(invoiceId, type, status, error?)`, `findRecent(invoiceId, type, since)` | Supports cron idempotency. |
| SettingsRepository | `get(key)`, `list()`, `update(key, value, actor)`, `seedDefaults(defaults)` | Writes append audit log entry and bump version. |
| CommissionRepository | `createDraft(reportData)`, `applyAdjustments(reportId, adjustmentIds)`, `finalize(reportId, actor)`, `markPaid(reportId)`, `listAdjustments(agentId, status)` | Ensures finalized reports immutable and adjustments tied via foreign keys. |
| AuditLogRepository | `append(entry)` | Stores `AuditLog` rows; invoked by services for append-only trail. |
| UsageIngestionRepository | `markProcessed(hash)`, `isProcessed(hash)`, `pruneOlderThan(date)` | Prevents duplicate ingestion. |

## 3. Transaction Boundaries

1. **Wallet deposit + settlement** (`FinancialOrchestrator.processPayment`): orchestrates wallet balance update, transaction log, invoice status transitions, and audit entries inside a shared `$transaction`, reverting all steps on failure.
2. **Invoice status change** (`InvoiceService.changeStatus`): wraps status history insert, invoice update, audit log entry.
3. **Settings update** (`SettingsService.updateSetting`): `SystemSetting` update + `SettingsAuditLog` insert + audit log + optional notification event recorded.
4. **Commission finalization**: marks report finalized, re-links adjustments, appends audit log.
5. **Importer batch processing**: each invoice creation executed in dedicated UoW to guarantee idempotency and consistent writes across `Invoice`, `InvoiceItem`, `InvoiceBatch`, `ProcessedUsageHash`.

## 4. Audit Context Propagation

- `withAuditContext` continues to provide `AsyncLocalStorage` actor. UoW decorator reads actor and requires presence before mutating state.
- Every repository method that mutates writes to `AuditLog` via `AuditLogRepository.append` with `entityType`, `entityId`, `action`, `payload`, `correlationId` from UoW context.

## 5. Idempotency Strategies

- Invoice creation uses composite unique constraint `(agentId, invoiceNumber)` and optional `InvoiceBatch.idempotencyKey` to detect duplicates.
- Wallet transactions enforce unique `paymentId` references through Prisma unique constraint.
- Notifications store `(invoiceId, type)` index with timestamp check to short-circuit duplicates.
- Processed hash table ensures importer skip duplicates across runs.

## 6. Migration Gaps & Schema Notes

- Schema already includes required columns (email, phone, telegramChatId) to satisfy UI, but TypeScript types currently outdated. Phase 6 plan replaces custom types with Prisma-derived DTOs and retires legacy mock fields.
- Additional computed fields for agent summaries come from `AgentFinancialSummary`; schedule nightly rebuild job plus on-demand recalculation hook after payment settlement.
- Introduce wallet transaction version column to support optimistic locking in the new orchestrator.

## 7. Testing Strategy

- Replace `audit-trail.test.ts` with integration tests seeded via Prisma test transaction (using SQLite/`prisma test` env or local Postgres). Each test runs in isolated transaction rolled back after completion.
- Add orchestrator tests for wallet partial settlements ensuring invoice status transitions to `PARTIAL` when remaining balance exists and audit log payload redaction persists.
- Verify settings update increments version, creates audit record, and publishes masked notification payload when admin alerts enabled.

## 8. Rollback & Observability

- UoW ensures atomic rollback on any thrown error; repository mutators must avoid side effects outside DB writes.
- Expose structured logging around UoW boundaries to trace correlation IDs and surface orchestrator compensation steps.
- Provide script `npm run db:seed` to pre-populate partners, agents, and sample data for local dev and tests; align seeds with Prisma-first UI rollout.

---
This blueprint now reflects the Phase 6 solution selection (Prisma-first realignment with orchestrator). Use it as the baseline for Phase 7 change vectors and sandbox verification.
