
import { InvoiceService } from './invoice-service';
import { invoices as primaryInvoicesDB, wallets, walletTransactions } from './data';
import { WalletTransaction } from './types';
import { randomUUID } from 'crypto';
import { getRequiredAuditActor } from './audit-context';

const locks = new Map<string, boolean>();

const acquireLock = async (walletId: string): Promise<boolean> => {
    if (locks.has(walletId)) return false;
    locks.set(walletId, true);
    return true;
}

const releaseLock = (walletId: string) => {
    locks.delete(walletId);
}

export const WalletService = {

  getWalletByAgentId: (agentId: string) => {
    return wallets.find(w => w.agentId === agentId);
  },
  
  deposit: async (
    agentId: string, 
    amount: number, 
    referenceId: string
  ): Promise<{ success: boolean; transactionId?: string }> => {
    
    const actor = getRequiredAuditActor();
    console.log(`[WalletService] Attempting deposit for agent ${agentId} by actor ${actor.userId}.`);
    
    const wallet = WalletService.getWalletByAgentId(agentId);
    if (!wallet) throw new Error(`Wallet not found for agent ${agentId}.`);
    if (amount <= 0) throw new Error("Deposit amount must be positive.");
    if (!(await acquireLock(wallet.id))) throw new Error("Wallet is currently busy. Please try again.");

    try {
        wallet.balance += amount;
        wallet.lastTransactionDate = new Date().toISOString();
        
        const transaction: WalletTransaction = {
            id: `txn_${randomUUID()}`,
            walletId: wallet.id,
            type: 'deposit',
            amount,
            timestamp: wallet.lastTransactionDate,
            notes: `External deposit by ${actor.userId}.`,
            referenceId,
        };
        walletTransactions.push(transaction);
        
        return { success: true, transactionId: transaction.id };

    } finally {
        releaseLock(wallet.id);
    }
  },

  settleInvoices: async (
    agentId: string,
    batchSize = 10
  ): Promise<{ settledCount: number, usedBalance: number, batchesProcessed: number }> => {
    
    const actor = getRequiredAuditActor();
    const wallet = WalletService.getWalletByAgentId(agentId);
    if (!wallet || wallet.balance <= 0) {
        return { settledCount: 0, usedBalance: 0, batchesProcessed: 0 };
    }
    
    if (!(await acquireLock(wallet.id))) {
      throw new Error("Could not acquire lock for settlement session.");
    }

    let totalUsedBalance = 0;
    let totalSettledCount = 0;
    let batchesProcessed = 0;

    try {
        console.log(`[WalletService] Starting settlement for agent ${agentId} by actor ${actor.userId}.`);
        
        while (wallet.balance > 0) {
            const unpaidInvoicesBatch = primaryInvoicesDB
                .filter(inv => inv.agentId === agentId && (inv.status === 'unpaid' || inv.status === 'overdue'))
                .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                .slice(0, batchSize);

            if (unpaidInvoicesBatch.length === 0) break;

            batchesProcessed++;
            for (const invoice of unpaidInvoicesBatch) {
                if (wallet.balance <= 0) break;
                
                const amountToSettle = Math.min(wallet.balance, invoice.amount);
                wallet.balance -= amountToSettle;
                totalUsedBalance += amountToSettle;

                const settlementTxn: WalletTransaction = {
                  id: `txn_${randomUUID()}`,
                  walletId: wallet.id,
                  type: 'settlement',
                  amount: amountToSettle,
                  timestamp: new Date().toISOString(),
                  notes: `Settled invoice ${invoice.id} by ${actor.userId}.`,
                  referenceId: `invoice_${invoice.id}`,
                };
                walletTransactions.push(settlementTxn);
                
                InvoiceService.changeStatus(invoice.id, 'paid', `system:wallet:${wallet.id}`, `Settled ${amountToSettle} from wallet.`);
                totalSettledCount++;
            }
        }

        if (totalSettledCount > 0) {
            wallet.lastTransactionDate = new Date().toISOString();
        }

        return { settledCount: totalSettledCount, usedBalance: totalUsedBalance, batchesProcessed };

    } finally {
        releaseLock(wallet.id);
    }
  }
};
