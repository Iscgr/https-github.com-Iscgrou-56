import { randomUUID } from 'crypto';

import type { Span } from '@opentelemetry/api';
import { PaymentMethod, Prisma, WalletTransactionType } from '@/generated/prisma';

import { getRequiredAuditActor } from './audit-context';
import { METRIC_STATUSES, recordOrchestratorPayment, recordOrchestratorRollback } from './observability/metrics';
import { withSpan } from './observability/tracing';
import { withUnitOfWork } from './persistence/unit-of-work';
import { WalletService } from './wallet-service';

const normalizeError = (error: unknown) => {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }
  return { message: String(error) };
};

export type ProcessPaymentInput = {
  agentId: string;
  amount: number;
  referenceId?: string | null;
  note?: string | null;
  invoiceId?: string | null;
  method?: PaymentMethod;
  settleBatchSize?: number;
  correlationId?: string;
};

export type ProcessPaymentSuccess = {
  success: true;
  paymentId: string;
  walletTransactionId: string;
  referenceId: string;
  settlement: {
    settledCount: number;
    usedBalance: number;
    batchesProcessed: number;
  };
};

export type ProcessPaymentFailure = {
  success: false;
  message: string;
};

export const FinancialOrchestrator = {
  async processPayment(input: ProcessPaymentInput): Promise<ProcessPaymentSuccess | ProcessPaymentFailure> {
    if (input.amount <= 0) {
      recordOrchestratorPayment(METRIC_STATUSES.FAILURE);
      return { success: false, message: 'Payment amount must be greater than zero.' };
    }

    const actor = getRequiredAuditActor();
    const referenceId = input.referenceId ?? `payment:${randomUUID()}`;

    return withSpan(
      'financialOrchestrator.processPayment',
      {
        attributes: {
          'payment.agent_id': input.agentId,
          'payment.amount': input.amount,
          'payment.reference_id': referenceId,
          'payment.actor': actor.userId,
          'payment.correlation_id': input.correlationId ?? 'auto',
        },
      },
  async (span: Span) => {
        try {
          const result = await withUnitOfWork(async (unit) => {
            const logger = unit.logger.child?.({ scope: 'financial-orchestrator' }) ?? unit.logger;
            logger.info('payment.start', {
              agentId: input.agentId,
              amount: input.amount,
              referenceId,
            });

            const payment = await unit.payments.recordPayment({
              agentId: input.agentId,
              invoiceId: input.invoiceId ?? null,
              amount: new Prisma.Decimal(input.amount),
              method: input.method ?? PaymentMethod.EXTERNAL,
              reference: referenceId,
              note: input.note ?? null,
            });

            const depositResult = await WalletService.depositWithin(unit, input.agentId, input.amount, referenceId);

            const settlement = await WalletService.settleWithin(
              unit,
              input.agentId,
              input.settleBatchSize ?? 10,
            );

            await unit.payments.assignWalletTransaction(payment.id, depositResult.transactionId);

            logger.info('payment.success', {
              paymentId: payment.id,
              walletTransactionId: depositResult.transactionId,
              usedBalance: settlement.usedBalance,
              settledCount: settlement.settledCount,
            });

            return {
              success: true as const,
              paymentId: payment.id,
              walletTransactionId: depositResult.transactionId,
              referenceId,
              settlement,
            };
          }, { correlationId: input.correlationId });

          span.addEvent('payment.success', {
            paymentId: result.paymentId,
            walletTransactionId: result.walletTransactionId,
            settledCount: result.settlement.settledCount,
          });

          recordOrchestratorPayment(METRIC_STATUSES.SUCCESS);
          return result;
        } catch (error) {
          const correlationId = input.correlationId;
          if (process.env.FAKE_PRISMA === '1') {
            await withUnitOfWork(async (unit) => {
              const logger = unit.logger.child?.({ scope: 'financial-orchestrator-compensation' }) ?? unit.logger;
              logger.warn('payment.compensation.start', {
                agentId: input.agentId,
                amount: input.amount,
                referenceId,
              });

              const wallet = await unit.wallets.ensureWallet(input.agentId);
              await unit.wallets.adjustBalance(wallet.id, -input.amount);
              await unit.wallets.recordTransaction({
                walletId: wallet.id,
                type: WalletTransactionType.REVERSAL,
                amount: new Prisma.Decimal(input.amount),
                referenceId: `rollback:${referenceId}`,
                notes: 'Automated compensation after orchestrator failure.',
              });
            }, { correlationId });

            recordOrchestratorRollback();
          }

          span.addEvent('payment.failure', {
            message: normalizeError(error).message,
            correlationId: correlationId ?? 'auto',
          });

          recordOrchestratorPayment(METRIC_STATUSES.FAILURE);
          return {
            success: false,
            message: normalizeError(error).message ?? 'Unknown error during payment processing.',
          };
        }
      },
    );
  },
};
