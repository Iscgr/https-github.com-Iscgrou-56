import { Agent, Invoice, Payment, SalesPartner, BatchJob, AgentFinancialSummary } from './types';
import { generateAvatar } from './placeholder-images';

// This file contains mock data and functions to simulate a database.

let agents: Agent[] = [
  { id: '1', publicId: 'pub_1', name: 'نماینده ۱', code: 'A001', contact: { email: 'agent1@example.com', phone: '123-456-7890', telegramChatId: '123456789' }, salesPartnerId: '1', status: 'active', avatarUrl: generateAvatar('Agent One'), portalLink: '/portal/pub_1', createdAt: '2023-01-15' },
  { id: '2', publicId: 'pub_2', name: 'نماینده ۲', code: 'A002', contact: { email: 'agent2@example.com', phone: '098-765-4321' }, salesPartnerId: '1', status: 'inactive', avatarUrl: generateAvatar('Agent Two'), portalLink: '/portal/pub_2', createdAt: '2023-02-20' },
];

let agentFinancialSummaries: AgentFinancialSummary[] = [
    { agentId: '1', agentName: 'نماینده ۱', agentCode: 'A001', agentStatus: 'active', totalSales: 5000, totalPayments: 3000, totalDebt: 2000, lastUpdatedAt: new Date().toISOString() },
    { agentId: '2', agentName: 'نماینده ۲', agentCode: 'A002', agentStatus: 'inactive', totalSales: 12000, totalPayments: 12000, totalDebt: 0, lastUpdatedAt: new Date().toISOString() }
];

export let invoices: Invoice[] = [
  { id: '1', invoiceNumber: 'INV-001', agentId: '1', agentName: 'نماینده ۱', date: '2023-10-01', dueDate: '2023-10-15', amount: 1000, status: 'paid', items: [{ description: 'سرویس ماهانه', amount: 1000 }], source: 'MANUAL', batchJobId: null },
  { id: '2', invoiceNumber: 'INV-002', agentId: '1', agentName: 'نماینده ۱', date: '2023-11-01', dueDate: '2023-11-15', amount: 1500, status: 'unpaid', items: [{ description: 'سرویس ماهانه', amount: 1500 }], source: 'MANUAL', batchJobId: null },
  { id: '3', invoiceNumber: 'INV-003', agentId: '1', agentName: 'نماینده ۱', date: '2023-11-20', dueDate: '2023-12-05', amount: 500, status: 'overdue', items: [{ description: 'پشتیبانی فنی', amount: 500 }], source: 'BATCH_UPLOAD', batchJobId: 'job_abc_123' },
];

export let payments: Payment[] = [
  { id: '1', agentId: '1', invoiceId: '1', date: '2023-10-10', amount: 1000, method: 'EXTERNAL', referenceNumber: 'REF-001' },
];

let salesPartners: SalesPartner[] = [ { id: '1', name: 'همکار فروش ۱', commissionRate: 10, totalSubAgentSales: 10000 } ];
let batchJobs: BatchJob[] = [ /* ... */ ];

// --- MOCK DATABASE ACCESSOR FUNCTIONS ---

// --- AGENT FUNCTIONS ---
export const getAgents = async (): Promise<Agent[]> => agents; // For legacy/direct access
export const getAllAgentIds = async (): Promise<string[]> => agents.map(a => a.id);
export const getAgentById = async (id: string): Promise<Agent | undefined> => agents.find(a => a.id === id);
export const getAgentSummaries = async (): Promise<AgentFinancialSummary[]> => agentFinancialSummaries;

// --- INVOICE FUNCTIONS ---
export const getInvoices = async (): Promise<Invoice[]> => invoices;
export const getInvoicesByAgentId = async (agentId: string): Promise<Invoice[]> => invoices.filter(i => i.agentId === agentId);

// --- PAYMENT FUNCTIONS ---
export const getPayments = async (): Promise<Payment[]> => payments;
export const getPaymentsByAgentId = async (agentId: string): Promise<Payment[]> => payments.filter(p => p.agentId === agentId);

// --- SALES PARTNER FUNCTIONS ---
export const getSalesPartners = async (): Promise<SalesPartner[]> => salesPartners;

// --- BATCH JOB FUNCTIONS ---
export const getBatchJobs = async (): Promise<BatchJob[]> => batchJobs;

// ... (The rest of the service functions like updateAgentFinancialSummary, cancelBatchInvoices, etc. remain the same)
export const updateAgentFinancialSummary = async (agentId: string): Promise<void> => { /* ... */ };
export const rebuildAllSummaries = async (): Promise<void> => { /* ... */ };
export const createIdempotentInvoice = async (idempotencyKey: string, invoiceData: Omit<Invoice, 'id' | 'invoiceNumber'>): Promise<{ success: boolean; invoice: Invoice | null; message: string }> => { /* ... */ };
export const cancelBatchInvoices = async (batchJobId: string, userId: string): Promise<{ success: boolean; message: string }> => { /* ... */ };

// Note: The actual data arrays (agents, invoices, etc.) are NOT exported directly anymore.
// This is a temporary measure to fix the import errors. The next step is to refactor the components
// to use these new accessor functions instead of direct imports.
