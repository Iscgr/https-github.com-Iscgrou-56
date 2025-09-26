
import { notFound } from 'next/navigation';
import { agents, invoices, payments } from '@/lib/data';
import type { Agent } from '@/lib/types';
import PortalClientPage from './_components/portal-client-page';


export default function AgentPortalPage({
  params,
}: {
  params: { agentId: string };
}) {
  const { agentId } = params;
  const agent = agents.find(a => a.id === agentId || a.publicId === agentId);

  if (!agent) {
    notFound();
  }

  const agentInvoices = invoices.filter(i => i.agentId === agent.id);
  const agentPayments = payments.filter(p => p.agentId === agent.id);

  // Pass server-fetched data to the client component
  return (
    <PortalClientPage
      initialAgent={agent}
      initialInvoices={agentInvoices}
      initialPayments={agentPayments}
    />
  );
}

