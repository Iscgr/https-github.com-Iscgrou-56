
import { WalletTransactionType, InvoiceStatus } from '@/generated/prisma';

import { withUnitOfWork, getRepositories, UnitOfWork } from './persistence/unit-of-work';
import { Prisma } from '@/generated/prisma';

const depositInternal = async (
  unit: UnitOfWork,
  agentId: string,
  amount: number,
  referenceId: string,
) => {
  const wallet = await unit.wallets.ensureWallet(agentId);

  await unit.wallets.adjustBalance(wallet.id, amount);

  const transaction = await unit.wallets.recordTransaction({
    walletId: wallet.id,
    type: WalletTransactionType.DEPOSIT,
    amount: new Prisma.Decimal(amount),
    notes: `External deposit by ${unit.actor.userId}.`,
    referenceId,
  });

  return { success: true, transactionId: transaction.id, walletId: wallet.id, amount } as const;
};

const settleInternal = async (
  unit: UnitOfWork,
  agentId: string,
  batchSize: number,
) => {
  const wallet = await unit.wallets.ensureWallet(agentId);
  let remainingBalance = Number(wallet.balance);

  if (remainingBalance <= 0) {
    return { settledCount: 0, usedBalance: 0, batchesProcessed: 0 } as const;
  }

  let totalUsed = 0;
  let settledCount = 0;
  let batches = 0;

  const invoices = await unit.invoices.listByAgent(agentId);
  const candidates = invoices
    .filter((invoice) => ['UNPAID', 'OVERDUE', 'PARTIAL'].includes(invoice.status))
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  while (remainingBalance > 0) {
    const batch = candidates.splice(0, batchSize);
    if (!batch.length) break;
    batches++;

    for (const invoice of batch) {
      if (remainingBalance <= 0) break;

      const invoiceTotal = Number(invoice.amount);
      const settledBefore = await unit.wallets.getSettledAmountForInvoice(invoice.id);
      const outstanding = Math.max(invoiceTotal - settledBefore, 0);

      if (outstanding <= 0) {
        continue;
      }

      const amountToSettle = Math.min(remainingBalance, outstanding);

      await unit.wallets.adjustBalance(wallet.id, -amountToSettle);
      remainingBalance -= amountToSettle;
      totalUsed += amountToSettle;

      const txn = await unit.wallets.recordTransaction({
        walletId: wallet.id,
        type: WalletTransactionType.SETTLEMENT,
        amount: new Prisma.Decimal(amountToSettle),
        notes: `Settled ${amountToSettle} on invoice ${invoice.invoiceNumber ?? invoice.id}.`,
        referenceId: `invoice_${invoice.id}`,
        invoiceId: invoice.id,
      });

      const stillOutstanding = outstanding - amountToSettle;
      const nextStatus = stillOutstanding > 0 ? InvoiceStatus.PARTIAL : InvoiceStatus.PAID;

      await unit.invoices.appendStatusHistory({
        invoiceId: invoice.id,
        fromStatus: invoice.status,
        toStatus: nextStatus,
        notes: `Wallet transaction ${txn.id}`,
      });

      await unit.invoices.updateInvoiceStatus(invoice.id, nextStatus);
      settledCount++;
    }
  }

  return {
    settledCount,
    usedBalance: totalUsed,
    batchesProcessed: batches,
  } as const;
};

export const WalletService = {
  async getWalletByAgentId(agentId: string) {
    const repositories = getRepositories();
    return repositories.wallets.getByAgentId(agentId);
  },

  async deposit(agentId: string, amount: number, referenceId: string) {
    if (amount <= 0) throw new Error('Deposit amount must be positive.');

    return withUnitOfWork((unit) => depositInternal(unit, agentId, amount, referenceId));
  },

  async settleInvoices(agentId: string, batchSize = 10) {
    return withUnitOfWork((unit) => settleInternal(unit, agentId, batchSize));
  },

  depositWithin: depositInternal,
  settleWithin: settleInternal,
};
