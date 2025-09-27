# Phase 7 – Implementation Task Breakdown

This breakdown operationalizes the change vector into concrete engineering activities with suggested sequencing and ownership placeholders.

## Legend
- **Owner**: To be assigned (placeholder initials provided).
- **Deps**: Identifies prerequisite tasks.
- **Artifacts**: Expected outputs (PRs, scripts, docs).

## Workstream A – Persistence Foundations

| Task ID | Description | Owner | Deps | Artifacts |
| --- | --- | --- | --- | --- |
| A1 | Refine Prisma client singleton and UnitOfWork instrumentation (structured logging, correlation IDs) | TBD-A | — | Updated `src/lib/persistence/prisma.ts`, `unit-of-work.ts`; log schema |
| A2 | Introduce `FinancialOrchestrator` domain service wrapping payment + wallet flows | TBD-B | A1 | `src/lib/financial-orchestrator.ts` (new), updated services/tests |
| A3 | Add optimistic locking fields (version) to wallet transaction schema/migrations | TBD-A | A1 | Prisma migration, updated `WalletRepository` |
| A4 | Implement secure settings key provider (Vault/KMS integration) | TBD-C | A1 | `src/lib/security/secure-settings.ts`, infrastructure config |

## Workstream B – Repository & Data Access Layer

| Task ID | Description | Owner | Deps | Artifacts |
| --- | --- | --- | --- | --- |
| B1 | Finalize read-model repositories (Agents, AgentFinancialSummary, Payments, PortalAppearance) | TBD-A | A1 | Repository files, updated types |
| B2 | Finalize write-model repositories with audit hooks (Invoice, Payment, Wallet, Settings, Commission, Notification) | TBD-B | A1 | Repository files, audit coverage |
| B3 | Create `data-access` module exporting typed server helpers + REST endpoints | TBD-D | B1, B2 | `src/lib/data-access.ts`, API route handlers |
| B4 | Remove legacy mock exports; introduce feature flag adapter for transitional routes | TBD-D | B3 | Updated modules, feature flag wiring |

## Workstream C – Application Layer & UI Integration

| Task ID | Description | Owner | Deps | Artifacts |
| --- | --- | --- | --- | --- |
| C1 | Refactor dashboard server components to consume `data-access` helpers | TBD-E | B3 | Updated `src/app/(dashboard)/**` files |
| C2 | Update portal pages and API routes to Prisma-backed data | TBD-E | B3 | Updated `src/app/portal/[agentId]/page.tsx`, API handlers |
| C3 | Wire feature flags (`PERSISTENCE_PRISMA_READS`, `PORTAL_PRISMA`, `FINANCIAL_ORCHESTRATOR`) into config and runtime | TBD-F | B4 | Flag definitions, environment docs |
| C4 | Retire temporary adapters once Stage 4 completed | TBD-F | C1–C3, validation | Code cleanup PR |

## Workstream D – Testing & Tooling

| Task ID | Description | Owner | Deps | Artifacts |
| --- | --- | --- | --- | --- |
| D1 | Build Prisma-integrated test harness (Vitest config, transaction wrapper) | TBD-G | A1 | `vitest.config.ts`, helpers |
| D2 | Rewrite `audit-trail.test.ts` using Prisma seeds and orchestrator flows | TBD-G | D1, A2 | Updated test suite |
| D3 | Add integration tests for settings encryption + notification masking | TBD-C | D1, A4 | New test files |
| D4 | Seed script for local dev/tests with minimal data set | TBD-G | B1 | `prisma/seed.ts`, npm script |

## Workstream E – Rollout & Operations

| Task ID | Description | Owner | Deps | Artifacts |
| --- | --- | --- | --- | --- |
| E1 | Implement feature flag toggles in deployment pipeline | TBD-H | C3 | CI/CD config updates |
| E2 | Configure observability dashboards + alerts per integration plan | TBD-I | Validation plan complete | Grafana dashboards, alert rules |
| E3 | Execute canary rollout checklist and document outcomes | TBD-H | Validation pass | Runbook updates, checklists |

## Sequencing Notes
- Workstream A precedes most other activities; begin with persistence foundation.
- Workstream B and C can proceed in parallel once repositories available, with coordination on feature flags.
- Testing (Workstream D) should start early (D1/D4) to support Workstream A/B deliverables.
- Rollout tasks (Workstream E) align with validation/integration plans and require coordination with operations.

## Staffing & Timeline (Draft)
- **Week 1**: A1–A4, B1 kickoff, D1/D4 groundwork.
- **Week 2**: A2/A3 finalization, B2/B3, C1 partial, D2.
- **Week 3**: C2/C3, B4 adapter cleanup, D3, validation dry runs.
- **Week 4**: E1–E3 execution, remove flags post-monitoring (C4).

_Note_: Owners/estimates to be finalized in sprint planning; this document serves as the initial task ledger.
