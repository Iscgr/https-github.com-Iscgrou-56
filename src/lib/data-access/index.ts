import { InvoiceSource, InvoiceStatus, Prisma } from '@/generated/prisma';

import {
  mapAgent,
  mapInvoice,
  mapPayment,
  mapPartner,
  mapStatusHistory,
  mapSummary,
} from '../data/mappers';
import type {
  Agent,
  AgentFinancialSummary,
  Invoice,
  InvoiceStatusHistory,
  Partner,
  Payment,
} from '../types';
import { getRepositories, withUnitOfWork } from '../persistence/unit-of-work';

const getReadRepositories = () => getRepositories();

export const getAgents = async (): Promise<Agent[]> => {
  const repositories = getReadRepositories();
  const agents = await repositories.agents.listAgents();
  return agents.map(mapAgent);
};

export const getAgentById = async (id: string): Promise<Agent | undefined> => {
  if (!id) return undefined;
  const repositories = getReadRepositories();
  const agent = await repositories.agents.findById(id);
  return agent ? mapAgent(agent) : undefined;
};

export const getAllAgentIds = async (): Promise<string[]> => {
  const repositories = getReadRepositories();
  return repositories.agents.listAgentIds();
};

export const getSalesPartners = async (): Promise<Partner[]> => {
  const repositories = getReadRepositories();
  const partners = await repositories.partners.listPartners();
  return partners.map(mapPartner);
};

export const getAgentSummaries = async (): Promise<AgentFinancialSummary[]> => {
  const repositories = getReadRepositories();
  const summaries = await repositories.agentSummaries.listOrderedByRecency();
  return summaries.map(mapSummary);
};

export const getInvoices = async (): Promise<Invoice[]> => {
  const repositories = getReadRepositories();
  const invoices = await repositories.invoices.listAll();
  return invoices.map(mapInvoice);
};

export const getInvoicesByAgentId = async (agentId: string): Promise<Invoice[]> => {
  const repositories = getReadRepositories();
  const invoices = await repositories.invoices.listByAgent(agentId);
  return invoices.map(mapInvoice);
};

export const getInvoiceStatusHistory = async (
  invoiceId: string,
): Promise<InvoiceStatusHistory[]> => {
  const repositories = getReadRepositories();
  const history = await repositories.invoices.listStatusHistory(invoiceId);
  return history.map(mapStatusHistory);
};

export const getPayments = async (): Promise<Payment[]> => {
  const repositories = getReadRepositories();
  const payments = await repositories.payments.listAll();
  return payments.map(mapPayment);
};

export const getPaymentsByAgentId = async (agentId: string): Promise<Payment[]> => {
  const repositories = getReadRepositories();
  const payments = await repositories.payments.listByAgent(agentId);
  return payments.map(mapPayment);
};

export const getPortalData = async (agentId: string) => {
  const [invoices, payments] = await Promise.all([
    getInvoicesByAgentId(agentId),
    getPaymentsByAgentId(agentId),
  ]);

  const totalBilled = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);

  return {
    invoices,
    payments,
    summary: {
      totalBilled,
      totalPaid,
      balance: totalBilled - totalPaid,
      invoiceCount: invoices.length,
    },
  } as const;
};

export type CreateInvoiceInput = {
  invoiceNumber: string;
  agentId: string;
  amount: number;
  currency?: string;
  issueDate: string;
  dueDate: string;
  status?: InvoiceStatus;
  source?: InvoiceSource;
  metadata?: Record<string, unknown> | null;
};

export const createIdempotentInvoice = async (
  input: CreateInvoiceInput,
): Promise<Invoice> => {
  const invoice = await withUnitOfWork(async (unit) => {
    const existing = await unit.invoices.findByInvoiceNumber(input.invoiceNumber);
    if (existing) {
      return mapInvoice(existing);
    }

    const created = await unit.invoices.createInvoice({
      agentId: input.agentId,
      invoiceNumber: input.invoiceNumber,
      amount: new Prisma.Decimal(input.amount),
      currency: input.currency ?? 'IRR',
      issueDate: new Date(input.issueDate),
      dueDate: new Date(input.dueDate),
  status: input.status ?? InvoiceStatus.UNPAID,
  source: input.source ?? InvoiceSource.SYSTEM,
  metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
    });

    await unit.agentSummaries.recalculate(input.agentId);

    return mapInvoice(created);
  });

  return invoice;
};

export const updateAgentFinancialSummary = async (
  agentId: string,
): Promise<void> => {
  await withUnitOfWork(async (unit) => {
    await unit.agentSummaries.recalculate(agentId);
  });
};

export const rebuildAllSummaries = async (): Promise<void> => {
  const agentIds = await getAllAgentIds();
  for (const agentId of agentIds) {
    await updateAgentFinancialSummary(agentId);
  }
};

export const getAgent = getAgentById;
