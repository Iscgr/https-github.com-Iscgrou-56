import { InvoiceStatus as PrismaInvoiceStatus } from '@/generated/prisma';

import { withUnitOfWork, getRepositories } from './persistence/unit-of-work';

export type InvoiceStatus = PrismaInvoiceStatus;

export interface InvoiceStatusChange {
  id: string;
  changedAt: Date;
  notes: string | null;
  invoiceId: string;
  fromStatus: InvoiceStatus;
  toStatus: InvoiceStatus;
  actorUserId: string;
}

export async function invoiceStatusHistory(invoiceId: string): Promise<InvoiceStatusChange[]> {
  // پیاده‌سازی واقعی - برای مثال از دیتابیس
  return [
    {
      id: 'status-change-1',
      changedAt: new Date(),
      notes: null,
      invoiceId,
  fromStatus: PrismaInvoiceStatus.DRAFT,
  toStatus: PrismaInvoiceStatus.UNPAID,
      actorUserId: 'user-1',
    },
  ];
}

type ChangeStatusResult = { success: boolean; message: string };

const TERMINAL_STATUSES: InvoiceStatus[] = [PrismaInvoiceStatus.PAID, PrismaInvoiceStatus.CANCELLED];

export const InvoiceService = {
  async changeStatus(
    invoiceId: string,
    toStatus: InvoiceStatus,
    _actorString: string,
    notes: string | null = null,
  ): Promise<ChangeStatusResult> {
    try {
      return await withUnitOfWork(async (unit) => {
        const invoice = await unit.invoices.findById(invoiceId);
        if (!invoice) {
          throw new Error(`Invoice with ID ${invoiceId} not found.`);
        }

        const fromStatus = invoice.status;

        if (fromStatus === toStatus) {
          return { success: false, message: `Invoice is already in '${toStatus}' state.` };
        }

        if (TERMINAL_STATUSES.includes(fromStatus)) {
          return {
            success: false,
            message: `Cannot change status from terminal state '${fromStatus}'.`,
          };
        }

        console.log(
          `[InvoiceService] Changing status for invoice ${invoiceId} from '${fromStatus}' to '${toStatus}'.`,
        );

        await unit.invoices.appendStatusHistory({
          invoiceId,
          fromStatus,
          toStatus,
          notes,
        });

        await unit.invoices.updateInvoiceStatus(invoiceId, toStatus);

        return { success: true, message: 'Status updated successfully.' };
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
      console.error(`[InvoiceService] Failed to change status for invoice ${invoiceId}:`, error);
      return { success: false, message: errorMessage };
    }
  },

  async getStatusHistory(invoiceId: string) {
    const repositories = getRepositories();
    const invoice = await repositories.invoices.findById(invoiceId);
    return invoice?.statusHistory ?? [];
  },
};
