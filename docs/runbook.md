# Prisma Persistence Rollout Runbook

## 0. Current Status
- **Date**: 2025-09-26
- **Phase**: 9 – Staged Integration (Initiated)
- **Stage**: Pre-Stage enablement in progress (instrumentation tasks P1–P5 outstanding)
- **Progress Signals**: Phase 8 validated (see `docs/evidence-log.md`), integration gates defined (`docs/integration-plan.md`), task decomposition available (`docs/phase-9-task-breakdown.md`).

## 1. Overview
- **Scope**: Rollout of Prisma-first persistence, FinancialOrchestrator, secure settings provider, and legacy mock retirement.
- **Feature Flags**: `PERSISTENCE_PRISMA_READS`, `FINANCIAL_ORCHESTRATOR`, `PORTAL_PRISMA`, `SETTINGS_SECURE_PROVIDER`.
- **Related Plans**: `docs/validation-plan.md`, `docs/integration-plan.md`.

## 2. Pre-Rollout Checklist
1. ✅ All validation checks in Phase 8 plan marked PASS with evidence logged.
2. ✅ Database migrations applied in staging and production standbys.
3. ✅ Vault/KMS credentials verified; fallback secrets rotated.
4. ✅ Observability dashboards and alerts deployed (see `docs/observability/` assets and Integration Plan §9B).
5. 🟡 On-call engineer briefed; communication channels (Slack #marfanet-rollout) to be reactivated prior to Stage 0 toggle.
6. ✅ Canary dataset seeded in production (agents/payments baseline).

## 3. Rollout Procedure

### Stage 0 – Dark Launch
- Deploy code (flags default OFF).
- Validate background telemetry: check Grafana dashboards for metrics ingestion.
- Confirm audit logs still populating via legacy path.

### Stage 1 – Enable Prisma Reads (Internal)
- Set `PERSISTENCE_PRISMA_READS=true` for admin cohort using feature flag service.
- Run dashboard smoke tests (Playwright script `npm run test:smoke -- --scope dashboard`).
- Monitor for 30 minutes; if errors >0.5%, revert flag.

### Stage 2 – Activate Financial Orchestrator
- Enable `FINANCIAL_ORCHESTRATOR=true`; keep legacy settlement fallback toggled on.
- Execute synthetic payment settlement via `scripts/experiments/settlement-canary.ts`.
- Watch rollback counter metric (`financial_orchestrator_rollback_total`).
- After 2 hours with no critical errors, disable fallback to confirm orchestrator handles traffic.

### Stage 3 – Portal Migration
- Toggle `PORTAL_PRISMA=true` for 10% of agents.
- Run portal smoke tests; verify API latency < 200ms.
- Gradually increase to 100% if error rate < 1% over 24 hours.

### Stage 4 – Secure Settings Provider
- Set `SETTINGS_SECURE_PROVIDER=true`.
- Perform manual settings update; confirm admin notification redacts values.
- If warning about fallback secret appears, halt rollout and investigate Vault connectivity.

### Stage 5 – Flag Cleanup
- Once stability confirmed (see §5), remove legacy adapters in codebase and disable all feature flags permanently.

## 4. Rollback Procedures

| Scenario | Trigger | Action |
| --- | --- | --- |
| Dashboard errors spike (>1% 5xx) | Prisma read layer failure | Set `PERSISTENCE_PRISMA_READS=false`; purge Cloudflare cache; investigate repository logs. |
| Settlement inconsistencies detected | Non-zero rollback metric, audit mismatch | Toggle `FINANCIAL_ORCHESTRATOR=false`, enable legacy settlement path; export incident ticket; review orchestrator logs. |
| Portal outage | >2% portal 5xx or latency > 2s | Set `PORTAL_PRISMA=false`; run health check; notify comms channel. |
| Secret provider failure | Vault/KMS auth errors | Set `SETTINGS_SECURE_PROVIDER=false`; rotate fallback secret; escalate to security. |

Rollback must be executed within 5 minutes of trigger detection. Document each event in incident tracker with timeline and resolution notes.

## 5. Monitoring & Alerting
- **Metrics**: Prisma query latency, orchestrator rollback count, portal SLA, audit log ingestion rate, Vault error count.
- **Alerts**:
  - Critical: rollback count > 3 in 10 minutes (PagerDuty P1).
  - Warning: portal SLA < 99% over 30 minutes (PagerDuty P2).
  - Info: secret provider fallback triggered (Slack notification).
- **Dashboards**: Grafana board `Prisma Rollout` (link TBD) with real-time flag state overlay.

## 6. Communication Protocol
- Stage transitions announced in Slack with timestamp and responsible engineer.
- Incident escalation path: On-call engineer → Tech Lead → Engineering Manager.
- End-of-day summary posted with metrics snapshot and outstanding issues.

## 7. Post-Rollout Actions
1. Confirm all feature flags disabled and code references removed.
2. Archive metrics and validation evidence in `docs/evidence-log.md`.
3. Conduct mini-retrospective (30 minutes) to capture lessons learned for ATOMOS Phase 10.
4. Update runbook with any deviations observed during rollout.

---
**Document Owner**: To be assigned (suggest Ops TL).

_Last updated: 2025-09-26._
