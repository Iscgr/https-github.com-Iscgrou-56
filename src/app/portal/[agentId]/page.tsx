
import { notFound } from 'next/navigation';
import { getAgentById, getInvoicesByAgentId, getPaymentsByAgentId } from '@/lib/data';
import PortalClientPage from './_components/portal-client-page';

// A mock function to aggregate portal data. In a real scenario, this might be a complex query.
const getPortalData = async (agentId: string) => {
    const invoices = await getInvoicesByAgentId(agentId);
    const payments = await getPaymentsByAgentId(agentId);
    
    const totalBilled = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const balance = totalBilled - totalPaid;

    return {
        invoices,
        payments,
        summary: {
            totalBilled,
            totalPaid,
            balance,
            invoiceCount: invoices.length,
        }
    };
};


export default async function AgentPortalPage({
  params,
}: {
  params: { agentId: string };
}) {
  const { agentId } = params;
  // Corrected function call
  const agent = await getAgentById(agentId);

  if (!agent) {
    notFound();
  }

  // Corrected to pass agentId
  const portalData = await getPortalData(agentId);

  return (
    <PortalClientPage
      agent={agent}
      portalData={portalData}
    />
  );
}
