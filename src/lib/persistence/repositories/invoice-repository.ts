import { randomUUID } from 'crypto';

import type { Prisma } from '@/generated/prisma';
import { InvoiceStatus } from '@/generated/prisma';

import { BaseRepository } from './base';

export type InvoiceWithItemsDTO = Prisma.InvoiceGetPayload<{
  include: {
    items: true;
    statusHistory: true;
    agent: true;
  };
}>;

export class InvoiceRepository extends BaseRepository {
  async listAll() {
    return this.db.invoice.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<InvoiceWithItemsDTO | null> {
    return this.db.invoice.findUnique({
      where: { id },
      include: {
        items: true,
        statusHistory: {
          orderBy: { changedAt: 'desc' },
        },
        agent: true,
      },
    });
  }

  async listByAgent(agentId: string) {
    return this.db.invoice.findMany({
      where: { agentId },
      orderBy: { issueDate: 'desc' },
    });
  }

  async listStatusHistory(invoiceId: string) {
    return this.db.invoiceStatusHistory.findMany({
      where: { invoiceId },
      orderBy: { changedAt: 'desc' },
    });
  }

  async listOverdue(referenceDate: Date) {
    return this.db.invoice.findMany({
      where: {
        dueDate: {
          lt: referenceDate,
        },
        status: {
          in: ['UNPAID', 'PARTIAL', 'OVERDUE'],
        },
      },
    });
  }

  async findByInvoiceNumber(invoiceNumber: string) {
    return this.db.invoice.findUnique({
      where: { invoiceNumber },
    });
  }

  async createInvoice(data: Prisma.InvoiceUncheckedCreateInput) {
    const invoice = await this.db.invoice.create({
      data: {
        ...data,
        id: data.id ?? randomUUID(),
      },
    });

    await this.writeAuditLog({
      entityType: 'Invoice',
      entityId: invoice.id,
      action: 'INVOICE_CREATED',
      payload: data as Record<string, unknown>,
    });

    return invoice;
  }

  async appendStatusHistory(params: {
    invoiceId: string;
    fromStatus: InvoiceStatus;
    toStatus: InvoiceStatus;
    notes?: string | null;
  }) {
    const { invoiceId, fromStatus, toStatus, notes = null } = params;
    await this.db.invoiceStatusHistory.create({
      data: {
  id: randomUUID(),
        invoiceId,
        fromStatus,
        toStatus,
        actorUserId: this.actor.userId,
        notes,
      },
    });
  }

  async updateInvoiceStatus(invoiceId: string, status: InvoiceStatus) {
    await this.db.invoice.update({
      where: { id: invoiceId },
      data: {
        status,
      },
    });
    await this.writeAuditLog({
      entityType: 'Invoice',
      entityId: invoiceId,
      action: 'INVOICE_STATUS_UPDATED',
      payload: { status },
    });
  }
}
