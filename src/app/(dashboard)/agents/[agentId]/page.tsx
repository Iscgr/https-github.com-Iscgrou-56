
import { notFound } from 'next/navigation';
import { agents, invoices, payments, salesPartners } from '@/lib/data';
import { AgentProfileClientPage } from './_components/agent-profile-client-page';

export default function AgentProfilePage({
  params,
}: {
  params: { agentId: string };
}) {
  const { agentId } = params;
  const agent = agents.find(a => a.id === agentId);

  if (!agent) {
    notFound();
  }

  const agentInvoices = invoices.filter(i => i.agentId === agent.id);
  const agentPayments = payments.filter(p => p.agentId === agent.id);
  const partner = salesPartners.find(p => p.id === agent.salesPartnerId);

  return (
    <AgentProfileClientPage
      initialAgent={agent}
      initialInvoices={agentInvoices}
      initialPayments={agentPayments}
      partner={partner}
    />
  );
}

