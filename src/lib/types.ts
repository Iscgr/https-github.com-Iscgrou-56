
import { z } from 'zod';

// Define a schema for a user actor for validation
export const ActorSchema = z.object({
  userId: z.string().min(1, { message: "User ID cannot be empty." }),
  role: z.enum(['user', 'admin', 'system']).default('user'), 
  // you can add other fields like ipAddress, userAgent, etc.
});

// Deriving the TypeScript type from the schema
export type Actor = z.infer<typeof ActorSchema>;

export type Agent = {
  id: string;
  name: string;
  partnerId: string;
  commissionRate: number; // e.g., 0.10 for 10%
  // ... other agent details
};

export type Partner = {
  id: string;
  name: string;
  // ... other partner details
};

export type Invoice = {
  id: string;
  agentId: string;
  amount: number;
  date: string;
  dueDate: string;
  status: 'draft' | 'unpaid' | 'paid' | 'overdue' | 'cancelled';
};

export type InvoiceStatusHistory = {
  id: string;
  invoiceId: string;
  fromStatus: Invoice['status'];
  toStatus: Invoice['status'];
  changedAt: string;
  actor: string; // This will now store a stringified version of the Actor object or just the userId
  notes: string | null;
};

export type Payment = {
  id: string;
  agentId: string;
  amount: number;
  date: string;
  invoiceId?: string; // Optional: link payment to a specific invoice
};

export type Wallet = {
  id: string;
  agentId: string;
  balance: number;
  lastTransactionDate: string | null;
};

export type WalletTransaction = {
    id: string;
    walletId: string;
    type: 'deposit' | 'withdrawal' | 'settlement' | 'reversal';
    amount: number;
    timestamp: string;
    notes: string;
    referenceId: string; // e.g., payment_ref_123, settlement_run_456
};

export type CommissionReport = {
    id: string;
    partnerId: string;
    startDate: string;
    endDate: string;
    totalCommission: number;
    status: 'DRAFT' | 'FINALIZED' | 'PAID' | 'CANCELLED';
    calculationDetails: any; // In a real app, this would be a structured type
};

export type CommissionAdjustment = {
    id: string;
    agentId: string;
    amount: number;
    reason: string;
    date: string;
    appliedReportId?: string; // The ID of the report this adjustment was included in
    status: 'UNAPPLIED' | 'APPLIED';
};

// Data structures for the Read Replica
export type AgentPerformanceData = {
    agentId: string;
    agentName: string;
    totalBilled: number;
    totalPaid: number;
    invoiceStatusCounts: {
        draft: number;
        unpaid: number;
        paid: number;
        overdue: number;
    }
};

export type SystemHealthData = {
    totalAgents: number;
    totalInvoices: number;
    totalDue: number;
    systemBalance: number; // e.g., sum of all wallet balances
};
