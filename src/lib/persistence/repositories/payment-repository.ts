import { randomUUID } from 'crypto';

import type { Prisma } from '@/generated/prisma';

import { BaseRepository } from './base';

export class PaymentRepository extends BaseRepository {
  async listAll() {
    return this.db.payment.findMany({
      orderBy: { recordedAt: 'desc' },
    });
  }

  async recordPayment(data: Prisma.PaymentUncheckedCreateInput) {
    const payment = await this.db.payment.create({
      data: {
        ...data,
        id: data.id ?? randomUUID(),
      },
    });

    await this.writeAuditLog({
      entityType: 'Payment',
      entityId: payment.id,
      action: 'PAYMENT_RECORDED',
      payload: data as Record<string, unknown>,
    });

    return payment;
  }

  async listByAgent(agentId: string) {
    return this.db.payment.findMany({
      where: { agentId },
      orderBy: { recordedAt: 'desc' },
    });
  }

  async assignWalletTransaction(paymentId: string, walletTransactionId: string) {
    await this.db.payment.update({
      where: { id: paymentId },
      data: {
        walletTransaction: {
          connect: {
            id: walletTransactionId,
          },
        },
      },
    });
  }
}
