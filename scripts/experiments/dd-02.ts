process.env.FAKE_PRISMA = '1';

import { Decimal } from '@prisma/client/runtime/library';
import type { PrismaClient } from '@/generated/prisma';
import { getAgentById, getPortalData } from '@/lib/data';

const agentRecord = {
  id: 'agent-dd02',
  code: 'AGT-99',
  name: 'نماینده نمونه',
  partnerId: 'partner-1',
  commissionRate: new Decimal(0.12),
  status: 'ACTIVE',
  email: 'sample@example.com',
  phone: '+989121234567',
  telegramChatId: 'sample_agent',
  avatarUrl: 'https://placehold.co/64',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-10'),
} as const;

const invoiceRecords = [
  {
    id: 'inv-dd02-1',
    agentId: agentRecord.id,
    invoiceNumber: 'INV-2001',
    amount: new Decimal(2000000),
    currency: 'IRR',
    issueDate: new Date('2024-02-01'),
    dueDate: new Date('2024-03-01'),
    status: 'PAID',
    source: 'SYSTEM',
    batchId: null,
    metadata: null,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-10'),
  },
  {
    id: 'inv-dd02-2',
    agentId: agentRecord.id,
    invoiceNumber: 'INV-2002',
    amount: new Decimal(1500000),
    currency: 'IRR',
    issueDate: new Date('2024-03-01'),
    dueDate: new Date('2024-04-01'),
    status: 'UNPAID',
    source: 'SYSTEM',
    batchId: null,
    metadata: null,
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-02'),
  },
] as const;

const paymentRecords = [
  {
    id: 'pay-dd02-1',
    agentId: agentRecord.id,
    invoiceId: invoiceRecords[0].id,
    amount: new Decimal(2000000),
    method: 'EXTERNAL',
    reference: 'TXN-555',
    note: null,
    recordedAt: new Date('2024-03-05'),
    createdAt: new Date('2024-03-05'),
  },
] as const;

const fakePrisma = {
  agent: {
    findUnique: async (params: unknown) => {
      const id = (params as { where?: { id?: string } })?.where?.id;
      return id === agentRecord.id ? agentRecord : null;
    },
  },
  invoice: {
    findMany: async (..._args: unknown[]) => invoiceRecords,
  },
  payment: {
    findMany: async (..._args: unknown[]) => paymentRecords,
  },
};

(globalThis as { __FAKE_PRISMA_CLIENT?: () => PrismaClient }).__FAKE_PRISMA_CLIENT = () =>
  fakePrisma as unknown as PrismaClient;

async function run() {
  const agent = await getAgentById(agentRecord.id);
  const portal = await getPortalData(agentRecord.id);

  delete (globalThis as { __FAKE_PRISMA_CLIENT?: unknown }).__FAKE_PRISMA_CLIENT;

  console.log(
    JSON.stringify({
      agent,
      summary: portal.summary,
      invoiceSample: portal.invoices[0]?.invoiceNumber,
      paymentReference: portal.payments[0]?.reference,
    }),
  );
}

run().catch((error) => {
  console.error('DD-02 experiment failed', error);
  process.exit(1);
});
