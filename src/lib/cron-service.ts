/**
 * @file src/lib/cron-service.ts
 * @description Module 4, Items 4.2 & 4.3: Resilient Automated Processes
 * This service simulates the execution of cron jobs, such as checking for overdue invoices.
 * It includes idempotency checks and robust error handling.
 */

import { InvoiceService } from './invoice-service';
import { getRepositories, withUnitOfWork } from './persistence/unit-of-work';
import { InvoiceStatus, NotificationStatus, NotificationType } from '@/generated/prisma';

// Mock external service for sending notifications
const sendNotificationAPI = async (
  invoice: { id: string; agentId: string; invoiceNumber: string },
): Promise<{ success: boolean; error?: string }> => {
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
    
    const repositories = getRepositories();
    const today = new Date();
    const overdueCandidates = await repositories.invoices.listOverdue(today);

    console.log(`[CronService] Found ${overdueCandidates.length} overdue candidates.`);

    // 2. Process each candidate individually for resilience (Item 4.3)
    for (const invoice of overdueCandidates) {
      try {
        // 3. Idempotency Check (Item 4.2): Has a reminder been sent in the last 24 hours?
        const twentyFourHoursAgo = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        const recentLog = await repositories.notifications.findRecent(
          invoice.id,
          NotificationType.OVERDUE_REMINDER,
          twentyFourHoursAgo,
        );

        if (recentLog) {
          console.log(`[CronService] Reminder already sent recently for invoice ${invoice.id}. Skipping.`);
          continue; // Skip to the next invoice
        }

        // 4. Update status using the centralized service
        await InvoiceService.changeStatus(invoice.id, InvoiceStatus.OVERDUE, 'system:cron:overdue');

        // 5. Send notification
        const notificationResult = await sendNotificationAPI(invoice);

        await withUnitOfWork(async (unit) => {
          const status = notificationResult.success
            ? NotificationStatus.SUCCESS
            : NotificationStatus.FAILED;

          await unit.notifications.logSend({
            invoiceId: invoice.id,
            type: NotificationType.OVERDUE_REMINDER,
            status,
            errorMessage: notificationResult.error ?? null,
          });
        });

      } catch (error: unknown) {
        // This catch block ensures that if one invoice fails (e.g., DB error during status change),
        // the entire loop doesn't crash.
        const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
        console.error(`[CronService] CRITICAL ERROR processing invoice ${invoice.id}. Skipping. Error: ${errorMessage}`);
      }
    }
    console.log(`[CronService] Finished daily job: processOverdueInvoices.`);
  }
};
