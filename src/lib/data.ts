
import { Agent, Invoice, Payment, Partner, Wallet, WalletTransaction, CommissionReport, CommissionAdjustment } from './types';

// This file contains mock data that simulates a database.

export let agents: Agent[] = [
  { id: 'agent_1', name: 'Agent One', partnerId: 'partner_1', commissionRate: 0.10 },
  { id: 'agent_2', name: 'Agent Two', partnerId: 'partner_1', commissionRate: 0.12 },
];

export let partners: Partner[] = [
  { id: 'partner_1', name: 'Partner Alpha' },
];

export let invoices: Invoice[] = [
  { id: 'inv_001', agentId: 'agent_1', amount: 100, date: '2023-10-01', dueDate: '2023-10-15', status: 'unpaid' },
  { id: 'inv_002', agentId: 'agent_1', amount: 250, date: '2023-10-05', dueDate: '2023-10-20', status: 'unpaid' },
  { id: 'inv_003', agentId: 'agent_2', amount: 500, date: '2023-10-02', dueDate: '2023-10-16', status: 'paid' },
];

export let payments: Payment[] = [
  { id: 'pay_001', agentId: 'agent_2', amount: 500, date: '2023-10-10', invoiceId: 'inv_003' },
];

export let wallets: Wallet[] = [
    { id: 'wallet_1', agentId: 'agent_1', balance: 50, lastTransactionDate: null },
    { id: 'wallet_2', agentId: 'agent_2', balance: 1000, lastTransactionDate: '2023-10-10T10:00:00Z' },
];

export let walletTransactions: WalletTransaction[] = [
    { id: 'txn_001', walletId: 'wallet_2', type: 'deposit', amount: 1500, timestamp: '2023-10-01T09:00:00Z', notes: 'Initial funding', referenceId: 'funding_ref_abc' },
    { id: 'txn_002', walletId: 'wallet_2', type: 'settlement', amount: 500, timestamp: '2023-10-10T10:00:00Z', notes: 'Settled invoice inv_003', referenceId: 'invoice_inv_003' },
];

export let commissionReports: CommissionReport[] = [];
export let commissionAdjustments: CommissionAdjustment[] = [];


// --- MOCK DATABASE ACCESSOR FUNCTIONS ---

export const getAgents = async (): Promise<Agent[]> => agents;
export const getAgentById = async (id: string): Promise<Agent | undefined> => agents.find(a => a.id === id);
export const getInvoices = async (): Promise<Invoice[]> => invoices;
export const getInvoicesByAgentId = async (agentId: string): Promise<Invoice[]> => invoices.filter(i => i.agentId === agentId);
export const getPayments = async (): Promise<Payment[]> => payments;
export const getPaymentsByAgentId = async (agentId: string): Promise<Payment[]> => payments.filter(p => p.agentId === agentId);
export const getSalesPartners = async (): Promise<Partner[]> => partners;

// Functions that were missing and causing build errors
export const updateAgentFinancialSummary = async (agentId: string): Promise<void> => { /* Mock implementation */ };
export const rebuildAllSummaries = async (): Promise<void> => { /* Mock implementation */ };
export const getAgentSummaries = async (): Promise<any[]> => []; // Return empty array for now
export const createIdempotentInvoice = async (invoice: Omit<Invoice, 'id'>): Promise<Invoice> => {
    const newInvoice = { ...invoice, id: `inv_${Math.random()}` };
    invoices.push(newInvoice);
    return newInvoice;
};
export const getAgent = async (id: string): Promise<Agent | undefined> => getAgentById(id);
export const getPortalData = async (agentId: string): Promise<any> => ({}); // Return empty object for now
