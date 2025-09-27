process.env.FAKE_PRISMA = '1';

import { Decimal } from '@prisma/client/runtime/library';
import type { PrismaClient } from '@/generated/prisma';
import { getInvoices } from '@/lib/data';

const invoices = [
  {
    id: 'inv-dd01',
    agentId: 'agent-1',
    invoiceNumber: 'INV-001',
    amount: new Decimal(1500000),
    currency: 'IRR',
    issueDate: new Date('2024-01-01'),
    dueDate: new Date('2024-02-01'),
    status: 'UNPAID',
    source: 'SYSTEM',
    batchId: null,
    metadata: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
  },
] as const;

const fakePrisma = {
  invoice: {
    findMany: (async (..._args: unknown[]) => invoices) as any,
  },
  agent: {
    findMany: (async (..._args: unknown[]) => []) as any,
  },
  payment: {
    findMany: (async (..._args: unknown[]) => []) as any,
  },
  agentFinancialSummary: {
    findMany: (async (..._args: unknown[]) => []) as any,
  },
};

(globalThis as { __FAKE_PRISMA_CLIENT?: () => PrismaClient }).__FAKE_PRISMA_CLIENT = () =>
  fakePrisma as unknown as PrismaClient;

async function run() {
  const result = await getInvoices();
  delete (globalThis as { __FAKE_PRISMA_CLIENT?: unknown }).__FAKE_PRISMA_CLIENT;

  const sample = result[0];
  console.log(
    JSON.stringify({
      count: result.length,
      status: sample?.status,
      invoiceNumber: sample?.invoiceNumber,
      isUppercase: sample?.status === sample?.status?.toUpperCase(),
    }),
  );
}

run().catch((error) => {
  console.error('DD-01 experiment failed', error);
  process.exit(1);
});
