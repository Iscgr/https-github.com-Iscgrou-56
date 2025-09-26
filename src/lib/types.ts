// ... (previous types: Agent, AgentFinancialSummary, Invoice, etc.)

export type SalesPartner = {
  id:string;
  name: string;
  commissionRate: number;
  totalSubAgentSales: number;
};

// --- NEW TYPES for Module 3 ---

export type CommissionReport = {
    id: string; // UUID
    partnerId: string;
    calculationDate: string;
    startDate: string;
    endDate: string;
    totalSales: number;
    commissionRate: number;
    commissionAmount: number;
    status: 'DRAFT' | 'FINALIZED' | 'PAID';
    // This would link to the detailed records used for calculation
    calculationDetails: { invoiceId: string; amount: number }[];
}

export type CommissionAdjustment = {
    id: string; // UUID
    partnerId: string;
    relatedInvoiceId: string;
    amount: number; // Can be negative for clawbacks
    reason: 'REFUND' | 'CORRECTION';
    appliedReportId: string | null; // Which report this adjustment was included in
    createdAt: string;
}

// --- END NEW TYPES ---


export type BatchJob = {
  // ... (BatchJob type)
}

export type BatchInvoiceRequest = {
  // ... (BatchInvoiceRequest type)
}
