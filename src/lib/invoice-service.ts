
import { Invoice, InvoiceStatusHistory } from './types';
import { invoices as primaryInvoicesDB } from './data';
import { randomUUID } from 'crypto';
import { getRequiredAuditActor } from './audit-context';

export let invoiceStatusHistory: InvoiceStatusHistory[] = [];

const findInvoice = (invoiceId: string) => {
    const invoice = primaryInvoicesDB.find(inv => inv.id === invoiceId);
    if (!invoice) throw new Error(`Invoice with ID ${invoiceId} not found.`);
    return invoice;
}

export const InvoiceService = {
  
  changeStatus: (
    invoiceId: string,
    toStatus: Invoice['status'],
    actorString: string, // This parameter is now ignored in favor of the context.
    notes: string | null = null
  ): { success: boolean; message: string } => {
    
    const actor = getRequiredAuditActor();
    
    try {
        const invoice = findInvoice(invoiceId);
        const fromStatus = invoice.status;

        if (fromStatus === toStatus) {
            return { success: false, message: `Invoice is already in '${toStatus}' state.` };
        }
        if (fromStatus === 'paid' || fromStatus === 'cancelled') {
             return { success: false, message: `Cannot change status from a terminal state ('${fromStatus}').` };
        }

        console.log(`[InvoiceService] Changing status for invoice ${invoiceId} from '${fromStatus}' to '${toStatus}' by actor '${actor.userId}'.`);

        const historyEntry: InvoiceStatusHistory = {
            id: `hist_${randomUUID()}`,
            invoiceId,
            fromStatus,
            toStatus,
            changedAt: new Date().toISOString(),
            actor: actor.userId,
            notes,
        };
        invoiceStatusHistory.push(historyEntry);

        invoice.status = toStatus;

        return { success: true, message: "Status updated successfully." };

    } catch (error: any) {
        console.error(`[InvoiceService] Failed to change status for invoice ${invoiceId}:`, error);
        return { success: false, message: error.message };
    }
  },

  getStatusHistory: (invoiceId: string): InvoiceStatusHistory[] => {
    return invoiceStatusHistory.filter(h => h.invoiceId === invoiceId);
  }
};
