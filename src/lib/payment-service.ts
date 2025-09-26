
import { WalletService } from './wallet-service';
import { getRequiredAuditActor } from './audit-context';

/**
 * Encapsulates the pure business logic for processing a payment transaction.
 * This service is completely decoupled from Next.js and UI concerns.
 *
 * @param agentId The ID of the agent making the payment.
 * @param amount The amount of the payment.
 * @returns A promise that resolves to a success or error object.
 */
async function processPaymentTransaction(
    agentId: string,
    amount: number
): Promise<{ success: boolean; message: string }> {
    // The audit actor is retrieved from the context, ensuring traceability.
    const actor = getRequiredAuditActor();
    console.log(`[PaymentService] Processing payment for agent ${agentId} from actor ${actor.userId}`);

    try {
        // 1. Deposit the new funds into the agent's wallet.
        await WalletService.deposit(agentId, amount, `payment_ref_${Date.now()}`);

        // 2. Attempt to settle any outstanding invoices with the new balance.
        await WalletService.settleInvoices(agentId);

        return { success: true, message: "Payment processed and settled successfully." };

    } catch (error: any) {
        console.error(`[PaymentService] Error during payment processing for agent ${agentId}:`, error);
        return { success: false, message: error.message };
    }
}

export const PaymentService = {
    processPaymentTransaction,
};
