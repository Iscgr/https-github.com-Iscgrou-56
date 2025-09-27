# Phase 6 – Solution Space Exploration

## 6A. Design Pattern Analysis

### Root-Cause Clusters Recap
- **C1 – Presentation/Type Contracts (T-01, T-02)**
- **C2 – Legacy Mocks & Data Drift (T-04, D-01, D-02, X-01)**
- **C3 – Transactional Integrity (A-02, X-03)**
- **C4 – Secure Settings Governance (A-03, D-03)**

### Candidate Patterns Considered
- Repository + Unit-of-Work consolidation
- Domain service orchestration with compensating transactions
- API boundary enforcement via BFF layer
- Centralized secret management + key rotation
- Data synchronization adapters for incremental migration

## 6B. Solution Alternatives

### Alternative A – “Prisma-First Realignment”
**Summary**: Fully embrace Prisma as system-of-record across all layers with immediate retirement of mock data and direct alignment of UI components.

| Layer | Changes |
| --- | --- |
| Presentation | Refactor dashboard/portal components to use server actions and typed REST endpoints backed by Prisma data; remove mock imports. |
| Application | Expand API routes to provide normalized payloads, enforcing `PageProps` contracts via shared DTOs. |
| Business Logic | Consolidate wallet/payment operations inside a `FinancialOrchestrator` service that wraps `$transaction` and uses Prisma decimal math. |
| Domain | Introduce rich domain objects (e.g., `InvoiceAggregate`) to encapsulate validation; map them via Prisma. |
| Infrastructure | Deploy Prisma migrations, add managed Postgres with read replica, integrate Vault-based SETTINGS_SECRET, run `prisma migrate deploy` in CI. |

**Pros**
- Rapid deprecation of legacy mocks; single source of truth.
- Simplifies testing by using Prisma stubs across board.
- Aligns with existing Unit-of-Work instrumentation.

**Cons**
- Larger upfront refactor touching all UI routes simultaneously.
- Requires production-grade DB access available during deployment.
- Higher regression risk without complete automated test suite.

### Alternative B – “Adapter-Led Transition”
**Summary**: Introduce an adapter layer that mediates between legacy mocks and Prisma, allowing incremental migration while delivering transactional and security fixes.

| Layer | Changes |
| --- | --- |
| Presentation | Consume a new `/api/portal` BFF endpoint that normalizes casing; adapter synthesizes data from Prisma + legacy arrays until parity achieved. |
| Application | Implement `DataBridgeService` translating mock contracts into Prisma queries; gradually phase out mock fields. |
| Business Logic | Layer compensating transaction handlers that enqueue rollback jobs (outbox pattern) to restore wallet state on failure. |
| Domain | Maintain existing DTOs, but annotate with deprecation metadata; rely on adapter for shape translation. |
| Infrastructure | Introduce message queue (e.g., BullMQ) for outbox jobs; integrate AWS KMS-managed key for secure settings without full Vault migration yet. |

**Pros**
- Lower immediate UI churn; allows staged rollout per module.
- Provides safety via compensating transactions before full refactor.
- Easier to ship in slices with feature flags.

**Cons**
- Extends lifespan of legacy mocks, risking added complexity.
- Adapter layer becomes technical debt if not removed promptly.
- Requires queue infrastructure to support outbox.

## 6C. Cross-Cutting Concern Analysis

| Concern | Alternative A | Alternative B |
| --- | --- | --- |
| Observability | Prisma instrumentation + audit log schema alignment; add OpenTelemetry spans on server actions. | Enrich adapter logging; monitor queue latency and dead-letter counts. |
| Security | Immediate Vault integration for secrets; rotate keys with Terraform. | Short-term KMS usage + periodic rotation scripts; eventual Vault migration deferred. |
| Testing | Replace mocks with seeded Prisma database + FAKE_PRISMA for deterministic tests. | Maintain dual-path tests validating adapter translation; add integration tests for outbox jobs. |
| Deployment | Requires schema migration coordination; possibly blue/green. | Introduces queue deployment plus adapter config toggles; smaller DB changes. |
| Performance | Direct Prisma queries with caching; potential to use read replicas. | Adapter adds overhead; queue processing delays eventual consistency. |

## 6D. Architectural Impact Evaluation

- **Alternative A** impacts all layers concurrently; relies on strong coordination but simplifies long-term maintenance by eliminating duplicated data sources. High initial effort, long-term operational simplicity.
- **Alternative B** limits immediate changes to presentation/business logic but introduces additional infrastructure (queue) and transitional complexity. Suitable when operations demand gradual rollout.

## 6E. Solution Selection & Justification

**Chosen Strategy: Hybrid Adoption on Alternative A Track with Adapter Safety Net**
- Core track follows Alternative A to eliminate mocks, enforce Prisma-first design, and harden transactions using `$transaction` and domain services.
- Selected safety elements from Alternative B (e.g., optional adapter/feature flags) will be used temporarily for high-risk routes to minimize downtime.

**Key Justifications**
1. Evidence from Phase 5 shows data layer already consistent (DD-01/02), making full Prisma transition feasible without adapter translation for most fields.
2. Transactional deficiency (DA-02) demands immediate `$transaction` adoption; Alternative A addresses this natively.
3. Secure settings improvements require stronger key governance; integrating Vault/Terraform aligns with long-term compliance goals.
4. Feature flags derived from Alternative B allow incremental rollout without committing to permanent adapter complexity.

## Next Actions (Phase 7 Preview)
1. Define change vectors for wallet/payment transaction refactor and secure settings key management.
2. Plan mock retirement sequence: identify modules, remove legacy imports, update tests with Prisma seeds.
3. Prepare infrastructure IaC updates (Vault secret provisioning, Prisma migrations).