const truthyValues = new Set(['1', 'true', 'yes', 'on']);

const normalize = (value: string | undefined) => value?.toLowerCase().trim() ?? '';

const isEnabled = (value: string | undefined) => truthyValues.has(normalize(value));

export const isPersistencePrismaReadsEnabled = (): boolean =>
  isEnabled(process.env.PERSISTENCE_PRISMA_READS);

export const isFinancialOrchestratorEnabled = (): boolean =>
  isEnabled(process.env.FINANCIAL_ORCHESTRATOR);

export const isPortalPrismaEnabled = (): boolean =>
  isEnabled(process.env.PORTAL_PRISMA);

export const isSecureSettingsProviderEnabled = (): boolean =>
  isEnabled(process.env.SETTINGS_SECURE_PROVIDER);

export const getRolloutStage = (): string => process.env.ROLLOUT_STAGE ?? 'unknown';

export const getFeatureFlagSnapshot = () => ({
  persistencePrismaReads: isPersistencePrismaReadsEnabled(),
  financialOrchestrator: isFinancialOrchestratorEnabled(),
  portalPrisma: isPortalPrismaEnabled(),
  settingsSecureProvider: isSecureSettingsProviderEnabled(),
});
