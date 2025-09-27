import { getAgents, getInvoices } from '@/lib/data';
import { InvoiceTableClient, type InvoiceWithAgent } from './invoice-table-client';

export async function InvoiceTable() {
  const [invoices, agents] = await Promise.all([getInvoices(), getAgents()]);

  const agentMap = new Map(agents.map((agent) => [agent.id, agent]));

  const rows: InvoiceWithAgent[] = invoices.map((invoice) => {
    const agent = agentMap.get(invoice.agentId);
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      agentId: invoice.agentId,
      agentName: agent?.name ?? 'ناشناس',
      agentCode: agent?.code ?? '---',
      amount: invoice.amount,
      currency: invoice.currency,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      status: invoice.status,
    };
  });

  return <InvoiceTableClient invoices={rows} />;
}
