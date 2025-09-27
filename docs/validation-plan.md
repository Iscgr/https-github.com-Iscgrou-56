# Phase 8 – Multi-Dimensional Validation Plan

This plan governs validation for the Prisma-first persistence rollout and associated service refactors.

## 8A. Functional Validation

| Check | Scope | Tooling | Pass Criteria |
| --- | --- | --- | --- |
| Unit regression | Repository methods, `FinancialOrchestrator`, secure settings provider | Vitest + Prisma test transaction harness | All unit suites green; coverage of happy path and failure injection. |
| API contract tests | `/api/agents`, `/api/agent-summaries`, `/api/portal` | Supertest (Next.js route handler invocation) | JSON schemas match published DTOs; responses tolerate missing optional fields. |
| UI smoke tests | Dashboard lists, portal page SSR, settings form | Playwright (headless) with seeded DB | Critical pages render without client errors; regression snapshots approved. |

## 8B. Performance Validation

| Check | Scope | Tooling | Pass Criteria |
| --- | --- | --- | --- |
| Prisma query latency | Agent summary + portal aggregates | `autocannon` hitting REST endpoints; Prisma query logs | P95 < 120 ms in staging sample; no N+1 queries detected. |
| Transaction throughput | Payment settlement orchestrator | Synthetic load script invoking settlement (10 rps for 1 minute) | Zero failed transactions; DB contention < 5% (monitor via pg_stat_activity). |

## 8C. Security Validation

| Check | Scope | Tooling | Pass Criteria |
| --- | --- | --- | --- |
| Secret management | Vault/KMS integration for `SETTINGS_SECRET` | Manual rotation drill + automated smoke test | Rotation updates environment without service restart; audit log records masked values only. |
| Audit trail integrity | Repository audit entries | SQL assertions + structured log inspection | Each mutating service produces corresponding `AuditLog` row with correlation ID. |
| Sensitive data masking | Settings notifications + exports | Integration test verifying redaction | No plaintext secrets appear in console logs or notifications. |

## 8D. Architectural Conformance Validation

| Check | Scope | Tooling | Pass Criteria |
| --- | --- | --- | --- |
| Dependency boundaries | Ensure UI only consumes `data-access` helpers | Import lint rule (`eslint-plugin-boundaries`) | Zero boundary violations. |
| UoW coverage | Verify mutating services use `withUnitOfWork` | Static scan (`ts-prune` custom rule) + targeted tests | All write paths exercised inside orchestrator/UoW. |

## 8E. Long-Run Stability Validation

| Check | Scope | Tooling | Pass Criteria |
| --- | --- | --- | --- |
| Cron/job resilience | Commission recalculation & summary rebuild jobs | Staging cron dry-run + monitoring logs | Jobs succeed 3 consecutive runs; rollbacks succeed when forced error injected. |
| Portal uptime | Monitor public portal endpoints | Synthetic ping (Grafana Cloud / UptimeRobot) | 99.5% availability during canary week. |

## Validation Workflow

1. **Pre-merge**: Functional unit + integration tests automated in CI; manual Playwright run for key flows.
2. **Staging gate**: Execute performance and security checks in staging environment; capture metrics in evidence log.
3. **Production canary**: Enable feature flags for 5% of traffic; monitor observability dashboards for 48 hours.
4. **Post-deployment audit**: Review audit logs, metrics, and incident tracker; update `evidence-log.md` with validation outcomes.

## Exit Criteria

- All checks above marked PASS with recorded evidence.
- No SEV-1/2 incidents in canary window.
- Stakeholders sign off on validation report (attach to `docs/evidence-log.md`).
