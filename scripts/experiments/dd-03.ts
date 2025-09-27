process.env.FAKE_PRISMA = '1';

import type { PrismaClient } from '@/generated/prisma';
import { encryptSettingValue } from '@/lib/security/secure-settings';

async function run() {
  const codeTimestamp = new Date('2024-04-01T12:00:00Z');

  const storedSetting: {
    key: string;
    value: string;
    isSensitive: boolean;
    description: string | null;
    updatedBy: string;
    updatedAt: Date;
    version: number;
  } = {
    key: 'SECURE_API_TOKEN',
  value: encryptSettingValue('seed-token'),
    isSensitive: true,
    description: 'Token for external integration',
    updatedBy: 'system',
    updatedAt: codeTimestamp,
    version: 1,
  };

  const auditLogEntries: unknown[] = [];
  const settingsAuditEntries: unknown[] = [];

  const fakePrisma = {
    systemSetting: {
      findUnique: async ({ where: { key } }: { where: { key: string } }) =>
        key === storedSetting.key ? { ...storedSetting } : null,
      findMany: async () => [{ ...storedSetting }],
      update: async ({ where: { key }, data }: { where: { key: string }; data: Record<string, unknown> }) => {
        if (key !== storedSetting.key) {
          throw new Error(`System setting '${key}' not found`);
        }

        if ('value' in data) {
          storedSetting.value = String(data.value);
        }
        if ('updatedBy' in data && data.updatedBy) {
          storedSetting.updatedBy = String(data.updatedBy);
        }
        if ('description' in data) {
          storedSetting.description = (data.description as string | null | undefined) ?? null;
        }
        if ('version' in data && typeof data.version === 'object' && data.version && 'increment' in data.version) {
          storedSetting.version += Number((data.version as { increment?: number }).increment ?? 0);
        }
        if ('updatedAt' in data && data.updatedAt instanceof Date) {
          storedSetting.updatedAt = data.updatedAt;
        } else {
          storedSetting.updatedAt = new Date();
        }

        return { ...storedSetting };
      },
    },
    settingsAuditLog: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        settingsAuditEntries.push({ ...data });
        return data;
      },
    },
    auditLog: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        auditLogEntries.push({ ...data });
        return data;
      },
    },
  } as unknown as PrismaClient;

  (globalThis as { __PRISMA_CLIENT__?: PrismaClient }).__PRISMA_CLIENT__ = fakePrisma;

  const [{ SettingsService }, auditContextModule] = await Promise.all([
    import('@/lib/settings-service'),
    import('@/lib/audit-context'),
  ]);
  const { withAuditContext } = auditContextModule;
  const { UnitOfWork, createPersistenceLogger } = await import('@/lib/persistence/unit-of-work');
  const { prisma: prismaClient } = await import('@/lib/persistence/prisma');

  (globalThis as { __FAKE_UOW_FACTORY?: (args: { actor: { userId: string; role: 'user' | 'admin' | 'system' }; correlationId?: string }) => unknown }).__FAKE_UOW_FACTORY = ({ actor, correlationId }) => {
    const resolvedCorrelationId = correlationId ?? `dd-03-${Date.now()}`;
    return new UnitOfWork({
      db: prismaClient,
      actor,
      correlationId: resolvedCorrelationId,
      logger: createPersistenceLogger({ correlationId: resolvedCorrelationId, actor }),
    } as any);
  };

  const warnings: string[] = [];
  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    warnings.push(String(args[0]));
    return originalWarn.apply(console, args as []);
  };

  const actor = { userId: 'experiment:dd-03', role: 'admin' } as const;
  const runWithContext = withAuditContext(actor, () =>
    SettingsService.updateSetting(storedSetting.key, 'rotated-production-token', actor.userId),
  );
  const updateResult = await runWithContext();

  const retrieved = await SettingsService.getSetting(storedSetting.key);
  const listed = await SettingsService.getAllSettings();

  console.warn = originalWarn;
  delete (globalThis as { __FAKE_UOW_FACTORY?: unknown }).__FAKE_UOW_FACTORY;
  delete (globalThis as { __PRISMA_CLIENT__?: unknown }).__PRISMA_CLIENT__;

  console.log(
    JSON.stringify({
      updateResult,
      storedValue: storedSetting.value,
      retrievedValue: retrieved?.value,
      listedCount: listed.length,
      settingsAuditEntry: settingsAuditEntries[0],
      auditLogPayload: (auditLogEntries[0] as { payload?: unknown } | undefined)?.payload,
      warnings,
    }),
  );
}

run().catch((error) => {
  console.error('DD-03 experiment failed', error);
  process.exit(1);
});
