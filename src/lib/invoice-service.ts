/**
 * @file src/lib/invoice-service.ts
 * @description Module 4, Items 4.1 & 4.4: Centralized Invoice State Management
 * This service is the single source of truth for all invoice status changes.
 * It ensures that every state transition is valid and creates an audit trail.
 */

import { Invoice, InvoiceStatusHistory } from './types';
import { invoices as primaryInvoicesDB } from './data'; // Simulate direct access to the primary DB
import { randomUUID } from 'crypto';

// Mock table for Invoice Status History on the primary database
export let invoiceStatusHistory: InvoiceStatusHistory[] = [];

// Helper function to get the current state of an invoice
const findInvoice = (invoiceId: string) => {
    const invoice = primaryInvoicesDB.find(inv => inv.id === invoiceId);
    if (!invoice) throw new Error(`Invoice with ID ${invoiceId} not found.`);
    return invoice;
}

export const InvoiceService = {
  
  /**
   * Centralized method to change an invoice's status.
   * This is the ONLY function that should ever modify `invoice.status`.
   * @param invoiceId - The ID of the invoice to change.
   * @param toStatus - The new status.
   * @param actor - The entity causing the change (e.g., 'user:123', 'system:payment_sync').
   * @param notes - (Optional) Contextual notes for the change.
   */
  changeStatus: (
    invoiceId: string,
    toStatus: Invoice['status'],
    actor: string,
    notes: string | null = null
  ): { success: boolean; message: string } => {
    
    try {
        const invoice = findInvoice(invoiceId);
        const fromStatus = invoice.status;

        // Basic state transition validation (can be expanded)
        if (fromStatus === toStatus) {
            return { success: false, message: `Invoice is already in '${toStatus}' state.` };
        }
        if (fromStatus === 'paid' || fromStatus === 'cancelled') {
             return { success: false, message: `Cannot change status from a terminal state ('${fromStatus}').` };
        }

        console.log(`[InvoiceService] Changing status for invoice ${invoiceId} from '${fromStatus}' to '${toStatus}' by actor '${actor}'.`);

        // 1. Create the history record (Audit Trail)
        const historyEntry: InvoiceStatusHistory = {
            id: `hist_${randomUUID()}`,
            invoiceId,
            fromStatus,
            toStatus,
            changedAt: new Date().toISOString(),
            actor,
            notes,
        };
        invoiceStatusHistory.push(historyEntry);

        // 2. Change the actual status
        invoice.status = toStatus;

        return { success: true, message: "Status updated successfully." };

    } catch (error: any) {
        console.error(`[InvoiceService] Failed to change status for invoice ${invoiceId}:`, error);
        return { success: false, message: error.message };
    }
  },

  /**
   * Retrieves the status history for a specific invoice.
   */
  getStatusHistory: (invoiceId: string): InvoiceStatusHistory[] => {
    return invoiceStatusHistory.filter(h => h.invoiceId === invoiceId);
  }
};
