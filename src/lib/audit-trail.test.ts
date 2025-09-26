
import { InvoiceService, invoiceStatusHistory } from './invoice-service';
import { WalletService } from './wallet-service';
import { invoices, wallets, walletTransactions } from './data';
import { Actor } from './types';
import { withAuditContext, getRequiredAuditActor } from './audit-context';

function resetMockData() {
    invoices.splice(0, invoices.length, { id: 'inv_001', agentId: 'agent_1', amount: 100, date: '2023-10-01', dueDate: '2023-10-15', status: 'unpaid' });
    wallets.splice(0, wallets.length, { id: 'wallet_1', agentId: 'agent_1', balance: 50, lastTransactionDate: null });
    invoiceStatusHistory.splice(0, invoiceStatusHistory.length);
    walletTransactions.splice(0, walletTransactions.length);
}

describe('Audit Trail Implementation (Phase C Validation)', () => {
    
    beforeEach(() => {
        resetMockData();
    });

    const testActor: Actor = { userId: 'test_admin_from_context', role: 'admin' };

    const withTestContext = <T extends (...args: any[]) => Promise<any>>(fn: T) => {
        return withAuditContext(testActor, fn);
    };

    test('InvoiceService uses the actor from context', async () => {
        const action = async () => {
            InvoiceService.changeStatus('inv_001', 'paid', 'dummy:actor', 'Payment validation');
        };
        
        await withTestContext(action)();

        const history = InvoiceService.getStatusHistory('inv_001');
        expect(history).toHaveLength(1);
        expect(history[0].actor).toBe(testActor.userId);
    });

    test('WalletService.deposit uses the actor from context', async () => {
        const action = async () => {
            await WalletService.deposit('agent_1', 75, 'ref_ctx_deposit');
        };

        await withTestContext(action)();
        
        const transaction = walletTransactions.find(t => t.referenceId === 'ref_ctx_deposit');
        expect(transaction).toBeDefined();
        expect(transaction?.notes).toContain(testActor.userId);
    });

    test('WalletService.settleInvoices propagates context to InvoiceService', async () => {
        const wallet = WalletService.getWalletByAgentId('agent_1');
        if (wallet) wallet.balance = 150;

        const action = async () => {
            await WalletService.settleInvoices('agent_1');
        };

        await withTestContext(action)();

        const history = InvoiceService.getStatusHistory('inv_001');
        expect(history).toHaveLength(1);
        expect(history[0].actor).toBe(testActor.userId);
    });

    test('Guard function throws error when context is not set', () => {
        const action = () => {
            InvoiceService.changeStatus('inv_001', 'paid', 'dummy:actor');
        };

        expect(action).toThrow("AuditError: Actor context is missing. This indicates a critical application error.");
    });
});
