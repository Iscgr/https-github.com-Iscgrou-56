/**
 * @file src/lib/cron-service.ts
 * @description Module 4, Items 4.2 & 4.3: Resilient Automated Processes
 * This service simulates the execution of cron jobs, such as checking for overdue invoices.
 * It includes idempotency checks and robust error handling.
 */

import { NotificationLog, Invoice } from './types';
import { invoices as primaryInvoicesDB } from './data';
import { InvoiceService } from './invoice-service';
import { randomUUID } from 'crypto';

// Mock table for Notification Logs on the primary database
export let notificationLogs: NotificationLog[] = [];

// Mock external service for sending notifications
const sendNotificationAPI = async (invoice: Invoice): Promise<{ success: boolean; error?: string }> => {
    // Simulate potential failures
    if (invoice.agentId === 'FAIL-AGENT') { // Specific agent ID to test failure
      return { success: false, error: "Invalid email address" };
    }
    if (Math.random() < 0.1) { // 10% chance of transient failure
      return { success: false, error: "Email service timeout" };
    }
    console.log(`[NotificationAPI] Sending overdue reminder for invoice ${invoice.invoiceNumber}...`);
    return { success: true };
}


export const CronService = {

  /**
   * Simulates a daily cron job that finds overdue invoices, updates their status,
   * and sends reminders.
   */
  processOverdueInvoices: async () => {
    console.log(`[CronService] Starting daily job: processOverdueInvoices...`);
    
    // 1. Find candidate invoices (unpaid and past their due date)
    const today = new Date();
    const overdueCandidates = primaryInvoicesDB.filter(
        inv => inv.status === 'unpaid' && new Date(inv.dueDate) < today
    );

    console.log(`[CronService] Found ${overdueCandidates.length} overdue candidates.`);

    // 2. Process each candidate individually for resilience (Item 4.3)
    for (const invoice of overdueCandidates) {
      try {
        // 3. Idempotency Check (Item 4.2): Has a reminder been sent in the last 24 hours?
        const twentyFourHoursAgo = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        const recentLog = notificationLogs.find(
          log => log.invoiceId === invoice.id &&
                 log.type === 'OVERDUE_REMINDER' &&
                 new Date(log.sentAt) > twentyFourHoursAgo
        );

        if (recentLog) {
          console.log(`[CronService] Reminder already sent recently for invoice ${invoice.id}. Skipping.`);
          continue; // Skip to the next invoice
        }

        // 4. Update status using the centralized service
        InvoiceService.changeStatus(invoice.id, 'overdue', 'system:cron:overdue');

        // 5. Send notification
        const notificationResult = await sendNotificationAPI(invoice);
        
        // 6. Log the notification attempt
        const logEntry: NotificationLog = {
            id: `nlog_${randomUUID()}`,
            invoiceId: invoice.id,
            type: 'OVERDUE_REMINDER',
            sentAt: new Date().toISOString(),
            status: notificationResult.success ? 'SUCCESS' : 'FAILED',
            errorMessage: notificationResult.error || null,
        };
        notificationLogs.push(logEntry);

      } catch (error: any) {
        // This catch block ensures that if one invoice fails (e.g., DB error during status change),
        // the entire loop doesn't crash.
        console.error(`[CronService] CRITICAL ERROR processing invoice ${invoice.id}. Skipping. Error: ${error.message}`);
      }
    }
    console.log(`[CronService] Finished daily job: processOverdueInvoices.`);
  }
};
