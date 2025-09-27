import { Counter, Histogram, Registry, collectDefaultMetrics } from 'prom-client';

type PaymentStatus = 'success' | 'failure';
type SettingsUpdateResult = 'success' | 'failure' | 'noop';

type MetricsBundle = {
  registry: Registry;
  counters: {
    orchestratorPayments: Counter<string>;
    orchestratorRollbacks: Counter<string>;
    settingsUpdates: Counter<string>;
  };
  histograms: {
    portalResponse: Histogram<string>;
  };
};

declare global {
  // eslint-disable-next-line no-var
  var __APP_METRICS__: MetricsBundle | undefined;
}

function createMetricsBundle(): MetricsBundle {
  const registry = new Registry();
  collectDefaultMetrics({ register: registry });

  const orchestratorPayments = new Counter({
    name: 'financial_orchestrator_payments_total',
    help: 'Count of FinancialOrchestrator payment processing attempts grouped by status.',
    labelNames: ['status'],
    registers: [registry],
  });

  const orchestratorRollbacks = new Counter({
    name: 'financial_orchestrator_rollbacks_total',
    help: 'Count of orchestrator rollback compensation executions.',
    registers: [registry],
  });

  const settingsUpdates = new Counter({
    name: 'settings_updates_total',
    help: 'Count of SettingsService.updateSetting invocations grouped by outcome.',
    labelNames: ['result'],
    registers: [registry],
  });

  const portalResponse = new Histogram({
    name: 'portal_response_duration_seconds',
    help: 'Duration of portal request handling in seconds.',
    buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5],
    labelNames: ['route'],
    registers: [registry],
  });

  return {
    registry,
    counters: {
      orchestratorPayments,
      orchestratorRollbacks,
      settingsUpdates,
    },
    histograms: {
      portalResponse,
    },
  } satisfies MetricsBundle;
}

const metrics = (globalThis.__APP_METRICS__ ??= createMetricsBundle());

const STATUS_SUCCESS: PaymentStatus = 'success';
const STATUS_FAILURE: PaymentStatus = 'failure';

/**
 * Record the outcome of a FinancialOrchestrator payment execution.
 */
export function recordOrchestratorPayment(status: PaymentStatus) {
  metrics.counters.orchestratorPayments.labels(status).inc();
}

/**
 * Record that a compensation/rollback path executed within the orchestrator.
 */
export function recordOrchestratorRollback() {
  metrics.counters.orchestratorRollbacks.inc();
}

/**
 * Record the outcome of a settings update attempt.
 */
export function recordSettingsUpdate(result: SettingsUpdateResult) {
  metrics.counters.settingsUpdates.labels(result).inc();
}

/**
 * Observe portal response duration in milliseconds for a specific route identifier.
 */
export function observePortalResponse(route: string, durationMs: number) {
  metrics.histograms.portalResponse.labels(route).observe(durationMs / 1000);
}

export function getMetricsRegistry() {
  return metrics.registry;
}

export async function getMetricsSnapshot() {
  return metrics.registry.metrics();
}

export const METRIC_STATUSES = {
  SUCCESS: STATUS_SUCCESS,
  FAILURE: STATUS_FAILURE,
} as const;

export const METRIC_SETTINGS_RESULTS = {
  SUCCESS: 'success' as SettingsUpdateResult,
  FAILURE: 'failure' as SettingsUpdateResult,
  NOOP: 'noop' as SettingsUpdateResult,
};

/**
 * Helper for tests to clear metrics when required.
 */
export function resetMetricsForTest() {
  metrics.registry.resetMetrics();
}
