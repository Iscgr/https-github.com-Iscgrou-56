import type {
  Agent as PrismaAgent,
  AgentFinancialSummary as PrismaAgentFinancialSummary,
  Invoice as PrismaInvoice,
  InvoiceStatusHistory as PrismaInvoiceStatusHistory,
  Partner as PrismaPartner,
  Payment as PrismaPayment,
} from '@/generated/prisma';
import { Prisma } from '@/generated/prisma';

import type {
  Agent,
  AgentFinancialSummary,
  Invoice,
  InvoiceStatusHistory,
  Partner,
  Payment,
} from '../types';

type DecimalLike = Prisma.Decimal | number | null | undefined;

export const decimalToNumber = (value: DecimalLike): number => {
  if (value == null) return 0;
  if (typeof value === 'number') return value;
  return value.toNumber();
};

export const mapAgent = (agent: PrismaAgent): Agent => ({
  id: agent.id,
  code: agent.code,
  name: agent.name,
  partnerId: agent.partnerId,
  commissionRate: decimalToNumber(agent.commissionRate),
  status: agent.status,
  email: agent.email ?? null,
  phone: agent.phone ?? null,
  telegramChatId: agent.telegramChatId ?? null,
  avatarUrl: agent.avatarUrl ?? null,
  createdAt: agent.createdAt.toISOString(),
  updatedAt: agent.updatedAt.toISOString(),
});

export const mapPartner = (partner: PrismaPartner): Partner => ({
  id: partner.id,
  name: partner.name,
  createdAt: partner.createdAt.toISOString(),
  updatedAt: partner.updatedAt.toISOString(),
});

export const mapInvoice = (invoice: PrismaInvoice): Invoice => ({
  id: invoice.id,
  agentId: invoice.agentId,
  invoiceNumber: invoice.invoiceNumber,
  amount: decimalToNumber(invoice.amount),
  currency: invoice.currency,
  issueDate: invoice.issueDate.toISOString(),
  dueDate: invoice.dueDate.toISOString(),
  status: invoice.status,
  source: invoice.source,
  batchId: invoice.batchId ?? null,
  metadata: invoice.metadata as Record<string, unknown> | null,
  createdAt: invoice.createdAt.toISOString(),
  updatedAt: invoice.updatedAt.toISOString(),
});

export const mapPayment = (payment: PrismaPayment): Payment => ({
  id: payment.id,
  agentId: payment.agentId,
  invoiceId: payment.invoiceId ?? null,
  amount: decimalToNumber(payment.amount),
  method: payment.method,
  reference: payment.reference ?? null,
  note: payment.note ?? null,
  recordedAt: payment.recordedAt.toISOString(),
  createdAt: payment.createdAt.toISOString(),
});

export const mapSummary = (
  summary: PrismaAgentFinancialSummary,
): AgentFinancialSummary => ({
  agentId: summary.agentId,
  totalBilled: decimalToNumber(summary.totalBilled),
  totalPaid: decimalToNumber(summary.totalPaid),
  outstandingAmount: decimalToNumber(summary.outstandingAmount),
  draftCount: summary.draftCount,
  unpaidCount: summary.unpaidCount,
  overdueCount: summary.overdueCount,
  paidCount: summary.paidCount,
  lastCalculatedAt: summary.lastCalculatedAt.toISOString(),
});

export const mapStatusHistory = (
  history: PrismaInvoiceStatusHistory,
): InvoiceStatusHistory => ({
  id: history.id,
  invoiceId: history.invoiceId,
  fromStatus: history.fromStatus,
  toStatus: history.toStatus,
  actorUserId: history.actorUserId,
  notes: history.notes ?? null,
  changedAt: history.changedAt.toISOString(),
});
