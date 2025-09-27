import { FinancialOrchestrator } from './financial-orchestrator';

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
    amount: number,
    options?: { referenceId?: string; note?: string; settleBatchSize?: number },
): Promise<{ success: boolean; message: string; referenceId?: string; paymentId?: string }> {
    const result = await FinancialOrchestrator.processPayment({
        agentId,
        amount,
        referenceId: options?.referenceId,
        note: options?.note ?? null,
        settleBatchSize: options?.settleBatchSize,
    });

    if (result.success) {
        return {
            success: true,
            message: 'Payment processed and settled successfully.',
            referenceId: result.referenceId,
            paymentId: result.paymentId,
        };
    }

    return {
        success: false,
        message: result.message,
    };
}

export const PaymentService = {
    processPaymentTransaction,
};
