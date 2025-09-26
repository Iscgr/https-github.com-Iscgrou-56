
import { notFound } from 'next/navigation';
import { getAgent, getPortalData } from '@/lib/data';
import PortalClientPage from './_components/portal-client-page';

export default async function AgentPortalPage({
  params,
}: {
  params: { agentId: string };
}) {
  const { agentId } = params;
  const agent = await getAgent(agentId);

  if (!agent) {
    notFound();
  }

  const portalData = await getPortalData();

  return (
    <PortalClientPage
      agent={agent}
      portalData={portalData}
    />
  );
}
