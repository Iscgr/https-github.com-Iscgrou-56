process.env.FAKE_PRISMA = '1';

import { PaymentService } from '@/lib/payment-service';
import { WalletService } from '@/lib/wallet-service';
import type { UnitOfWork } from '@/lib/persistence/unit-of-work';
import type { PersistenceLogger } from '@/lib/persistence/types';
import type { Actor } from '@/lib/types';
import { withAuditContext } from '@/lib/audit-context';

interface WalletState {
  id: string;
  agentId: string;
  balance: number;
}

async function run() {
  const walletState: WalletState = { id: 'wallet-1', agentId: 'agent-1', balance: 0 };
  const transactions: Array<{ amount: number }> = [];

  const invoices = [
    {
      id: 'invoice-1',
      agentId: 'agent-1',
      amount: 120,
      status: 'UNPAID',
      dueDate: new Date('2024-01-01'),
      invoiceNumber: 'INV-1',
    },
  ];

  const appendHistory: any[] = [];
  const statusUpdates: Record<string, string> = {};

  (globalThis as { __FAKE_UOW_FACTORY?: (args: { actor: Actor; correlationId?: string }) => UnitOfWork }).__FAKE_UOW_FACTORY = ({ actor, correlationId }) => {
    const createLogger = (): PersistenceLogger => ({
      log: () => undefined,
      info: () => undefined,
      warn: () => undefined,
      error: () => undefined,
      debug: () => undefined,
      child: () => createLogger(),
    });
    const logger = createLogger();
    const unit = {
      actor,
      correlationId: correlationId ?? 'da-02-correlation',
      logger,
      wallets: {
        ensureWallet: async (agentId: string) => {
          walletState.agentId = agentId;
          return walletState;
        },
        adjustBalance: async (_walletId: string, delta: number) => {
          walletState.balance += delta;
          return walletState;
        },
        recordTransaction: async (data: Record<string, unknown>) => {
          transactions.push({ amount: Number(data.amount) });
          return { id: `txn-${transactions.length}` };
        },
        getSettledAmountForInvoice: async () => 0,
      },
      invoices: {
        listByAgent: async () => invoices,
        appendStatusHistory: async (entry: unknown) => {
          appendHistory.push(entry);
        },
        updateInvoiceStatus: async (invoiceId: string, status: string) => {
          statusUpdates[invoiceId] = status;
        },
      },
      payments: {
        recordPayment: async (data: Record<string, unknown>) => ({
          id: data.id ?? `payment-${Date.now()}`,
        }),
        assignWalletTransaction: async () => undefined,
      },
    } satisfies Record<string, unknown>;

    return unit as unknown as UnitOfWork;
  };

  const originalSettleWithin = WalletService.settleWithin;
  WalletService.settleWithin = async () => {
    throw new Error('forced-settlement-failure');
  };

  const actor: Actor = { userId: 'experiment:da-02', role: 'admin' };
  const runWithContext = withAuditContext(actor, () => PaymentService.processPaymentTransaction('agent-1', 50));
  const result = await runWithContext();

  WalletService.settleWithin = originalSettleWithin;
  delete (globalThis as { __FAKE_UOW_FACTORY?: unknown }).__FAKE_UOW_FACTORY;

  console.log(JSON.stringify({
    result,
    walletBalance: walletState.balance,
    transactionCount: transactions.length,
    statusUpdates,
    appendHistoryLength: appendHistory.length,
  }));
}

run().catch((error) => {
  console.error('DA-02 experiment failed', error);
  process.exit(1);
});
