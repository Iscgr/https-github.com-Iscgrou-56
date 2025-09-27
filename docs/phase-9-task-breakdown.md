# Phase 9 – Staged Integration Task Breakdown

This breakdown translates the Phase 9 integration plan into actionable engineering and operations tasks aligned with feature-flag stages.

## Legend
- **Owner**: Placeholder initials (assign during rollout readiness review).
- **Deps**: Immediate prerequisites before starting the task.
- **Artifacts**: Expected deliverables (PRs, dashboards, playbooks).

## Pre-Stage Enablement (Instrumentation & Tooling)

| Task ID | Description | Owner | Deps | Artifacts |
| --- | --- | --- | --- | --- |
| P1 | Implement Prometheus metrics exporter (`prom-client`) with `/api/internal/metrics` route | TBD-I | Validation evidence complete | Metrics module, deployment config |
| P2 | Add OpenTelemetry spans to `withUnitOfWork` & `FinancialOrchestrator` (trace IDs, correlation metadata) | TBD-I | P1 | Updated TypeScript modules, tracing config |
| P3 | Ship structured logs (`stage`, `actor`, `flagState`) to ELK pipeline; ensure log retention policy updated | TBD-O | P1 | Log shipper config, dashboard notes |
| P4 | Create Grafana dashboard panels for settlement success rate, Prisma latency, portal SLA overlaying flag states | TBD-O | P1 | Grafana board link, README snippet |
| P5 | Configure Prometheus alert rules and PagerDuty routing (P1 rollback spike, P2 portal SLA dip, P3 Vault fallback) | TBD-N | P1, P4 | Alert rule manifests, PagerDuty services |

## Stage Execution Tasks

| Stage | Task ID | Description | Owner | Deps | Success Criteria |
| --- | --- | --- | --- | --- | --- |
| Stage 0 | S0-1 | Deploy facade + orchestrator code with all flags OFF; validate telemetry ingestion | TBD-A | P1–P5 | Metrics/traces visible within 5 minutes; no new ERROR logs |
| Stage 1 | S1-1 | Enable `PERSISTENCE_PRISMA_READS` for admin cohort via flag service | TBD-B | S0-1 | Playwright smoke passes twice; latency P95 < 120 ms |
| Stage 1 | S1-2 | Monitor admin session dashboards, capture Grafana snapshot | TBD-O | S1-1 | Grafana snapshot archived; 5xx < 0.5% |
| Stage 2 | S2-1 | Toggle `FINANCIAL_ORCHESTRATOR`; run `settlement-canary` script every 15 minutes for 2 hours | TBD-A | S1-1 | Synthetic settlements all succeed; rollback counter stays 0 |
| Stage 2 | S2-2 | Validate audit log parity sample (legacy vs facade) | TBD-C | S2-1 | Spot-check diff yields parity |
| Stage 3 | S3-1 | Ramp `PORTAL_PRISMA` to 10%, 50%, 100% cohorts with 24h observation | TBD-B | S2-1 | Error rate < 1%, latency < 200 ms |
| Stage 3 | S3-2 | Coordinate support desk comms & capture user feedback | TBD-E | S3-1 | No increase in portal-related tickets |
| Stage 4 | S4-1 | Disable fallback flags, remove legacy adapter deployments | TBD-A | S3-1 | Infra manifests updated; smoke suite green |
| Stage 4 | S4-2 | Initiate 7-day watch window automation (alert thresholds + daily summaries) | TBD-O | S4-1 | Daily summaries posted; alerts remain quiet |

## Contingency & Rollback Actions

| Scenario | Trigger | Immediate Action | Follow-up |
| --- | --- | --- | --- |
| Prisma read regression | Dashboard 5xx > 1% or latency breach | Flip `PERSISTENCE_PRISMA_READS=false`, flush cache | Inspect repo logs, run parity diff tool |
| Orchestrator rollback spike | `financial_orchestrator_rollback_total > 0` in 10 mins | Toggle `FINANCIAL_ORCHESTRATOR=false`, re-enable legacy settlement | Export incident report, diff audit entries |
| Portal outage | Portal SLA < 99% or latency > 2s | Set `PORTAL_PRISMA=false`, restore adapter | Notify support channel, analyze Grafana panel |
| Secret provider fault | Vault/KMS failure detected | `SETTINGS_SECURE_PROVIDER=false`, rotate fallback secret | Engage security; document mitigation in runbook |

## Communication & Documentation Cadence
- Stage entry/exit notes posted to Slack `#marfanet-rollout` with timestamps and owning engineer.
- Daily summary doc appended to `docs/runbook.md` §6 during active rollout.
- Metrics snapshots and incident tickets archived in `docs/evidence-log.md` upon Stage 4 completion.
- Post-watch-window retrospective feeds Phase 10 learning artifacts.

---
_This document will be updated as owners commit to timelines and tooling deliverables are merged._

## Status Update – 2025-09-27
- ✅ P1 metrics exporter available via `/api/internal/metrics`; orchestrator/settings counters wired.
- ✅ P2 tracing spans instrument `withUnitOfWork` and `FinancialOrchestrator` with correlation metadata.
- ✅ P3 structured logs include `rolloutStage` and live feature flag snapshots; ready for ELK shipping.
- ✅ P4 Grafana dashboards prepared (`docs/observability/grafana-dashboard.json`) and ready for import.
- ✅ P5 alert routing rules published (`docs/observability/prometheus-rules.yaml`) for Prometheus/Alertmanager deployment.
