import {
  InvoiceSource,
  InvoiceStatus,
  Prisma,
  type PrismaClient,
} from '@/generated/prisma';

import type {
  Agent,
  AgentFinancialSummary,
  Invoice,
  InvoiceStatusHistory,
  Partner,
  Payment,
} from './types';
import {
  decimalToNumber,
  mapAgent,
  mapInvoice,
  mapPartner,
  mapPayment,
  mapStatusHistory,
  mapSummary,
} from './data/mappers';
import * as dataAccess from './data-access';
import { isPersistencePrismaReadsEnabled } from './feature-flags';

const isServerEnvironment = () => typeof window === 'undefined';

async function fetchJson<T>(input: RequestInfo | URL): Promise<T> {
  const res = await fetch(input, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${String(input)}: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

type PrismaClientFactory = () => PrismaClient;

async function getPrisma(): Promise<PrismaClient> {
  if (process.env.FAKE_PRISMA === '1') {
    const factory = (globalThis as { __FAKE_PRISMA_CLIENT?: PrismaClientFactory }).__FAKE_PRISMA_CLIENT;
    if (!factory) {
      throw new Error('FAKE_PRISMA flag set but __FAKE_PRISMA_CLIENT factory not provided');
    }
    return factory();
  }

  const { prisma } = await import('./prisma');
  return prisma;
}

const shouldUseFacade = () => isServerEnvironment() && isPersistencePrismaReadsEnabled();

const recalculateAgentSummary = async (
  prisma: PrismaClient,
  agentId: string,
): Promise<void> => {
  const [invoiceAgg, paymentAgg] = await Promise.all([
    prisma.invoice.groupBy({
      by: ['status'],
      where: { agentId },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.payment.aggregate({
      where: { agentId },
      _sum: { amount: true },
    }),
  ]);

  const statusCounts = invoiceAgg.reduce<Record<InvoiceStatus, number>>((acc, group) => {
    acc[group.status] = group._count._all;
    return acc;
  }, {} as Record<InvoiceStatus, number>);

  const totalBilled = invoiceAgg.reduce<number>((sum, group) => {
    const amount = group._sum.amount;
    return sum + decimalToNumber(amount);
  }, 0);

  const totalPaid = decimalToNumber(paymentAgg._sum.amount);

  await prisma.agentFinancialSummary.upsert({
    where: { agentId },
    create: {
      agentId,
      totalBilled,
      totalPaid,
      outstandingAmount: Math.max(totalBilled - totalPaid, 0),
      draftCount: statusCounts[InvoiceStatus.DRAFT] ?? 0,
      unpaidCount: statusCounts[InvoiceStatus.UNPAID] ?? 0,
      overdueCount: statusCounts[InvoiceStatus.OVERDUE] ?? 0,
      paidCount: statusCounts[InvoiceStatus.PAID] ?? 0,
    },
    update: {
      totalBilled,
      totalPaid,
      outstandingAmount: Math.max(totalBilled - totalPaid, 0),
      draftCount: statusCounts[InvoiceStatus.DRAFT] ?? 0,
      unpaidCount: statusCounts[InvoiceStatus.UNPAID] ?? 0,
      overdueCount: statusCounts[InvoiceStatus.OVERDUE] ?? 0,
      paidCount: statusCounts[InvoiceStatus.PAID] ?? 0,
      lastCalculatedAt: new Date(),
    },
  });
};

const legacyGetAgents = async (): Promise<Agent[]> => {
  const prisma = await getPrisma();
  const records = await prisma.agent.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return records.map(mapAgent);
};

const legacyGetAgentById = async (id: string): Promise<Agent | undefined> => {
  if (!id) return undefined;
  const prisma = await getPrisma();
  const record = await prisma.agent.findUnique({ where: { id } });
  return record ? mapAgent(record) : undefined;
};

const legacyGetAllAgentIds = async (): Promise<string[]> => {
  const prisma = await getPrisma();
  const records = await prisma.agent.findMany({ select: { id: true } });
  return records.map((record) => record.id);
};

const legacyGetInvoices = async (): Promise<Invoice[]> => {
  const prisma = await getPrisma();
  const records = await prisma.invoice.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return records.map(mapInvoice);
};

const legacyGetInvoicesByAgentId = async (agentId: string): Promise<Invoice[]> => {
  const prisma = await getPrisma();
  const records = await prisma.invoice.findMany({
    where: { agentId },
    orderBy: { createdAt: 'desc' },
  });
  return records.map(mapInvoice);
};

const legacyGetPayments = async (): Promise<Payment[]> => {
  const prisma = await getPrisma();
  const records = await prisma.payment.findMany({
    orderBy: { recordedAt: 'desc' },
  });
  return records.map(mapPayment);
};

const legacyGetPaymentsByAgentId = async (agentId: string): Promise<Payment[]> => {
  const prisma = await getPrisma();
  const records = await prisma.payment.findMany({
    where: { agentId },
    orderBy: { recordedAt: 'desc' },
  });
  return records.map(mapPayment);
};

const legacyGetSalesPartners = async (): Promise<Partner[]> => {
  const prisma = await getPrisma();
  const records = await prisma.partner.findMany({ orderBy: { createdAt: 'desc' } });
  return records.map(mapPartner);
};

const legacyGetAgentSummaries = async (): Promise<AgentFinancialSummary[]> => {
  const prisma = await getPrisma();
  const summaries = await prisma.agentFinancialSummary.findMany({
    orderBy: { lastCalculatedAt: 'desc' },
  });
  return summaries.map(mapSummary);
};

const legacyUpdateAgentFinancialSummary = async (agentId: string): Promise<void> => {
  const prisma = await getPrisma();
  await recalculateAgentSummary(prisma, agentId);
};

const legacyRebuildAllSummaries = async (): Promise<void> => {
  const agentIds = await legacyGetAllAgentIds();
  for (const agentId of agentIds) {
    await legacyUpdateAgentFinancialSummary(agentId);
  }
};

const legacyCreateIdempotentInvoice = async (
  input: dataAccess.CreateInvoiceInput,
): Promise<Invoice> => {
  const prisma = await getPrisma();

  const existing = await prisma.invoice.findUnique({
    where: { invoiceNumber: input.invoiceNumber },
  });

  if (existing) {
    return mapInvoice(existing);
  }

  const created = await prisma.invoice.create({
    data: {
      invoiceNumber: input.invoiceNumber,
      agentId: input.agentId,
      amount: input.amount,
      currency: input.currency ?? 'IRR',
      issueDate: new Date(input.issueDate),
      dueDate: new Date(input.dueDate),
      status: input.status ?? InvoiceStatus.UNPAID,
      source: input.source ?? InvoiceSource.SYSTEM,
      metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });

  await recalculateAgentSummary(prisma, input.agentId);

  return mapInvoice(created);
};

const legacyGetInvoiceStatusHistory = async (
  invoiceId: string,
): Promise<InvoiceStatusHistory[]> => {
  const prisma = await getPrisma();
  const history = await prisma.invoiceStatusHistory.findMany({
    where: { invoiceId },
    orderBy: { changedAt: 'desc' },
  });
  return history.map(mapStatusHistory);
};

export const getAgents = async (): Promise<Agent[]> => {
  if (!isServerEnvironment()) {
    return fetchJson<Agent[]>('/api/agents');
  }
  return shouldUseFacade() ? dataAccess.getAgents() : legacyGetAgents();
};

export const getAllAgentIds = async (): Promise<string[]> => {
  return shouldUseFacade() ? dataAccess.getAllAgentIds() : legacyGetAllAgentIds();
};

export const getAgentById = async (id: string): Promise<Agent | undefined> => {
  if (!isServerEnvironment()) {
    return undefined;
  }
  return shouldUseFacade() ? dataAccess.getAgentById(id) : legacyGetAgentById(id);
};

export const getInvoices = async (): Promise<Invoice[]> => {
  if (!isServerEnvironment()) {
    return fetchJson<Invoice[]>('/api/invoices');
  }
  return shouldUseFacade() ? dataAccess.getInvoices() : legacyGetInvoices();
};

export const getInvoicesByAgentId = async (agentId: string): Promise<Invoice[]> => {
  return shouldUseFacade()
    ? dataAccess.getInvoicesByAgentId(agentId)
    : legacyGetInvoicesByAgentId(agentId);
};

export const getPayments = async (): Promise<Payment[]> => {
  if (!isServerEnvironment()) {
    return fetchJson<Payment[]>('/api/payments');
  }
  return shouldUseFacade() ? dataAccess.getPayments() : legacyGetPayments();
};

export const getPaymentsByAgentId = async (agentId: string): Promise<Payment[]> => {
  return shouldUseFacade()
    ? dataAccess.getPaymentsByAgentId(agentId)
    : legacyGetPaymentsByAgentId(agentId);
};

export const getSalesPartners = async (): Promise<Partner[]> => {
  if (!isServerEnvironment()) {
    return fetchJson<Partner[]>('/api/sales-partners');
  }
  return shouldUseFacade() ? dataAccess.getSalesPartners() : legacyGetSalesPartners();
};

export const getAgentSummaries = async (): Promise<AgentFinancialSummary[]> => {
  if (!isServerEnvironment()) {
    return fetchJson<AgentFinancialSummary[]>('/api/agent-summaries');
  }
  return shouldUseFacade() ? dataAccess.getAgentSummaries() : legacyGetAgentSummaries();
};

export const updateAgentFinancialSummary = async (agentId: string): Promise<void> => {
  return shouldUseFacade()
    ? dataAccess.updateAgentFinancialSummary(agentId)
    : legacyUpdateAgentFinancialSummary(agentId);
};

export const rebuildAllSummaries = async (): Promise<void> => {
  return shouldUseFacade() ? dataAccess.rebuildAllSummaries() : legacyRebuildAllSummaries();
};

export type { CreateInvoiceInput } from './data-access';

export const createIdempotentInvoice = async (
  input: dataAccess.CreateInvoiceInput,
): Promise<Invoice> => {
  return shouldUseFacade()
    ? dataAccess.createIdempotentInvoice(input)
    : legacyCreateIdempotentInvoice(input);
};

export const getAgent = getAgentById;

export const getInvoiceStatusHistory = async (
  invoiceId: string,
): Promise<InvoiceStatusHistory[]> => {
  if (!isServerEnvironment()) {
    throw new Error('getInvoiceStatusHistory is only available on the server.');
  }
  return shouldUseFacade()
    ? dataAccess.getInvoiceStatusHistory(invoiceId)
    : legacyGetInvoiceStatusHistory(invoiceId);
};

export const getPortalData = async (agentId: string) => {
  const [agentInvoices, agentPayments] = await Promise.all([
    getInvoicesByAgentId(agentId),
    getPaymentsByAgentId(agentId),
  ]);

  const totalBilled = agentInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const totalPaid = agentPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const balance = totalBilled - totalPaid;

  return {
    invoices: agentInvoices,
    payments: agentPayments,
    summary: {
      totalBilled,
      totalPaid,
      balance,
      invoiceCount: agentInvoices.length,
    },
  } as const;
};

