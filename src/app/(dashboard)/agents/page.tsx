import PageHeader from '@/components/page-header';
import { getAgentSummaries } from '@/lib/data'; // <-- CHANGE HERE
import { AgentFinancialSummary } from '@/lib/types'; // <-- CHANGE HERE
import { AgentFormDialog } from './_components/agent-form-dialog';
import { DataTable } from './_components/agent-table'; // Assuming this component is adapted for summaries
import { columns } from './_components/columns'; // Assuming this is adapted as well

export default async function AgentsPage() {
  // Fetch the fast, pre-calculated summary data
  const agentSummaries: AgentFinancialSummary[] = await getAgentSummaries();

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="مدیریت نمایندگان"
        description="لیست نمایندگان فروش و وضعیت مالی آن‌ها را در این بخش مشاهده کنید."
      >
        <AgentFormDialog />
      </PageHeader>
      
      {/* The DataTable component will now receive summary data, making it much faster */}
      <DataTable columns={columns} data={agentSummaries} />
    </div>
  );
}
