import { PageHeader } from '@/components/page-header'; // <-- CHANGED
import { getAgentSummaries } from '@/lib/data';
import { AgentFinancialSummary } from '@/lib/types';
import { AgentFormDialog } from './_components/agent-form-dialog';
import { DataTable } from './_components/agent-table';
import { columns } from './_components/columns';

export default async function AgentsPage() {
  const agentSummaries: AgentFinancialSummary[] = await getAgentSummaries();

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="مدیریت نمایندگان"
        description="لیست نمایندگان فروش و وضعیت مالی آن‌ها را در این بخش مشاهده کنید."
      >
        <AgentFormDialog />
      </PageHeader>
      
      <DataTable columns={columns} data={agentSummaries} />
    </div>
  );
}
