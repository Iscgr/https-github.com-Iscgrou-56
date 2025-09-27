# Phase 7.B — Change Vector Formalization

## Targeted Modules

1. **Infrastructure Layer**
   - `src/lib/persistence/prisma.ts`
   - `src/lib/persistence/unit-of-work.ts`
   - `src/lib/persistence/repositories/*.ts`
2. **Domain Services**
   - `src/lib/invoice-service.ts`
   - `src/lib/wallet-service.ts`
   - `src/lib/payment-service.ts`
   - `src/lib/cron-service.ts`
   - `src/lib/settings-service.ts`
   - `src/lib/commission-service.ts`
3. **Application Layer & Server Actions**
   - `src/lib/data-access.ts` (new abstraction replacing `data.ts`)
   - `src/app/(dashboard)/**` data loaders
   - `src/app/portal/[agentId]/page.tsx`
4. **Testing & Tooling**
   - `src/lib/audit-trail.test.ts`
   - `package.json` scripts (`db:seed`, `test:integration`)
   - `prisma/seed.ts` (new)

## Execution Order

1. Bootstrap persistence utilities (Prisma client singleton + UnitOfWork).
2. Introduce `FinancialOrchestrator` domain service coordinating wallet/payment transactions inside `withUnitOfWork`.
3. Implement read-model repositories required for UI hydration (Agents, AgentFinancialSummary, Invoices, Payments, PortalAppearance).
4. Implement write-model repositories used by services (Invoice, Payment, Wallet, Settings, Commission, Notification, AuditLog, ProcessedUsageHash) with optimistic locking and audit hooks.
5. Replace `src/lib/data.ts` with typed accessors backed by repositories (including server component helpers) and expose REST endpoints for client islands.
6. Update application pages and actions to use new accessors; add feature flags to toggle between Prisma-first path and temporary adapter for high-risk routes.
7. Implement secure settings key-provider integration (Vault/KMS) and update `SettingsService` notifications to respect redaction.
8. Create database seed to ensure local dev has minimal data for rendering and to power integration tests.
9. Rewrite Vitest integration suites to operate against Prisma transaction harness.
10. Remove legacy mocks and types, align all `import` statements accordingly; delete feature flag once parity verified.

## Safeguards & Rollback

- Each step gated behind `withUnitOfWork` wrapper to guarantee transactionality.
- Feature flags (`PERSISTENCE_ADAPTER_MODE`) allow rolling back portal/dashboards to legacy adapters without redeploying.
- Rollback path: switch repository factory to return mocked adapters pointing to in-memory arrays for emergency fallback (kept in branch until cutover). Orchestrator can revert to existing `PaymentService` path if needed.

## Dependencies & Assumptions

- PostgreSQL service available on `DATABASE_URL` with Vault-provided credentials.
- Prisma migrations applied (`npx prisma migrate dev`).
- Audit context is always set when calling mutating services; reads can operate without actor.
- Queue infrastructure (BullMQ/Redis) optional for deferred compensations if feature flags enable adapter fallback.

This change vector aligns with the Phase 6 solution selection and defines the implementation blueprint for Phase 7.C onward.
