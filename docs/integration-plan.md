# Phase 9 – Staged Integration Plan

This plan defines the rollout strategy for the Prisma-first persistence changes.

## 9A. Integration Vector Planning

| Stage | Scope | Feature Flags | Duration |
| --- | --- | --- | --- |
| Stage 0 | Dark launch of new repositories and orchestrator behind feature flags | `PERSISTENCE_PRISMA_READS`, `FINANCIAL_ORCHESTRATOR` | 1 day |
| Stage 1 | Enable Prisma-backed reads for internal dashboards | `PERSISTENCE_PRISMA_READS=true` for admin users | 2 days |
| Stage 2 | Activate orchestrator for settlement flows, maintain legacy fallback | `FINANCIAL_ORCHESTRATOR` + fallback toggle | 3 days |
| Stage 3 | Switch portal endpoints to Prisma data, retire adapter | `PORTAL_PRISMA=true` | 2 days |
| Stage 4 | Remove legacy mocks and disable fallback flags | All flags off | 1 day |

### Stage Gate Criteria

- **Stage 0 → 1**
  - Deployment completed with all flags defaulting to false.
  - Telemetry smoke test confirms metrics/traces arriving in staging dashboard within 5 minutes.
  - No new ERROR-level logs from repositories when facade is dark launched.
- **Stage 1 → 2**
  - Dashboard Playwright smoke (`npm run test:smoke -- --scope dashboard`) passes twice across 30 minute window.
  - Prisma read latency (P95) < 120 ms and API 5xx < 0.5% for admin cohort.
  - Rollback ready: `PERSISTENCE_PRISMA_READS` kill-switch verified in flag console.
- **Stage 2 → 3**
  - Synthetic settlement (`scripts/experiments/settlement-canary.ts`) succeeds 5 times consecutively.
  - `financial_orchestrator_rollback_total` counter remains 0 for 2 hours.
  - Audit log parity spot-check (legacy vs facade) shows no divergence.
- **Stage 3 → 4**
  - Portal latency < 200 ms P95 and error rate < 1% over 24 hours with staged agent cohorts.
  - Support desk reports no spike in ticket volume tied to portal issues.
  - Feature flag revert path validated for staged cohorts.
- **Stage 4 Completion**
  - All flags disabled; legacy adapters removed from production deployment manifest.
  - Watch window (7 days) under thresholds: failed transactions < 1%, portal SLA ≥ 99.5%, Vault errors = 0.

## 9B. Observability Instrumentation

- ✅ **Metrics (Implemented 2025-09-26)**: Prometheus counters/gauges exposed via `/api/internal/metrics` (`prom-client` registry, orchestrator/settings hooks).
- ✅ **Tracing (Implemented 2025-09-26)**: OpenTelemetry spans wrap `withUnitOfWork` and `FinancialOrchestrator`, enriching events with correlation IDs and actors.
- ✅ **Logs (Implemented 2025-09-26)**: Structured logger now emits `rolloutStage` and `flagState` metadata alongside correlation IDs.
- ✅ **Dashboards (Implemented 2025-09-27)**: `docs/observability/grafana-dashboard.json` contains importable panels for orchestrator success, rollbacks, portal latency, and settings outcomes.
- ✅ **Alert Wiring (Implemented 2025-09-27)**: `docs/observability/prometheus-rules.yaml` delivers Prometheus alert definitions for PagerDuty/Slack routing.

### Dashboard & Alert Specifications

- **Grafana Panels**
  - *Orchestrator Success Rate*: `rate(financial_orchestrator_payments_total{status="success"}[5m]) / rate(financial_orchestrator_payments_total[5m])` with threshold annotation at 0.99.
  - *Orchestrator Rollbacks*: `increase(financial_orchestrator_rollbacks_total[5m])` plotted as bar chart with flag state overlays.
  - *Settings Updates Outcomes*: stacked area of `rate(settings_updates_total{result!="noop"}[15m])` by result to monitor failures.
  - *Portal Latency Histogram*: heatmap from `histogram_quantile(0.95, sum by (le)(rate(portal_response_duration_seconds_bucket{route="portal/[agentId]"}[5m])))`.
  - *Feature Flag Snapshot*: table panel reading from Loki/ELK logs filtering `flagState` field to validate toggle distribution.
- **Alert Rules**
  - *P1 – Orchestrator Rollback Spike*: `increase(financial_orchestrator_rollbacks_total[10m]) > 3` → PagerDuty Critical.
  - *P2 – Portal SLA Dip*: `histogram_quantile(0.95, sum by (le)(rate(portal_response_duration_seconds_bucket[10m]))) > 0.2` OR `increase(financial_orchestrator_payments_total{status="failure"}[15m]) > 5` → PagerDuty Warning.
  - *P3 – Settings Update Failures*: `increase(settings_updates_total{result="failure"}[30m]) > 0` → Slack notification for security follow-up.
  - *Heartbeat*: `absent(financial_orchestrator_payments_total[5m])` → Info-level alert to detect stalled ingestion.

## 9C. Rollout Strategy Execution

1. Deploy code with flags default OFF.
2. Execute Stage 0 smoke tests; ensure metrics/traces flowing.
3. Sequentially enable each stage in staging, then production, with automated synthetic checks before progressing.
4. At each stage, update runbook with findings and sign-off from engineering + ops.

## 9D. Watch Window Monitoring

- Duration: 7 days post Stage 4.
- Monitored Signals: rollback count, Prisma error rate, API 5xx, portal SLA, audit log ingestion.
- Alert Thresholds: >1% failed transactions triggers automatic rollback to previous stage.

## 9E. Stability Confirmation

- After watch window, archive metrics snapshots and validation reports.
- Remove feature flag code paths and delete fallback adapter modules.
- Conduct post-mortem style review to document lessons learned for ATOMOS Phase 10.

## Communication Plan

- Daily Slack updates during rollout stages.
- Stakeholder summary at completion with links to validation artifacts and dashboards.
- Incident escalation path defined in runbook (`docs/runbook.md` TBD).
