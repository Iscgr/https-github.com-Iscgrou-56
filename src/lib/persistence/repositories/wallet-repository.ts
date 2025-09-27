import { randomUUID } from 'crypto';

import { Prisma } from '@/generated/prisma';

import { BaseRepository } from './base';

export class WalletRepository extends BaseRepository {
  async getByAgentId(agentId: string) {
    return this.db.wallet.findUnique({
      where: { agentId },
    });
  }

  async listTransactions(agentId: string) {
    return this.db.walletTransaction.findMany({
      where: {
        wallet: {
          agentId,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSettledAmountForInvoice(invoiceId: string) {
    const result = await this.db.walletTransaction.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        invoiceId,
        type: 'SETTLEMENT',
      },
    });

    return Number(result._sum.amount ?? 0);
  }

  async ensureWallet(agentId: string) {
    const wallet = await this.db.wallet.upsert({
      where: { agentId },
      update: {},
      create: {
        id: randomUUID(),
        agentId,
      },
    });

    return wallet;
  }

  async adjustBalance(walletId: string, delta: number) {
    const wallet = await this.db.wallet.update({
      where: { id: walletId },
      data: {
        balance: { increment: new Prisma.Decimal(delta) },
        version: { increment: 1 },
        lastTransactionAt: new Date(),
      },
    });

    return wallet;
  }

  async recordTransaction(data: Prisma.WalletTransactionUncheckedCreateInput) {
    const transaction = await this.db.walletTransaction.create({
      data: {
        ...data,
        id: data.id ?? randomUUID(),
      },
    });

    await this.writeAuditLog({
      entityType: 'WalletTransaction',
      entityId: transaction.id,
      action: 'WALLET_TX_RECORDED',
      payload: data as Record<string, unknown>,
    });

    return transaction;
  }
}
