import { InvoiceStatus, Prisma } from '@/generated/prisma';

import { BaseRepository } from './base';

type StatusTotals = Record<InvoiceStatus, number>;

export class AgentFinancialSummaryRepository extends BaseRepository {
  async listOrderedByRecency() {
    return this.db.agentFinancialSummary.findMany({
      orderBy: { lastCalculatedAt: 'desc' },
    });
  }

  async getByAgentId(agentId: string) {
    return this.db.agentFinancialSummary.findUnique({
      where: { agentId },
    });
  }

  async recalculate(agentId: string) {
    const [invoiceAgg, paymentAgg] = await Promise.all([
      this.db.invoice.groupBy({
        by: ['status'],
        where: { agentId },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      this.db.payment.aggregate({
        where: { agentId },
        _sum: { amount: true },
      }),
    ]);

    const totals = invoiceAgg.reduce<StatusTotals>((acc, group) => {
      acc[group.status] = group._count._all;
      return acc;
    }, {} as StatusTotals);

    const totalBilled = invoiceAgg.reduce<number>((sum, group) => {
      const amount = group._sum.amount ?? new Prisma.Decimal(0);
      return sum + Number(amount);
    }, 0);

    const totalPaid = Number(paymentAgg._sum.amount ?? new Prisma.Decimal(0));

    await this.db.agentFinancialSummary.upsert({
      where: { agentId },
      create: {
        agentId,
        totalBilled,
        totalPaid,
        outstandingAmount: Math.max(totalBilled - totalPaid, 0),
        draftCount: totals[InvoiceStatus.DRAFT] ?? 0,
        unpaidCount: totals[InvoiceStatus.UNPAID] ?? 0,
        overdueCount: totals[InvoiceStatus.OVERDUE] ?? 0,
        paidCount: totals[InvoiceStatus.PAID] ?? 0,
      },
      update: {
        totalBilled,
        totalPaid,
        outstandingAmount: Math.max(totalBilled - totalPaid, 0),
        draftCount: totals[InvoiceStatus.DRAFT] ?? 0,
        unpaidCount: totals[InvoiceStatus.UNPAID] ?? 0,
        overdueCount: totals[InvoiceStatus.OVERDUE] ?? 0,
        paidCount: totals[InvoiceStatus.PAID] ?? 0,
        lastCalculatedAt: new Date(),
      },
    });
  }
}
