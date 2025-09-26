/**
 * @file src/lib/commission-service.ts
 * @description Module 3, Item 3.5: Dedicated Commission Service
 * This service encapsulates all business logic related to commission calculation.
 * It exclusively uses the read-replica data source for its queries to isolate the workload.
 */

import { CommissionReport, SalesPartner } from './types';
import { getPaidInvoicesForAgents } from './read-replica-data';
// In a real app, you'd have a function to get agents of a partner
import { getAgents } from './data'; // Using primary data just for agent lookup simulation

export const CommissionService = {
  
  /**
   * Calculates the commission for a given sales partner for a specific period.
   * This is a heavy, analytical operation that runs against the read replica.
   */
  calculateCommission: async (
    partner: SalesPartner,
    startDate: string,
    endDate: string
  ): Promise<Omit<CommissionReport, 'id' | 'calculationDate'>> => {

    console.log(`[CommissionService] Starting commission calculation for partner '${partner.name}'...`);

    // 1. Find all agents belonging to this partner (simulated)
    const allAgents = await getAgents(); // This lookup is acceptable on primary
    const partnerAgentIds = allAgents
      .filter(a => a.salesPartnerId === partner.id)
      .map(a => a.id);

    // 2. Run the heavy query against the READ REPLICA to get relevant invoices
    const paidInvoices = await getPaidInvoicesForAgents(partnerAgentIds, startDate, endDate);

    // 3. Perform the calculation logic
    const totalSales = paidInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
    const commissionAmount = (totalSales * partner.commissionRate) / 100;

    // 4. (Future) Apply any adjustments/clawbacks (Item 3.2)
    // const adjustments = await findRefundedPaymentsForPartner(...)
    // totalCommission -= adjustments.reduce(...)

    const reportData: Omit<CommissionReport, 'id' | 'calculationDate'> = {
        partnerId: partner.id,
        startDate,
        endDate,
        totalSales,
        commissionRate: partner.commissionRate,
        commissionAmount,
        status: 'DRAFT',
        calculationDetails: paidInvoices.map(inv => ({ invoiceId: inv.id, amount: inv.amount })),
    };

    console.log(`[CommissionService] Calculation complete for partner '${partner.name}'. Commission: ${commissionAmount}`);

    return reportData;
  }
};
