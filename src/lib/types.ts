import { z } from 'zod';

export const ActorSchema = z.object({
  userId: z.string().min(1, { message: 'User ID cannot be empty.' }),
  role: z.enum(['user', 'admin', 'system']).default('user'),
});

export type Actor = z.infer<typeof ActorSchema>;

export type AgentStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export type Agent = {
  id: string;
  code: string;
  name: string;
  partnerId: string;
  commissionRate: number;
  status: AgentStatus;
  email?: string | null;
  phone?: string | null;
  telegramChatId?: string | null;
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Partner = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type InvoiceStatus =
  | 'DRAFT'
  | 'UNPAID'
  | 'PARTIAL'
  | 'PAID'
  | 'OVERDUE'
  | 'CANCELLED';

export type InvoiceSource = 'BATCH_UPLOAD' | 'MANUAL' | 'SYSTEM';

export type Invoice = {
  id: string;
  agentId: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  source: InvoiceSource;
  batchId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type InvoiceItem = {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitAmount: number;
  totalAmount: number;
};

export type InvoiceStatusHistory = {
  id: string;
  invoiceId: string;
  fromStatus: InvoiceStatus;
  toStatus: InvoiceStatus;
  actorUserId: string;
  notes: string | null;
  changedAt: string;
};

export type PaymentMethod = 'EXTERNAL' | 'INTERNAL_SETTLEMENT' | 'ADJUSTMENT';

export type Payment = {
  id: string;
  agentId: string;
  invoiceId?: string | null;
  amount: number;
  method: PaymentMethod;
  reference?: string | null;
  note?: string | null;
  recordedAt: string;
  createdAt: string;
};

export type WalletTransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'SETTLEMENT' | 'REVERSAL';

export type Wallet = {
  id: string;
  agentId: string;
  balance: number;
  currency: string;
  lastTransactionAt: string | null;
  version: number;
};

export type WalletTransaction = {
  id: string;
  walletId: string;
  type: WalletTransactionType;
  amount: number;
  referenceId?: string | null;
  notes?: string | null;
  createdAt: string;
  invoiceId?: string | null;
  paymentId?: string | null;
};

export type CommissionStatus = 'DRAFT' | 'FINALIZED' | 'PAID' | 'CANCELLED';

export type CommissionCalculationDetail = {
  invoiceId: string;
  amount: number;
  metadata?: Record<string, unknown>;
};

export type CommissionReport = {
  id: string;
  agentId: string;
  partnerId: string;
  periodStart: string;
  periodEnd: string;
  startDate: string;
  endDate: string;
  totalCommission: number;
  status: CommissionStatus;
  calculationDetails?: CommissionCalculationDetail[];
  createdAt: string;
  finalizedAt?: string | null;
};

export type CommissionAdjustmentStatus = 'UNAPPLIED' | 'APPLIED';

export type CommissionAdjustment = {
  id: string;
  agentId: string;
  amount: number;
  reason: string;
  createdAt: string;
  appliedReportId?: string | null;
  status: CommissionAdjustmentStatus;
};

export type AgentFinancialSummary = {
  agentId: string;
  totalBilled: number;
  totalPaid: number;
  outstandingAmount: number;
  draftCount: number;
  unpaidCount: number;
  overdueCount: number;
  paidCount: number;
  lastCalculatedAt: string;
};

export type NotificationType = 'OVERDUE_REMINDER' | 'INVOICE_ISSUED' | 'PAYMENT_RECEIVED';
export type NotificationStatus = 'SUCCESS' | 'FAILED';

export type NotificationLog = {
  id: string;
  invoiceId: string;
  type: NotificationType;
  status: NotificationStatus;
  sentAt: string;
  errorMessage?: string | null;
};

export type SystemSetting = {
  key: string;
  value: string;
  isSensitive: boolean;
  description?: string | null;
  updatedBy: string;
  updatedAt: string;
  version: number;
};

export type SettingsAuditLog = {
  id: string;
  settingKey: string;
  oldValue?: string | null;
  newValue: string;
  changedBy: string;
  changedAt: string;
};

export type ProcessedUsageHash = {
  hash: string;
  createdAt: string;
};

export type AgentPerformanceData = {
  agentId: string;
  agentName: string;
  agentCode: string;
  totalBilled: number;
  totalPaid: number;
  totalDebt: number;
  invoiceStatusCounts: {
    draft: number;
    unpaid: number;
    paid: number;
    overdue: number;
  };
};

export type SystemHealthData = {
  totalAgents: number;
  totalInvoices: number;
  totalDue: number;
  systemBalance: number;
};

// Next.js App Router PageProps type definition
export interface PageProps {
  params?: { [key: string]: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export interface SalesPartner {
  id: string;
  name: string;
  email: string;
  commissionRate: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
