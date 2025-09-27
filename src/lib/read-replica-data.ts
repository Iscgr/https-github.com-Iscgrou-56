/**
 * @file src/lib/read-replica-data.ts
 * @description Module 3, Item 3.1: Read Replica Database Access
 * This file simulates a connection to a read-only database replica.
 * All functions here are optimized for heavy, analytical queries (OLAP)
 * and should NOT be used for transactional operations (OLTP).
 */

import { Invoice, Payment } from './types';

// In a real application, this data would be replicated from the primary DB.
// We are re-declaring it here to simulate isolation.
const iso = (value: string) => new Date(value).toISOString();

const replicatedInvoices: Invoice[] = [
    {
        id: '1',
        invoiceNumber: 'INV-001',
        agentId: '1',
        amount: 1_000_000,
        currency: 'IRR',
        issueDate: iso('2023-10-01'),
        dueDate: iso('2023-10-15'),
        status: 'PAID',
        source: 'MANUAL',
        batchId: null,
        metadata: null,
        createdAt: iso('2023-10-01'),
        updatedAt: iso('2023-10-10'),
    },
    {
        id: '2',
        invoiceNumber: 'INV-002',
        agentId: '1',
        amount: 1_500_000,
        currency: 'IRR',
        issueDate: iso('2023-11-01'),
        dueDate: iso('2023-11-15'),
        status: 'PAID',
        source: 'MANUAL',
        batchId: null,
        metadata: null,
        createdAt: iso('2023-11-01'),
        updatedAt: iso('2023-11-10'),
    },
    {
        id: '101',
        invoiceNumber: 'INV-101',
        agentId: '1',
        amount: 2_500_000,
        currency: 'IRR',
        issueDate: iso('2023-11-05'),
        dueDate: iso('2023-11-25'),
        status: 'PAID',
        source: 'SYSTEM',
        batchId: null,
        metadata: null,
        createdAt: iso('2023-11-05'),
        updatedAt: iso('2023-11-12'),
    },
];

const replicatedPayments: Payment[] = [
    {
        id: '1',
        agentId: '1',
        invoiceId: '1',
        amount: 1_000_000,
        method: 'EXTERNAL',
        reference: 'BANK-1000',
        note: null,
        recordedAt: iso('2023-10-10'),
        createdAt: iso('2023-10-10'),
    },
    {
        id: '2',
        agentId: '1',
        invoiceId: '2',
        amount: 1_500_000,
        method: 'EXTERNAL',
        reference: 'BANK-1500',
        note: null,
        recordedAt: iso('2023-11-10'),
        createdAt: iso('2023-11-10'),
    },
    {
        id: '101',
        agentId: '1',
        invoiceId: '101',
        amount: 2_500_000,
        method: 'EXTERNAL',
        reference: 'BANK-2500',
        note: null,
        recordedAt: iso('2023-11-12'),
        createdAt: iso('2023-11-12'),
    },
];

/**
 * Simulates a heavy analytical query to get all paid invoices for a list of agent IDs within a date range.
 * This is the kind of query that should run on a read replica.
 */
export const getPaidInvoicesForAgents = async (agentIds: string[], startDate: string, endDate: string): Promise<Invoice[]> => {
    console.log(`[Read Replica] Running heavy query: getPaidInvoicesForAgents for ${agentIds.length} agents.`);
    
    // Simulate network delay and heavy query processing
    await new Promise(resolve => setTimeout(resolve, 750));

    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    const results = replicatedInvoices.filter(invoice => {
        if (invoice.status !== 'PAID') return false;

        const payment = replicatedPayments.find(p => p.invoiceId === invoice.id);
        if (!payment) return false;

        const paymentDate = new Date(payment.recordedAt);
        const isInDateRange = paymentDate >= startDateObj && paymentDate <= endDateObj;

        return agentIds.includes(invoice.agentId) && isInDateRange;
    });

    return results;
}

/**
 * Simulates a query to find refunded payments that would trigger a commission clawback.
 */
export const findRefundedPaymentsForPartner = async (partnerId: string, _startDate: string, _endDate: string): Promise<Payment[]> => {
     console.log(`[Read Replica] Querying for refunded payments for partner ${partnerId}.`);
     // In this mock, we'll just return an empty array.
     // A real implementation would query for payments with a 'refunded' status.
     return [];
}
