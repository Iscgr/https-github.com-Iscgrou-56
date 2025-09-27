import { PageHeader } from '@/components/page-header';
import { InvoiceTable } from './_components/invoice-table';
import { UploadUsageDataDialog } from './_components/upload-usage-data-dialog';

export const dynamic = 'force-dynamic';

export default function InvoicesPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="مدیریت فاکتورها"
        description="در این بخش می‌توانید فاکتورهای صادر شده برای نمایندگان را مشاهده و مدیریت کنید."
      >
        <UploadUsageDataDialog />
      </PageHeader>
      <InvoiceTable />
    </div>
  );
}
