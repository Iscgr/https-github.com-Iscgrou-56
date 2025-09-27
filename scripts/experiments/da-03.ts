process.env.FAKE_PRISMA = '1';

import { randomUUID } from 'crypto';

import { SettingsService } from '@/lib/settings-service';
import type { UnitOfWork } from '@/lib/persistence/unit-of-work';
import type { PersistenceLogger } from '@/lib/persistence/types';
import type { Actor } from '@/lib/types';
import { withAuditContext } from '@/lib/audit-context';

async function run() {
  const stored = {
    key: 'API_KEY',
    value: 'plain-secret',
    isSensitive: true,
    description: 'External API token',
    updatedBy: 'system',
    updatedAt: new Date(),
    version: 1,
  };

  let capturedUpdate: unknown;
  let capturedOptions: unknown;

  (globalThis as { __FAKE_UOW_FACTORY?: (args: { actor: Actor; correlationId?: string }) => UnitOfWork }).__FAKE_UOW_FACTORY = ({ actor, correlationId }) => {
    const createLogger = (): PersistenceLogger => ({
      log: () => undefined,
      info: () => undefined,
      warn: () => undefined,
      error: () => undefined,
      debug: () => undefined,
      child: () => createLogger(),
    });
    const logger = createLogger();
    const unit = {
      actor,
      correlationId: correlationId ?? 'da-03-correlation',
      logger,
      settings: {
        getSetting: async (key: string) => (key === stored.key ? stored : null),
        updateSetting: async (
          _key: string,
          data: { value: string; updatedBy: string; description?: string },
          options?: unknown,
        ) => {
          capturedUpdate = data;
          capturedOptions = options;
          stored.value = data.value;
          stored.updatedBy = data.updatedBy;
          stored.description = data.description ?? stored.description;
          stored.updatedAt = new Date();
          stored.version += 1;
          return { ...stored };
        },
      },
    } satisfies Record<string, unknown>;

    return unit as unknown as UnitOfWork;
  };

  const warnings: string[] = [];
  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    warnings.push(String(args[0]));
    return originalWarn.apply(console, args as []);
  };

  const actor: Actor = { userId: 'experiment:da-03', role: 'admin' };
  const runWithContext = withAuditContext(actor, () =>
    SettingsService.updateSetting('API_KEY', 'super-secret-token', actor.userId),
  );
  const result = await runWithContext();

  console.warn = originalWarn;
  delete (globalThis as { __FAKE_UOW_FACTORY?: unknown }).__FAKE_UOW_FACTORY;

  console.log(
    JSON.stringify({
      result,
      storedValue: stored.value,
      capturedUpdate,
      capturedOptions,
      warnings,
    }),
  );
}

run().catch((error) => {
  console.error('DA-03 experiment failed', error);
  process.exit(1);
});
