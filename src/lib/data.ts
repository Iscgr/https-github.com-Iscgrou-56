import { Agent, Invoice, Payment, SalesPartner, BatchJob, AgentFinancialSummary } from './types';
import { generateAvatar } from './placeholder-images';

// ... (previous mock data and tables)

// --- MOCK DATABASE FUNCTIONS ---

// ... (getAgentSummaries, getAgentById)

// --- CHANGES START for Item 2.3 & 2.4 ---

// Simulates a persistent, database-backed event queue for reliability.
const eventQueue: { eventType: string; payload: any }[] = [];

const dispatchEvent = (eventType: string, payload: any) => {
    console.log(`[Event Bus] Dispatching event: ${eventType}`, payload);
    eventQueue.push({ eventType, payload });
    // In a real system, a worker would process this queue.
    // Here we process it immediately for simulation.
    processEventQueue(); 
};

const processEventQueue = async () => {
    while(eventQueue.length > 0) {
        const event = eventQueue.shift();
        if (!event) break;

        console.log(`[Event Worker] Processing event: ${event.eventType}`);
        try {
            if (event.eventType === 'INVOICE_CREATED' || event.eventType === 'PAYMENT_CREATED') {
                await updateAgentFinancialSummary(event.payload.agentId);
            }
            // ... other event types
        } catch (error) {
            console.error(`[Event Worker] Failed to process event. Moving to DLQ.`, event, error);
            // Add to a dedicated event DLQ (not implemented for this demo)
        }
    }
};


// The "Command" part of CQRS, now triggered by an event
export const updateAgentFinancialSummary = async (agentId: string): Promise<void> => {
    console.log(`[CQRS] Updating summary for Agent ID: ${agentId}`);
    const summary = agentFinancialSummaries.find(s => s.agentId === agentId);
    if (!summary) return;

    const agentInvoices = invoices.filter(i => i.agentId === agentId && i.status !== 'cancelled');
    const agentPayments = payments.filter(p => p.agentId === agentId);

    summary.totalSales = agentInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    summary.totalPayments = agentPayments.reduce((sum, pay) => sum + pay.amount, 0);
    summary.totalDebt = summary.totalSales - summary.totalPayments;
    summary.lastUpdatedAt = new Date().toISOString();

    console.log(`[CQRS] Summary updated for Agent ID: ${agentId}`, summary);
};

// Admin tool to rebuild the entire read model
export const rebuildAllSummaries = async (): Promise<void> => {
    console.warn(`[CQRS] [Admin] Starting FULL REBUILD of AgentFinancialSummaries table.`);
    const allAgents = agents; // In a real DB, you'd fetch all agent IDs.
    
    // This simulates iterating through all agents and recalculating their summaries.
    for (const agent of allAgents) {
        await updateAgentFinancialSummary(agent.id);
    }
    console.warn(`[CQRS] [Admin] FULL REBUILD completed.`);
};

// --- CHANGES END ---

// ... (getInvoices, getPayments, etc.)

// --- Adjusted functions to use the new event queue ---
export const createIdempotentInvoice = async (
  idempotencyKey: string,
  invoiceData: Omit<Invoice, 'id' | 'invoiceNumber'>
): Promise<{ success: boolean; invoice: Invoice | null; message: string }> => {
  // ... (idempotency logic remains the same)
  
  try {
    const newInvoice: Invoice = {
      // ... (invoice creation)
    };
    invoices.push(newInvoice);
    
    // DISPATCH EVENT instead of directly calling the update function
    dispatchEvent('INVOICE_CREATED', { agentId: newInvoice.agentId, amount: newInvoice.amount });
    
    return { success: true, invoice: newInvoice, message: 'Invoice created successfully.' };
  } catch (error) {
    // ... (error handling)
  }
};
