
// This script now tests the PURE business logic, decoupled from Next.js.

import { Actor } from './types';
import { withAuditContext } from './audit-context';
import { PaymentService } from './payment-service';

const testActor: Actor = { userId: 'test_headless_user', role: 'system' };

async function runTest() {
    console.log('[TEST_SCRIPT] Initiating HEADLESS payment transaction test...');
    
    // 1. Define the pure business logic to be tested.
    const paymentTransaction = async () => {
        return PaymentService.processPaymentTransaction('agent_1', 25);
    };

    // 2. Wrap it in the audit context, just like the server action would.
    const auditedTransaction = withAuditContext(testActor, paymentTransaction);

    try {
        // 3. Execute the transaction.
        const result = await auditedTransaction();

        console.log('[TEST_SCRIPT] Service Result:', result);

        // 4. Validate the outcome.
        if (result.success) {
            console.log('[TEST_SCRIPT] VALIDATION SUCCEEDED: The pure service executed successfully.');
        } else {
            console.error('[TEST_SCRIPT] VALIDATION FAILED: The pure service reported an error.', result.message);
        }
    } catch (error) {
        console.error('[TEST_SCRIPT] VALIDATION FAILED: An unexpected error occurred.', error);
    }
}

runTest();
