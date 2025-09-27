
import { notFound } from 'next/navigation';
import { getAgentById, getPortalData } from '@/lib/data';
import PortalClientPage from './_components/portal-client-page';


export default async function AgentPortalPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = await params;
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
