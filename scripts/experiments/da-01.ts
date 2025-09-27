process.env.FAKE_PRISMA = '1';

import { prisma } from '@/lib/prisma';
import { withUnitOfWork } from '@/lib/persistence/unit-of-work';
import { withAuditContext } from '@/lib/audit-context';

type PrismaLike = { $transaction: (fn: (tx: unknown) => Promise<unknown>) => Promise<unknown> };

async function runExperiment() {
  const client = prisma as unknown as PrismaLike & {
    __originalTransaction?: PrismaLike['$transaction'];
  };

  if (!client.__originalTransaction) {
    client.__originalTransaction = client.$transaction.bind(prisma);
  }

  let transactionCalled = false;

  Object.defineProperty(client, '$transaction', {
    configurable: true,
    get() {
      return async (callback: (tx: unknown) => Promise<unknown>) => {
        transactionCalled = true;
        const txStub = {};
        const result = await callback(txStub);
        return result;
      };
    },
  });

  const descriptor = Object.getOwnPropertyDescriptor(client, '$transaction');
  console.log('overrideDescriptor', descriptor ? { configurable: descriptor.configurable, hasGetter: !!descriptor.get } : null);

  const actor = { userId: 'experiment:da-01', role: 'admin' } as const;
  const wrapped = withAuditContext(actor, () => withUnitOfWork(async () => 'ok'));
  const result = await wrapped();

  Object.defineProperty(client, '$transaction', {
    configurable: true,
    value: client.__originalTransaction!,
  });

  console.log(JSON.stringify({ transactionCalled, result }));
}

runExperiment().catch((error) => {
  console.error('DA-01 experiment failed', error);
  process.exit(1);
});
