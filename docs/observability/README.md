# Observability Artifacts

This directory contains ready-to-apply assets for the Prisma persistence rollout.

- `grafana-dashboard.json` — Import into Grafana to visualize orchestrator success rate, rollbacks, portal latency (p95), and settings update outcomes. The dashboard expects a Prometheus data source with UID `PROM_DS`.
- `prometheus-rules.yaml` — Prometheus alerting rules for rollback spikes, latency degradation, secure settings failures, and signal absence. Route alerts to PagerDuty according to severity levels described in `docs/integration-plan.md`.

## Deployment Steps

1. **Grafana**
   - Navigate to *Dashboards → Import*.
   - Upload `grafana-dashboard.json` and select the Prometheus datasource.
   - Tag the dashboard with `marfanet` to align with the rollout runbook.

2. **Prometheus**
   - Place `prometheus-rules.yaml` into your alerting rules directory (e.g., `/etc/prometheus/rules`).
   - Reload Prometheus (`kill -HUP <pid>` or `promtool` hot reload) to activate.
   - Ensure Alertmanager routes `severity=critical` to PagerDuty, `severity=warning` to PagerDuty (Warning), and `severity=info` to Slack `#marfanet-rollout`.

3. **Validation**
   - Trigger synthetic orchestrator actions (`scripts/experiments/da-02.ts`) and verify metrics appear under `/api/internal/metrics`.
   - Confirm Grafana panels display data and alerts remain green.

These assets complete Phase 9 observability prerequisites prior to Stage 0 dark launch.
