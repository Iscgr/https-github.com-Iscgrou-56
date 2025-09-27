// @ts-nocheck
process.env.FAKE_PRISMA = '1';

const agents = [
  {
    id: 'agent-1',
    code: 'AG-001',
    name: 'Alpha Logistics',
    partnerId: 'partner-1',
    commissionRate: 0.1,
    status: 'ACTIVE',
    email: 'alpha@example.com',
    phone: '+98-21-123456',
    telegramChatId: null,
    avatarUrl: null,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-02-01T00:00:00Z'),
    partner: {
      id: 'partner-1',
      name: 'Partner One',
      createdAt: new Date('2023-12-01T00:00:00Z'),
      updatedAt: new Date('2024-01-15T00:00:00Z'),
    },
    wallet: {
      id: 'wallet-1',
      agentId: 'agent-1',
      balance: 125,
      currency: 'IRR',
      lastTransactionAt: new Date('2024-02-05T10:00:00Z'),
      version: 3,
    },
    PortalAppearance: {
      id: 'appearance-1',
      agentId: 'agent-1',
      theme: { color: 'blue' },
      createdAt: new Date('2024-01-05T00:00:00Z'),
      updatedAt: new Date('2024-01-20T00:00:00Z'),
    },
  },
];

const partners = agents.map((agent) => agent.partner);

const invoices = [
  {
    id: 'invoice-1',
    agentId: 'agent-1',
    invoiceNumber: 'INV-001',
    amount: 250,
    currency: 'IRR',
    issueDate: new Date('2024-01-10T00:00:00Z'),
    dueDate: new Date('2024-01-25T00:00:00Z'),
    status: 'UNPAID',
    source: 'SYSTEM',
    batchId: null,
    metadata: { note: 'Test invoice' },
    createdAt: new Date('2024-01-10T00:00:00Z'),
    updatedAt: new Date('2024-01-15T00:00:00Z'),
  },
  {
    id: 'invoice-2',
    agentId: 'agent-1',
    invoiceNumber: 'INV-002',
    amount: 150,
    currency: 'IRR',
    issueDate: new Date('2024-02-01T00:00:00Z'),
    dueDate: new Date('2024-02-20T00:00:00Z'),
    status: 'PAID',
    source: 'SYSTEM',
    batchId: null,
    metadata: null,
    createdAt: new Date('2024-02-01T00:00:00Z'),
    updatedAt: new Date('2024-02-10T00:00:00Z'),
  },
];

const payments = [
  {
    id: 'payment-1',
    agentId: 'agent-1',
    invoiceId: 'invoice-2',
    amount: 150,
    method: 'EXTERNAL',
    reference: 'PAY-001',
    note: null,
    recordedAt: new Date('2024-02-11T12:00:00Z'),
    createdAt: new Date('2024-02-11T12:00:00Z'),
  },
  {
    id: 'payment-2',
    agentId: 'agent-1',
    invoiceId: null,
    amount: 75,
    method: 'EXTERNAL',
    reference: 'PAY-002',
    note: 'Wallet top-up',
    recordedAt: new Date('2024-02-15T08:30:00Z'),
    createdAt: new Date('2024-02-15T08:30:00Z'),
  },
];

const summaries = [
  {
    id: 'summary-1',
    agentId: 'agent-1',
    totalBilled: 400,
    totalPaid: 150,
    outstandingAmount: 250,
    draftCount: 0,
    unpaidCount: 1,
    overdueCount: 0,
    paidCount: 1,
    lastCalculatedAt: new Date('2024-02-12T00:00:00Z'),
  },
];

const invoiceStatusHistory = [
  {
    id: 'hist-1',
    invoiceId: 'invoice-2',
    fromStatus: 'UNPAID',
    toStatus: 'PAID',
    actorUserId: 'system:automation',
    notes: 'Auto-settled from wallet',
    changedAt: new Date('2024-02-10T09:00:00Z'),
  },
];

function clone(value) {
  if (Array.isArray(value)) {
    return value.map(clone);
  }
  if (value instanceof Date) {
    return new Date(value);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, val]) => [key, clone(val)]));
  }
  return value;
}

function applySelect(record, select) {
  if (!select) return clone(record);
  const entries = Object.entries(select).filter(([, enabled]) => enabled);
  const result = {};
  for (const [key] of entries) {
    result[key] = clone(record[key]);
  }
  return result;
}

function applyOrder(records, orderBy) {
  if (!orderBy) return [...records];
  const [[field, direction]] = Object.entries(orderBy);
  return [...records].sort((a, b) => {
    const av = a[field];
    const bv = b[field];
    const compare = av > bv ? 1 : av < bv ? -1 : 0;
    return direction === 'desc' ? -compare : compare;
  });
}

function createFakePrisma() {
  return {
    agent: {
      findMany: async (args = {}) => {
        const { where, select, orderBy } = args;
        let records = [...agents];
        if (where?.agentId) {
          records = records.filter((agent) => agent.id === where.agentId);
        }
        if (orderBy) {
          records = applyOrder(records, orderBy);
        }
        return records.map((record) => applySelect(record, select));
      },
      findUnique: async (args) => {
        const { where, include, select } = args;
        let record = agents.find((agent) => {
          if (where.id) return agent.id === where.id;
          if (where.code) return agent.code === where.code;
          return false;
        });
        if (!record) return null;
        const cloneRecord = clone(record);
        if (select) {
          return applySelect(cloneRecord, select);
        }
        if (!include) {
          delete cloneRecord.partner;
          delete cloneRecord.wallet;
          delete cloneRecord.PortalAppearance;
          return clone(cloneRecord);
        }
        return cloneRecord;
      },
    },
    agentFinancialSummary: {
      findMany: async (args = {}) => {
        const records = applyOrder(summaries, args.orderBy);
        return clone(records);
      },
      findUnique: async (args) => {
        const record = summaries.find((summary) => summary.agentId === args.where.agentId);
        return record ? clone(record) : null;
      },
      upsert: async () => {
        throw new Error('Not implemented in experiment');
      },
    },
    invoice: {
      findMany: async (args = {}) => {
        const { where, orderBy } = args;
        let records = [...invoices];
        if (where?.agentId) {
          records = records.filter((invoice) => invoice.agentId === where.agentId);
        }
        if (orderBy) {
          records = applyOrder(records, orderBy);
        }
        return clone(records);
      },
      findUnique: async (args) => {
        const { where } = args;
        const record = invoices.find((invoice) => {
          if (where.id) return invoice.id === where.id;
          if (where.invoiceNumber) return invoice.invoiceNumber === where.invoiceNumber;
          return false;
        });
        return record ? clone(record) : null;
      },
      groupBy: async () => {
        throw new Error('groupBy not implemented in experiment');
      },
      create: async () => {
        throw new Error('create not implemented in experiment');
      },
    },
    payment: {
      findMany: async (args = {}) => {
        const { where, orderBy } = args;
        let records = [...payments];
        if (where?.agentId) {
          records = records.filter((payment) => payment.agentId === where.agentId);
        }
        if (orderBy) {
          records = applyOrder(records, orderBy);
        }
        return clone(records);
      },
      aggregate: async () => {
        throw new Error('aggregate not implemented in experiment');
      },
    },
    partner: {
      findMany: async (args = {}) => {
        return applyOrder(partners, args.orderBy).map(clone);
      },
    },
    invoiceStatusHistory: {
      findMany: async (args = {}) => {
        const { where, orderBy } = args;
        let records = [...invoiceStatusHistory];
        if (where?.invoiceId) {
          records = records.filter((entry) => entry.invoiceId === where.invoiceId);
        }
        if (orderBy) {
          records = applyOrder(records, orderBy);
        }
        return clone(records);
      },
    },
    wallet: {
      findUnique: async (args) => {
        const record = agents[0].wallet;
        if (args.where.agentId === record.agentId) {
          return clone(record);
        }
        return null;
      },
    },
    portalAppearance: {
      findUnique: async (args) => {
        const record = agents[0].PortalAppearance;
        if (args.where.agentId === record.agentId) {
          return clone(record);
        }
        return null;
      },
    },
  };
}

function jsonStable(value) {
  return JSON.stringify(value, (_, v) => (v instanceof Date ? v.toISOString() : v));
}

async function main() {
  const fakePrisma = createFakePrisma();
  (globalThis as any).__PRISMA_CLIENT__ = fakePrisma as any;
  (globalThis as any).__FAKE_PRISMA_CLIENT = () => fakePrisma as any;

  const data = await import('@/lib/data');
  const {
    getAgents,
    getAgentSummaries,
    getPayments,
    getInvoices,
    getPortalData,
  } = data;

  const capture = async (flagValue) => {
    process.env.PERSISTENCE_PRISMA_READS = flagValue;
    return {
      agents: await getAgents(),
      summaries: await getAgentSummaries(),
      payments: await getPayments(),
      invoices: await getInvoices(),
      portal: await getPortalData('agent-1'),
    };
  };

  const legacy = await capture('0');
  const facade = await capture('1');

  const parity = {
    agents: jsonStable(legacy.agents) === jsonStable(facade.agents),
    summaries: jsonStable(legacy.summaries) === jsonStable(facade.summaries),
    payments: jsonStable(legacy.payments) === jsonStable(facade.payments),
    invoices: jsonStable(legacy.invoices) === jsonStable(facade.invoices),
    portal: jsonStable(legacy.portal) === jsonStable(facade.portal),
  };

  console.log(
    JSON.stringify(
      {
        parity,
        legacy,
        facade,
      },
      (_, v) => (v instanceof Date ? v.toISOString() : v),
    ),
  );
}

main().catch((error) => {
  console.error('DB-01 parity experiment failed', error);
  process.exit(1);
});
