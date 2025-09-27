import { PageHeader } from '@/components/page-header';
import { getAgents, getAgentSummaries } from '@/lib/data';
import { AgentFormDialog } from './_components/agent-form-dialog';
import { DataTable } from './_components/agent-table';
import { AgentSummaryRow, columns } from './_components/columns';

export const dynamic = 'force-dynamic';

export default async function AgentsPage() {
  const [agents, summaries] = await Promise.all([getAgents(), getAgentSummaries()]);

  const tableData: AgentSummaryRow[] = summaries.map((summary) => {
    const agent = agents.find((candidate) => candidate.id === summary.agentId);
    return {
      agentId: summary.agentId,
      agentName: agent?.name ?? 'نامشخص',
      agentCode: agent?.code ?? '---',
      agentStatus: agent?.status ?? 'INACTIVE',
      totalBilled: summary.totalBilled,
      totalPaid: summary.totalPaid,
      outstandingAmount: summary.outstandingAmount,
      lastCalculatedAt: summary.lastCalculatedAt,
    };
  });

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="مدیریت نمایندگان"
        description="لیست نمایندگان فروش و وضعیت مالی آن‌ها را در این بخش مشاهده کنید."
      >
        <AgentFormDialog />
      </PageHeader>
      
      <DataTable columns={columns} data={tableData} />
    </div>
  );
}
